"""Build a real macOS host and verify native Button words, scoped motion, focus and hold callbacks."""
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
with tempfile.TemporaryDirectory(prefix="metalui-button-words-") as temporary:
    contents = Path(temporary) / "ButtonWordsProof.app" / "Contents"
    (contents / "MacOS").mkdir(parents=True)
    (contents / "Info.plist").write_bytes(plistlib.dumps({
        "CFBundleIdentifier": "dev.metalui.buttonwordsproof", "CFBundleName": "ButtonWordsProof",
        "CFBundleExecutable": "ButtonWordsProof", "CFBundlePackageType": "APPL",
        "NSPrincipalClass": "NSApplication", "LSMinimumSystemVersion": "14.0",
    }))
    shutil.copytree(products / "MetalUI_MetalUI.bundle", contents / "Resources" / "MetalUI_MetalUI.bundle")
    subprocess.run(["xcrun", "swiftc", "-parse-as-library", "-target", f"{platform.machine()}-apple-macos14.0",
                    "-I", str(products), "-L", str(products), "-lMetalUI",
                    str(Path(__file__).with_name("button-words-proof.swift")),
                    "-o", str(contents / "MacOS" / "ButtonWordsProof")], check=True)
    report = Path(temporary) / "result.txt"
    command = ["open", "-W", "-n", str(contents.parent), "--env", f"METALUI_NATIVE_REPORT={report}"]
    if os.environ.get("METALUI_NATIVE_CAPTURE"):
        command.extend(["--env", f"METALUI_NATIVE_CAPTURE={os.environ['METALUI_NATIVE_CAPTURE']}"])
    if os.environ.get("METALUI_COLORWAY"):
        command.extend(["--env", f"METALUI_COLORWAY={os.environ['METALUI_COLORWAY']}"])
    subprocess.run(command, check=True, timeout=45)
    result = report.read_text()
    print(result)
    if "passed=true" not in result:
        raise SystemExit("Native Button words failed")
