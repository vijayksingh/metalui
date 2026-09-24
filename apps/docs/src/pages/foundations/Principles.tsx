import { Link } from 'react-router';
import { PageHeader, Rules, Section } from '../../ui/doc';

const PRINCIPLES = [
  { id: 'P1', title: 'Materials, not colors', body: 'Every control is one material from a closed set: bone or graphite soft-touch, smoked glass, rubber wells, anodized metal. Depth comes from the material recipe, never from a lone shadow.' },
  { id: 'P2', title: 'One key light, top left', body: 'Highlights sit on top edges and shade sits on bottom edges. Wells shade at the top and catch light at the bottom lip. Nothing glows.' },
  { id: 'P3', title: 'Mechanics you can feel', body: 'Buttons press in 1pt and their shadow collapses; release springs back. Thumbs slide and dials click into detents. Motion is short, damped and physical.' },
  { id: 'P4', title: 'Colorways, not themes', body: 'Bone and Graphite are two finishes of the same objects, like hardware colorways. Signal colors stay the same in both.' },
  { id: 'P5', title: 'One signal per object', body: 'Phosphor green marks intent (focus, selection, live state), never a call to action. Each object carries at most one saturated signal.' },
  { id: 'P6', title: 'Quiet at rest', body: 'Text-like objects rest without a card; their material rises in on hover. Softness belongs to materials and edges, never to legibility.' },
];

const FOUNDATIONS = [
  { to: '/foundations/color', title: 'Color & ink', body: 'Two colorways, four inks with measured contrast floors, one signal per object.' },
  { to: '/foundations/typography', title: 'Typography', body: 'Geist, Martian Mono and Doto; seven roles, three weights, lines on a 2-point grid.' },
  { to: '/foundations/radius', title: 'Radius', body: 'A ×6 ladder. Nested shapes are inset 6 and lose 6; a shape is a slab or a pill, never in between.' },
  { to: '/foundations/spacing', title: 'Spacing', body: 'A 4-point base with 2 and 6 for fine work, and named relationships for every gap.' },
  { to: '/foundations/sizing', title: 'Sizing', body: 'Seven control heights from 20 to 44; the icon size follows the height.' },
  { to: '/foundations/elevation', title: 'Elevation', body: 'Five levels, each a material: well, canvas, cap, raised, floating.' },
  { to: '/foundations/motion', title: 'Motion', body: 'Four damped springs; press lands in 50ms and releases on a spring.' },
];

export default function Principles() {
  return (
    <>
      <PageHeader
        title="Foundations"
        lede="The rules every MetalUI object is built from. They are derived from the approved Soft Hardware object sheet, then reduced to a few rules instead of a list of hand-tuned values. Each page shows its rules live; open the dial panel (bottom right) to tune them."
      />
      <Section title="Principles">
        <Rules rules={PRINCIPLES} />
      </Section>
      <Section title="The foundations">
        <ul className="flex flex-col">
          {FOUNDATIONS.map((f) => (
            <li key={f.to} className="border-b border-[var(--mu-rule)] last:border-0">
              <Link to={f.to} className="group flex flex-col gap-6 py-16 text-ink no-underline">
                <span className="type-title group-hover:underline">{f.title}</span>
                <span className="prose-body max-w-[64ch] text-ink2">{f.body}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
