import * as React from 'react';

export type Colorway = 'bone' | 'graphite';

const KEY = 'metalui:colorway';

function initial(): Colorway {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'bone' || saved === 'graphite') return saved;
  } catch {}
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'graphite' : 'bone';
}

const ColorwayContext = React.createContext<{ colorway: Colorway; setColorway: (c: Colorway) => void }>({
  colorway: 'bone',
  setColorway: () => {},
});

export function ColorwayProvider({ children }: { children: React.ReactNode }) {
  const [colorway, setColorway] = React.useState<Colorway>(initial);
  React.useEffect(() => {
    document.documentElement.dataset.muColorway = colorway;
    try { localStorage.setItem(KEY, colorway); } catch {}
  }, [colorway]);
  return <ColorwayContext.Provider value={{ colorway, setColorway }}>{children}</ColorwayContext.Provider>;
}

export const useColorway = () => React.useContext(ColorwayContext);
