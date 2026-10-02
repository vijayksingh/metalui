"""Build a real macOS host and verify native recognition, source preservation and reduced motion."""
from pathlib import Path
import os
import platform
import plistlib
import shutil
import subprocess
import tempfile

repo = Path(__file__).resolve().parents[2]
subprocess.run(["swift", "build", "-j", "2"], cwd=repo, check=True)
products = Path(subprocess.check_output(["swift", "build", "--show-bin-path"], cwd=repo, text=True).strip())
with tempfile.TemporaryDirectory(prefix="metalui-provenance-document-") as temporary:
    contents = Path(temporary) / "ProvenanceDocumentProof.app" / "Contents"
    (contents / "MacOS").mkdir(parents=True)
    (contents / "Info.plist").write_bytes(plistlib.dumps({
        "CFBundleIdentifier": "dev.metalui.provenance-documentproof", "CFBundleName": "ProvenanceDocumentProof",
        "CFBundleExecutable": "ProvenanceDocumentProof", "CFBundlePackageType": "APPL",
        "NSPrincipalClass": "NSApplication", "LSMinimumSystemVersion": "14.0",
    }))
    shutil.copytree(products / "MetalUI_MetalUI.bundle", contents / "Resources" / "MetalUI_MetalUI.bundle")
    subprocess.run(["xcrun", "swiftc", "-parse-as-library", "-target", f"{platform.machine()}-apple-macos14.0",
                    "-I", str(products), "-L", str(products), "-lMetalUI",
                    *[str(repo / "swift" / "Examples" / name) for name in ["MetalProvenanceCueFrames.swift", "MetalProvenanceDocumentExample.swift", "MetalProvenanceSourceEditor.swift"]],
                    str(Path(__file__).with_name("provenance-document-proof.swift")),
                    "-o", str(contents / "MacOS" / "ProvenanceDocumentProof")], check=True)
    report = Path(temporary) / "result.txt"
    command = ["open", "-W", "-n", str(contents.parent), "--env", f"METALUI_NATIVE_REPORT={report}"]
    if os.environ.get("METALUI_COLORWAY"):
        command.extend(["--env", f"METALUI_COLORWAY={os.environ['METALUI_COLORWAY']}"])
    if os.environ.get("METALUI_NATIVE_CAPTURE"):
        command.extend(["--env", f"METALUI_CAPTURES={os.environ['METALUI_NATIVE_CAPTURE']}"])
    subprocess.run(command, check=True, timeout=45)
    result = report.read_text()
    print(result)
    if "passed=true" not in result:
        raise SystemExit("Native provenance document behavior failed")
