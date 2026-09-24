import * as React from 'react';
import { Icon, ICON_CATALOG, ICON_NAMES, type IconName } from '../src/icons';
import { CopyButton } from './ComponentSection';

const CATEGORIES = ['Tools', 'Actions', 'Status'] as const;

const pascal = (n: string) => n.split('-').map((p) => p[0].toUpperCase() + p.slice(1)).join('');

export function IconGallery() {
  const [picked, setPicked] = React.useState<IconName>('send-away');
  const jsx = `import { ${pascal(picked)}Icon } from '@unlocalhosted/metalui/icons';\n\n<${pascal(picked)}Icon size={16} />`;

  return (
    <>
      <div className="sec-h">
        <h2>Icons</h2>
        <span className="cap">{ICON_NAMES.length} glyphs · hover to pose · press to play</span>
      </div>
      {CATEGORIES.map((cat) => {
        const names = ICON_NAMES.filter((n) => ICON_CATALOG[n].category === cat);
        return (
          <div className="cat" key={cat}>
            <div className="eng cat-h">{cat}<span>{names.length}</span></div>
            <div className="wells">
              {names.map((name) => {
                const ic = ICON_CATALOG[name];
                return (
                  <div className="w" key={name}>
                    <span className="slot">
                      <button
                        type="button"
                        className="tb mu-icon-trigger"
                        aria-label={ic.label}
                        aria-pressed={picked === name}
                        onClick={() => setPicked(name)}
                      >
                        <Icon name={name} size={16} />
                      </button>
                    </span>
                    <div className="w-t">
                      <b>{ic.label}</b>
                      <span>hover · {ic.hover}</span>
                      <span>press · {ic.press}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      <div className="picked">
        <span className="picked-glyph mu-icon-trigger"><Icon name={picked} size={96} /></span>
        <pre><code>{jsx}</code></pre>
        <CopyButton text={jsx} label="Copy JSX" />
      </div>
    </>
  );
}
