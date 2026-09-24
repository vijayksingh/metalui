import SwiftUI

/// Minimal SVG path-data parser: M L H V C S Q T A Z, absolute and
/// relative, with implicit command repetition. Enough for icon sprites.
enum MetalSVGPath {
    static func parse(_ data: String) -> Path {
        var scanner = Tokenizer(Array(data.utf8))
        var path = Path()
        var current = CGPoint.zero
        var start = CGPoint.zero
        var lastControl: CGPoint?
        var command: UInt8 = 0

        while let next = scanner.nextCommandOrNumber() {
            if case let .command(value) = next { command = value } else { scanner.rewind() }
            let relative = command >= 97
            let base = relative ? current : .zero
            func point() -> CGPoint {
                let x = scanner.number(), y = scanner.number()
                return CGPoint(x: base.x + x, y: base.y + y)
            }
            switch command | 0x20 {
            case UInt8(ascii: "m"):
                current = point()
                start = current
                path.move(to: current)
                command = relative ? UInt8(ascii: "l") : UInt8(ascii: "L")
                lastControl = nil
            case UInt8(ascii: "l"):
                current = point()
                path.addLine(to: current)
                lastControl = nil
            case UInt8(ascii: "h"):
                current = CGPoint(x: (relative ? current.x : 0) + scanner.number(), y: current.y)
                path.addLine(to: current)
                lastControl = nil
            case UInt8(ascii: "v"):
                current = CGPoint(x: current.x, y: (relative ? current.y : 0) + scanner.number())
                path.addLine(to: current)
                lastControl = nil
            case UInt8(ascii: "c"):
                let c1 = point(), c2 = point(), end = point()
                path.addCurve(to: end, control1: c1, control2: c2)
                lastControl = c2
                current = end
            case UInt8(ascii: "s"):
                let c1 = reflect(lastControl, around: current)
                let c2 = point(), end = point()
                path.addCurve(to: end, control1: c1, control2: c2)
                lastControl = c2
                current = end
            case UInt8(ascii: "q"):
                let control = point(), end = point()
                path.addQuadCurve(to: end, control: control)
                lastControl = control
                current = end
            case UInt8(ascii: "t"):
                let control = reflect(lastControl, around: current)
                let end = point()
                path.addQuadCurve(to: end, control: control)
                lastControl = control
                current = end
            case UInt8(ascii: "a"):
                let rx = scanner.number(), ry = scanner.number(), rotation = scanner.number()
                let largeArc = scanner.flag(), sweep = scanner.flag()
                let end = point()
                addArc(to: &path, from: current, to: end, rx: rx, ry: ry, rotation: rotation, largeArc: largeArc, sweep: sweep)
                current = end
                lastControl = nil
            case UInt8(ascii: "z"):
                path.closeSubpath()
                current = start
                lastControl = nil
            default:
                return path
            }
        }
        return path
    }

    private static func reflect(_ control: CGPoint?, around point: CGPoint) -> CGPoint {
        guard let control else { return point }
        return CGPoint(x: 2 * point.x - control.x, y: 2 * point.y - control.y)
    }

    /// SVG endpoint arc → center parameterization → cubic segments.
    private static func addArc(
        to path: inout Path, from p0: CGPoint, to p1: CGPoint,
        rx rxIn: Double, ry ryIn: Double, rotation: Double, largeArc: Bool, sweep: Bool
    ) {
        var rx = abs(rxIn), ry = abs(ryIn)
        guard rx > 0, ry > 0, p0 != p1 else { path.addLine(to: p1); return }
        let phi = rotation * .pi / 180
        let cosPhi = cos(phi), sinPhi = sin(phi)
        let dx = (p0.x - p1.x) / 2, dy = (p0.y - p1.y) / 2
        let x1 = cosPhi * dx + sinPhi * dy
        let y1 = -sinPhi * dx + cosPhi * dy
        let lambda = (x1 * x1) / (rx * rx) + (y1 * y1) / (ry * ry)
        if lambda > 1 { rx *= lambda.squareRoot(); ry *= lambda.squareRoot() }
        let numerator = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1
        let denominator = rx * rx * y1 * y1 + ry * ry * x1 * x1
        var factor = (max(0, numerator) / denominator).squareRoot()
        if largeArc == sweep { factor = -factor }
        let cxp = factor * rx * y1 / ry
        let cyp = -factor * ry * x1 / rx
        let cx = cosPhi * cxp - sinPhi * cyp + (p0.x + p1.x) / 2
        let cy = sinPhi * cxp + cosPhi * cyp + (p0.y + p1.y) / 2
        func angle(_ ux: Double, _ uy: Double, _ vx: Double, _ vy: Double) -> Double {
            let sign: Double = ux * vy - uy * vx < 0 ? -1 : 1
            let dot = (ux * vx + uy * vy) / ((ux * ux + uy * uy).squareRoot() * (vx * vx + vy * vy).squareRoot())
            return sign * acos(min(1, max(-1, dot)))
        }
        let theta1 = angle(1, 0, (x1 - cxp) / rx, (y1 - cyp) / ry)
        var delta = angle((x1 - cxp) / rx, (y1 - cyp) / ry, (-x1 - cxp) / rx, (-y1 - cyp) / ry)
        if !sweep && delta > 0 { delta -= 2 * .pi }
        if sweep && delta < 0 { delta += 2 * .pi }
        let segments = max(1, Int((abs(delta) / (.pi / 2)).rounded(.up)))
        let step = delta / Double(segments)
        let kappa = 4.0 / 3.0 * tan(step / 4)
        var t = theta1
        func pointAt(_ angle: Double) -> CGPoint {
            let x = rx * cos(angle), y = ry * sin(angle)
            return CGPoint(x: cosPhi * x - sinPhi * y + cx, y: sinPhi * x + cosPhi * y + cy)
        }
        func derivativeAt(_ angle: Double) -> CGPoint {
            let x = -rx * sin(angle), y = ry * cos(angle)
            return CGPoint(x: cosPhi * x - sinPhi * y, y: sinPhi * x + cosPhi * y)
        }
        for index in 0..<segments {
            let t2 = t + step
            let start = pointAt(t), end = index == segments - 1 ? p1 : pointAt(t2)
            let d1 = derivativeAt(t), d2 = derivativeAt(t2)
            path.addCurve(
                to: end,
                control1: CGPoint(x: start.x + kappa * d1.x, y: start.y + kappa * d1.y),
                control2: CGPoint(x: end.x - kappa * d2.x, y: end.y - kappa * d2.y)
            )
            t = t2
        }
    }

    private struct Tokenizer {
        enum Token { case command(UInt8), number }
        let bytes: [UInt8]
        var index = 0
        var mark = 0

        init(_ bytes: [UInt8]) { self.bytes = bytes }

        mutating func skipSeparators() {
            while index < bytes.count, bytes[index] == 0x20 || bytes[index] == 0x2C || bytes[index] == 0x0A || bytes[index] == 0x09 {
                index += 1
            }
        }

        mutating func nextCommandOrNumber() -> Token? {
            skipSeparators()
            mark = index
            guard index < bytes.count else { return nil }
            let byte = bytes[index]
            if (byte >= 65 && byte <= 90 && byte != 69) || (byte >= 97 && byte <= 122 && byte != 101) {
                index += 1
                return .command(byte)
            }
            return .number
        }

        mutating func rewind() { index = mark }

        mutating func flag() -> Bool {
            skipSeparators()
            guard index < bytes.count else { return false }
            let value = bytes[index] == UInt8(ascii: "1")
            index += 1
            return value
        }

        mutating func number() -> Double {
            skipSeparators()
            let begin = index
            var seenDot = false
            var seenExponent = false
            if index < bytes.count, bytes[index] == 0x2D || bytes[index] == 0x2B { index += 1 }
            while index < bytes.count {
                let byte = bytes[index]
                if byte >= 0x30 && byte <= 0x39 {
                    index += 1
                } else if byte == 0x2E && !seenDot && !seenExponent {
                    seenDot = true
                    index += 1
                } else if (byte == 0x65 || byte == 0x45) && !seenExponent {
                    seenExponent = true
                    index += 1
                    if index < bytes.count, bytes[index] == 0x2D || bytes[index] == 0x2B { index += 1 }
                } else {
                    break
                }
            }
            return Double(String(decoding: bytes[begin..<index], as: UTF8.self)) ?? 0
        }
    }
}
