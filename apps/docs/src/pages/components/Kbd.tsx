import { Button, Kbd } from '@unlocalhosted/metalui';
import reactSource from '../../../../../packages/metalui/src/components/kbd/kbd.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/kbd/kbd.css?raw';
import agentGuide from '../../../../../packages/metalui/src/components/kbd/kbd.agent.md?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalKbd.swift?raw';
import { CodeScreen, PageHeader, Rules, Section, SourceTabs, Stage, TokenTable } from '../../ui/doc';
import { Beat, Compare, LayerTrail, SpecLine } from '../../ui/beat';
import { SwiftCapture } from '../../ui/SwiftCapture';
import { tokens } from '../../lib/tokens';

/* ─────────────────────────────────────────────────────────
 * KEYCAP on the component template
 *
 *   head      title · one line · layer trail · spec line
 *   hero      a chord and the glyph set · usage on the code screen
 *   details   1 where keys sit     three surfaces side by side, magnified
 *             2 shown, never pressed   a keycap beside the button it labels
 *             3 sizes              default in a field, small in a footer
 *   api · tokens · platforms · rules
 * ───────────────────────────────────────────────────────── */

const K = tokens.kbd;

const USAGE = [
  { id: 'react', label: 'React', file: 'search-field.tsx', lang: 'tsx' as const, code: `import { Kbd } from '@unlocalhosted/metalui';\n\n<Kbd>⌘</Kbd><Kbd>K</Kbd>\n<Kbd size="small">↩</Kbd>\n<Kbd surface="strip">⌘K</Kbd>` },
  { id: 'swift', label: 'SwiftUI', file: 'SearchField.swift', lang: 'swift' as const, code: `import MetalUI\n\nMetalKbd("⌘K")\nMetalKbd("↩", size: .small)\nMetalKbd("⌘K", surface: .strip)` },
];

export default function KbdPage() {
  return (
    <>
      <PageHeader title="Keycap" lede="A key's glyph on a small raised cap: in a search field, a palette footer, a toast's Undo, a tooltip. Shown, never pressed.">
        <LayerTrail
          down={[{ label: 'the key recipe', to: '/foundations/materials' }, { label: 'the readout role', to: '/foundations/typography' }]}
          here="Keycap"
          up={[{ label: 'Command palette', to: '/components/command-palette' }, { label: 'Toolbar', to: '/components/toolbar' }, { label: 'Toast', to: '/components/toast' }, { label: 'Tooltip', to: '/components/tooltip' }]}
        />
        <SpecLine
          items={[
            { label: 'React', value: 'import { Kbd }', href: '#hero', mono: true },
            { label: 'Swift', value: 'MetalKbd', href: '#platforms', mono: true },
            { label: 'Props', value: '3', href: '#api' },
            { label: 'Surfaces', value: '3', href: '#where-keys-sit' },
            { label: 'Tokens', value: String(Object.keys(K).filter((k) => !k.startsWith('$')).length), href: '#tokens' },
          ]}
        />
      </PageHeader>

      <section id="hero" className="flex scroll-mt-80 flex-col gap-24">
        <Stage caption="A chord is two caps side by side. Every glyph sits on the same cap, 20 tall, in the readout role.">
          <div className="flex flex-col items-center gap-20">
            <span className="flex items-center gap-6" style={{ zoom: 1.5 }}><Kbd>⌘</Kbd><Kbd>K</Kbd></span>
            <span className="flex flex-wrap items-center justify-center gap-6">
              {['⌘', '⌥', '⇧', '⌃', '⎋', '↩', '⌫', '↑', '↓', 'V'].map((g) => <Kbd key={g}>{g}</Kbd>)}
            </span>
          </div>
        </Stage>
        <CodeScreen tabs={USAGE} />
      </section>

      <Section id="details" title="Details">
        <div className="flex flex-col gap-56">
          <Beat
            id="where-keys-sit"
            title="Where keys sit"
            setup="A key takes on the surface it sits in: raised on a light surface, a dark cap on a graphite strip, sunk into a toast's Undo."
            caption="Compare the three: the glyph and the cap's size never change; the light and the depth follow the surface."
          >
            <Compare
              zoom={1.75}
              items={[
                { label: 'default', lit: true, node: <span className="type-ui flex h-32 items-center gap-8 rounded-pill bg-s-lo px-12 text-ink3 ring-1 ring-rule">Search <Kbd>⌘K</Kbd></span> },
                { label: 'strip', node: <span data-mu-colorway="graphite" className="material-frost-graphite type-ui flex h-32 items-center gap-8 rounded-pill px-12 text-kbd-strip-ink">Search <Kbd surface="strip">⌘K</Kbd></span> },
                { label: 'sunk', node: <span className="recipe-toast-undo type-ui flex h-toast-undo-height items-center gap-toast-undo-gap rounded-pill pl-toast-undo-pad-left pr-toast-undo-pad-right text-toast-ink">Undo <Kbd surface="sunk">⌘Z</Kbd></span> },
              ]}
            />
          </Beat>

          <Beat
            id="shown-never-pressed"
            title="Shown, never pressed"
            setup="A keycap names a key; the control it labels is the thing you press. Giving the cap a hover or a press makes two targets where there is one."
            caption="Hover both. The button lifts and sinks; the keycap inside it stays still, because the whole button is the target."
            cost="none: a keycap has no states to build, test or keep in parity."
          >
            <Compare
              zoom={1.5}
              items={[
                { label: 'keycap alone', node: <Kbd>⌘K</Kbd> },
                { label: 'inside the button it labels', lit: true, node: <Button size="compact">lenses <Kbd size="small">⌘K</Kbd></Button> },
              ]}
            />
          </Beat>

          <Beat
            id="sizes"
            title="Two sizes"
            setup={`Default is ${K.height} tall, for a field or a menu row. Small is ${K.small}, for a dense footer where four keys share a line.`}
            caption="Count the keys in the footer: small caps let a row of hints sit on one line under a list."
          >
            <div className="flex w-full max-w-440 flex-col gap-16">
              <div className="type-ui flex h-36 items-center justify-between rounded-pill bg-s-lo pl-14 pr-8 text-ink3 ring-1 ring-rule">
                Search this canvas <Kbd>⌘F</Kbd>
              </div>
              <div className="type-doc-caption flex flex-wrap items-center justify-center gap-x-12 gap-y-6 border-t border-rule pt-14 text-ink3">
                <span className="flex items-center gap-4"><Kbd size="small">↑</Kbd><Kbd size="small">↓</Kbd> move</span>
                <span className="flex items-center gap-4"><Kbd size="small">↩</Kbd> open</span>
                <span className="flex items-center gap-4"><Kbd size="small">⇧</Kbd><Kbd size="small">↩</Kbd> pin</span>
                <span className="flex items-center gap-4"><Kbd size="small">⎋</Kbd> close</span>
              </div>
            </div>
          </Beat>
        </div>
      </Section>

      <Section id="variants" title="SwiftUI">
        <SwiftCapture name="kbd" maxWidth={480} />
      </Section>

      <Section id="api" title="API">
        <TokenTable
          head={['Prop', 'Type', 'Default', 'Notes']}
          mono={[0, 1, 2]}
          rows={[
            ['size', "'default' | 'small'", "'default'", `${K.height} tall, or ${K.small} for a dense footer.`],
            ['surface', "'default' | 'strip' | 'sunk'", "'default'", 'Raised on a light surface, a dark cap on a graphite strip, sunk in a toast’s Undo.'],
            ['label', 'string', '–', 'What assistive tech says when the glyph is not a word. ⌘ ⌥ ⇧ ⌃ ⎋ ↩ ⌫ and arrows are named for you.'],
          ]}
        />
      </Section>

      <Section id="tokens" title="Tokens">
        <TokenTable
          rows={[
            ['--mu-kbd-height', `${K.height}`, 'default height'],
            ['--mu-kbd-small', `${K.small}`, 'small height'],
            ['--mu-kbd-min', `${K.min}`, 'minimum width, so one glyph is a square'],
            ['--mu-kbd-pad', `${K.pad}`, 'side padding'],
            ['--mu-kbd-strip-bg · -sh · -ink', 'recipe', 'the dark cap on a graphite strip'],
            ['--mu-kbd-sunk-bg · -sh · -ink', 'recipe', 'the sunk cap in a toast’s Undo'],
          ]}
        />
      </Section>

      <Section id="platforms" title="Platforms">
        <SourceTabs
          tabs={[
            { id: 'react', label: 'React', code: reactSource },
            { id: 'css', label: 'CSS', code: cssSource },
            { id: 'swift', label: 'SwiftUI', code: swiftSource },
            { id: 'agent', label: 'Agent guide', code: agentGuide },
          ]}
        />
      </Section>

      <Section id="rules" title="Rules">
        <Rules
          rules={[
            { id: 'K1', title: 'Glyphs, one cap per key', body: '⌘ ⌥ ⇧ ⌃ ⎋ ↩ ⌫ ↑ ↓ and single letters. A chord is two caps side by side (⌘ then K), or one cap with both glyphs where space is tight.' },
            { id: 'K2', title: 'Shown, never pressed', body: 'A keycap has no hover or press. The control it labels is the button. Shown in “Shown, never pressed”.' },
          ]}
        />
      </Section>
    </>
  );
}
