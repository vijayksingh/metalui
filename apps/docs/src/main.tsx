import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import './styles.css';
import { ColorwayProvider } from './app/colorway';
import { Shell } from './app/Shell';
import { NotFound } from './pages/NotFound';

const lazy = (load: () => Promise<{ default: React.ComponentType }>) => async () => ({ Component: (await load()).default });

const router = createBrowserRouter([
  {
    Component: Shell,
    errorElement: <NotFound />,
    children: [
      { index: true, lazy: lazy(() => import('./pages/Home')) },
      { path: 'foundations', lazy: lazy(() => import('./pages/foundations/Principles')) },
      { path: 'foundations/color', lazy: lazy(() => import('./pages/foundations/Color')) },
      { path: 'foundations/typography', lazy: lazy(() => import('./pages/foundations/Typography')) },
      { path: 'foundations/radius', lazy: lazy(() => import('./pages/foundations/Radius')) },
      { path: 'foundations/spacing', lazy: lazy(() => import('./pages/foundations/Spacing')) },
      { path: 'foundations/sizing', lazy: lazy(() => import('./pages/foundations/Sizing')) },
      { path: 'foundations/elevation', lazy: lazy(() => import('./pages/foundations/Elevation')) },
      { path: 'foundations/materials', lazy: lazy(() => import('./pages/foundations/Materials')) },
      { path: 'foundations/motion', lazy: lazy(() => import('./pages/foundations/Motion')) },
      { path: 'foundations/transitions', lazy: lazy(() => import('./pages/foundations/Transitions')) },
      { path: 'components/button', lazy: lazy(() => import('./pages/components/Button')) },
      { path: 'components/provenance-tooltip', lazy: lazy(() => import('./pages/components/ProvenanceTooltip')) },
      { path: 'components/hover-engraving', lazy: lazy(() => import('./pages/components/HoverEngraving')) },
      { path: 'components/suggestion-chip', lazy: lazy(() => import('./pages/components/SuggestionChip')) },
      { path: 'components/cue', lazy: lazy(() => import('./pages/components/CueFamily')) },
      { path: 'components/selection-frame', lazy: lazy(() => import('./pages/components/SelectionFrame')) },
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
