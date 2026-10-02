import Foundation
import Combine

/// UTF16 positions match textarea and TextKit, including backward selection direction.
public struct MetalCueSelection: Equatable, Sendable {
    public var start: Int
    public var end: Int
    public var backward: Bool
    public init(start: Int = 0, end: Int = 0, backward: Bool = false) {
        self.start = start; self.end = end; self.backward = backward
    }
}

/// Source ownership for structured inline edits. A recognizer never writes to this document.
@MainActor public final class MetalCueDocument: ObservableObject {
    @Published public private(set) var source: String
    @Published public private(set) var selection: MetalCueSelection
    @Published public private(set) var editing = false
    @Published public private(set) var canUndo = false
    @Published public private(set) var canRedo = false
    private struct Saved { let source: String; let selection: MetalCueSelection }
    private struct Gesture { let before: Saved; var range: NSRange }
    private var gesture: Gesture?
    private var past: [Saved] = []
    private var future: [Saved] = []
    private var typing = false
    private let limit: Int

    public init(_ source: String, selection: MetalCueSelection = .init(), historyLimit: Int = 100) {
        self.source = source; self.selection = selection; self.limit = max(1, historyLimit)
        self.selection = clamped(selection, in: source)
    }
    private var saved: Saved { Saved(source: source, selection: selection) }
    // Swift String equality folds canonically equivalent spellings. Source offsets do not:
    // precomposed and combining accents can occupy different UTF16 ranges.
    private func sameSource(_ first: String, _ second: String) -> Bool {
        first.utf16.elementsEqual(second.utf16)
    }
    private func clamped(_ selection: MetalCueSelection, in source: String) -> MetalCueSelection {
        let count = source.utf16.count
        let start = min(count, max(0, selection.start))
        return .init(start: start, end: min(count, max(start, selection.end)), backward: selection.backward)
    }
    private func publish(_ saved: Saved) {
        source = saved.source; selection = saved.selection
        editing = gesture != nil; canUndo = !past.isEmpty; canRedo = !future.isEmpty
    }
    private func remember(_ saved: Saved) { past.append(saved); past = Array(past.suffix(limit)); future.removeAll() }
    /// Coalesces host typing until commit/begin/history navigation. Equal echoes preserve previews.
    public func setSource(_ source: String, selection: MetalCueSelection? = nil) {
        guard !sameSource(source, self.source) else { return }
        if gesture != nil { commit() }
        if !typing { remember(saved) }
        typing = true
        publish(Saved(source: source, selection: clamped(selection ?? self.selection, in: source)))
    }
    public func setSelection(_ selection: MetalCueSelection) { publish(Saved(source: source, selection: clamped(selection, in: source))) }
    @discardableResult public func begin(_ range: NSRange) -> Bool {
        guard gesture == nil, range.location >= 0, range.length >= 0, range.location <= source.utf16.count,
              range.length <= source.utf16.count - range.location else { return false }
        typing = false; gesture = Gesture(before: saved, range: range); publish(saved); return true
    }
    @discardableResult public func replace(_ words: String) -> Bool {
        guard var active = gesture else { return false }
        let ns = source as NSString, range = active.range
        guard !sameSource(ns.substring(with: range), words) else { return true }
        let count = words.utf16.count, end = range.location + range.length, delta = count - range.length
        func move(_ position: Int) -> Int {
            if position <= range.location { return position }
            if position >= end { return position + delta }
            return range.location + min(position - range.location, count)
        }
        let next = ns.replacingCharacters(in: range, with: words)
        let selection = MetalCueSelection(start: move(self.selection.start), end: move(self.selection.end), backward: self.selection.backward)
        active.range = NSRange(location: range.location, length: count); gesture = active
        publish(Saved(source: next, selection: selection)); return true
    }
    public func commit() {
        typing = false
        guard let active = gesture else { return }
        gesture = nil
        if !sameSource(active.before.source, source) { remember(active.before) }
        publish(saved)
    }
    public func cancel() {
        typing = false
        guard let active = gesture else { return }
        gesture = nil; publish(active.before)
    }
    public func undo() {
        typing = false
        if gesture != nil { cancel(); return }
        guard let before = past.popLast() else { return }
        future.append(saved); publish(before)
    }
    public func redo() {
        typing = false
        guard gesture == nil, let next = future.popLast() else { return }
        past.append(saved); publish(next)
    }
}
