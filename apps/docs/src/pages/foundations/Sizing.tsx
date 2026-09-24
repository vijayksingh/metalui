import { useDialKit } from 'dialkit';
import { Icon, type IconName } from '@unlocalhosted/metalui/icons';
import { Bench, PageHeader, Rules, Section, TokenTable, copyJSON } from '../../ui/doc';

const USES = ['Keycap, inline pill, tag', 'Status badge, readout, switch', 'Segment, dial, compact button', 'Button, list row', 'Tool button, field, slat', 'Search well, standalone field', 'Toast, settings row'];
const LABELS = ['⌘K', 'Synced', 'Grouped', 'Cancel', 'Search', 'Search this canvas', 'Deleted 3 blocks'];
const ICONS: (IconName | null)[] = [null, 'synced', 'layout', null, 'search', 'search', 'undo'];

export default function Sizing() {
  const d = useDialKit(
    'Sizing',
    {
      heights: {
        base: [20, 16, 24, 1],
        step: [4, 2, 8, 1],
      },
      iconRule: {
        upTo24: [12, 10, 16, 1],
        upTo32: [14, 12, 18, 1],
        upTo40: [16, 14, 20, 1],
        above: [20, 16, 24, 1],
      },
      showIcons: true,
      copy: { type: 'action', label: 'Copy sizing tokens' },
    },
    {
      onAction: (a) => {
        if (a === 'copy') copyJSON({ height: heights, icon: d.iconRule });
      },
    },
  );

  const heights = USES.map((_, i) => d.heights.base + d.heights.step * i);
  const iconFor = (h: number) => (h <= 24 ? d.iconRule.upTo24 : h <= 32 ? d.iconRule.upTo32 : h <= 40 ? d.iconRule.upTo40 : d.iconRule.above);
  const padFor = (h: number, icon: boolean) => (icon ? (h - iconFor(h)) / 2 : h / 2 - 1);

  return (
    <>
      <PageHeader
        title="Sizing"
        lede={`Seven control heights, ${d.heights.base} to ${heights.at(-1)} in steps of ${d.heights.step}. A container is the sum of its parts: a toolbar strip is a 36 tool plus two 6 nests, 48 tall, and at r24 it is an exact capsule.`}
      />

      <Section title="Control heights">
        <Bench caption="Each height with its icon size and the pill padding rule">
          <div className="flex flex-wrap items-end justify-center gap-16">
            {heights.map((h, i) => {
              const icon = d.showIcons ? ICONS[i] : null;
              const keycap = i === 0;
              return (
                <figure key={h} className="flex flex-col items-center gap-12">
                  <span
                    className={`material-cap inline-flex items-center text-ink ${i === 1 ? 'type-label' : keycap ? 'type-readout' : 'type-ui'} ${keycap ? '' : 'rounded-pill'}`}
                    style={{
                      height: h,
                      borderRadius: keycap ? 'var(--mu-radius-key)' : undefined,
                      paddingInline: keycap ? 5 : undefined,
                      paddingLeft: keycap ? undefined : padFor(h, !!icon),
                      paddingRight: keycap ? undefined : h / 2 - 1,
                      gap: 6,
                    }}
                  >
                    {icon && <Icon name={icon} size={iconFor(h)} className="text-ink2" />}
                    {LABELS[i]}
                  </span>
                  <figcaption className="flex flex-col items-center gap-2">
                    <span className="type-readout text-ink">{h}</span>
                    <span className="type-label engraved">icon {iconFor(h)}</span>
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </Bench>
        <TokenTable head={['Height', 'Icon', 'Used for']} rows={heights.map((h, i) => [`h-${h}`, `${iconFor(h)}px`, USES[i]])} />
      </Section>

      <Section title="Rules">
        <Rules
          rules={[
            { id: 'Z1', title: 'Heights come from the ladder', body: 'A control is one of seven heights. Something that falls between two of them is a different object, or it is wrong.' },
            { id: 'Z2', title: 'The icon follows the height', body: '20–24 → 12, 28–32 → 14, 36–40 → 16, 44 and up → 20. The stroke stays at 1.7 units on the 24 grid, so every size keeps the same visual weight in its box.' },
            { id: 'Z3', title: 'Containers are sums', body: 'A container is its content plus two nests. A 36 tool in a 6 nest makes a 48 strip, and 48 at r24 is a true capsule, where the old 50 at r24 was a near-pill.' },
          ]}
        />
      </Section>
    </>
  );
}
