// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "MetalUI",
    platforms: [.macOS(.v14), .iOS(.v17)],
    products: [
        .library(name: "MetalUI", targets: ["MetalUI"]),
    ],
    targets: [
        .target(
            name: "MetalUI",
            path: "swift/Sources/MetalUI",
            // Geist, Martian Mono and Doto (SIL OFL 1.1, licences alongside), registered by MetalFonts.
            resources: [.copy("Resources/Fonts")]
        ),
        .testTarget(name: "MetalUITests", dependencies: ["MetalUI"], path: "swift/Tests/MetalUITests"),
    ]
)
