"""Build a real macOS host and verify native Toast keyboard behavior."""
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
with tempfile.TemporaryDirectory(prefix="metalui-toast-focus-") as temporary:
    contents = Path(temporary) / "ToastFocusProof.app" / "Contents"
    (contents / "MacOS").mkdir(parents=True)
    (contents / "Info.plist").write_bytes(plistlib.dumps({
        "CFBundleIdentifier": "dev.metalui.toastfocusproof", "CFBundleName": "ToastFocusProof",
        "CFBundleExecutable": "ToastFocusProof", "CFBundlePackageType": "APPL",
        "NSPrincipalClass": "NSApplication", "LSMinimumSystemVersion": "14.0",
    }))
    shutil.copytree(products / "MetalUI_MetalUI.bundle", contents / "Resources" / "MetalUI_MetalUI.bundle")
    subprocess.run(["xcrun", "swiftc", "-parse-as-library", "-target", f"{platform.machine()}-apple-macos14.0",
                    "-I", str(products), "-L", str(products), "-lMetalUI",
                    str(Path(__file__).with_name("toast-focus-proof.swift")),
                    "-o", str(contents / "MacOS" / "ToastFocusProof")], check=True)
    report = Path(temporary) / "result.txt"
    command = ["open", "-W", "-n", str(contents.parent), "--env", f"METALUI_NATIVE_REPORT={report}"]
    if os.environ.get("METALUI_NATIVE_CAPTURE"):
        command.extend(["--env", f"METALUI_NATIVE_CAPTURE={os.environ['METALUI_NATIVE_CAPTURE']}"])
    subprocess.run(command, check=True, timeout=25)
    result = report.read_text()
    print(result)
    if "passed=true" not in result:
        raise SystemExit("Native Toast keyboard behavior failed")
