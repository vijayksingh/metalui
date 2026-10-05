import { ICON_CATALOG, ICON_NAMES } from '@unlocalhosted/metalui/icons';
import { LIFE_CATALOG, LIFE_ICON_NAMES, LIFE_CATEGORIES } from '@unlocalhosted/metalui/icons/life';

export const ICON_PAGES = [
  ...ICON_NAMES.map(name => ({ kind: 'product' as const, name, to: `/icons/${name}`, label: ICON_CATALOG[name].label, category: ICON_CATALOG[name].category, description: ICON_CATALOG[name].hover, keywords: '' })),
  ...LIFE_ICON_NAMES.map(name => ({ kind: 'life' as const, name, to: `/icons/life/${name}`, label: LIFE_CATALOG[name].label, category: LIFE_CATEGORIES[LIFE_CATALOG[name].category], description: LIFE_CATALOG[name].hover, keywords: LIFE_CATALOG[name].synonyms.join(' ') })),
];
