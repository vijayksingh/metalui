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
            // Geist, Martian Mono and Doto (SIL OFL 1.1, licences alongside), registered by MetalFonts;
            // the product and life glyphs as custom SF Symbols (npm run symbols), compiled by actool.
            resources: [.copy("Resources/Fonts"), .process("Resources/MetalIcons.xcassets")]
        ),
        .testTarget(name: "MetalUITests", dependencies: ["MetalUI"], path: "swift/Tests/MetalUITests"),
    ]
)
