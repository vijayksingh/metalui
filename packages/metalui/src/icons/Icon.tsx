import * as React from 'react';
import { ICON_CATALOG, type IconName } from './catalog.generated';
import './icons.generated.css';

/* ─────────────────────────────────────────────────────────
 * ICON PLAYBACK
 *
 * An icon with a motion study (docs/ICON-MOTION.md) plays one act:
 *    0ms  pointer enters the trigger (not touch), it gains focus-visible, or is clicked
 *         → every part's keyframes start together on one clock
 *   Nms   the act ends at rest, N = its duration; it finishes even if the pointer leaves,
 *         and a trigger during the act is ignored (one performance at a time)
 * Disabled triggers and reduced motion play nothing; reduced motion also stops an act.
 *
 * Legacy icons (no study yet):
 * Hover   the trigger (nearest .mu-icon-trigger, else the icon) is hovered:
 *         CSS springs every part into its pose; leaving reverses it.
 * Press   pointerdown, or Enter / Space on the trigger:
 *    0ms  data-press set (restarted if already playing)
 *   Nms   data-press cleared, N = the icon's pressMs (its longest track)
 * Reduced motion: both are no-ops; the CSS keeps the glyph static.
 * ───────────────────────────────────────────────────────── */

// Static icons at or below this size use the tuned 16 cut (simplified geometry,
// heavier stroke). Animated icons keep the master geometry, like the sheet,
// because the tuned cut has no moving parts.
const SMALL = 16;

export interface IconProps extends Omit<React.SVGProps<SVGSVGElement>, 'children' | 'name'> {
  /** Rendered size in px. */
  size?: number;
  /** Accessible name. Without it the icon is decorative (aria-hidden). */
  title?: string;
  /** Stroke width in 24-grid units. Defaults to 1.7 (the tuned cut's weight when static at ≤16px). */
  strokeWidth?: number;
  /** Set false to keep the glyph static; at ≤16px it then uses the tuned small cut. */
  animate?: boolean;
}

function markup(name: IconName, uid: string, small: boolean) {
  const icon = ICON_CATALOG[name];
  const body16 = 'body16' in icon ? icon.body16 : undefined;
  const body = small && body16 ? body16 : icon.body;
  const defs = small && body16?.includes('<defs>') ? '' : icon.defs;
  return ((defs ? `<defs>${defs}</defs>` : '') + body).replace(/&-/g, `${uid}-`);
}

const disabled = (trigger: Element) =>
  (trigger instanceof HTMLButtonElement && trigger.disabled) ||
  trigger.hasAttribute('data-disabled') ||
  trigger.getAttribute('aria-disabled') === 'true';

function useActPlayback(ref: React.RefObject<SVGSVGElement | null>, name: IconName, enabled: boolean) {
  React.useEffect(() => {
    const svg = ref.current;
    const icon = ICON_CATALOG[name];
    const act = 'motion' in icon ? icon.motion : undefined;
    if (!svg || !enabled || !act) return;
    const trigger = svg.closest('.mu-icon-trigger') ?? svg;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    svg.setAttribute('data-motion-runtime', ''); // the CSS player steps aside
    let running: Animation[] = [];
    const stop = () => {
      running.forEach((a) => a.cancel());
      running = [];
      svg.removeAttribute('data-playing');
    };
    const play = () => {
      if (running.length || reduce.matches || disabled(trigger)) return;
      svg.setAttribute('data-playing', '');
      running = act.tracks.flatMap(({ part, keyframes }) => {
        const el = svg.querySelector<SVGElement>(`[data-part="${part}"]`);
        return el ? [el.animate(keyframes as Keyframe[], { duration: act.duration, easing: 'linear', fill: 'both' })] : [];
      });
      const batch = running;
      // Released only after every part is back at rest, so nothing snaps.
      Promise.allSettled(batch.map((a) => a.finished)).then(() => {
        if (running === batch) stop();
      });
    };
    const onPointer = (event: Event) => {
      if ((event as PointerEvent).pointerType !== 'touch') play();
    };
    const onFocus = () => {
      if (trigger.matches(':focus-visible')) play();
    };
    const onReduce = () => {
      if (reduce.matches) stop();
    };
    trigger.addEventListener('pointerenter', onPointer);
    trigger.addEventListener('focusin', onFocus);
    trigger.addEventListener('click', play);
    reduce.addEventListener('change', onReduce);
    return () => {
      stop();
      svg.removeAttribute('data-motion-runtime');
      trigger.removeEventListener('pointerenter', onPointer);
      trigger.removeEventListener('focusin', onFocus);
      trigger.removeEventListener('click', play);
      reduce.removeEventListener('change', onReduce);
    };
  }, [ref, name, enabled]);
}

function usePressPlayback(ref: React.RefObject<SVGSVGElement | null>, name: IconName, enabled: boolean) {
  React.useEffect(() => {
    const svg = ref.current;
    if (!svg || !enabled || 'motion' in ICON_CATALOG[name]) return;
    const trigger = (svg.closest('.mu-icon-trigger') as HTMLElement | null) ?? svg;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const play = () => {
      if (disabled(trigger)) return;
      svg.removeAttribute('data-press');
      void svg.getBoundingClientRect(); // restart the keyframes
      svg.setAttribute('data-press', '');
      clearTimeout(timer);
      timer = setTimeout(() => svg.removeAttribute('data-press'), ICON_CATALOG[name].pressMs);
    };
    const onKey = (event: Event) => {
      const { key, repeat } = event as KeyboardEvent;
      if (!repeat && (key === 'Enter' || key === ' ')) play();
    };
    trigger.addEventListener('pointerdown', play);
    trigger.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(timer);
      trigger.removeEventListener('pointerdown', play);
      trigger.removeEventListener('keydown', onKey);
      svg.removeAttribute('data-press');
    };
  }, [ref, name, enabled]);
}

export const Icon = React.forwardRef<SVGSVGElement, IconProps & { name: IconName }>(function Icon(
  { name, size = 24, title, strokeWidth, animate = true, className, style, ...props },
  forwardedRef,
) {
  const ref = React.useRef<SVGSVGElement>(null);
  React.useImperativeHandle(forwardedRef, () => ref.current as SVGSVGElement);
  const uid = `mu${React.useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const small = !animate && size <= SMALL;
  const sw = strokeWidth ?? (small ? ICON_CATALOG[name].sw16 : undefined);
  useActPlayback(ref, name, animate);
  usePressPlayback(ref, name, animate);

  const html = markup(name, uid, small) + (title ? `<title>${title.replace(/[<&]/g, '')}</title>` : '');
  return (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`mu-icon mu-ic-${name}${className ? ` ${className}` : ''}`}
      style={sw === undefined ? style : ({ '--sw': sw, ...style } as React.CSSProperties)}
      data-static={animate ? undefined : ''}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
      {...props}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});

export function createIcon(name: IconName, displayName: string) {
  const Named = React.forwardRef<SVGSVGElement, IconProps>(function NamedIcon(props, ref) {
    return <Icon ref={ref} name={name} {...props} />;
  });
  Named.displayName = displayName;
  return Named;
}
