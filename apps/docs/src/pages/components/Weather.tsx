import * as React from 'react';
import { useDialKit } from 'dialkit';
import { useAwake, Weather, WeatherTile, WEATHER_SKIES, type WeatherDay, type WeatherHour, type WeatherKind, type WeatherSky } from '@unlocalhosted/metalui';
import reactSource from '../../../../../packages/metalui/src/blocks/weather/weather.tsx?raw';
import agentSource from '../../../../../packages/metalui/src/blocks/weather/weather.agent.md?raw';
import { ComponentPage } from '../../ui/ComponentPage';

// A sample day in Lisbon, Saturday 26 September 2026. °C.
const PERIODS: { from: number; to: number; kind: WeatherKind; condition: string }[] = [
  { from: 0, to: 5.5, kind: 'clear', condition: 'Clear night' },
  { from: 5.5, to: 8.5, kind: 'mist', condition: 'Morning mist' },
  { from: 8.5, to: 11, kind: 'clear', condition: 'Sunny' },
  { from: 11, to: 14, kind: 'partly', condition: 'Partly cloudy' },
  { from: 14, to: 15.5, kind: 'rain', condition: 'Light rain' },
  { from: 15.5, to: 16.5, kind: 'storm', condition: 'Thunder' },
  { from: 16.5, to: 19.5, kind: 'cloud', condition: 'Cloudy' },
  { from: 19.5, to: 24, kind: 'clear', condition: 'Clear night' },
];
const TEMPS: [number, number][] = [[0, 15], [4, 14], [7, 14], [9, 19], [12, 24], [14, 23], [16, 21], [18, 20], [21, 17], [24, 15]];
const RAIN: Record<WeatherKind, number> = { clear: 0, partly: 10, cloud: 20, drizzle: 50, rain: 70, storm: 90, snow: 60, sleet: 70, mist: 5, windy: 5, heat: 0 };
const DAYS: WeatherDay[] = [
  { name: 'Today', kind: 'rain', low: 14, high: 24 },
  { name: 'Sun', kind: 'partly', low: 15, high: 23 },
  { name: 'Mon', kind: 'clear', low: 16, high: 26 },
  { name: 'Tue', kind: 'clear', low: 17, high: 28 },
  { name: 'Wed', kind: 'cloud', low: 16, high: 25 },
  { name: 'Thu', kind: 'rain', low: 14, high: 20 },
  { name: 'Fri', kind: 'partly', low: 13, high: 21 },
];
const TILES: { sky: WeatherKind; name: string; temp: number; meta: string }[] = [
  { sky: 'clear', name: 'Clear', temp: 21, meta: 'Dry' },
  { sky: 'partly', name: 'Partly', temp: 20, meta: 'Rain 10%' },
  { sky: 'cloud', name: 'Cloudy', temp: 17, meta: 'Rain 20%' },
  { sky: 'drizzle', name: 'Drizzle', temp: 15, meta: 'Rain 50%' },
  { sky: 'rain', name: 'Rain', temp: 14, meta: 'Rain 80%' },
  { sky: 'storm', name: 'Thunder', temp: 16, meta: 'Rain 90%' },
  { sky: 'snow', name: 'Snow', temp: -3, meta: 'Snow 60%' },
  { sky: 'sleet', name: 'Sleet', temp: 1, meta: 'Mixed 70%' },
  { sky: 'mist', name: 'Mist', temp: 9, meta: 'Vis 800 m' },
  { sky: 'windy', name: 'Windy', temp: 15, meta: '42 km/h' },
  { sky: 'heat', name: 'Heat', temp: 38, meta: 'UV 10' },
];
const KINDS = Object.keys(WEATHER_SKIES) as WeatherKind[];

const lerp = (h: number) => {
  for (let i = 0; i < TEMPS.length - 1; i++) {
    const [a, ta] = TEMPS[i], [b, tb] = TEMPS[i + 1];
    if (h >= a && h <= b) return ta + ((tb - ta) * (h - a)) / (b - a);
  }
  return TEMPS[0][1];
};
const period = (h: number) => PERIODS.find((p) => h >= p.from && h < p.to) ?? PERIODS[0];
const pad = (n: number) => String(n).padStart(2, '0');

function useClock(runs: boolean, dayLength: number, start: number) {
  const [hour, setHour] = React.useState(start);
  React.useEffect(() => setHour(start), [start]);
  React.useEffect(() => {
    if (!runs) return;
    // The day and its stepped sky share the authored frame cadence. Interleaving a faster
    // day clock with the dot frames invalidates the same scene between visible frames.
    const duration = getComputedStyle(document.documentElement).getPropertyValue('--mu-r-weather-dot-frame').trim();
    const frame = parseFloat(duration) * (duration.endsWith('ms') ? 1 : 1000);
    if (!Number.isFinite(frame) || frame <= 0) return;
    let previous = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const elapsed = now - previous; previous = now;
      setHour((h) => (h + (24 * elapsed) / (dayLength * 1000)) % 24);
    }, frame);
    return () => window.clearInterval(id);
  }, [runs, dayLength]);
  return hour;
}

function Playground() {
  const d = useDialKit('Weather', {
    time: { runs: true, dayLength: [48, 12, 180, 6], start: [9, 0, 23.75, 0.25] },
    sky: {
      kind: { type: 'select', options: ['forecast', ...KINDS], default: 'forecast' },
      own: false,
      rain: [0.6, 0, 1, 0.05],
      snow: [0, 0, 1, 0.05],
      thunder: false,
      mist: [0, 0, 1, 0.05],
      wind: [0, 0, 1, 0.05],
      windFrom: { type: 'select', options: ['left', 'right'], default: 'left' },
      heat: [0, 0, 1, 0.05],
      birds: [2, 0, 3, 1],
      moonPhase: [0.5, 0, 1, 0.01],
    },
    motion: { animate: true },
  });
  const [watch, awake] = useAwake(); // the demo's day-cycle clock sleeps when the page is hidden or scrolled away
  const hour = useClock(d.time.runs && awake, d.time.dayLength, d.time.start);
  const p = period(hour);
  const kind: WeatherKind = d.sky.kind === 'forecast' ? p.kind : (d.sky.kind as WeatherKind);
  const sky: WeatherSky = d.sky.own
    ? { ...WEATHER_SKIES[kind], rain: d.sky.rain, snow: d.sky.snow, thunder: d.sky.thunder, mist: d.sky.mist, wind: d.sky.wind, windFrom: d.sky.windFrom === 'right' ? -1 : 1, heat: d.sky.heat, birds: d.sky.birds, moonPhase: d.sky.moonPhase }
    : { ...WEATHER_SKIES[kind], moonPhase: d.sky.moonPhase };
  const condition = d.sky.kind === 'forecast' ? p.condition : kind[0].toUpperCase() + kind.slice(1);
  const temp = lerp(hour);
  const start = Math.ceil((hour + 0.01) / 3) * 3;
  const hours: WeatherHour[] = [hour, start, start + 3, start + 6, start + 9, start + 12].map((h, i) => {
    const hw = h % 24;
    return { label: i === 0 ? 'Now' : pad(Math.floor(hw)), hour: hw, kind: d.sky.kind === 'forecast' ? period(hw).kind : kind, temp: lerp(hw) };
  });
  const clock = `${pad(Math.floor(hour))}:${pad(Math.floor(((hour % 1) * 60) / 5) * 5)}`;
  const widget = (cw: 'bone' | 'graphite') => (
    <div key={cw} ref={cw === 'bone' ? watch : undefined} data-mu-colorway={cw} data-testid={`weather-${cw}`} className="flex flex-col items-center gap-20 rounded-card bg-page p-24">
      <Weather
        place="Lisbon"
        summary={`${condition} now`}
        hour={hour}
        sky={sky}
        condition={condition}
        temp={temp}
        feels={temp - 1}
        rain={RAIN[kind]}
        wind="9 km/h"
        live={d.time.runs}
        clock={clock}
        hours={hours}
        days={DAYS}
        animate={d.motion.animate}
      />
    </div>
  );
  return <div className="grid w-full gap-16 xl:grid-cols-2">{widget('bone')}{widget('graphite')}</div>;
}

function Tiles() {
  const [hour, setHour] = React.useState(12);
  return (
    <div className="flex flex-col gap-16">
      <label className="flex items-center gap-12 type-ui text-ink2">
        Time of day
        <input type="range" min={0} max={23.75} step={0.25} value={hour} onChange={(e) => setHour(+e.target.value)} aria-label="Time of day" />
        <span className="type-readout">{pad(Math.floor(hour))}:{pad((hour % 1) * 60)}</span>
      </label>
      {(['bone', 'graphite'] as const).map((cw) => (
        <div key={cw} data-mu-colorway={cw} data-testid={`weather-tiles-${cw}`} className="flex flex-wrap gap-10 rounded-card bg-page p-24">
          {TILES.map((t) => <WeatherTile key={t.sky} sky={t.sky} hour={hour} temp={t.temp} name={t.name} meta={t.meta} />)}
        </div>
      ))}
    </div>
  );
}

export default function WeatherPage() {
  return (
    <ComponentPage
      title="Weather"
      lede="Weather as an object: a slab with a dot-matrix sky sunk into it. The sun rides its arc to the time of day, the moon crosses in its phase, and the weather moves in stepped frames. The next hours and the week sit under it."
      play={{ lede: "The day runs in 48 seconds. Use the Weather panel to stop it, set the time, choose a sky, or compose your own: rain, snow, thunder, mist, wind and its direction, heat, birds and the moon's phase.", node: <Playground /> }}
      more={[{ id: 'tiles', title: 'Tiles', lede: 'One sky each, at the same time of day. Move the time to see the sun and the moon cross them all.', node: <Tiles /> }]}
      sources={[
        { id: 'react', label: 'React', code: reactSource },
        { id: 'agent', label: 'Agent guide', code: agentSource },
      ]}
      rules={[
        { id: 'W1', title: 'The sky is a description', body: 'Pass a kind or a WeatherSky. Spread a preset and change one thing: { ...WEATHER_SKIES.snow, wind: 0.9 } is a blizzard.', origin: 'Ours' },
        { id: 'W2', title: 'Time moves the sky', body: 'The hour places the sun and the moon; a host that wants the day to pass moves the hour.', origin: 'Ours' },
        { id: 'W3', title: 'One dot a degree', body: 'The week shares one scale, so a longer, further-right run is a warmer day.', origin: 'Ours' },
      ]}
    />
  );
}
