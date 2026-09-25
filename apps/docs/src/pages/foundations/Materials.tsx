import * as React from 'react';
import { useDialKit } from 'dialkit';
import { tokens } from '../../lib/tokens';
import { useColorway } from '../../app/colorway';
import { Bench, PageHeader, Rules, Section, TokenTable, copyJSON } from '../../ui/doc';
import { SwiftCapture } from '../../ui/SwiftCapture';
import { Switch } from '@unlocalhosted/metalui';
import { GADGETS, GADGET_MATERIALS, type GadgetMaterial } from '@unlocalhosted/metalui/gadgets';
import { createSound } from '@unlocalhosted/metalui/sound';
import { GadgetMaterialSheet } from '../../ui/GadgetMaterialSheet';

const FROST = tokens.frost;
type FrostName = keyof typeof FROST.recipes;
const FROSTS = Object.keys(FROST.recipes) as FrostName[];

/** Something for the frost to melt: hard stripes, a saturated block and a line of type. */
function BusyBackdrop() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden rounded-plate">
      <div className="absolute inset-0" style={{ background: 'repeating-linear-gradient(90deg, #1f1f1f 0 14px, #ebebeb 14px 28px)' }} />
      <div className="absolute left-[150px] top-[20px] h-[72px] w-[96px] rounded-plate bg-[linear-gradient(135deg,#FF7B4D,#E8552A)]" />
      <span className="type-title absolute left-12 top-[100px] text-black">Frost melts what is behind</span>
    </div>
  );
}

export default function Materials() {
  const { colorway } = useColorway();
  const d = useDialKit(
    'Materials',
    {
      frost: {
        blur: [FROST.backdrop.blur, 0, 48, 1],
        saturate: [FROST.backdrop.saturate, 1, 2.5, 0.05],
        reduceTransparency: false,
      },
      copy: { type: 'action', label: 'Copy frost backdrop' },
      gadget: {
        material: { type: 'select', options: [...GADGET_MATERIALS], default: 'clay' },
        bevel: [1, 0.25, 2.5, 0.05],
        gloss: [1, 0, 3, 0.05],
        grain: [1, 0, 3, 0.05],
        flecks: [1, 0, 3, 0.05],
        shadow: [1, 0, 2, 0.05],
        contrast: false,
      },
      copyFinish: { type: 'action', label: 'Copy gadget finish' },
    },
    {
      onAction: (a) => {
        if (a === 'copy') copyJSON({ blur: d.frost.blur, saturate: d.frost.saturate });
        if (a === 'copyFinish') {
          const m = d.gadget.material as GadgetMaterial, base = GADGETS.materials[m] as unknown as { bevel: number; gloss: readonly number[]; grain: readonly number[]; flecks: number };
          copyJSON({ material: m, bevel: +(base.bevel * d.gadget.bevel).toFixed(2), gloss: [base.gloss[0], +(base.gloss[1] * d.gadget.gloss).toFixed(3)], grain: [base.grain[0], +(base.grain[1] * d.gadget.grain).toFixed(4)], flecks: +(base.flecks * d.gadget.flecks).toFixed(2), shadowScale: d.gadget.shadow });
        }
      },
    },
  );
  const sound = React.useMemo(() => createSound(), []);
  const [soundOn, setSoundOn] = React.useState(false);
  const gadgetTune = React.useMemo(() => ({
    material: d.gadget.material as GadgetMaterial,
    values: { bevel: d.gadget.bevel, gloss: d.gadget.gloss, grain: d.gadget.grain, flecks: d.gadget.flecks, shadow: d.gadget.shadow },
  }), [d.gadget.material, d.gadget.bevel, d.gadget.gloss, d.gadget.grain, d.gadget.flecks, d.gadget.shadow]);

  const tuned = d.frost.blur !== FROST.backdrop.blur || d.frost.saturate !== FROST.backdrop.saturate;
  const benchVars = { '--mu-backdrop': `blur(${d.frost.blur}px) saturate(${d.frost.saturate})` } as React.CSSProperties;

  return (
    <>
      <PageHeader
        title="Materials"
        lede="A material is a recipe: a fill and an ordered shadow stack, rendered the same way as CSS box-shadow and as SwiftUI layered shadows. Floating surfaces add frost: a blur of what is behind them under a translucent fill, with an opaque twin for Reduce Transparency."
      />

      <Section
        title="Frost"
        lede="Three frosted recipes, one backdrop. Strip is the toolbar in the colorway; plate is the denser fill for palettes, menus and the lens bar; graphite is dark chrome that stays graphite in both colorways (tool strip, tooltips, past banner). Turn on Reduce Transparency in the dial panel, or in System Settings, and each swaps to its opaque twin: the blur goes, the fill turns solid, the shadow stack stays."
      >
        <Bench caption={`web · blur ${d.frost.blur} · saturate ${d.frost.saturate}${tuned ? ' (tuned)' : ''} · ${d.frost.reduceTransparency ? 'reduce transparency: opaque twins' : 'frosted'}`}>
          <div
            className="flex flex-wrap justify-center gap-24"
            style={benchVars}
            data-mu-transparency={d.frost.reduceTransparency ? 'reduce' : undefined}
          >
            {FROSTS.map((f) => (
              <figure key={f} className="flex flex-col items-center gap-10">
                <div className="relative h-[140px] w-[252px]">
                  <BusyBackdrop />
                  <div
                    data-frost={f}
                    data-mu-colorway={f === 'graphite' ? 'graphite' : undefined}
                    className={`mu-frost-${f} absolute left-[36px] top-[42px] grid h-[56px] w-[180px] place-items-center rounded-card`}
                  >
                    <span className="type-label text-ink2">{f}</span>
                  </div>
                </div>
                <figcaption className="type-label engraved">.mu-frost-{f}</figcaption>
              </figure>
            ))}
          </div>
        </Bench>
        <SwiftCapture name="frost" />
      </Section>

      <Section
        title="Gadget materials"
        lede="Gadgets are cut from seven materials, each a finish the one light shades: how deep the bevel, how glossy, how rough, how flecked, how much light passes through, how heavy its shadow. The same seven sound when struck (Foundations › Sound), so every body you see here also has a voice. Each row shows a material light, middling and heavy. Strike a body, or drag along a row."
      >
        <Bench caption={`web · one light from the upper left · ${colorway}${d.gadget.contrast ? ' · increased contrast' : ''} · tuning ${d.gadget.material}`}>
          <div className="flex w-full flex-col gap-20">
            <label className="flex items-center gap-12 type-ui text-ink">
              <Switch aria-label="Sound" checked={soundOn} onCheckedChange={async (next) => { if (next) await sound.enable(); else sound.disable(); setSoundOn(next); }} />
              Sound
            </label>
            <GadgetMaterialSheet host={colorway === 'graphite' ? 'graphite' : 'bone'} contrast={d.gadget.contrast} sound={sound} tune={gadgetTune} />
          </div>
        </Bench>
        <SwiftCapture name="gadget-materials" />
      </Section>

      <Section title="Recipes" lede="Each recipe names its fill, its opaque twin and its shadow stack. A value that names a colorway token follows the colorway; a literal is the same in both.">
        <TokenTable
          head={['Recipe', 'Fill · opaque twin · shadow', 'Used for']}
          rows={FROSTS.map((f) => {
            const r = FROST.recipes[f] as { fill: string; opaque: string; shadow: string; use: string };
            const short = (v: string) => (v.length > 40 ? `${v.slice(0, 38)}…` : v);
            return [`.mu-frost-${f}`, `${short(r.fill)} · ${short(r.opaque)} · ${short(r.shadow)}`, r.use];
          })}
        />
        <TokenTable
          head={['Token', 'Value', 'Used for']}
          rows={[
            ['--mu-backdrop', `blur(${FROST.backdrop.blur}px) saturate(${FROST.backdrop.saturate})`, 'The one frost behind every floating surface.'],
            ['--mu-frost-opaque', `${tokens.colorways.bone['frost-opaque']} · ${tokens.colorways.graphite['frost-opaque']}`, 'The fill under Reduce Transparency, per colorway.'],
            ['--mu-contrast-edge', `${tokens.colorways.bone['contrast-edge']} · ${tokens.colorways.graphite['contrast-edge']}`, 'A 1 pt hairline rimming frost under Increase Contrast.'],
            ['data-mu-transparency', '"reduce"', 'On any ancestor: forces the opaque twins, like the system setting.'],
          ]}
        />
      </Section>

      <Section title="Use it">
        <TokenTable
          head={['Platform', 'API', 'Notes']}
          mono={[0, 1]}
          rows={[
            ['CSS', 'class="mu-frost-plate"', 'From tokens.css; carries its Reduce Transparency and Increase Contrast twins.'],
            ['Tailwind', 'material-frost-plate', 'The same recipe as a utility (theme.css); material-float is the plate.'],
            ['SwiftUI', '.metalFrost(.plate, in: shape)', 'MetalFrost.plate.recipe(in:) for a MetalRecipe; reads Reduce Transparency and Increase Contrast from the environment.'],
          ]}
        />
      </Section>

      <Section title="Rules">
        <Rules
          rules={[
            { id: 'F1', title: 'Floating is always frosted', body: 'Palette, menus, lens bar, tool strip and toast blur what is behind them. They read as higher than raised without a heavier shadow.', origin: 'Elevation E2' },
            { id: 'F2', title: 'One frost', body: 'Every frosted surface uses the same backdrop, blur 22 and saturate 1.6. A surface that needs more separation takes the denser plate fill, never more blur.' },
            { id: 'F3', title: 'Every frost has an opaque twin', body: 'Under Reduce Transparency the fill turns opaque and the blur goes; the shadow stack stays, so the surface still reads as floating.', origin: 'the native reference materials' },
            { id: 'F4', title: 'Dark frost needs density', body: 'Graphite frost over a light backdrop needs about 0.9 opacity or it turns muddy grey, which is why the graphite recipe runs .94 to .96.', origin: 'Elevation E4' },
            { id: 'F5', title: 'Shadows stay outside', body: 'A translucent fill never shows its own drop shadow through it: CSS paints outer shadows only outside the box, and SwiftUI masks them to match.' },
          ]}
        />
      </Section>
    </>
  );
}
