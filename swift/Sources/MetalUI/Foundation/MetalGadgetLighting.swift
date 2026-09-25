import CoreGraphics
import CoreImage
import CoreImage.CIFilterBuiltins
import SwiftUI

// The one light for gadgets in SwiftUI: the web's SVG lighting (packages/metalui/src/gadgets/light.ts)
// rebuilt on Core Image. A body's mask, blurred, is its height (CIHeightFieldFromMask); a sphere lit
// by the token light, in the body's pigment, is the shading every normal looks up (CIShadedMaterial);
// grain perturbs the height, flecks sit in the moulding, and a cast and a contact shadow put it down.
// Results are cached per (material, pigment, size, colorway, contrast).

// MARK: - Recipe types (filled by MetalGadgets.generated.swift)

public struct MetalGadgetShadow: Sendable, Hashable {
    public let blur: Double
    public let dx: Double
    public let dy: Double
    public let alpha: Double
}

public struct MetalGadgetFinish: Sendable {
    public let lightness: (Double, Double)
    public let chromaCap: Double
    public let bevel: Double
    public let surfaceScale: Double
    public let diffuse: Double
    public let glossExponent: Double
    public let glossStrength: Double
    public let grainFrequency: Double
    public let grainAmplitude: Double
    public let grainDirectional: Bool
    public let flecks: Double
    public let translucency: Double
    public let cast: MetalGadgetShadow
    public let contact: MetalGadgetShadow
    /// The hue the docs sheet shows this material at.
    public let sampleHue: Double
    public let strikeTravel: Double
    public let strikeSquash: Double
}

// MARK: - Pigment: OKLCH → Display P3 (the web's color.ts)

public enum MetalPigment {
    /// Gamma-encoded Display P3 components for an OKLCH colour; chroma is reduced (bisection)
    /// at constant lightness and hue until it fits, never the other way round.
    public static func p3(lightness L: Double, chroma C: Double, hue H: Double) -> (red: Double, green: Double, blue: Double) {
        let l = min(1, max(0, L)), h = (H.truncatingRemainder(dividingBy: 360) + 360).truncatingRemainder(dividingBy: 360)
        func linearP3(_ c: Double) -> (Double, Double, Double) {
            let a = c * cos(h * .pi / 180), b = c * sin(h * .pi / 180)
            let lm = pow(l + 0.3963377774 * a + 0.2158037573 * b, 3)
            let mm = pow(l - 0.1055613458 * a - 0.0638541728 * b, 3)
            let sm = pow(l - 0.0894841775 * a - 1.291485548 * b, 3)
            let r = 4.0767416621 * lm - 3.3077115913 * mm + 0.2309699292 * sm
            let g = -1.2684380046 * lm + 2.6097574011 * mm - 0.3413193965 * sm
            let bl = -0.0041960863 * lm - 0.7034186147 * mm + 1.707614701 * sm
            return (0.8224621 * r + 0.177538 * g, 0.0331941 * r + 0.9668058 * g, 0.0170827 * r + 0.0723974 * g + 0.9105199 * bl)
        }
        func inside(_ v: (Double, Double, Double)) -> Bool { [v.0, v.1, v.2].allSatisfy { $0 >= -1e-5 && $0 <= 1 + 1e-5 } }
        var c = max(0, C)
        if !inside(linearP3(c)) {
            var lo = 0.0, hi = c
            for _ in 0..<12 { let mid = (lo + hi) / 2; if inside(linearP3(mid)) { lo = mid } else { hi = mid } }
            c = lo
        }
        let v = linearP3(c)
        func gamma(_ x: Double) -> Double { let x = min(1, max(0, x)); return x <= 0.0031308 ? 12.92 * x : 1.055 * pow(x, 1 / 2.4) - 0.055 }
        return (gamma(v.0), gamma(v.1), gamma(v.2))
    }

    public static func color(lightness: Double, chroma: Double, hue: Double) -> Color {
        let p = p3(lightness: lightness, chroma: chroma, hue: hue)
        return Color(.displayP3, red: p.red, green: p.green, blue: p.blue)
    }
}

// MARK: - Lighting

public enum MetalGadgetLighting {
    /// The shadow colour (tokens gadgets.light.shadow-color), for parts drawn in SwiftUI.
    public static let shadow = Color(red: MetalGadgetTokens.shadowColor.red, green: MetalGadgetTokens.shadowColor.green, blue: MetalGadgetTokens.shadowColor.blue)
    private static let context = CIContext(options: [.workingColorSpace: CGColorSpace(name: CGColorSpace.displayP3)!])
    nonisolated(unsafe) private static var cache: [String: CGImage] = [:]
    private static let lock = NSLock()

    /// A lit body: the gadget canvas's rounded body, cut from `material`, in one pigment (OKLCH),
    /// drawn at `size` points and `scale`. Returns the image with room for its shadow around it.
    public static func body(_ material: MetalSoundMaterial, lightness: Double, chroma: Double, hue: Double,
                            size: Double, scale: Double = 2, colorway: MetalColorway = .bone, contrast: Bool = false) -> CGImage? {
        let r = MetalGadgetTokens.bodyRect
        let path = CGPath(roundedRect: CGRect(x: r.x, y: r.y, width: r.width, height: r.height),
                          cornerWidth: MetalGadgetTokens.bodyRadius, cornerHeight: MetalGadgetTokens.bodyRadius, transform: nil)
        return surface(path, key: "body", material: material, lightness: lightness, chroma: chroma, hue: hue, size: size, scale: scale, colorway: colorway, contrast: contrast)
    }

    /// Any shape on the 400-unit canvas (even-odd, so cuts are holes), lit as `material` in one pigment.
    /// `key` names the shape for the cache.
    public static func surface(_ path: CGPath, key shape: String, material: MetalSoundMaterial, lightness: Double, chroma: Double, hue: Double,
                               size: Double, scale: Double = 2, colorway: MetalColorway = .bone, contrast: Bool = false) -> CGImage? {
        let key = "\(shape)|\(material.rawValue)|\(lightness)|\(chroma)|\(hue)|\(size)|\(scale)|\(colorway.rawValue)|\(contrast)"
        lock.lock(); if let hit = cache[key] { lock.unlock(); return hit }; lock.unlock()
        guard let image = render(material, path: path, lightness: lightness, chroma: chroma, hue: hue, size: size, scale: scale,
                                 colorway: colorway, contrast: contrast) else { return nil }
        lock.lock(); cache[key] = image; lock.unlock()
        return image
    }

    private static func render(_ material: MetalSoundMaterial, path: CGPath, lightness: Double, chroma: Double, hue: Double,
                               size: Double, scale: Double, colorway: MetalColorway, contrast: Bool) -> CGImage? {
        let f = material.finish
        let px = size * scale, unit = px / MetalGadgetTokens.canvas      // pixels per canvas unit
        var L = lightness
        if colorway == .graphite, L > MetalGadgetTokens.graphiteBrightAbove { L -= MetalGadgetTokens.graphiteBrightDrop }

        // The shape's mask, on a canvas with room for the shadow (canvas units, y down → pixels, y up).
        let canvas = CGRect(x: 0, y: 0, width: px, height: px)
        var toPixels = CGAffineTransform(translationX: 0, y: px).scaledBy(x: unit, y: -unit)
        guard let shape = path.copy(using: &toPixels) else { return nil }
        let bodyRect = shape.boundingBoxOfPath
        guard let mask = maskImage(canvas: canvas, path: shape) else { return nil }

        // Height: the blurred mask.
        let height = CIFilter.heightFieldFromMask()
        height.inputImage = mask
        height.radius = Float(f.bevel * unit)
        guard let field = height.outputImage?.cropped(to: canvas) else { return nil }
        // Shading: a sphere in the pigment, lit by the token light (diffuse + gloss).
        let pigment = MetalPigment.p3(lightness: L, chroma: chroma, hue: hue)
        guard let sphere = shadingSphere(pigment: pigment, finish: f) else { return nil }
        let shade = CIFilter.shadedMaterial()
        shade.inputImage = field
        shade.shadingImage = sphere
        // Core Image's height scale runs in pixels where SVG's surfaceScale runs in alpha steps; 1.6 matches their slopes.
        shade.scale = Float(f.surfaceScale * unit * 1.6)
        guard var lit = shade.outputImage?.cropped(to: canvas) else { return nil }
        // Grain: on the web, fractal roughness added to the height and lit. Core Image's shaded
        // material cannot take a roughened height (it saturates), so the same roughness is applied
        // as the light and dark it produces once lit: a fine modulation around 1.
        if f.grainAmplitude > 0 {
            var noise = noiseImage(canvas)
            noise = f.grainDirectional
                ? noise.applyingFilter("CIMotionBlur", parameters: [kCIInputRadiusKey: 6 * unit, kCIInputAngleKey: 0])
                : noise.applyingGaussianBlur(sigma: max(0.6, 0.9 / f.grainFrequency * unit))
            let k = CGFloat(f.grainAmplitude * MetalGadgetTokens.grainLitGain)
            let texture = noise.applyingFilter("CIColorMatrix", parameters: [
                "inputRVector": CIVector(x: k, y: 0, z: 0, w: 0), "inputGVector": CIVector(x: k, y: 0, z: 0, w: 0),
                "inputBVector": CIVector(x: k, y: 0, z: 0, w: 0), "inputAVector": CIVector(x: 0, y: 0, z: 0, w: 0),
                "inputBiasVector": CIVector(x: 1 - k / 2, y: 1 - k / 2, z: 1 - k / 2, w: 1),
            ]).cropped(to: canvas)
            lit = lit.applyingFilter("CIMultiplyCompositing", parameters: [kCIInputBackgroundImageKey: texture]).cropped(to: canvas)
        }

        // The light spreads over the pigment: a touch lighter at the top, darker at the bottom;
        // a translucent (scattering) material glows at its core.
        let spread = CIFilter.linearGradient()
        spread.point0 = CGPoint(x: 0, y: bodyRect.maxY); spread.color0 = CIColor(red: 1.03, green: 1.03, blue: 1.03)
        spread.point1 = CGPoint(x: 0, y: bodyRect.minY); spread.color1 = CIColor(red: 0.95, green: 0.95, blue: 0.95)
        if let g = spread.outputImage?.cropped(to: canvas) {
            lit = lit.applyingFilter("CIMultiplyCompositing", parameters: [kCIInputBackgroundImageKey: g]).cropped(to: canvas)
        }
        if f.translucency >= MetalGadgetTokens.scatter.0, f.translucency <= MetalGadgetTokens.scatter.1 {
            let core = CIFilter.radialGradient()
            core.center = CGPoint(x: bodyRect.midX, y: bodyRect.minY + bodyRect.height * 0.42)
            core.radius0 = 0; core.radius1 = Float(bodyRect.width * 0.62)
            core.color0 = CIColor(red: 1, green: 1, blue: 1, alpha: 0.28 * f.translucency); core.color1 = CIColor(red: 1, green: 1, blue: 1, alpha: 0)
            if let g = core.outputImage?.cropped(to: canvas) {
                lit = g.applyingFilter("CIScreenBlendMode", parameters: [kCIInputBackgroundImageKey: lit]).cropped(to: canvas)
            }
        }
        lit = lit.applyingFilter("CISourceInCompositing", parameters: [kCIInputBackgroundImageKey: mask])

        // Flecks: sparse light specks from thresholded noise, only on the body.
        if f.flecks > 0 {
            let slope = min(MetalGadgetTokens.fleckMax, f.flecks * MetalGadgetTokens.fleckScale)
            // A speck where the noise clears the cut, at full white; then the material's fleck strength.
            let gain = 1 / (1 - MetalGadgetTokens.fleckUniformCut)
            let specks = noiseImage(canvas)
                .applyingFilter("CIColorMatrix", parameters: [
                    "inputRVector": CIVector(x: 0, y: 0, z: 0, w: 0), "inputGVector": CIVector(x: 0, y: 0, z: 0, w: 0),
                    "inputBVector": CIVector(x: 0, y: 0, z: 0, w: 0), "inputAVector": CIVector(x: gain, y: 0, z: 0, w: 0),
                    "inputBiasVector": CIVector(x: 1, y: 1, z: 1, w: -MetalGadgetTokens.fleckUniformCut * gain),
                ])
                .applyingFilter("CIColorClamp")
                .applyingFilter("CIColorMatrix", parameters: ["inputAVector": CIVector(x: 0, y: 0, z: 0, w: slope)])
                .applyingFilter("CISourceInCompositing", parameters: [kCIInputBackgroundImageKey: mask])
            lit = specks.composited(over: lit)
        }

        // Shadows: cast and contact, darker on a dark host and under increased contrast.
        let alpha = (colorway == .graphite ? MetalGadgetTokens.graphiteShadow : 1) * (contrast ? MetalGadgetTokens.contrastShadow : 1)
        func shadow(_ s: MetalGadgetShadow) -> CIImage {
            mask.applyingGaussianBlur(sigma: s.blur * unit)
                .transformed(by: CGAffineTransform(translationX: s.dx * unit, y: -s.dy * unit))
                .applyingFilter("CIColorMatrix", parameters: [
                    "inputRVector": CIVector(x: 0, y: 0, z: 0, w: 0), "inputGVector": CIVector(x: 0, y: 0, z: 0, w: 0),
                    "inputBVector": CIVector(x: 0, y: 0, z: 0, w: 0), "inputAVector": CIVector(x: 0, y: 0, z: 0, w: CGFloat(min(1, s.alpha * alpha))),
                    "inputBiasVector": CIVector(x: MetalGadgetTokens.shadowColor.red, y: MetalGadgetTokens.shadowColor.green, z: MetalGadgetTokens.shadowColor.blue, w: 0),
                ])
                .cropped(to: canvas)
        }
        let composed = lit.composited(over: shadow(f.contact).composited(over: shadow(f.cast)))
        return context.createCGImage(composed, from: canvas, format: .RGBA8, colorSpace: CGColorSpace(name: CGColorSpace.displayP3))
    }

    /// Uniform noise, opaque. Core Image's random image has random alpha too, and colour filters
    /// un-premultiply before they read red, so red ÷ a random alpha would overshoot every threshold.
    private static func noiseImage(_ canvas: CGRect) -> CIImage {
        CIFilter.randomGenerator().outputImage!.settingAlphaOne(in: canvas).cropped(to: canvas)
    }

    /// The shape's alpha: white inside (even-odd, so cuts stay clear), clear outside.
    private static func maskImage(canvas: CGRect, path: CGPath) -> CIImage? {
        guard let ctx = CGContext(data: nil, width: Int(canvas.width), height: Int(canvas.height), bitsPerComponent: 8, bytesPerRow: 0,
                                  space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { return nil }
        ctx.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1))
        ctx.addPath(path)
        ctx.fillPath(using: .evenOdd)
        return ctx.makeImage().map { CIImage(cgImage: $0) }
    }

    /// The shading lookup: a sphere in the pigment, lit by the one light (azimuth, elevation) with
    /// the material's diffuse, plus its gloss as a specular highlight from the gloss elevation.
    static func shadingSphere(pigment: (red: Double, green: Double, blue: Double), finish f: MetalGadgetFinish) -> CIImage? {
        let n = 256, c = Double(n) / 2
        var bytes = [UInt8](repeating: 0, count: n * n * 4)
        let az = MetalGadgetTokens.lightAzimuth * .pi / 180, el = MetalGadgetTokens.lightElevation * .pi / 180
        // SVG measures azimuth clockwise with y down; the sphere is y up.
        let light = (cos(el) * cos(az), -cos(el) * sin(az), sin(el))
        let gel = MetalGadgetTokens.glossElevation * .pi / 180
        let glossLight = (cos(gel) * cos(az), -cos(gel) * sin(az), sin(gel))
        let half = { () -> (Double, Double, Double) in
            let h = (glossLight.0, glossLight.1, glossLight.2 + 1), len = sqrt(h.0 * h.0 + h.1 * h.1 + h.2 * h.2)
            return (h.0 / len, h.1 / len, h.2 / len)
        }()
        for row in 0..<n {
            for col in 0..<n {
                let nx = (Double(col) + 0.5 - c) / c, ny = (c - Double(row) - 0.5) / c, rr = nx * nx + ny * ny
                guard rr <= 1 else { continue }
                let nz = sqrt(1 - rr)
                let diffuse = f.diffuse * max(0, nx * light.0 + ny * light.1 + nz * light.2) * MetalGadgetTokens.litGain
                let spec = f.glossStrength > 0 ? f.glossStrength * pow(max(0, nx * half.0 + ny * half.1 + nz * half.2), max(1, min(128, f.glossExponent))) : 0
                let i = (row * n + col) * 4
                bytes[i] = UInt8(min(255, (pigment.red * diffuse + spec) * 255))
                bytes[i + 1] = UInt8(min(255, (pigment.green * diffuse + spec) * 255))
                bytes[i + 2] = UInt8(min(255, (pigment.blue * diffuse + spec) * 255))
                bytes[i + 3] = 255
            }
        }
        let data = Data(bytes)
        return CIImage(bitmapData: data, bytesPerRow: n * 4, size: CGSize(width: n, height: n), format: .RGBA8,
                       colorSpace: CGColorSpace(name: CGColorSpace.displayP3))
    }
}

/// A material specimen: the gadget body cut from a material, lit by the one light, as the
/// docs sheet shows it (Foundations › Materials › Gadget materials).
public struct MetalMaterialSpecimen: View {
    let material: MetalSoundMaterial
    let lightness: Double, chroma: Double, hue: Double
    let size: Double
    @Environment(\.displayScale) private var displayScale
    @Environment(\.metalColorway) private var colorway
    @Environment(\.colorSchemeContrast) private var contrast

    public init(_ material: MetalSoundMaterial, lightness: Double, chroma: Double, hue: Double, size: Double = 132) {
        self.material = material; self.lightness = lightness; self.chroma = chroma; self.hue = hue; self.size = size
    }

    /// The sheet's sample: lighter when light, darker when heavy, at the material's own hue.
    public init(_ material: MetalSoundMaterial, weight: Double, size: Double = 132) {
        let f = material.finish
        self.init(material, lightness: min(f.lightness.1, max(f.lightness.0, 0.88 - 0.56 * weight)),
                  chroma: min(f.chromaCap, 0.095), hue: f.sampleHue - 8 * weight, size: size)
    }

    public var body: some View {
        Group {
            if let image = MetalGadgetLighting.body(material, lightness: lightness, chroma: chroma, hue: hue, size: size,
                                                    scale: max(1, displayScale), colorway: colorway, contrast: contrast == .increased) {
                Image(decorative: image, scale: max(1, displayScale))
            } else {
                Color.clear
            }
        }
        .frame(width: size, height: size)
        .accessibilityLabel("\(material.rawValue) specimen")
    }
}
