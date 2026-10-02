'use client';

import * as React from 'react';
import { useRender } from '@base-ui/react/use-render';
import { ExternalIcon, DownloadIcon, ArrowIcon } from '../../icons/components.generated';
import { Tooltip } from '../tooltip/tooltip';
import { useReducedMotion } from '../../motion/reduced';

const LINK = 'mu-link mu-icon-trigger link-anchor outline-none focus-visible:focus-ring';
export interface LinkProps extends useRender.ComponentProps<'a'> {
  /** Marks a destination outside this site and opens a new tab. */
  external?: boolean;
  /** Enable the browser's quieter visited underline. Off by default in apps. */
  visited?: boolean;
  /** Destination cannot currently be followed. */
  disabled?: boolean;
  disabledReason?: string;
  /** The host route is pending. Stops on unmount, off screen or reduced motion. */
  loading?: boolean;
  fileSize?: string;
  kind?: 'inline' | 'quiet' | 'standalone';
}

/** A real anchor; Base UI useRender preserves router and ref composition. */
export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(function Link({ external, visited, disabled, disabledReason, loading, fileSize, kind = 'inline', render, className, children, ...props }, forwardedRef) {
  const [element, setElement] = React.useState<HTMLAnchorElement | null>(null);
  const ref = React.useCallback((node: HTMLAnchorElement | null) => {
    setElement(node);
    if (typeof forwardedRef === 'function') forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  }, [forwardedRef]);
  const reduced = useReducedMotion(element);
  const [visible, setVisible] = React.useState(false);
  const unavailable = disabled || props['aria-disabled'] === true || props['aria-disabled'] === 'true';
  React.useEffect(() => {
    if (!loading || !element) { setVisible(false); return; }
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(element);
    return () => observer.disconnect();
  }, [loading, element]);
  const download = props.download !== undefined && props.download !== false;
  const glyph = download ? <DownloadIcon /> : external ? <ExternalIcon /> : kind === 'standalone' ? <ArrowIcon /> : null;
  const anchor = useRender({ render, ref, defaultTagName: 'a', props: {
    ...props,
    href: unavailable ? undefined : props.href,
    'aria-disabled': unavailable || undefined,
    role: unavailable ? 'link' : props.role,
    'aria-busy': loading || undefined,
    tabIndex: unavailable ? props.tabIndex ?? 0 : props.tabIndex,
    'data-visited': visited ? '' : undefined,
    'data-kind': kind,
    'data-reduced': reduced ? '' : undefined,
    className: className ? `${LINK} ${className}` : LINK,
    ...(external && !download ? { target: props.target ?? '_blank', rel: props.rel ?? 'noopener noreferrer' } : null),
    onPointerEnter: (event: React.PointerEvent<HTMLAnchorElement>) => {
      const box = event.currentTarget.getBoundingClientRect();
      event.currentTarget.style.setProperty('--mu-link-origin', event.clientX > box.x + box.width / 2 ? 'right' : 'left');
      props.onPointerEnter?.(event);
    },
    onClick: (event: React.MouseEvent<HTMLAnchorElement>) => { if (unavailable) { event.preventDefault(); event.stopPropagation(); } else props.onClick?.(event); },
    onAuxClick: (event: React.MouseEvent<HTMLAnchorElement>) => { if (unavailable) { event.preventDefault(); event.stopPropagation(); } else props.onAuxClick?.(event); },
    onKeyDown: (event: React.KeyboardEvent<HTMLAnchorElement>) => { if (unavailable && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); event.stopPropagation(); } else props.onKeyDown?.(event); },
    children: <><span className="mu-link-line link-line">{children}{loading && !unavailable && props['aria-current'] !== 'page' && <span aria-hidden className="link-loading" data-paused={!visible ? '' : undefined} data-reduced={reduced ? '' : undefined} />}</span>{glyph && <span aria-hidden className="mu-link-out link-out">{glyph}</span>}{download && fileSize && <span className="text-ink3"> · {fileSize}</span>}{external && !download && <span className="sr-only"> (opens in a new tab)</span>}{unavailable && disabledReason && <span className="sr-only"> ({disabledReason})</span>}</>,
  } });
  return unavailable && disabledReason ? <Tooltip label={disabledReason}><span className="inline">{anchor}</span></Tooltip> : anchor;
});
