// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "MetalUI",
    platforms: [.macOS(.v14), .iOS(.v17)],
    products: [
        .library(name: "MetalUI", targets: ["MetalUI"]),
    ],
    targets: [
        .target(name: "MetalUI", path: "swift/Sources/MetalUI"),
        .testTarget(name: "MetalUITests", dependencies: ["MetalUI"], path: "swift/Tests/MetalUITests"),
    ]
)
