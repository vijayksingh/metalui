"""Build a real macOS host and verify native Progress paired label/glyph settle and reduced stillness in both colorways."""
from pathlib import Path
import os
import platform
import plistlib
import shutil
import subprocess
import tempfile

repo = Path(__file__).resolve().parents[2]
if not os.environ.get("METALUI_NATIVE_SKIP_BUILD"):
    subprocess.run(["swift", "build", "-j", "2"], cwd=repo, check=True)
products = Path(subprocess.check_output(["swift", "build", "--show-bin-path"], cwd=repo, text=True).strip())
with tempfile.TemporaryDirectory(prefix="metalui-progress-label-") as temporary:
    contents = Path(temporary) / "ProgressLabelProof.app" / "Contents"
    (contents / "MacOS").mkdir(parents=True)
    (contents / "Info.plist").write_bytes(plistlib.dumps({
        "CFBundleIdentifier": "dev.metalui.progresslabelproof", "CFBundleName": "ProgressLabelProof",
        "CFBundleExecutable": "ProgressLabelProof", "CFBundlePackageType": "APPL",
        "NSPrincipalClass": "NSApplication", "LSMinimumSystemVersion": "14.0",
    }))
    shutil.copytree(products / "MetalUI_MetalUI.bundle", contents / "Resources" / "MetalUI_MetalUI.bundle")
    subprocess.run(["xcrun", "swiftc", "-parse-as-library", "-target", f"{platform.machine()}-apple-macos14.0",
                    "-I", str(products), "-L", str(products), "-lMetalUI",
                    str(Path(__file__).with_name("progress-label-proof.swift")),
                    "-o", str(contents / "MacOS" / "ProgressLabelProof")], check=True)
    report = Path(temporary) / "result.txt"
    subprocess.run([str(contents / "MacOS" / "ProgressLabelProof")], env={**os.environ, "METALUI_NATIVE_REPORT": str(report)}, check=True, timeout=25)
    result = report.read_text()
    print(result)
    if "passed=true" not in result:
        raise SystemExit("Native ProgressLabel public behavior failed")
