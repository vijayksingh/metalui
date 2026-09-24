// Stroke outliner for the SF Symbol export (driven by scripts/build-symbols.mjs; imported from Kamui).
//
// stdin:  {"jobs":[{"id":…, "items":[{"layer":…, "shape":Shape, "masks":[{"op":"subtract"|"intersect","shapes":[Shape]}]}]}]}
//         Shape = {"d":[["M",x,y],["L",x,y],["C",x1,y1,x2,y2,x,y],["Z"]], "stroke":width|null, "dash":[a,b]|null, "pathLength":n|null}
// stdout: {"jobs":[{"id":…, "layers":{"primary":[item[contour[[x,y],…]]], …}}]}
//
// CoreGraphics does the geometry (stroke outlining with round caps/joins,
// dashing, and the macOS 14 boolean ops), so the export needs no npm deps.
// Contours come back flattened; symbols.mjs resamples them so the three
// weight masters interpolate.
import CoreGraphics
import Foundation

struct Shape: Decodable {
    let d: [[Value]]
    let stroke: Double?
    let dash: [Double]?
    let pathLength: Double?
}

enum Value: Decodable {
    case s(String), n(Double)
    init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        if let n = try? c.decode(Double.self) { self = .n(n) } else { self = .s(try c.decode(String.self)) }
    }
    var num: Double { if case let .n(v) = self { return v }; return 0 }
    var str: String { if case let .s(v) = self { return v }; return "" }
}

struct Mask: Decodable { let op: String; let shapes: [Shape] }
struct Item: Decodable { let layer: String; let shape: Shape; let masks: [Mask] }
struct Job: Decodable { let id: String; let items: [Item] }
struct Input: Decodable { let jobs: [Job] }

func centerline(_ s: Shape) -> CGPath {
    let p = CGMutablePath()
    for cmd in s.d {
        let v = cmd.dropFirst().map(\.num)
        switch cmd[0].str {
        case "M": p.move(to: CGPoint(x: v[0], y: v[1]))
        case "L": p.addLine(to: CGPoint(x: v[0], y: v[1]))
        case "C": p.addCurve(to: CGPoint(x: v[4], y: v[5]), control1: CGPoint(x: v[0], y: v[1]), control2: CGPoint(x: v[2], y: v[3]))
        case "Z": p.closeSubpath()
        default: break
        }
    }
    return p
}

/// Polylines per subpath, cubics split into `steps` segments.
func flatten(_ path: CGPath, steps: Int = 24) -> [(points: [CGPoint], closed: Bool)] {
    var out: [(points: [CGPoint], closed: Bool)] = []
    var cur: [CGPoint] = []
    var last = CGPoint.zero
    func flush(_ closed: Bool) { if cur.count > 1 { out.append((cur, closed)) }; cur = [] }
    path.applyWithBlock { el in
        let e = el.pointee
        switch e.type {
        case .moveToPoint:
            flush(false); last = e.points[0]; cur = [last]
        case .addLineToPoint:
            last = e.points[0]; cur.append(last)
        case .addQuadCurveToPoint:
            let c = e.points[0], p = e.points[1]
            for i in 1...steps {
                let t = CGFloat(i) / CGFloat(steps), u = 1 - t
                cur.append(CGPoint(x: u * u * last.x + 2 * u * t * c.x + t * t * p.x, y: u * u * last.y + 2 * u * t * c.y + t * t * p.y))
            }
            last = p
        case .addCurveToPoint:
            let c1 = e.points[0], c2 = e.points[1], p = e.points[2]
            for i in 1...steps {
                let t = CGFloat(i) / CGFloat(steps), u = 1 - t
                let a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t
                cur.append(CGPoint(x: a * last.x + b * c1.x + c * c2.x + d * p.x, y: a * last.y + b * c1.y + c * c2.y + d * p.y))
            }
            last = p
        case .closeSubpath:
            flush(true)
        @unknown default: break
        }
    }
    flush(false)
    return out
}

func length(_ path: CGPath) -> CGFloat {
    flatten(path, steps: 64).reduce(0) { total, sub in
        var pts = sub.points
        if sub.closed, let f = pts.first { pts.append(f) }
        return total + zip(pts, pts.dropFirst()).reduce(0) { $0 + hypot($1.1.x - $1.0.x, $1.1.y - $1.0.y) }
    }
}

func region(_ s: Shape) -> CGPath {
    var p = centerline(s)
    guard let w = s.stroke else { return p }
    if let dash = s.dash, dash.count >= 2 {
        let k = s.pathLength.map { length(p) / CGFloat($0) } ?? 1
        p = p.copy(dashingWithPhase: 0, lengths: dash.map { CGFloat($0) * k })
    }
    return p.copy(strokingWithWidth: CGFloat(w), lineCap: .round, lineJoin: .round, miterLimit: 10).normalized()
}

let data = FileHandle.standardInput.readDataToEndOfFile()
let input = try JSONDecoder().decode(Input.self, from: data)
var jobsOut: [[String: Any]] = []
for job in input.jobs {
    // Items stay separate (no cross-item union): overlaps resolve under the
    // nonzero rule, and each item keeps the same contour topology at every
    // stroke width, which interpolation needs.
    var layers: [String: [[[[Double]]]]] = [:]
    for item in job.items {
        var r = region(item.shape)
        for m in item.masks {
            guard !m.shapes.isEmpty else { continue }
            var mp: CGPath = region(m.shapes[0])
            for s in m.shapes.dropFirst() { mp = mp.union(region(s)) }
            r = m.op == "intersect" ? r.intersection(mp) : r.subtracting(mp)
        }
        let contours = flatten(r.normalized()).map { sub in sub.points.map { [Double($0.x), Double($0.y)] } }
        layers[item.layer, default: []].append(contours)
    }
    jobsOut.append(["id": job.id, "layers": layers])
}
let json = try JSONSerialization.data(withJSONObject: ["jobs": jobsOut])
FileHandle.standardOutput.write(json)
