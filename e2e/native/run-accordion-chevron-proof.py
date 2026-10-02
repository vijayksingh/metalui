"""Build a real macOS host and verify native Accordion binding and shared chevron morph."""
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
with tempfile.TemporaryDirectory(prefix="metalui-accordion-chevron-") as temporary:
    contents = Path(temporary) / "AccordionChevronProof.app" / "Contents"
    (contents / "MacOS").mkdir(parents=True)
    (contents / "Info.plist").write_bytes(plistlib.dumps({
        "CFBundleIdentifier": "dev.metalui.accordionchevronproof", "CFBundleName": "AccordionChevronProof",
        "CFBundleExecutable": "AccordionChevronProof", "CFBundlePackageType": "APPL",
        "NSPrincipalClass": "NSApplication", "LSMinimumSystemVersion": "14.0",
    }))
    shutil.copytree(products / "MetalUI_MetalUI.bundle", contents / "Resources" / "MetalUI_MetalUI.bundle")
    subprocess.run(["xcrun", "swiftc", "-parse-as-library", "-target", f"{platform.machine()}-apple-macos14.0",
                    "-I", str(products), "-L", str(products), "-lMetalUI",
                    str(Path(__file__).with_name("accordion-chevron-proof.swift")),
                    "-o", str(contents / "MacOS" / "AccordionChevronProof")], check=True)
    report = Path(temporary) / "result.txt"
    command = ["open", "-W", "-n", str(contents.parent), "--env", f"METALUI_NATIVE_REPORT={report}"]
    if os.environ.get("METALUI_NATIVE_CAPTURE"):
        command.extend(["--env", f"METALUI_NATIVE_CAPTURE={os.environ['METALUI_NATIVE_CAPTURE']}"])
    if os.environ.get("METALUI_COLORWAY"):
        command.extend(["--env", f"METALUI_COLORWAY={os.environ['METALUI_COLORWAY']}"])
    subprocess.run(command, check=True, timeout=25)
    result = report.read_text()
    print(result)
    if "passed=true" not in result:
        raise SystemExit("Native Accordion chevron binding failed")
