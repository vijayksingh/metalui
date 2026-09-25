import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import './styles.css';
import { ColorwayProvider } from './app/colorway';
import { Shell } from './app/Shell';
import { NotFound } from './pages/NotFound';

const lazy = (load: () => Promise<{ default: React.ComponentType }>) => async () => ({ Component: (await load()).default });

const router = createBrowserRouter([
  { path: '/', lazy: lazy(() => import('./pages/Landing')), errorElement: <NotFound /> },
  {
    Component: Shell,
    errorElement: <NotFound />,
    children: [
      { path: 'overview', lazy: lazy(() => import('./pages/Home')) },
      { path: 'layers', lazy: lazy(() => import('./pages/Layers')) },
      { path: 'foundations', lazy: lazy(() => import('./pages/foundations/Principles')) },
      { path: 'foundations/color', lazy: lazy(() => import('./pages/foundations/Color')) },
      { path: 'foundations/typography', lazy: lazy(() => import('./pages/foundations/Typography')) },
      { path: 'foundations/radius', lazy: lazy(() => import('./pages/foundations/Radius')) },
      { path: 'foundations/spacing', lazy: lazy(() => import('./pages/foundations/Spacing')) },
      { path: 'foundations/sizing', lazy: lazy(() => import('./pages/foundations/Sizing')) },
      { path: 'foundations/elevation', lazy: lazy(() => import('./pages/foundations/Elevation')) },
      { path: 'foundations/materials', lazy: lazy(() => import('./pages/foundations/Materials')) },
      { path: 'foundations/mechanisms', lazy: lazy(() => import('./pages/foundations/Mechanisms')) },
      { path: 'foundations/gadgets', lazy: lazy(() => import('./pages/foundations/Gadgets')) },
      { path: 'foundations/sound', lazy: lazy(() => import('./pages/foundations/Sound')) },
      { path: 'foundations/motion', lazy: lazy(() => import('./pages/foundations/Motion')) },
      { path: 'foundations/transitions', lazy: lazy(() => import('./pages/foundations/Transitions')) },
      { path: 'components/button', lazy: lazy(() => import('./pages/components/Button')) },
      { path: 'components/toolbar', lazy: lazy(() => import('./pages/components/Toolbar')) },
      { path: 'components/command-palette', lazy: lazy(() => import('./pages/components/CommandPalette')) },
      { path: 'components/tooltip', lazy: lazy(() => import('./pages/components/Tooltip')) },
      { path: 'components/menu', lazy: lazy(() => import('./pages/components/Menu')) },
      { path: 'components/toast', lazy: lazy(() => import('./pages/components/Toast')) },
      { path: 'components/slab', lazy: lazy(() => import('./pages/components/Slab')) },
      { path: 'components/led', lazy: lazy(() => import('./pages/components/Led')) },
      { path: 'components/status', lazy: lazy(() => import('./pages/components/Status')) },
      { path: 'components/kbd', lazy: lazy(() => import('./pages/components/Kbd')) },
      { path: 'components/switcher', lazy: lazy(() => import('./pages/components/Switcher')) },
      { path: 'components/swatch', lazy: lazy(() => import('./pages/components/Swatch')) },
      { path: 'components/checkbox', lazy: lazy(() => import('./pages/components/Checkbox')) },
      { path: 'components/slider', lazy: lazy(() => import('./pages/components/Slider')) },
      { path: 'components/icon-button', lazy: lazy(() => import('./pages/components/IconButton')) },
      { path: 'components/field', lazy: lazy(() => import('./pages/components/Field')) },
      { path: 'components/dialog', lazy: lazy(() => import('./pages/components/Dialog')) },
      { path: 'components/link-card', lazy: lazy(() => import('./pages/components/LinkCard')) },
      { path: 'components/size-readout', lazy: lazy(() => import('./pages/components/SizeReadout')) },
      { path: 'components/tool-strip', lazy: lazy(() => import('./pages/components/ToolStrip')) },
      { path: 'components/past-banner', lazy: lazy(() => import('./pages/components/PastBanner')) },
      { path: 'components/memory-scrubber', lazy: lazy(() => import('./pages/components/MemoryScrubber')) },
      { path: 'components/lens-bar', lazy: lazy(() => import('./pages/components/LensBar')) },
      { path: 'components/region', lazy: lazy(() => import('./pages/components/Region')) },
      { path: 'components/provenance-tooltip', lazy: lazy(() => import('./pages/components/ProvenanceTooltip')) },
      { path: 'components/hover-engraving', lazy: lazy(() => import('./pages/components/HoverEngraving')) },
      { path: 'components/suggestion-chip', lazy: lazy(() => import('./pages/components/SuggestionChip')) },
      { path: 'components/cue', lazy: lazy(() => import('./pages/components/CueFamily')) },
      { path: 'components/selection-frame', lazy: lazy(() => import('./pages/components/SelectionFrame')) },
      { path: 'components/snap-guides', lazy: lazy(() => import('./pages/components/SnapGuides')) },
      { path: 'components/lasso', lazy: lazy(() => import('./pages/components/Lasso')) },
      { path: 'components/block-silhouette', lazy: lazy(() => import('./pages/components/BlockSilhouette')) },
      { path: 'components/code-card', lazy: lazy(() => import('./pages/components/CodeCard')) },
      { path: 'components/switch', lazy: lazy(() => import('./pages/components/Switch')) },
      { path: 'components/settings', lazy: lazy(() => import('./pages/components/Settings')) },
      { path: 'components/brush-cursor', lazy: lazy(() => import('./pages/components/BrushCursor')) },
      { path: 'components/draw-tools', lazy: lazy(() => import('./pages/components/DrawTools')) },
      { path: 'components/connector', lazy: lazy(() => import('./pages/components/Connector')) },
      { path: 'components/perfect-preview', lazy: lazy(() => import('./pages/components/PerfectPreview')) },
      { path: 'components/line-handles', lazy: lazy(() => import('./pages/components/LineHandles')) },
      { path: 'components/folder', lazy: lazy(() => import('./pages/components/Folder')) },
      { path: 'components/select', lazy: lazy(() => import('./pages/components/Select')) },
      { path: 'components/tabs', lazy: lazy(() => import('./pages/components/Tabs')) },
      { path: 'icons', lazy: lazy(() => import('./pages/Icons')) },
      { path: 'icons/life', lazy: lazy(() => import('./pages/IconsLife')) },
      { path: '*', Component: NotFound },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ColorwayProvider>
      <RouterProvider router={router} />
    </ColorwayProvider>
  </React.StrictMode>,
);
