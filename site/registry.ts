import type { ComponentType } from 'react';

import buttonMeta from '../components/button/meta.json';
import ButtonDemo from '../components/button/button.demo';
import buttonTsx from '../components/button/button.tsx?raw';
import buttonCss from '../components/button/button.css?raw';
import buttonAgent from '../components/button/button.agent.md?raw';
import buttonSwift from '../swift/Sources/MetalUI/Components/MetalButton.swift?raw';

export interface ComponentEntry {
  meta: typeof buttonMeta;
  Demo: ComponentType;
  sources: { react: string; css: string; swift: string; agent: string };
}

export const COMPONENTS: ComponentEntry[] = [
  {
    meta: buttonMeta,
    Demo: ButtonDemo,
    sources: { react: buttonTsx, css: buttonCss, swift: buttonSwift, agent: buttonAgent },
  },
];
