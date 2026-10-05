import * as React from 'react';
import { useViewTransitionState } from 'react-router';

// Match the actual item, not the card's surrounding scene or the whole docs page.
export const PLACE_TARGETS: Record<string, string> = {
  'drop-zone': '.mu-drop-zone',
  'empty-state': '.mu-empty-state',
  'lens-bar': '.mu-filterbar',
  'memory-scrubber': '.mu-scrubber',
  'past-banner': '.mu-pastbanner',
  region: '.mu-region',
  sidebar: '.mu-sidebar',
  'split-pane': '.mu-split-pane',
};

export const OBJECT_TARGETS: Record<string, string> = {
  attachment: '.mu-attachment', avatar: '.mu-avatar', 'block-silhouette': '.mu-silhouette',
  card: '.mu-card', 'code-card': '.mu-codecard', connector: '.snap-canvas',
  day: '.mu-day', folder: '.mu-folder', 'link-card': '.mu-linkcard', table: '.mu-table', weather: '.mu-weather',
};

export function catalogTarget(path: string) {
  const name = path.split('/').at(-1)!;
  return PLACE_TARGETS[name] ?? OBJECT_TARGETS[name];
}

const INSTRUMENTS = new Set(['brush-cursor', 'cue', 'hover-engraving', 'lasso', 'line-handles', 'perfect-preview', 'provenance-tooltip', 'selection-frame', 'size-readout', 'snap-guides', 'suggestion-chip']);
export function catalogDetailTarget(path: string) {
  return INSTRUMENTS.has(path.split('/').at(-1)!) ? '.stage' : catalogTarget(path) && `.stage ${catalogTarget(path)}`;
}

/** Only the selected card participates. Names disappear as soon as navigation settles. */
export function useCatalogTransition(to: string, root: React.RefObject<HTMLElement | null>, label?: string, specimen?: string) {
  const active = useViewTransitionState(to);
  React.useLayoutEffect(() => {
    if (!active || document.documentElement.classList.contains('rm') || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const elements = [[label, 'docs-card-label'], [specimen, 'docs-card-specimen']].flatMap(([selector, name]) => {
      const element = selector && root.current?.querySelector<HTMLElement>(selector);
      return element ? [{ element, name: name! }] : [];
    });
    if (!elements.length) return;
    document.documentElement.dataset.catalogNavigation = '';
    for (const { element, name } of elements) {
      element.style.viewTransitionName = name;
      element.dataset.catalogTransition = '';
    }
    return () => {
      delete document.documentElement.dataset.catalogNavigation;
      for (const { element } of elements) {
        element.style.removeProperty('view-transition-name');
        delete element.dataset.catalogTransition;
      }
    };
  }, [active, to, root, label, specimen]);
}
