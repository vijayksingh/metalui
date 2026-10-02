'use client';
import * as React from 'react';

export interface CueSelection { start: number; end: number; direction?: 'forward' | 'backward' | 'none' }
export interface CueSourceRange { start: number; end: number }
export interface CueDocumentSnapshot { source: string; selection: CueSelection; editing: boolean; canUndo: boolean; canRedo: boolean }
type Saved = Pick<CueDocumentSnapshot, 'source' | 'selection'>;
type Gesture = { before: Saved; range: CueSourceRange };

/** Document offsets use UTF16, exactly like textarea/TextKit. Recognition never calls this writer. */
export class CueDocument {
  private snapshot: CueDocumentSnapshot;
  private past: Saved[] = [];
  private future: Saved[] = [];
  private gesture?: Gesture;
  private typing = false;
  private listeners = new Set<() => void>();
  private limit: number;

  constructor(source: string, selection: CueSelection = { start: 0, end: 0 }, historyLimit = 100) {
    this.limit = Number.isFinite(historyLimit) ? Math.max(1, Math.floor(historyLimit)) : 100;
    this.snapshot = { source, selection: this.clamp(selection, source), editing: false, canUndo: false, canRedo: false };
  }
  getSnapshot = (): CueDocumentSnapshot => this.snapshot;
  subscribe = (notify: () => void): (() => void) => { this.listeners.add(notify); return () => { this.listeners.delete(notify); }; };
  private clamp(selection: CueSelection, source: string): CueSelection {
    const start = Math.max(0, Math.min(source.length, Math.trunc(selection.start)));
    return { start, end: Math.max(start, Math.min(source.length, Math.trunc(selection.end))), direction: selection.direction ?? 'none' };
  }
  private saved(): Saved { return { source: this.snapshot.source, selection: { ...this.snapshot.selection } }; }
  private publish(value: Saved): void {
    this.snapshot = { ...value, selection: { ...value.selection }, editing: !!this.gesture, canUndo: this.past.length > 0, canRedo: this.future.length > 0 };
    this.listeners.forEach(notify => notify());
  }
  private remember(before: Saved): void { this.past.push(before); this.past = this.past.slice(-this.limit); this.future = []; }

  /** Host typing is coalesced until commit, begin or history navigation. Identical echoes do nothing. */
  setSource = (source: string, selection: CueSelection = this.snapshot.selection): void => {
    if (source === this.snapshot.source) return;
    if (this.gesture) this.commit();
    if (!this.typing) this.remember(this.saved());
    this.typing = true;
    this.publish({ source, selection: this.clamp(selection, source) });
  };
  setSelection = (selection: CueSelection): void => { this.publish({ source: this.snapshot.source, selection: this.clamp(selection, this.snapshot.source) }); };
  /** Reject nesting and invalid offsets, rather than overwriting the captured gesture. */
  begin = (range: CueSourceRange): boolean => {
    if (this.gesture || !Number.isInteger(range.start) || !Number.isInteger(range.end) || range.start < 0 || range.end < range.start || range.end > this.snapshot.source.length) return false;
    this.typing = false;
    this.gesture = { before: this.saved(), range: { ...range } };
    this.publish(this.saved());
    return true;
  };
  replace = (words: string): boolean => {
    const gesture = this.gesture;
    if (!gesture) return false;
    const { source, selection } = this.snapshot;
    const { start, end } = gesture.range;
    if (source.slice(start, end) === words) return true;
    const delta = words.length - (end - start);
    const move = (position: number) => position <= start ? position : position >= end ? position + delta : start + Math.min(position - start, words.length);
    const next = source.slice(0, start) + words + source.slice(end);
    gesture.range = { start, end: start + words.length };
    this.publish({ source: next, selection: { ...selection, start: move(selection.start), end: move(selection.end) } });
    return true;
  };
  commit = (): void => {
    this.typing = false;
    const gesture = this.gesture;
    if (!gesture) return;
    this.gesture = undefined;
    if (gesture.before.source !== this.snapshot.source) this.remember(gesture.before);
    this.publish(this.saved());
  };
  cancel = (): void => {
    this.typing = false;
    const gesture = this.gesture;
    if (!gesture) return;
    this.gesture = undefined;
    this.publish(gesture.before);
  };
  undo = (): void => {
    this.typing = false;
    if (this.gesture) { this.cancel(); return; }
    const before = this.past.pop();
    if (!before) return;
    this.future.push(this.saved()); this.publish(before);
  };
  redo = (): void => {
    this.typing = false;
    if (this.gesture) return;
    const next = this.future.pop();
    if (!next) return;
    this.past.push(this.saved()); this.publish(next);
  };
}

/** One document per mounted host; apply selection only to an editor that already has focus. */
export function useCueDocument(source: string, selection?: CueSelection, historyLimit?: number) {
  const [document] = React.useState(() => new CueDocument(source, selection, historyLimit));
  const snapshot = React.useSyncExternalStore(document.subscribe, document.getSnapshot, document.getSnapshot);
  return { ...snapshot, setSource: document.setSource, setSelection: document.setSelection, begin: document.begin, replace: document.replace, commit: document.commit, cancel: document.cancel, undo: document.undo, redo: document.redo };
}
