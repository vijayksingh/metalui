import SwiftUI

/// Sections of immediate settings. Each row owns one trailing control.
public struct MetalSettings: View {
    private let content: AnyView

    public init<Content: View>(@ViewBuilder content: () -> Content) { self.content = AnyView(content()) }

    public var body: some View {
        VStack(alignment: .leading, spacing: MetalSettingsMetrics.sectionGap) { content }
    }

    public struct Section: View {
        private let title: String
        private let rows: [AnyView]

        public init(_ title: String, @MetalSettingsRowsBuilder rows: () -> [AnyView]) {
            self.title = title
            self.rows = rows()
        }

        public var body: some View {
            VStack(alignment: .leading, spacing: MetalSettingsMetrics.headingGap) {
                MetalLabel(title, style: .engraved)
                    .padding(.horizontal, MetalSettingsMetrics.headingPadX)
                MetalSurface(.raiseLite, radius: .card) {
                    VStack(spacing: .zero) {
                        ForEach(rows.indices, id: \.self) { index in
                            if index > .zero {
                                MetalRule(.horizontal)
                                    .padding(.horizontal, MetalSettingsMetrics.rowPadX)
                            }
                            rows[index]
                        }
                    }
                }
            }
            .accessibilityElement(children: .contain)
            .accessibilityLabel(title)
        }
    }

    public struct Row<Control: View>: View {
        private let name: String
        private let detail: String?
        private let control: Control

        public init(_ name: String, detail: String? = nil, @ViewBuilder control: () -> Control) {
            self.name = name
            self.detail = detail
            self.control = control()
        }

        public var body: some View {
            HStack(spacing: MetalSettingsMetrics.rowGap) {
                VStack(alignment: .leading, spacing: MetalSettingsMetrics.detailGap) {
                    MetalLabel(name, style: .name)
                    if let detail, !detail.isEmpty { MetalLabel(detail, style: .detail) }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                control.fixedSize()
            }
            .padding(.horizontal, MetalSettingsMetrics.rowPadX)
            .padding(.vertical, MetalSettingsMetrics.rowPadY)
            .frame(minHeight: MetalSettingsMetrics.rowMin)
        }
    }

    public struct Keys: View {
        private let name: String
        private let keys: [String]

        public init(_ name: String, keys: [String]) {
            self.name = name
            self.keys = keys
        }

        public var body: some View {
            Row(name) {
                HStack(spacing: MetalSettingsMetrics.keysGap) {
                    ForEach(Array(keys.enumerated()), id: \.offset) { _, key in MetalKbd(key) }
                }
            }
        }
    }
}

@resultBuilder
public enum MetalSettingsRowsBuilder {
    public static func buildExpression<Control: View>(_ row: MetalSettings.Row<Control>) -> [AnyView] { [AnyView(row)] }
    public static func buildExpression(_ keys: MetalSettings.Keys) -> [AnyView] { [AnyView(keys)] }
    public static func buildBlock(_ parts: [AnyView]...) -> [AnyView] { parts.flatMap { $0 } }
    public static func buildOptional(_ part: [AnyView]?) -> [AnyView] { part ?? [] }
    public static func buildEither(first part: [AnyView]) -> [AnyView] { part }
    public static func buildEither(second part: [AnyView]) -> [AnyView] { part }
    public static func buildArray(_ parts: [[AnyView]]) -> [AnyView] { parts.flatMap { $0 } }
}
