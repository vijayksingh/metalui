/* ─────────────────────────────────────────────────────────
 * HAPTIC (the web's share of the tap you feel when something catches)
 *
 *   alignment  a snap caught a new line (Snap guides): one short tick
 *   detent     a value landed on a stop (a detent): one firmer tick
 *   refusal    a thing would not do what was asked: two ticks
 *
 * One call per catch, never one per frame. The first path that exists wins:
 *   bridge      a web-view host (Electron, Tauri, WKWebView) set one with setHapticBridge:
 *               it plays the platform haptic (NSHapticFeedbackManager on a Mac trackpad)
 *   vibrate     navigator.vibrate on a touch device that has it (Android)
 *   ios-switch  iOS Safari 17.4+: toggling a hidden <input type="checkbox" switch> plays
 *               the system tick (feature-detected; a touch device only, since a Mac's
 *               Safari has the switch but no haptic)
 *   none        everywhere else (a Mac or PC browser): nothing plays, and nothing stands in
 *               for it. Never replace a haptic with a sound or a flash.
 * Returns the path it took, so a host can say honestly what the person felt.
 * ───────────────────────────────────────────────────────── */

export type HapticKind = 'alignment' | 'detent' | 'refusal';
export type HapticPath = 'bridge' | 'vibrate' | 'ios-switch' | 'none';
/** A host's native haptic. Called once per catch with the kind; see the Snap guides agent guide. */
export type HapticBridge = (kind: HapticKind) => void;

/** navigator.vibrate patterns in ms: short enough to read as a tick, not a buzz. */
const VIBRATE: Record<HapticKind, number | number[]> = { alignment: 8, detent: 12, refusal: [10, 60, 10] };
/** Switch toggles per kind, and the gap between them (ms). */
const TICKS: Record<HapticKind, number> = { alignment: 1, detent: 1, refusal: 2 };
const TICK_GAP = 80;

let bridge: HapticBridge | null = null;
let bridgeVersion = 0;

/** Route haptic() to the host's native haptic (a web view in a Mac app), or back to the web with null. */
export function setHapticBridge(fn: HapticBridge | null) {
  bridge = fn;
  const installed = ++bridgeVersion;
  // A disposed host must never clear a newer host's transport.
  return () => {
    if (bridgeVersion === installed) { bridge = null; bridgeVersion++; }
  };
}

/** Opt into the shipped WKWebView host handler. SSR and ordinary browsers return null. */
export function connectWebKitHaptics(): (() => void) | null {
  if (typeof window === 'undefined') return null;
  const host = window as Window & { webkit?: { messageHandlers?: { metaluiHaptic?: { postMessage(kind: HapticKind): void } } } };
  const handler = host.webkit?.messageHandlers?.metaluiHaptic;
  if (typeof handler?.postMessage !== 'function') return null;
  return setHapticBridge(kind => handler.postMessage(kind));
}

const coarse = () => typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;

let label: HTMLLabelElement | null = null;
function tickSwitch() {
  if (!label || !label.isConnected) {
    label = document.createElement('label');
    label.setAttribute('aria-hidden', 'true');
    label.dataset.muHaptic = '';
    label.style.display = 'none';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.setAttribute('switch', '');
    input.tabIndex = -1;
    label.appendChild(input);
    document.body.appendChild(label);
  }
  label.click(); // a label click toggles its switch, and iOS plays the tick
}

/** Play the haptic for a catch where this platform can, and say which path it took. */
export function haptic(kind: HapticKind): HapticPath {
  if (bridge) {
    bridge(kind);
    return 'bridge';
  }
  if (typeof window === 'undefined' || typeof document === 'undefined') return 'none';
  if (!coarse()) return 'none';
  if (typeof navigator.vibrate === 'function') {
    // false: the browser refused (no user activation yet, or vibration is off)
    return navigator.vibrate(VIBRATE[kind]) ? 'vibrate' : 'none';
  }
  if ('switch' in HTMLInputElement.prototype) {
    tickSwitch();
    for (let i = 1; i < TICKS[kind]; i++) window.setTimeout(tickSwitch, TICK_GAP * i);
    return 'ios-switch';
  }
  return 'none';
}
