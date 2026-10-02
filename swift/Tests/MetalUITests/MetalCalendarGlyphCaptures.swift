import AppKit
import SwiftUI
import XCTest
@testable import MetalUI

@MainActor final class MetalCalendarGlyphCaptures: XCTestCase {
    func testCanonicalCalendarControls() throws {
        let day = Date(timeIntervalSince1970: 1_790_726_400)
        let directory = try XCTUnwrap(ProcessInfo.processInfo.environment["METALUI_CAPTURES"])
        for colorway in MetalColorway.allCases {
            let content = VStack(alignment: .leading, spacing: MetalSpace.s24) {
                MetalCalendar("Trip day", selection: .constant(day), month: .constant(day))
                MetalDatePicker("Due date", selection: .constant(day))
            }.padding(MetalSpace.s24).frame(width: 400)
                .background((colorway == .bone ? MetalShared.page : MetalShared.pageDark).color)
                .metalColorway(colorway).metalReduceMotion()
            _ = NSApplication.shared
            let host = NSHostingView(rootView: content)
            let size = host.fittingSize
            host.frame = NSRect(origin: .zero, size: size)
            let window = NSWindow(contentRect: host.frame, styleMask: [.borderless], backing: .buffered, defer: false)
            window.contentView = host; window.orderFront(nil)
            host.layoutSubtreeIfNeeded()
            RunLoop.current.run(until: Date().addingTimeInterval(0.1))
            let bitmap = try XCTUnwrap(host.bitmapImageRepForCachingDisplay(in: host.bounds))
            host.cacheDisplay(in: host.bounds, to: bitmap)
            let url = URL(fileURLWithPath: directory).appendingPathComponent("calendar-glyph-\(colorway.rawValue).png")
            try XCTUnwrap(bitmap.representation(using: .png, properties: [:])).write(to: url)
            window.orderOut(nil)
        }
    }
}
