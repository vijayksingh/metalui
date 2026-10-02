import AppKit
import SwiftUI
import XCTest
@testable import MetalUI

@MainActor
final class MetalLinkCaptures: XCTestCase {
    func testDestinationStates() throws {
        let directory = try XCTUnwrap(ProcessInfo.processInfo.environment["METALUI_CAPTURES"])
        let destination = try XCTUnwrap(URL(string: "https://example.org/guide"))
        for colorway in MetalColorway.allCases {
            let view = VStack(alignment: .leading, spacing: MetalLayout.gapRelated) {
                MetalLink("The field guide", destination: destination)
                MetalLink("Current guide", destination: destination, current: true)
                MetalLink("Unavailable guide", destination: destination, disabled: true, disabledReason: "The guide is being revised")
                MetalLink("Quiet guide", destination: destination, kind: .quiet)
                MetalLink("Accessibility notes", destination: destination, external: true)
                MetalLink("Tram map.pdf", destination: destination, download: true, fileSize: "2.4 MB")
                MetalLink("Read the field guide", destination: destination, kind: .standalone)
                MetalLink("Open the region", destination: destination, loading: true)
            }.font(.metal(MetalType.body)).padding(MetalLayout.gapRelated)
                .frame(width: 680, alignment: .leading)
                .background((colorway == .bone ? MetalShared.page : MetalShared.pageDark).color)
                .metalColorway(colorway)
            let renderer = ImageRenderer(content: view); renderer.scale = 2
            let image = try XCTUnwrap(renderer.cgImage)
            let url = URL(fileURLWithPath: directory).appendingPathComponent("link-\(colorway.rawValue).png")
            try XCTUnwrap(NSBitmapImageRep(cgImage: image).representation(using: .png, properties: [:])).write(to: url)
        }
    }
}
