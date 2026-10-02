"""Compile a real SwiftUI fixture against the built iOS package and capture its console beats."""
from pathlib import Path
import argparse
import plistlib
import shutil
import subprocess
import tempfile
import time

parser = argparse.ArgumentParser()
parser.add_argument("source", type=Path)
parser.add_argument("--derived-data", required=True, type=Path)
parser.add_argument("--simulator", required=True, help="Booted iOS Simulator UUID")
parser.add_argument("--captures", required=True, type=Path)
parser.add_argument("--bundle-id", default="dev.metalui.integrationproof")
args = parser.parse_args()
products = args.derived_data / "Build/Products/Debug-iphonesimulator"
objects = args.derived_data / "Build/Intermediates.noindex/MetalUI.build/Debug-iphonesimulator/MetalUI-t.build/Objects-normal/arm64"
object_files = list(objects.glob("*.o"))
if not object_files:
    raise SystemExit("Build the MetalUI iOS Simulator scheme before running the fixture.")
args.captures.mkdir(parents=True, exist_ok=True)
sdk = subprocess.check_output(["xcrun", "--sdk", "iphonesimulator", "--show-sdk-path"], text=True).strip()
with tempfile.TemporaryDirectory(prefix="metalui-native-proof-") as directory:
    app = Path(directory) / "MetalUIProof.app"
    app.mkdir()
    subprocess.run(["xcrun", "--sdk", "iphonesimulator", "swiftc", "-sdk", sdk,
                    "-target", "arm64-apple-ios17.0-simulator", "-I", str(products), "-parse-as-library",
                    "-profile-generate", "-profile-coverage-mapping", str(args.source.resolve()),
                    *map(str, object_files), "-o", str(app / "MetalUIProof")], check=True)
    shutil.copytree(products / "MetalUI_MetalUI.bundle", app / "MetalUI_MetalUI.bundle")
    plist = {"CFBundleIdentifier": args.bundle_id, "CFBundleName": "MetalUI Integration Proof",
             "CFBundleExecutable": "MetalUIProof", "CFBundlePackageType": "APPL", "MinimumOSVersion": "17.0",
             "UIDeviceFamily": [1, 2], "UILaunchScreen": {},
             "UIApplicationSceneManifest": {"UIApplicationSupportsMultipleScenes": True}}
    (app / "Info.plist").write_bytes(plistlib.dumps(plist))
    subprocess.run(["codesign", "--force", "--sign", "-", str(app)], check=True)
    subprocess.run(["xcrun", "simctl", "install", args.simulator, str(app)], check=True)
    subprocess.run(["xcrun", "simctl", "terminate", args.simulator, args.bundle_id], capture_output=True)
    process = subprocess.Popen(["xcrun", "simctl", "launch", "--console-pty", args.simulator, args.bundle_id],
                               stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    try:
        for line in process.stdout:
            print(line, end="", flush=True)
            tag, delay = None, .15
            if "MU_NUMBER_READY" in line:
                tag = "number-field-rest"
            if "MU_POLICY_" in line and not "DONE" in line:
                tag = "motion-policy-" + line.strip().split("MU_POLICY_")[-1].lower()
            if "MU_MORPH_COMPARE " in line:
                tag = "morph-" + line.strip().split("MU_MORPH_COMPARE ")[-1]
                delay = .8
            elif any("MU_MORPH_" + beat in line for beat in ["INTERRUPTED", "REDUCED", "TURN", "FALLBACK"]):
                tag = "morph-" + line.strip().split("MU_MORPH_")[-1].lower()
            if tag:
                time.sleep(delay)
                subprocess.run(["xcrun", "simctl", "io", args.simulator, "screenshot",
                                str(args.captures / (tag + ".png"))], check=True)
            if "MU_MORPH_DONE" in line or "MU_POLICY_DONE" in line or "MU_NUMBER_DONE" in line:
                break
    finally:
        process.terminate()
        process.wait(timeout=10)
