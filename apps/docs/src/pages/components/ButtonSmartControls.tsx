import * as React from 'react';
import type { ButtonCap } from '@unlocalhosted/metalui';
import type { IconName } from '@unlocalhosted/metalui/icons';
import type { ButtonXrayModel } from '../../ui/xray/ButtonXray';
import { useRecipeLayers } from '../../ui/xray/kit';

interface Props {
  model: ButtonXrayModel;
  setModel: (patch: Partial<ButtonXrayModel>) => void;
  content: { label: string; cap: ButtonCap; icon: IconName | 'none'; disabled: boolean };
  setContent: (key: 'label' | 'cap' | 'icon' | 'disabled', value: string | boolean) => void;
  travel: number;
  setTravel: (value: number) => void;
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const round = (value: number, step: number) => Math.round(value / step) * step;

/** A handle on the drawn object. Pointer capture and arrow keys edit the same value. */
function Handle({ label, value, min, max, step, axis, pixelsPerStep, onChange, className }: {
  label: string; value: number; min: number; max: number; step: number; axis: 'x' | 'y'; pixelsPerStep: number;
  onChange: (value: number) => void; className: string;
}) {
  const start = React.useRef<{ x: number; y: number; value: number } | null>(null);
  return (
    <span
      role="slider" tabIndex={0} aria-label={label} aria-valuemin={min} aria-valuemax={max} aria-valuenow={value}
      className={`bw-handle ${className}`}
      onPointerDown={(event) => { event.preventDefault(); start.current = { x: event.clientX, y: event.clientY, value }; event.currentTarget.setPointerCapture(event.pointerId); }}
      onPointerMove={(event) => {
        if (!start.current) return;
        const delta = axis === 'x' ? event.clientX - start.current.x : start.current.y - event.clientY;
        onChange(clamp(round(start.current.value + (delta / pixelsPerStep) * step, step), min, max));
      }}
      onPointerUp={() => { start.current = null; }}
      onPointerCancel={() => { start.current = null; }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight' || event.key === 'ArrowUp') { event.preventDefault(); onChange(clamp(round(value + step, step), min, max)); }
        if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') { event.preventDefault(); onChange(clamp(round(value - step, step), min, max)); }
      }}
    ><span className="bw-handle-core" /></span>
  );
}

function Meter({ label, value }: { label: string; value: string }) {
  return <span className="bw-meter"><span>{label}</span><strong>{value}</strong></span>;
}

export function ButtonSmartControls({ model: m, setModel, content, setContent, travel, setTravel }: Props) {
  const recipe = useRecipeLayers('button', content.cap === 'standard' ? 'self' : content.cap);
  const padding = m.padAuto ? m.h / 2 - 1 : m.pad;
  const radius = m.h * m.corners / 2;
  const shapeWidth = 146 + padding * 4;
  const layerNames = ['Fill', 'Inner glow', 'Top light', 'Rim', 'Contact', 'Drop'];
  const lightAngle = m.lightDeg * Math.PI / 180;
  const lightX = Math.sin(lightAngle) * 68;
  const lightY = -Math.cos(lightAngle) * 68;
  const lightRef = React.useRef<HTMLDivElement>(null);
  const draggingLight = React.useRef(false);
  const updateLight = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = lightRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = event.clientX - (rect.left + rect.width / 2);
    const y = (rect.top + rect.height / 2) - event.clientY;
    setModel({ lightDeg: round(clamp(Math.atan2(x, y) * 180 / Math.PI, -90, 90), 5), lightK: round(clamp(Math.hypot(x, y) / 68, 0, 1.5), 0.05) });
  };
  return (
    <div className="bw-smart" data-cap={content.cap}>
      <div className="bw-content-row">
        <label className="bw-field bw-label-field"><span>Label</span><input value={content.label} onChange={(event) => setContent('label', event.target.value)} aria-label="Button label" /></label>
        <fieldset className="bw-cap-select"><legend>Cap</legend>{(['standard', 'primary', 'destructive'] as ButtonCap[]).map((cap) => <label key={cap}><input type="radio" name="button-cap" checked={content.cap === cap} onChange={() => setContent('cap', cap)} /><span>{cap}</span></label>)}</fieldset>
        <label className="bw-field"><span>Icon</span><select value={content.icon} onChange={(event) => setContent('icon', event.target.value)} aria-label="Button icon">{['none', 'share', 'duplicate', 'send-away', 'check'].map((icon) => <option key={icon} value={icon}>{icon}</option>)}</select></label>
        <label className="bw-disabled"><input type="checkbox" checked={content.disabled} onChange={(event) => setContent('disabled', event.target.checked)} /><span>Disabled</span></label>
      </div>
      <div className="bw-instruments">
        <section className="bw-instrument bw-shape" aria-label="Shape instrument">
          <header><span className="eng">01 / Box model</span><p>Pull edge for height, side for padding, corner for radius.</p></header>
          <div className="bw-shape-diagram">
            <div className="bw-shape-outline" style={{ width: shapeWidth + 28, height: m.h * 2 + 28 }} />
            <div className="bw-shape-object" style={{ width: shapeWidth, height: m.h * 2, borderRadius: radius * 2 }}>
              <span className="bw-shape-padding" style={{ width: padding * 2 }} /><span className="bw-shape-face">{content.label || 'Button'}</span><span className="bw-shape-padding" style={{ width: padding * 2 }} />
              <Handle label="Button height" value={m.h} min={20} max={48} step={2} axis="y" pixelsPerStep={4} onChange={(h) => setModel({ h })} className="bw-height-handle" />
              <Handle label="Side padding" value={padding} min={2} max={32} step={1} axis="x" pixelsPerStep={3} onChange={(pad) => setModel({ padAuto: false, pad })} className="bw-padding-handle" />
              <Handle label="Corner radius" value={m.corners} min={0} max={1} step={0.05} axis="x" pixelsPerStep={3} onChange={(corners) => setModel({ corners })} className="bw-radius-handle" />
            </div>
          </div>
          <div className="bw-readouts"><Meter label="Height" value={`${m.h}px`} /><Meter label="Padding" value={`${padding}px`} /><Meter label="Radius" value={`${Number(radius.toFixed(1))}px`} /></div>
          <label className="bw-small-switch"><input type="checkbox" checked={m.padAuto} onChange={(event) => setModel({ padAuto: event.target.checked })} /><span>Automatic padding follows height</span></label>
        </section>
        <section className="bw-instrument bw-light" aria-label="Light instrument">
          <header><span className="eng">02 / Light</span><p>Move sun. Direction and strength change together.</p></header>
          <div ref={lightRef} className="bw-light-diagram" role="slider" tabIndex={0} aria-label="Light direction and strength" aria-valuemin={-90} aria-valuemax={90} aria-valuenow={m.lightDeg} aria-valuetext={`${m.lightDeg} degrees, ${Math.round(m.lightK * 100)} percent strength`}
            onPointerDown={(event) => { draggingLight.current = true; event.currentTarget.setPointerCapture(event.pointerId); updateLight(event); }}
            onPointerMove={(event) => { if (draggingLight.current) updateLight(event); }}
            onPointerUp={() => { draggingLight.current = false; }} onPointerCancel={() => { draggingLight.current = false; }}
            onKeyDown={(event) => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); setModel({ lightDeg: clamp(m.lightDeg + (event.key === 'ArrowRight' ? 5 : -5), -90, 90) }); } if (event.key === 'ArrowUp' || event.key === 'ArrowDown') { event.preventDefault(); setModel({ lightK: clamp(round(m.lightK + (event.key === 'ArrowUp' ? .05 : -.05), .05), 0, 1.5) }); } }}>
            <span className="bw-light-orbit" /><span className="bw-light-object" style={{ filter: `brightness(${0.7 + m.lightK * 0.3})` }}>Button</span><span className="bw-sun" style={{ transform: `translate(${lightX}px, ${lightY}px)`, opacity: .35 + m.lightK / 1.5 * .65 }}>✳</span>
          </div>
          <div className="bw-readouts"><Meter label="Direction" value={`${m.lightDeg}°`} /><Meter label="Strength" value={`${Math.round(m.lightK * 100)}%`} /></div>
        </section>
        <section className="bw-instrument bw-type" aria-label="Typography instrument">
          <header><span className="eng">03 / Type</span><p>Shape text inside cap. Compare optical center.</p></header>
          <div className="bw-type-sample" style={{ fontSize: m.size * 1.55, fontWeight: m.weight, letterSpacing: `${m.track}em`, transform: m.optical ? 'translateY(-2px)' : undefined }}>{content.label || 'Button'}</div>
          <div className="bw-adjust-row"><span>Size</span><button type="button" aria-label="Decrease type size" onClick={() => setModel({ size: clamp(m.size - .5, 10, 16) })}>−</button><strong>{m.size}px</strong><button type="button" aria-label="Increase type size" onClick={() => setModel({ size: clamp(m.size + .5, 10, 16) })}>+</button></div>
          <div className="bw-adjust-row"><span>Weight</span>{[400, 500, 600].map((weight) => <button key={weight} type="button" aria-pressed={m.weight === weight} onClick={() => setModel({ weight })}>{weight}</button>)}</div>
          <div className="bw-adjust-row"><span>Tracking</span><button type="button" aria-label="Decrease tracking" onClick={() => setModel({ track: clamp(round(m.track - .005, .005), -.03, .06) })}>−</button><strong>{m.track.toFixed(3)}em</strong><button type="button" aria-label="Increase tracking" onClick={() => setModel({ track: clamp(round(m.track + .005, .005), -.03, .06) })}>+</button></div>
          <label className="bw-small-switch"><input type="checkbox" checked={m.optical} onChange={(event) => setModel({ optical: event.target.checked })} /><span>Center on letters</span></label>
        </section>
        <section className="bw-instrument bw-shadow" aria-label="Elevation instrument">
          <header><span className="eng">04 / Elevation</span><p>Pull cap away from floor. Shadow softens with distance.</p></header>
          <div className="bw-elevation-diagram"><span className="bw-elevation-floor" /><div className="bw-elevation-object" style={{ transform: `translateY(${-m.lift * 19}px)`, boxShadow: `0 ${5 + m.lift * 4}px ${8 + m.lift * 9}px rgba(0,0,0,.22)` }}>
            <Handle label="Button elevation" value={m.lift} min={0} max={3} step={0.1} axis="y" pixelsPerStep={2} onChange={(lift) => setModel({ lift })} className="bw-elevation-handle" />Button
          </div></div>
          <div className="bw-readouts"><Meter label="Lift" value={m.lift.toFixed(1)} /><Meter label="Press travel" value={`${travel}px`} /></div>
          <div className="bw-travel-choices" role="group" aria-label="Press travel">{[0, .5, 1, 2, 3].map((amount) => <button key={amount} type="button" aria-pressed={travel === amount} onClick={() => setTravel(amount)}>{amount}</button>)}</div>
        </section>
        <section className="bw-instrument bw-layers" aria-label="Material layers">
          <header><span className="eng">05 / Material stack</span><p>Switch a layer. X-ray shows its contribution.</p></header>
          <div className="bw-layer-stack">{layerNames.map((name, index) => <label key={name} className="bw-layer"><input type="checkbox" checked={m.on[index]} onChange={(event) => setModel({ on: m.on.map((on, at) => at === index ? event.target.checked : on) })} /><span className="bw-layer-slab" style={{ background: index === 0 ? recipe.fill : 'var(--btn-bg)', boxShadow: index === 0 ? 'var(--btn-sh)' : recipe.shadows[index - 1] }} /><span>{name}</span></label>)}</div>
        </section>
      </div>
    </div>
  );
}
