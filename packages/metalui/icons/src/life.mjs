// MetalUI life icons: the source of truth (imported from Kamui design/medium-icons/src/glyphs.mjs).
// Same construction as the product set (icons.mjs): 24-unit grid, stroke 1.7 (var --sw), round caps/joins.
// Classes: .f stroke + duotone fill, .s solid fill, .d duotone fill only, .v the feelings vessel.
// Tokens: & -> icon root, @H -> hovered host, KF -> unique keyframe prefix, &- -> unique id prefix.
// base = rest state, mo = hover motion (the builder wraps it in prefers-reduced-motion:no-preference).
// val: + / 0 / -   en: hi / mid / lo. Tints are not written here: tokens.json foundations.tint names
// the feelings and moments each family carries (DS-42), and the builder reads them from there.
import { f, pol, crescent, sparkle, rays, snowflake, wave, zig, arc, bitten } from './life-geo.mjs';

const E = 'cubic-bezier(.3,0,.2,1)';          // press/settle curve, same as product set
const EO = 'cubic-bezier(.2,.7,.3,1)';        // ease-out for one-shot sparks
const HEAD = (x, y, r = 2) => `<circle class="s hd" cx="${x}" cy="${y}" r="${r}"/>`;

// ---- feelings vessel: the self as a soft round screen; the trace inside is the feeling
const V = (duo = 0.17) => `<circle class="v d" style="--duo:${duo}" cx="12" cy="12" r="9.3"/>`;
const VCLIP = `<clipPath id="&-in"><circle cx="12" cy="12" r="9.3"/></clipPath>`;

// ---- crescent moons
const MOON_NAP = crescent([10.6, 13.4, 6.4], [14.2, 10.2, 5.2]);
const MOON_NIGHT = crescent([11.2, 12.6, 7.8], [15.6, 8.8, 6.4]);
const MOON_INS = crescent([10.2, 13.8, 6.4], [13.8, 10.6, 5.2]);

// ---- sun-arc family for time markers: horizon y 17.4, path radius 8
function dayArc(theta) {
  const cx = 12, cy = 17.4, r = 8.4, sr = 2.7, gap = 4.4;
  const sun = pol(cx, cy, r, theta);
  const dA = (Math.asin(Math.min(1, gap / 2 / r)) * 2 * 180) / Math.PI; // angular half-gap
  const done = theta + dA < 180 ? arc(cx, cy, r, 180, theta + dA) : '';
  const todo = theta - dA > 0 ? arc(cx, cy, r, theta - dA, 0) : '';
  return { sun, sr, done, todo };
}
const dayGlyph = (theta, hoverDeg) => {
  const A = dayArc(theta);
  return {
    body: `<path class="hz" d="M2.8 17.4h18.4"/>${A.done ? `<path class="dn" d="${A.done}"/>` : ''}${A.todo ? `<path class="td" d="${A.todo}"/>` : ''}<g class="sg"><circle class="s" cx="${A.sun[0]}" cy="${A.sun[1]}" r="${A.sr}"/></g>`,
    base: `& .td{opacity:.4} & .sg{transform-origin:12px 17.4px}`,
    mo: `@H .sg{transform:rotate(${hoverDeg}deg)}`,
  };
};
const MORNING = dayGlyph(140, 14), AFTERNOON = dayGlyph(60, 12), EVENING = dayGlyph(26, 8);

export const CATS = [
  ['meals', 'Meals & food'], ['sleep', 'Sleep & rest'], ['body', 'Body & health'], ['feelings', 'Feelings & mind'],
  ['work', 'Work'], ['social', 'Social & people'], ['places', 'Places & moves'], ['learning', 'Learning & making'],
  ['money', 'Money'], ['home', 'Home & chores'], ['time', 'Time markers'], ['weather', 'Weather'],
];

export const GLYPHS = [
/* =============================== MEALS =============================== */
{ name: 'breakfast', cat: 'meals', label: 'Breakfast', syn: ['breakfast', 'brekkie', 'eggs', 'toast', 'oats', 'porridge', 'cereal', 'bfast'], hook: 'jev:life=meal · time<11:00', hover: 'yolk wobbles',
  body: `<path class="w f" style="--duo:.06" d="M11.4 3.8c2.6-.4 4 1.4 5.2 2.8 1.1 1.3 3.2 1.6 3.6 3.9.4 2.1-1 3.3-1.4 5-.5 2.1-1.7 3.9-4.2 4.3-2.3.4-3.3-1-5-1.2-1.9-.2-4-.8-4.6-3-.6-2.1.7-3.3.8-5.1.1-1.8.2-3.9 2.1-5.1 1-.6 1.9-1.3 2.9-1.4Z"/><circle class="yk f" style="--duo:.4" cx="12.4" cy="11.6" r="2.9"/>`,
  base: `& .yk{transform-origin:12.4px 11.6px} & .w{transform-origin:12px 12px}`,
  mo: `@H .yk{animation:KF .62s ${E}} @H .w{transform:rotate(-4deg)} @keyframes KF{30%{transform:scale(1.14,.88)}55%{transform:scale(.94,1.06)}80%{transform:scale(1.02,.98)}}` },

{ name: 'lunch', cat: 'meals', label: 'Lunch', syn: ['lunch', 'lunch w/', 'lunch with', 'midday meal', 'lunched', 'bowl', 'salad'], hook: 'jev:life=meal · 11:00–15:00', hover: 'chopsticks dip into the bowl',
  body: `<path class="f" style="--duo:.14" d="M4.4 11h15.2a7.6 7.6 0 0 1-15.2 0Z"/><path d="M9.4 20.4h5.2"/><g class="cs"><path d="M12.6 8.6 17.8 3.4M14.8 9.2l5-4.4"/></g>`,
  base: `& .cs{transform-origin:17px 5px}`,
  mo: `@H .cs{transform:translate(-.7px,1px) rotate(-5deg)}` },

{ name: 'dinner', cat: 'meals', label: 'Dinner', syn: ['dinner', 'supper', 'dinner w/', 'ate out', 'restaurant', 'dined'], hook: 'jev:life=meal · after 17:00', hover: 'fork and knife lift off the table',
  body: `<circle class="f" style="--duo:.1" cx="12" cy="12" r="4.9"/><circle cx="12" cy="12" r="2.1" style="opacity:.5"/><g class="fk"><path d="M3.4 4.2v3.9a1 1 0 0 0 2 0V4.2M4.4 4.2v15.6"/></g><g class="kn"><path d="M19.8 19.8V4.2c-1.6.9-2.3 3.2-2.3 5.7 0 1.2.9 1.9 2.3 1.9"/></g>`,
  base: `& .fk{transform-origin:4.4px 19.8px} & .kn{transform-origin:19.8px 19.8px;--dl:.05s}`,
  mo: `@H .fk{transform:translateY(-1px) rotate(-6deg)} @H .kn{transform:translateY(-1px) rotate(6deg)}` },

{ name: 'snack', cat: 'meals', label: 'Snack', syn: ['snack', 'snacked', 'biscuit', 'cookie', 'chips', 'crisps', 'nibbles', 'munchies'], hook: 'jev:life=meal(snack)', hover: 'cookie turns, a crumb falls',
  body: `<g class="ck"><path class="f" style="--duo:.14" d="${bitten([11.2, 12.8, 8], [18.4, 6.2, 4.2])}"/><circle class="s" cx="8.4" cy="10.4" r="1"/><circle class="s" cx="13.2" cy="15.4" r="1"/><circle class="s" cx="8.6" cy="15.8" r="1"/><circle class="s" cx="12.4" cy="10.4" r="1"/></g><circle class="cr s" cx="17.8" cy="9.6" r=".85"/>`,
  base: `& .ck{transform-origin:11.2px 12.8px} & .cr{opacity:0}`,
  mo: `@H .ck{transform:rotate(-14deg)} @H .cr{animation:KF .6s ${E} .08s} @keyframes KF{0%{opacity:1;transform:none}100%{opacity:0;transform:translate(1.2px,6px)}}` },

{ name: 'coffee', cat: 'meals', label: 'Coffee', syn: ['coffee', 'coffee #2', 'espresso', 'latte', 'flat white', 'cortado', 'americano', 'cappuccino', 'caffeine'], hook: 'rule:/coffee(\\s*#\\d+)?/ → counter', hover: 'steam rises from the cup',
  body: `<path class="f" style="--duo:.14" d="M4.8 9.4h10.6v6a4.2 4.2 0 0 1-4.2 4.2H9a4.2 4.2 0 0 1-4.2-4.2Z"/><path d="M15.4 10.8h1.2a2.5 2.5 0 0 1 0 5h-1.2"/><path class="st s1" d="M8.6 6.9c-.9-.9.9-1.8 0-2.8"/><path class="st s2" d="M11.8 6.9c-.9-.9.9-1.8 0-2.8"/>`,
  base: `& .s2{--dl:.12s}`,
  mo: `@H .st{animation:KF 1.1s cubic-bezier(.4,0,.4,1) var(--dl,0s) 2} @keyframes KF{0%{transform:none;opacity:1}55%{transform:translateY(-2.2px);opacity:0}56%{transform:translateY(1.2px);opacity:0}100%{transform:none;opacity:1}}` },

{ name: 'tea', cat: 'meals', label: 'Tea', syn: ['tea', 'chai', 'matcha', 'green tea', 'herbal', 'cuppa', 'brew'], hook: 'jev:life=drink(tea)', hover: 'pot tips to pour',
  body: `<g class="pt"><path class="f" style="--duo:.12" d="M5.8 11.4h10.4l-.5 4.2a4.4 4.4 0 0 1-4.4 3.9h-.6a4.4 4.4 0 0 1-4.4-3.9Z"/><path d="M7.4 11.4c.4-1.8 1.9-2.9 3.6-2.9s3.2 1.1 3.6 2.9"/><circle class="s" cx="11" cy="7" r="1.05"/><path d="M16.1 12.4h.9a2.3 2.3 0 0 1 0 4.6h-1.5"/><path d="M5.9 13.4 3.6 11"/></g>`,
  base: `& .pt{transform-origin:11px 19.5px}`,
  mo: `@H .pt{transform:rotate(-12deg)}` },

{ name: 'water', cat: 'meals', label: 'Water', syn: ['water', 'glass of water', 'hydrated', 'drank water', 'litre', 'bottle'], hook: 'rule:/(\\d+) ?(glasses|l|ml) water/ → counter', hover: 'water sloshes in the glass',
  defs: `<clipPath id="&-g"><path d="M6.2 4.6h11.6l-1.4 13.6a1.9 1.9 0 0 1-1.9 1.7H9.5a1.9 1.9 0 0 1-1.9-1.7Z"/></clipPath>`,
  body: `<g clip-path="url(#&-g)"><g class="wv"><path class="d" style="--duo:.2" d="M4 10.8c2.1-1 3.9 1 6 0s3.9-1 6 0 3.9 1 6 0V22H4Z"/><path d="M4 10.8c2.1-1 3.9 1 6 0s3.9-1 6 0 3.9 1 6 0" style="stroke-width:calc(var(--sw) * .8)"/></g></g><path d="M6.2 4.6h11.6l-1.4 13.6a1.9 1.9 0 0 1-1.9 1.7H9.5a1.9 1.9 0 0 1-1.9-1.7Z"/>`,
  base: `& .wv{transform-origin:12px 12px}`,
  mo: `@H .wv{animation:KF 1s ${E}} @keyframes KF{25%{transform:translateX(-2px) rotate(7deg)}55%{transform:translateX(1.4px) rotate(-5deg)}80%{transform:rotate(2deg)}}` },

{ name: 'alcohol', cat: 'meals', label: 'Alcohol', syn: ['wine', 'beer', 'drinks', 'a drink', 'cocktail', 'pint', 'glass of wine', 'drunk', 'hungover'], hook: 'jev:life=drink(alcohol) · counter', hover: 'glass tilts to clink',
  body: `<g class="gl"><path d="M7.4 3.8h9.2l.3 3.4a5 5 0 0 1-9.8 0Z"/><path class="d" style="--duo:.24" d="M7.3 7.4h9.4a4.7 4.7 0 0 1-9.4 0Z"/><path d="M12 12.4v7.2M8.8 19.8h6.4"/></g>`,
  base: `& .gl{transform-origin:12px 19.8px}`,
  mo: `@H .gl{transform:rotate(-10deg)}` },

{ name: 'cooking', cat: 'meals', label: 'Cooking', syn: ['cooked', 'cooking', 'made dinner', 'baked', 'meal prep', 'recipe', 'in the kitchen'], hook: 'jev:life=cooking', hover: 'lid lifts, steam escapes',
  body: `<path class="f" style="--duo:.12" d="M5.4 10.6h13.2v6a3 3 0 0 1-3 3H8.4a3 3 0 0 1-3-3Z"/><path d="M5.4 12.6H3.6M18.6 12.6h1.8"/><g class="ld"><path d="M4.6 8.4h14.8"/><path d="M10.6 8.4a1.4 1.4 0 0 1 2.8 0"/></g><path class="pf" d="M8.4 5.6c-.7-.7.7-1.4 0-2.2M15.6 5.6c-.7-.7.7-1.4 0-2.2"/>`,
  base: `& .ld{transform-origin:4.6px 8.4px} & .pf{opacity:0}`,
  mo: `@H .ld{transform:translateY(-1.5px) rotate(-7deg)} @H .pf{animation:KF .9s ${E} .1s} @keyframes KF{0%{opacity:0;transform:translateY(1.4px)}40%{opacity:1}100%{opacity:0;transform:translateY(-1.6px)}}` },

{ name: 'takeaway', cat: 'meals', label: 'Takeaway', syn: ['takeout', 'takeaway', 'delivery', 'ordered in', 'uber eats', 'doordash', 'deliveroo', 'swiggy', 'zomato'], hook: 'jev:life=meal(ordered) · money', hover: 'handle swings',
  body: `<path class="f" style="--duo:.12" d="M5.2 9h13.6l-1.5 9.6a1.7 1.7 0 0 1-1.7 1.4H8.4a1.7 1.7 0 0 1-1.7-1.4Z"/><path d="M5.2 9 6.8 6h10.4L18.8 9"/><g class="hn"><path d="M9.2 6c0-3 5.6-3 5.6 0"/></g>`,
  base: `& .hn{transform-origin:12px 6px}`,
  mo: `@H .hn{animation:KF .8s ${E}} @keyframes KF{25%{transform:rotate(14deg)}55%{transform:rotate(-8deg)}80%{transform:rotate(3deg)}}` },

{ name: 'fasting', cat: 'meals', label: 'Fasting', syn: ['fasting', 'fasted', 'skipped breakfast', 'skipped lunch', 'no food', 'IF', '16:8', 'eating window'], hook: 'jev:life=fasting · duration', hover: 'hand sweeps the empty plate',
  body: `<path d="M3.4 4.2v3.9a1 1 0 0 0 2 0V4.2M4.4 4.2v15.6"/><circle class="f" style="--duo:.08" cx="13.6" cy="12" r="6.6"/><path d="M13.6 12V8.8" style="opacity:.55"/><g class="hd2"><path d="M13.6 12l2.6 1.5"/></g><circle class="s" cx="13.6" cy="12" r=".9"/>`,
  base: `& .hd2{transform-origin:13.6px 12px}`,
  mo: `@H .hd2{transform:rotate(230deg);transition-duration:.9s}` },

/* =============================== SLEEP =============================== */
{ name: 'sleep', cat: 'sleep', label: 'Sleep', syn: ['slept', 'sleep', 'slept 6h', 'went to bed', 'bedtime', 'in bed', 'asleep'], hook: 'rule:/slept (\\d+(\\.\\d+)?)h/ → metric sleep', hover: 'blanket rises with a breath',
  body: `<path d="M3.8 5.6v14.2"/><path d="M3.8 13.4h14.4a2 2 0 0 1 2 2v4.4"/><path d="M3.8 17h16.4"/><rect class="f" style="--duo:.14" x="6" y="9.6" width="4.4" height="3.8" rx="1.9"/><path class="bk f" style="--duo:.2" d="M12.4 13.4v-1.6a1.8 1.8 0 0 1 1.8-1.8h4.2a1.8 1.8 0 0 1 1.8 1.8v1.6"/>`,
  base: `& .bk{transform-origin:16px 13.4px}`,
  mo: `@H .bk{animation:KF 1.6s cubic-bezier(.45,0,.55,1) 2} @keyframes KF{50%{transform:scaleY(1.28)}}` },

{ name: 'nap', cat: 'sleep', label: 'Nap', syn: ['nap', 'napped', 'power nap', 'siesta', 'dozed', 'dozed off', 'snooze'], hook: 'jev:life=nap · duration', hover: 'a z drifts up',
  body: `<path class="mn f" style="--duo:.14" d="${MOON_NAP}"/><path class="z" d="M15.4 3.8h3.4l-3.4 4h3.4"/>`,
  base: `& .mn{transform-origin:10.6px 13.4px}`,
  mo: `@H .mn{transform:rotate(-8deg)} @H .z{animation:KF 1.2s cubic-bezier(.4,0,.4,1)} @keyframes KF{0%{transform:none;opacity:1}50%{transform:translate(1px,-2.4px);opacity:0}51%{transform:translate(-1px,1.2px);opacity:0}100%{transform:none;opacity:1}}` },

{ name: 'woke', cat: 'sleep', label: 'Woke', syn: ['woke early', 'up at 5', 'early start', 'alarm', 'up early', '5am', 'sunrise run'], hook: 'jev:life=wake · time', hover: 'the alarm rings',
  body: `<g class="al"><circle class="f" style="--duo:.1" cx="12" cy="13" r="6.6"/><path d="M12 10.2V13l1.9 1.3"/><path d="M4.3 7.4a3 3 0 0 1 4.3-4"/><path d="M15.4 3.4a3 3 0 0 1 4.3 4"/></g><path d="M7.6 18.6 6.2 20.2M16.4 18.6l1.4 1.6"/>`,
  base: `& .al{transform-origin:12px 13px}`,
  mo: `@H .al{animation:KF .7s linear} @keyframes KF{10%,50%,90%{transform:rotate(7deg)}30%,70%{transform:rotate(-7deg)}100%{transform:none}}` },

{ name: 'bad-night', cat: 'sleep', label: 'Bad night', syn: ["couldn't sleep", 'insomnia', 'awake at 3', 'up all night', 'restless', 'bad sleep', 'tossing'], hook: 'jev:metric=sleep · valence -', hover: 'restless line jitters',
  body: `<path class="f" style="--duo:.14" d="${MOON_INS}"/><path class="jt" d="${zig(14, 6.6, 1.35, 1.6, 5)}"/>`,
  mo: `@H .jt{animation:KF .5s linear 2} @keyframes KF{25%{transform:translate(.5px,-.3px)}50%{transform:translate(-.4px,.3px)}75%{transform:translate(.3px,.2px)}}` },

{ name: 'tired', cat: 'sleep', label: 'Tired', syn: ['tired', 'exhausted', 'knackered', 'sleepy', 'wiped', 'low battery', 'running on empty', 'shattered'], val: '-', en: 'lo', hook: 'jev:mood energy=low', hover: 'last bar flickers',
  body: `<rect class="f" style="--duo:.06" x="3.2" y="7.4" width="15.6" height="9.2" rx="3"/><path d="M21 10.6v2.8"/><rect class="br s" x="5.8" y="10" width="2.6" height="4" rx="1"/>`,
  mo: `@H .br{animation:KF .9s steps(1)} @keyframes KF{20%{opacity:.25}40%{opacity:1}60%{opacity:.25}80%{opacity:1}}` },

{ name: 'rested', cat: 'sleep', label: 'Rested', syn: ['rested', 'well rested', 'slept well', 'slept like a log', 'refreshed', 'recharged', 'good sleep', 'slept in'], val: '+', en: 'lo', hook: 'jev:mood energy=high · metric sleep', hover: 'bars charge in turn',
  body: `<rect class="f" style="--duo:.06" x="3.2" y="7.4" width="15.6" height="9.2" rx="3"/><path d="M21 10.6v2.8"/><rect class="br b1 s" x="5.8" y="10" width="2.6" height="4" rx="1"/><rect class="br b2 s" x="9.7" y="10" width="2.6" height="4" rx="1"/><rect class="br b3 s" x="13.6" y="10" width="2.6" height="4" rx="1"/>`,
  base: `& .b1{transform-origin:5.8px 12px} & .b2{transform-origin:9.7px 12px;--dl:.08s} & .b3{transform-origin:13.6px 12px;--dl:.16s}`,
  mo: `@H .br{animation:KF .5s ${EO} var(--dl) both} @keyframes KF{0%{transform:scaleX(0)}100%{transform:none}}` },

/* =============================== BODY =============================== */
{ name: 'run', cat: 'body', label: 'Run', syn: ['ran', 'run', 'ran 5k', 'jog', 'jogged', 'parkrun', 'tempo', 'intervals', 'long run'], hook: 'rule:/ran (\\d+)k/ → metric exercise', hover: 'the figure strides',
  body: `<g class="fg">${HEAD(15.4, 4.6)}<path class="tr" d="M13.4 8.4 11.2 13.4"/><path class="ar" d="M8.4 11.2 10.4 8.8l3-.4 2.6 2.4 2.4-1"/><path class="la" d="M11.2 13.4l3.2 2.4-1 4.2"/><path class="lb" d="M11.2 13.4 9.2 16.8H5.4"/></g>`,
  base: `& .fg{transform-origin:11.2px 13.4px} & .la,& .lb{transform-origin:11.2px 13.4px} & .ar{transform-origin:13.4px 8.4px}`,
  mo: `@H .fg{transform:translateX(.6px) rotate(4deg)} @H .la{animation:KF .56s ease-in-out 2} @H .lb{animation:KF2 .56s ease-in-out 2} @H .ar{animation:KF3 .56s ease-in-out 2}
       @keyframes KF{50%{transform:rotate(-26deg)}} @keyframes KF2{50%{transform:rotate(24deg)}} @keyframes KF3{50%{transform:rotate(-10deg)}}` },

{ name: 'walk', cat: 'body', label: 'Walk', syn: ['walked', 'walk', 'stroll', 'hike', 'hiked', 'went for a walk', 'dog walk', 'wander'], hook: 'rule:/walked (\\d+)k?/ → metric exercise', hover: 'legs swing a step',
  body: `${HEAD(12.8, 4.4)}<path d="M12.4 8.2 11.6 13.4"/><path class="aa" d="M9.8 11.8l2.6-3.6 2.4 3.2"/><path class="la" d="M11.6 13.4l2 3 .8 3.4"/><path class="lb" d="M11.6 13.4l-1.6 3.2-1.4 3.2"/>`,
  base: `& .la,& .lb{transform-origin:11.6px 13.4px} & .aa{transform-origin:12.4px 8.2px}`,
  mo: `@H .la{animation:KF .8s ease-in-out} @H .lb{animation:KF2 .8s ease-in-out} @H .aa{animation:KF3 .8s ease-in-out}
       @keyframes KF{50%{transform:rotate(-16deg)}} @keyframes KF2{50%{transform:rotate(16deg)}} @keyframes KF3{50%{transform:rotate(12deg)}}` },

{ name: 'gym', cat: 'body', label: 'Gym', syn: ['gym', 'lifted', 'weights', 'strength', 'workout', 'leg day', 'squats', 'deadlift', 'pt session'], hook: 'jev:metric=exercise(strength)', hover: 'dumbbell lifts',
  body: `<g class="db"><path d="M8.6 12h6.8"/><rect class="f" style="--duo:.16" x="5.4" y="7.2" width="3.2" height="9.6" rx="1.5"/><rect class="f" style="--duo:.16" x="15.4" y="7.2" width="3.2" height="9.6" rx="1.5"/><path d="M3.4 10v4M20.6 10v4"/></g>`,
  base: `& .db{transform-origin:12px 12px}`,
  mo: `@H .db{transform:translateY(-1.6px) rotate(-7deg)}` },

{ name: 'yoga', cat: 'body', label: 'Yoga', syn: ['yoga', 'vinyasa', 'pilates', 'meditated', 'meditation', 'breathwork', 'sat for 10'], hook: 'jev:metric=exercise(mobility) · focus', hover: 'a slow breath lifts the figure',
  body: `<g class="up">${HEAD(12, 4.8)}<path d="M12 8.2v5.2"/><path d="M6.4 13.2l2.8-3.4L12 9.2l2.8.6 2.8 3.4"/></g><path d="M4.4 17.8c1.9-2.6 4.8-3.8 7.6-3.8s5.7 1.2 7.6 3.8"/><path d="M7 19.8h10"/>`,
  mo: `@H .up{animation:KF 1.8s cubic-bezier(.45,0,.55,1)} @keyframes KF{50%{transform:translateY(-1px)}}` },

{ name: 'cycle', cat: 'body', label: 'Cycle', syn: ['cycled', 'bike', 'biked', 'ride', 'rode', 'spin class', 'peloton', 'cycling'], hook: 'rule:/(rode|cycled) (\\d+)k/ → metric exercise', hover: 'bike rolls forward',
  body: `<g class="bk"><circle cx="6.2" cy="15.4" r="3.6"/><circle cx="17.8" cy="15.4" r="3.6"/><path d="M6.2 15.4 9.4 9.4h5.4M9.4 9.4l2.6 6h-5.8M14.8 9.4l3 6M14.8 9.4l-1-2.6h2.2M8 7.2h2.8"/></g><path class="sp" d="M1.6 12.4h1.6" style="opacity:0"/>`,
  base: `& .bk{transform-origin:12px 15px}`,
  mo: `@H .bk{transform:translateX(1.2px)} @H .sp{animation:KF .6s ${E}} @keyframes KF{30%{opacity:.6}100%{opacity:0;transform:translateX(-1px)}}` },

{ name: 'swim', cat: 'body', label: 'Swim', syn: ['swam', 'swim', 'pool', 'laps', 'lengths', 'open water', 'sea swim'], hook: 'jev:metric=exercise(swim)', hover: 'water rolls under the stroke',
  body: `${HEAD(8.6, 9.2, 1.9)}<path class="arm" d="M10.8 11.4c1.6-3.6 5.4-5.2 9-4"/><path class="w1" d="${wave(3.2, 15.2, 2.8, 1, 6)}"/><path class="w2" d="${wave(3.2, 19, 2.8, 1, 6)}" style="opacity:.5"/>`,
  base: `& .arm{transform-origin:10.8px 11.4px}`,
  mo: `@H .w1{animation:KF .9s ease-in-out} @H .w2{animation:KF2 .9s ease-in-out} @H .arm{transform:rotate(-8deg)} @keyframes KF{50%{transform:translateX(1.4px)}} @keyframes KF2{50%{transform:translateX(-1.4px)}}` },

{ name: 'stretch', cat: 'body', label: 'Stretch', syn: ['stretched', 'stretch', 'mobility', 'foam roll', 'warm up', 'cool down'], hook: 'jev:metric=exercise(mobility)', hover: 'arms reach higher',
  body: `${HEAD(12, 5.8, 1.9)}<g class="ar"><path d="M6.6 3.6 12 9.2l5.4-5.6"/></g><path d="M12 9.2v4.8"/><path d="M7.4 20.2 12 14l4.6 6.2"/>`,
  base: `& .ar{transform-origin:12px 9.2px}`,
  mo: `@H .ar{transform:scale(1.12,1.1)} @H .hd{transform:translateY(-.4px)}` },

{ name: 'headache', cat: 'body', label: 'Headache', syn: ['headache', 'migraine', 'head hurts', 'head is pounding', 'tension headache'], hook: 'jev:life=symptom(head) · pain_level', hover: 'the ache flares once',
  body: `<path class="f" style="--duo:.06" d="M9 20.4v-3c-2.2-1.3-3.6-3.6-3.6-6.2a7 7 0 0 1 13.9-1.2l1.2 3.1a.6.6 0 0 1-.6.8h-1.2v2.3a1.8 1.8 0 0 1-1.8 1.8h-1.6v2.4"/><path class="zz" d="M9.2 10.4l1.8-2.2 1.6 2.4 1.8-2.2"/>`,
  base: `& .zz{transform-origin:11.8px 9.4px}`,
  mo: `@H .zz{animation:KF .5s ${EO}} @keyframes KF{0%{transform:none}30%{transform:scale(1.25);opacity:.6}60%{transform:scale(.95);opacity:1}100%{transform:none}}` },

{ name: 'sick', cat: 'body', label: 'Sick', syn: ['sick', 'ill', 'fever', 'flu', 'cold', 'covid', 'under the weather', 'temperature', 'unwell'], hook: 'jev:life=unwell · measurement temp', hover: 'mercury climbs',
  body: `<path class="f" style="--duo:.06" d="M10 14.2V5.6a2 2 0 0 1 4 0v8.6a3.8 3.8 0 1 1-4 0Z"/><circle class="s" cx="12" cy="17.2" r="1.7"/><path class="mc" d="M12 16V10"/><path d="M16.8 6.4h1.6M16.8 9.2h1.6M16.8 12h1.6" style="opacity:.5"/>`,
  base: `& .mc{transform-origin:12px 16px}`,
  mo: `@H .mc{transform:scaleY(1.45)}` },

{ name: 'medication', cat: 'body', label: 'Medication', syn: ['meds', 'took meds', 'pill', 'tablet', 'vitamins', 'ibuprofen', 'paracetamol', 'dose', 'medication'], hook: 'jev:life=meds · recurring', hover: 'capsule twists open',
  body: `<g transform="rotate(45 12 12)"><path class="c1" d="M8 12V7.4a4 4 0 0 1 8 0V12Z"/><path class="c2 f" style="--duo:.3" d="M8 12v4.6a4 4 0 0 0 8 0V12Z"/></g>`,
  base: `& .c1{transform-origin:12px 12px}`,
  mo: `@H .c1{transform:translateY(-1.3px) rotate(-8deg)}` },

{ name: 'doctor', cat: 'body', label: 'Doctor', syn: ['doctor', 'gp', 'dentist', 'appointment', 'checkup', 'physio', 'therapist', 'clinic', 'hospital'], hook: 'jev:life=appointment(health) · date', hover: 'chestpiece swings',
  body: `<path d="M6.6 3.8H6a.6.6 0 0 0-.6.6v4.8a4.4 4.4 0 0 0 8.8 0V4.4a.6.6 0 0 0-.6-.6H13"/><g class="cp"><path d="M9.8 13.6v1.8a4.2 4.2 0 0 0 8.4 0v-2"/><circle class="f" style="--duo:.2" cx="18.2" cy="11.2" r="2.2"/></g>`,
  base: `& .cp{transform-origin:9.8px 13.6px}`,
  mo: `@H .cp{animation:KF .9s ${E}} @keyframes KF{30%{transform:rotate(-12deg)}60%{transform:rotate(6deg)}85%{transform:rotate(-2deg)}}` },

{ name: 'period', cat: 'body', label: 'Period', syn: ['period', 'on my period', 'cramps', 'cycle day', 'day 1', 'pms', 'spotting'], hook: 'jev:life=cycle · private by default', hover: 'the cycle ring turns a day',
  body: `<path class="f" style="--duo:.26" d="M12 6.6c2.4 2.8 3.8 4.8 3.8 6.8a3.8 3.8 0 0 1-7.6 0c0-2 1.4-4 3.8-6.8Z"/><g class="rg">${Array.from({ length: 10 }, (_, i) => { const p = pol(12, 12, 8.6, 90 - i * 36); return `<circle class="s" cx="${p[0]}" cy="${p[1]}" r="${i === 0 ? 1.2 : 0.75}"${i ? ' style="opacity:.55"' : ''}/>`; }).join('')}</g>`,
  base: `& .rg{transform-origin:12px 12px}`,
  mo: `@H .rg{transform:rotate(36deg)}` },

{ name: 'weight', cat: 'body', label: 'Weight', syn: ['weight', 'weighed', 'kg', 'lbs', 'scale', 'weigh-in', 'bmi'], hook: 'rule:/weight (\\d+)/ → metric weight', hover: 'needle settles',
  body: `<rect class="f" style="--duo:.06" x="3.6" y="3.6" width="16.8" height="16.8" rx="5"/><path d="M7.8 10.2a5 5 0 0 1 8.4 0"/><path class="nd" d="M12 11.4 13.4 8.2"/>`,
  base: `& .nd{transform-origin:12px 11.4px}`,
  mo: `@H .nd{animation:KF 1s ${E}} @keyframes KF{25%{transform:rotate(-46deg)}55%{transform:rotate(14deg)}80%{transform:rotate(-5deg)}}` },

{ name: 'steps', cat: 'body', label: 'Steps', syn: ['steps', '10k steps', 'step count', 'on my feet', 'walked around'], hook: 'rule:/(\\d+)k? steps/ → metric exercise', hover: 'prints step in turn',
  body: `<g class="p1"><ellipse class="f" style="--duo:.22" cx="8.4" cy="7" rx="2.4" ry="3.2"/><ellipse class="f" style="--duo:.22" cx="8.8" cy="13.5" rx="1.7" ry="1.4"/></g><g class="p2"><ellipse class="f" style="--duo:.22" cx="15.6" cy="10.4" rx="2.4" ry="3.2"/><ellipse class="f" style="--duo:.22" cx="15.2" cy="16.9" rx="1.7" ry="1.4"/></g>`,
  base: `& .p2{--dl:.12s}`,
  mo: `@H .p1,@H .p2{animation:KF .7s ${E} var(--dl)} @keyframes KF{40%{transform:translateY(-1.4px);opacity:.5}}` },

{ name: 'heart-rate', cat: 'body', label: 'Heart rate', syn: ['heart rate', 'hr', 'bpm', 'resting hr', 'hrv', 'pulse', 'zone 2'], hook: 'rule:/(\\d+) ?bpm/ → metric heart', hover: 'the trace redraws',
  body: `<path class="tr" pathLength="1" d="M3 12.4h3.8l1.8-4 3 9.2 2.6-7.4 1.6 2.2H21"/>`,
  base: `& .tr{stroke-dasharray:1 2}`,
  mo: `@H .tr{animation:KF .7s cubic-bezier(.4,0,.2,1) both} @keyframes KF{0%{stroke-dashoffset:1}100%{stroke-dashoffset:0}}` },

{ name: 'sunlight', cat: 'body', label: 'Sunlight', syn: ['sunlight', 'got outside', 'morning light', 'daylight', 'sat in the sun', 'vitamin d'], hook: 'jev:life=outdoors(light)', hover: 'beams reach further in',
  body: `<path class="sn f" style="--duo:.26" d="M4.6 3.4h5.8A7 7 0 0 1 3.4 10.4V4.6a1.2 1.2 0 0 1 1.2-1.2Z"/><g class="bm">${[-20, -45, -70].map((a) => { const p = pol(3.4, 3.4, 9.8, a), q = pol(3.4, 3.4, a === -45 ? 17.6 : 15.4, a); return `<path d="M${p[0]} ${p[1]}L${q[0]} ${q[1]}"/>`; }).join('')}</g>`,
  base: `& .bm{transform-origin:3.4px 3.4px}`,
  mo: `@H .bm{transform:scale(1.08)} @H .sn{fill-opacity:.45}` },

/* =============================== FEELINGS =============================== */
// Vessel + trace. Position of the trace = valence (lifted / centred / sunk).
// Shape = energy (flat = low, smooth wave = mid, sharp = high). Level = capacity. Dots = attention.
{ name: 'calm', cat: 'feelings', label: 'Calm', syn: ['calm', 'peaceful', 'settled', 'at ease', 'still', 'chill', 'relaxed', 'serene'], val: '+', en: 'lo', hook: 'jev:mood_level + valence/energy', hover: 'reflection ripples once',
  body: `${V()}<path d="${wave(6.4, 11, 2.8, .5, 4)}"/><path class="rf" d="${wave(8.8, 14.4, 2.1, .4, 3)}" style="opacity:.45"/>`,
  base: `& .rf{transform-origin:12px 14.4px}`,
  mo: `@H .rf{animation:KF 1.4s cubic-bezier(.45,0,.55,1)} @keyframes KF{50%{transform:scaleX(1.35);opacity:.2}}`,
  grammar: 'still line, lifted; faint reflection' },

{ name: 'hopeful', cat: 'feelings', label: 'Hopeful', syn: ['hopeful', 'optimistic', 'looking up', 'things are turning', 'promising', 'encouraged'], val: '+', en: 'lo', hook: 'jev:valence/energy', hover: 'dawn lifts over the line',
  // The dawn is a chord-closed tinted wire (K4), not a disc under a half-plane clip (K1).
  body: `${V()}<path d="M5.8 14.6h12.4"/><path class="dw f" style="--duo:.3" d="M9.48 12.8A3.1 3.1 0 0 1 14.52 12.8"/>`,
  base: `& .dw{transform-origin:12px 14.6px}`,
  mo: `@H .dw{transform:translateY(-1.3px)}`,
  grammar: 'line with a disc rising above it' },

{ name: 'grateful', cat: 'feelings', label: 'Grateful', syn: ['grateful', 'thankful', 'gratitude', 'blessed', 'appreciative', 'lucky'], val: '+', en: 'lo', hook: 'jev:valence/energy', hover: 'a drop lands in the full vessel',
  defs: VCLIP,
  body: `${V(0.1)}<g clip-path="url(#&-in)"><path class="d" style="--duo:.3" d="M2 11.8h20V22H2Z"/></g><path class="sf" d="${wave(5.4, 11.8, 2.2, .35, 6)}"/><circle class="dp s" cx="12" cy="6.4" r="1.2"/>`,
  base: `& .sf{transform-origin:12px 11.8px} & .dp{opacity:0}`,
  mo: `@H .dp{animation:KF .8s cubic-bezier(.5,0,.8,.6)} @H .sf{animation:KF2 .8s ${E}} @keyframes KF{0%{transform:translateY(-1px);opacity:1}60%{transform:translateY(5px);opacity:1}61%{opacity:0}100%{opacity:0}} @keyframes KF2{55%{transform:none}70%{transform:scaleX(.8)}100%{transform:none}}`,
  grammar: 'level high (full), calm surface, something received' },

{ name: 'loved', cat: 'feelings', label: 'Loved', syn: ['loved', 'cared for', 'held', 'close to', 'connected', 'affection', 'in love'], val: '+', en: 'mid', hook: 'jev:valence/energy', hover: 'the two circles draw closer',
  body: `${V()}<circle class="l1" cx="10.2" cy="12" r="3.1"/><circle class="l2" cx="13.8" cy="12" r="3.1"/>`,
  mo: `@H .l1{transform:translateX(.7px)} @H .l2{transform:translateX(-.7px)}`,
  grammar: 'two forms overlapping' },

{ name: 'happy', cat: 'feelings', label: 'Happy', syn: ['happy', 'good day', 'great day', 'good mood', 'content', 'glad', 'cheerful', 'joy', 'lovely day'], val: '+', en: 'mid', hook: 'rule:/mood (\\d)/ · jev:mood_level', hover: 'the crest swells',
  body: `${V()}<path class="cr" d="M6.8 13.2c2.2 0 2.8-4.6 5.2-4.6s3 4.6 5.2 4.6"/>`,
  base: `& .cr{transform-origin:12px 13.2px}`,
  mo: `@H .cr{transform:scaleY(1.22)}`,
  grammar: 'one smooth crest, lifted' },

{ name: 'excited', cat: 'feelings', label: 'Excited', syn: ['excited', 'buzzing', 'pumped', "can't wait", 'thrilled', 'stoked', 'hyped'], val: '+', en: 'hi', hook: 'jev:valence/energy', hover: 'crests bounce',
  body: `${V()}<path class="cr" d="M6.4 13.6c1.3 0 1.5-5 2.8-5s1.5 5 2.8 5 1.5-5 2.8-5 1.5 5 2.8 5"/>`,
  base: `& .cr{transform-origin:12px 13.6px}`,
  mo: `@H .cr{animation:KF .6s ${E} 2} @keyframes KF{40%{transform:scaleY(1.28)}}`,
  grammar: 'quick tall crests, lifted' },

{ name: 'energised', cat: 'feelings', label: 'Energised', syn: ['energized', 'energised', 'full of energy', 'wired', 'charged', 'alive', 'fired up'], val: '+', en: 'hi', hook: 'jev:valence/energy', hover: 'the bolt pulses up',
  body: `${V()}<path class="bt" d="M13.6 6.4 9.4 12.6h5.2l-4.2 5.8"/>`,
  base: `& .bt{transform-origin:12px 12px}`,
  mo: `@H .bt{animation:KF .5s ${EO}} @keyframes KF{35%{transform:translateY(-1.2px) scale(1.08)}}`,
  grammar: 'sharp line rising' },

{ name: 'proud', cat: 'feelings', label: 'Proud', syn: ['proud', 'nailed it', 'did it', 'accomplished', 'shipped it', 'pleased with myself', 'win'], val: '+', en: 'mid', hook: 'jev:valence/energy', hover: 'the summit dot hops',
  body: `${V()}<path d="M7 16.2h2.8v-3h2.8v-3h2.8"/><circle class="pk s" cx="15.6" cy="7.4" r="1.25"/>`,
  mo: `@H .pk{animation:KF .6s ${E}} @keyframes KF{40%{transform:translateY(-1.6px)}70%{transform:translateY(.3px)}}`,
  grammar: 'steps climbing to a point' },

{ name: 'curious', cat: 'feelings', label: 'Curious', syn: ['curious', 'wondering', 'intrigued', 'rabbit hole', 'fascinated', 'interested'], val: '0', en: 'mid', hook: 'jev:valence/energy · kind=question', hover: 'the loop turns over',
  body: `${V()}<path class="lp" d="M6.6 14.6c2.4 0 3.8-.8 4.6-2.2.9-1.7.1-3.4-1.2-3.2-1.5.2-1.2 2.5.6 2.9 2.2.5 4.2-.9 5.8-3.3"/><circle class="s" cx="16.9" cy="7.6" r="1"/>`,
  base: `& .lp{transform-origin:11px 11px}`,
  mo: `@H .lp{animation:KF .8s ${E}} @keyframes KF{40%{transform:rotate(-8deg) scale(1.05)}}`,
  grammar: 'one clean loop, then onward' },

{ name: 'focused', cat: 'feelings', label: 'Focused', syn: ['focused', 'in the zone', 'flow', 'locked in', 'deep focus', 'concentrated'], val: '0', en: 'hi', hook: 'rule:/focus (\\d+)h/ → metric focus', hover: 'the ring tightens on the point',
  body: `${V()}<circle class="rg" cx="12" cy="12" r="3.8"/><circle class="s" cx="12" cy="12" r="1.2"/>`,
  base: `& .rg{transform-origin:12px 12px}`,
  mo: `@H .rg{transform:scale(.8)}`,
  grammar: 'dot held in a ring (attention, gathered)' },

{ name: 'distracted', cat: 'feelings', label: 'Distracted', syn: ['distracted', 'scattered', "can't focus", 'all over the place', 'fragmented', 'doomscrolling', 'context switching'], val: '0', en: 'mid', hook: 'jev:valence/energy · metric focus', hover: 'dots wander apart',
  body: `${V()}<circle class="a s" cx="8.8" cy="9.6" r="1.15"/><circle class="b s" cx="15.4" cy="10.8" r="1.15"/><circle class="c s" cx="11" cy="15.2" r="1.15"/>`,
  mo: `@H .a{transform:translate(-.6px,-.5px)} @H .b{transform:translate(.7px,-.3px)} @H .c{transform:translate(-.2px,.8px)}`,
  grammar: 'dots scattered (attention, spread)' },

{ name: 'bored', cat: 'feelings', label: 'Bored', syn: ['bored', 'meh', 'nothing to do', 'uninspired', 'tedious', 'killing time'], val: '0', en: 'lo', hook: 'jev:valence/energy', hover: 'dots trail off slowly',
  body: `${V()}<circle class="a s" cx="8.4" cy="13.2" r="1.1"/><circle class="b s" cx="12" cy="13.2" r="1.1" style="opacity:.6"/><circle class="c s" cx="15.6" cy="13.2" r="1.1" style="opacity:.3"/>`,
  base: `& .b{--dl:.15s} & .c{--dl:.3s}`,
  mo: `@H .a,@H .b,@H .c{animation:KF 1.2s ease-in-out var(--dl)} @keyframes KF{50%{transform:translateY(.7px)}}`,
  grammar: 'dots in a row, fading (attention, idling)' },

{ name: 'dull', cat: 'feelings', label: 'Dull', syn: ['dull', 'flat', 'so dull today', 'grey day', 'blah', 'numb', 'nothing', 'low-key off'], val: '-', en: 'lo', hook: 'jev:mood_level=Low · energy low', hover: 'the flat line sinks a little',
  body: `${V()}<path class="fl" d="M8.4 15h7.2"/>`,
  mo: `@H .fl{transform:translateY(.6px) scaleX(.94)}`,
  base: `& .fl{transform-origin:12px 15px}`,
  grammar: 'flat line, low' },

{ name: 'lonely', cat: 'feelings', label: 'Lonely', syn: ['lonely', 'alone', 'isolated', 'left out', 'missing people', 'by myself'], val: '-', en: 'lo', hook: 'jev:valence/energy', hover: 'the single dot drifts',
  body: `${V()}<circle class="s d1" cx="14.6" cy="14.6" r="1.3"/>`,
  mo: `@H .d1{animation:KF 1.6s cubic-bezier(.45,0,.55,1)} @keyframes KF{50%{transform:translate(-1px,.4px)}}`,
  grammar: 'one dot, low, off-centre' },

{ name: 'sad', cat: 'feelings', label: 'Sad', syn: ['sad', 'down', 'low', 'blue', 'upset', 'cried', 'heavy', 'gutted', 'felt pretty low'], val: '-', en: 'lo', hook: 'jev:mood_level=Very low…Low', hover: 'the line settles lower',
  body: `${V()}<path class="sd" d="M7 10c2.8.2 4.2 2 5.4 3.6 1 1.3 2.3 1.9 4.4 1.9"/>`,
  mo: `@H .sd{transform:translateY(.7px)}`,
  grammar: 'line falling, sunk' },

{ name: 'drained', cat: 'feelings', label: 'Drained', syn: ['drained', 'burnt out', 'burned out', 'depleted', 'wiped after', 'empty', 'running on fumes'], val: '-', en: 'lo', hook: 'jev:energy low · "what drained me"', hover: 'the level drops',
  defs: VCLIP,
  body: `${V(0.1)}<g clip-path="url(#&-in)"><g class="lv"><path class="d" style="--duo:.3" d="M2 16.4h20V22H2Z"/></g></g><path class="lv" d="${wave(6.9, 16.4, 2.05, .3, 5)}"/>`,
  mo: `@H .lv{transform:translateY(1px)}`,
  grammar: 'level low (empty), calm surface' },

{ name: 'anxious', cat: 'feelings', label: 'Anxious', syn: ['anxious', 'nervous', 'worried', 'on edge', 'uneasy', 'jittery', 'unsettled', 'panicky'], val: '-', en: 'hi', hook: 'jev:valence/energy', hover: 'the jitter quickens',
  body: `${V()}<path class="jt" d="${zig(6.6, 13.2, 1.2, 1.5, 9)}"/>`,
  mo: `@H .jt{animation:KF .16s linear 4} @keyframes KF{25%{transform:translate(.35px,-.2px)}75%{transform:translate(-.35px,.2px)}}`,
  grammar: 'tight small jitter, sunk' },

{ name: 'angry', cat: 'feelings', label: 'Angry', syn: ['angry', 'furious', 'livid', 'pissed', 'mad', 'fuming', 'raging', 'annoyed', 'irritated'], val: '-', en: 'hi', hook: 'jev:valence/energy', hover: 'the zigzag sparks once',
  body: `${V()}<path class="zg" d="M6.6 13.8l2.2-4.6 1.8 5.8 2.4-6.8 1.8 5.4 2.6-3.4"/>`,
  base: `& .zg{transform-origin:12px 11.6px}`,
  mo: `@H .zg{animation:KF .46s ${EO}} @keyframes KF{0%{transform:none}25%{transform:scale(1.2) rotate(-4deg)}50%{transform:scale(.96) rotate(3deg)}75%{transform:scale(1.03)}100%{transform:none}}`,
  grammar: 'sharp, irregular zigzag' },

{ name: 'stressed', cat: 'feelings', label: 'Stressed', syn: ['stressed', 'under pressure', 'swamped', 'tense', 'stretched thin', 'crunch', 'frazzled'], val: '-', en: 'hi', hook: 'jev:valence/energy', hover: 'the plates squeeze the coil',
  body: `${V()}<path class="p1" d="M8.4 7.8h7.2"/><path class="p2" d="M8.4 16.2h7.2"/><path class="co" d="M12 7.8l-2.2 1.2 4.4 1.2-4.4 1.2 4.4 1.2-4.4 1.2 4.4 1.2-2.2 1.2"/>`,
  base: `& .co{transform-origin:12px 12px}`,
  mo: `@H .p1{transform:translateY(1px)} @H .p2{transform:translateY(-1px)} @H .co{transform:scaleY(.76)}`,
  grammar: 'a coil pressed between plates' },

{ name: 'frustrated', cat: 'feelings', label: 'Frustrated', syn: ['frustrated', 'stuck', 'fed up', 'exasperated', 'hitting a wall', 'argh', 'ugh'], val: '-', en: 'mid', hook: 'jev:valence/energy', hover: 'the line pushes the wall and crumples',
  body: `${V()}<path class="ln" d="M6.4 12.4h3.6l1.2-1.6 1.2 3 1.2-1.4"/><path d="M15.6 8.4v7.6"/>`,
  base: `& .ln{transform-origin:6.4px 12.4px}`,
  mo: `@H .ln{animation:KF .5s ${E}} @keyframes KF{40%{transform:translateX(.9px) scaleX(.94)}}`,
  grammar: 'a line meeting a wall' },

{ name: 'overwhelmed', cat: 'feelings', label: 'Overwhelmed', syn: ['overwhelmed', 'too much', 'drowning', 'buried', 'in over my head', 'flooded', 'underwater'], val: '-', en: 'hi', hook: 'jev:valence/energy', hover: 'the water rises and churns',
  defs: VCLIP,
  body: `${V(0.1)}<g clip-path="url(#&-in)"><g class="ws"><path class="d" style="--duo:.3" d="M2 8.6c1.3-1.2 2.6-1.2 3.9 0s2.6 1.2 3.9 0 2.6-1.2 3.9 0 2.6 1.2 3.9 0 2.6-1.2 3.9 0V22H2Z"/><path d="${wave(5.6, 8.9, 2.14, 1.1, 6)}"/><path d="${wave(4.4, 13.4, 2.53, 1, 6)}" style="opacity:.5"/></g></g>`,
  mo: `@H .ws{animation:KF .9s ${E}} @keyframes KF{40%{transform:translate(1px,-.8px)}70%{transform:translate(-.5px,-.3px)}}`,
  grammar: 'level brimming, surface choppy' },

/* =============================== WORK =============================== */
{ name: 'meeting', cat: 'work', label: 'Meeting', syn: ['meeting', 'sync', 'standup', 'stand-up', 'call with team', 'offsite', 'workshop', 'all-hands', 'retro'], hook: 'jev:life=meeting · date/time', hover: 'heads nod in turn',
  body: `${HEAD(6, 8.4, 1.8).replace('hd', 'hd h1')}${HEAD(12, 6.6, 1.9).replace('hd', 'hd h2')}${HEAD(18, 8.4, 1.8).replace('hd', 'hd h3')}<path d="M3.2 14.4a2.8 2.8 0 0 1 5.6 0M8.8 12.8a3.2 3.2 0 0 1 6.4 0M15.2 14.4a2.8 2.8 0 0 1 5.6 0"/><path d="M3.4 18.4h17.2"/>`,
  base: `& .h2{--dl:.1s} & .h3{--dl:.2s}`,
  mo: `@H .hd{animation:KF .5s ${E} var(--dl)} @keyframes KF{40%{transform:translateY(.8px)}}` },

{ name: 'call', cat: 'work', label: 'Call', syn: ['call', 'called', 'phone call', 'rang', 'facetime', 'zoom', 'video call', 'call with'], hook: 'jev:life=call · entity person', hover: 'handset rings',
  body: `<g class="hs"><path class="f" style="--duo:.12" d="M8.4 4.2 9.8 7.6a1.3 1.3 0 0 1-.4 1.5L8 10.2a11 11 0 0 0 5.8 5.8l1.1-1.4a1.3 1.3 0 0 1 1.5-.4l3.4 1.4a1.3 1.3 0 0 1 .8 1.3l-.2 1.6a2 2 0 0 1-2.1 1.8C10 19.8 4.2 14 3.7 6.4a2 2 0 0 1 1.8-2.1L7.1 4a1.3 1.3 0 0 1 1.3.2Z"/></g><path class="sg1" d="M14.4 3.6a6 6 0 0 1 6 6"/><path class="sg2" d="M14.4 7a2.6 2.6 0 0 1 2.6 2.6"/>`,
  base: `& .hs{transform-origin:9px 14px} & .sg2{--dl:.1s}`,
  mo: `@H .hs{animation:KF .6s linear} @H .sg1,@H .sg2{animation:KF2 .6s ${E} var(--dl)} @keyframes KF{15%,55%{transform:rotate(6deg)}35%,75%{transform:rotate(-6deg)}100%{transform:none}} @keyframes KF2{40%{opacity:.2}}` },

{ name: 'deep-work', cat: 'work', label: 'Deep work', syn: ['deep work', 'heads down', 'maker time', 'no meetings', 'focus block', 'writing block', 'dnd'], hook: 'rule:/focus (\\d+)h/ · jev:kind=log(focus)', hover: 'the cups close in',
  body: `<path d="M4.6 14.6v-2.2a7.4 7.4 0 0 1 14.8 0v2.2"/><rect class="c1 f" style="--duo:.18" x="3.4" y="13.4" width="4.4" height="6.6" rx="2"/><rect class="c2 f" style="--duo:.18" x="16.2" y="13.4" width="4.4" height="6.6" rx="2"/>`,
  mo: `@H .c1{transform:translateX(.7px)} @H .c2{transform:translateX(-.7px)}` },

{ name: 'email', cat: 'work', label: 'Email', syn: ['email', 'emailed', 'inbox', 'replied', 'inbox zero', 'mail', 'sent the email'], hook: 'jev:kind=task/log · verb=email', hover: 'flap opens',
  body: `<rect class="f" style="--duo:.08" x="3.2" y="5.6" width="17.6" height="12.8" rx="2.8"/><path class="fp" d="M4.4 7.2l6.8 5a1.4 1.4 0 0 0 1.6 0l6.8-5"/>`,
  base: `& .fp{transform-origin:12px 6.6px}`,
  mo: `@H .fp{transform:scaleY(-.55)}` },

{ name: 'review', cat: 'work', label: 'Review', syn: ['review', 'reviewed', 'code review', 'pr review', 'feedback', 'approved', 'lgtm', 'crit'], hook: 'jev:life=review', hover: 'the tick redraws',
  defs: `<mask id="&-m" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#fff" stroke="none"/><circle cx="16.6" cy="16.6" r="5.5" fill="#000" stroke="none"/></mask>`,
  body: `<g mask="url(#&-m)"><rect x="4.6" y="3.4" width="11.4" height="17" rx="2.6"/><path d="M8 8h4.8M8 11.4h3"/></g><circle class="f" style="--duo:.2" cx="16.6" cy="16.6" r="3.9"/><path class="tk" pathLength="1" d="M14.9 16.7l1.2 1.2 2.3-2.5"/>`,
  base: `& .tk{stroke-dasharray:1 2}`,
  mo: `@H .tk{animation:KF .4s ${E} .05s both} @keyframes KF{0%{stroke-dashoffset:1}100%{stroke-dashoffset:0}}` },

{ name: 'shipped', cat: 'work', label: 'Shipped', syn: ['shipped', 'ship', 'launched', 'released', 'deployed', 'went live', 'merged', 'the deploy', 'release'], hook: 'jev:life=ship · kind=log', hover: 'the arrow leaves the box',
  body: `<rect class="f" style="--duo:.14" x="3.6" y="9.4" width="11.2" height="10.8" rx="2.4"/><path d="M3.6 13.4h11.2M9.2 9.4v4"/><g class="ar"><path d="M15.8 8.2l4.2-4.2M16.4 4h3.6v3.6"/></g>`,
  mo: `@H .ar{animation:KF .6s ${E}} @keyframes KF{45%{transform:translate(2.4px,-2.4px);opacity:0}46%{transform:translate(-1.4px,1.4px);opacity:0}100%{transform:none;opacity:1}}` },

{ name: 'blocked', cat: 'work', label: 'Blocked', syn: ['blocked', 'blocker', 'waiting on', 'stuck on', 'can\'t proceed', 'on hold', 'dependency'], hook: 'jev:state=blocked', hover: 'the barrier wobbles',
  defs: `<clipPath id="&-b"><rect x="3" y="7.4" width="18" height="5.4" rx="1.7"/></clipPath>`,
  body: `<g class="br"><rect class="f" style="--duo:.08" x="3" y="7.4" width="18" height="5.4" rx="1.7"/><g clip-path="url(#&-b)"><path d="M9.2 6.6 6.4 13.6M14.2 6.6l-2.8 7M19.2 6.6l-2.8 7" style="opacity:.6"/></g></g><path d="M6.4 12.8v7M17.6 12.8v7M4.8 19.8h3.2M16 19.8h3.2"/>`,
  base: `& .br{transform-origin:12px 12.8px}`,
  mo: `@H .br{animation:KF .6s ${E}} @keyframes KF{25%{transform:rotate(-3deg)}55%{transform:rotate(2deg)}80%{transform:rotate(-.6deg)}}` },

{ name: 'idea', cat: 'work', label: 'Idea', syn: ['idea', 'what if', 'thought:', 'shower thought', 'eureka', 'brainstorm', 'could we'], hook: 'jev:kind=idea', hover: 'the bulb warms and glints',
  body: `<path class="bb f" style="--duo:.12" d="M9.4 16.4v-.8c0-1.3-.7-2.2-1.6-3.2a5.8 5.8 0 1 1 8.4 0c-.9 1-1.6 1.9-1.6 3.2v.8Z"/><path d="M9.6 18.6h4.8M10.6 20.8h2.8"/><path class="rs" d="M12 .9v1.3M3.6 4.4l1 .9M20.4 4.4l-1 .9" style="opacity:0"/>`,
  mo: `@H .bb{fill-opacity:.4} @H .rs{opacity:1;transition:opacity .25s ease .05s}` },

{ name: 'bug', cat: 'work', label: 'Bug', syn: ['bug', 'fixed a bug', 'debugging', 'crash', 'regression', 'broken', 'issue', 'flaky test'], hook: 'jev:life=bug · kind=task', hover: 'legs scuttle',
  body: `<ellipse class="f" style="--duo:.14" cx="12" cy="13.8" rx="4.6" ry="5.8"/><path d="M9.6 8.6a2.4 2.4 0 0 1 4.8 0"/><path d="M12 10.8v8.6" style="opacity:.5"/><path d="M10.2 6.6 8.8 4.8M13.8 6.6l1.4-1.8"/><g class="lL"><path d="M7.4 11.6 4.6 10.4M7.4 14.6H4.2M7.8 17.4l-2.6 1.6"/></g><g class="lR"><path d="M16.6 11.6l2.8-1.2M16.6 14.6h3.2M16.2 17.4l2.6 1.6"/></g>`,
  base: `& .lL{transform-origin:7.4px 14.6px} & .lR{transform-origin:16.6px 14.6px}`,
  mo: `@H .lL{animation:KF .18s linear 3} @H .lR{animation:KF2 .18s linear 3} @keyframes KF{50%{transform:rotate(8deg)}} @keyframes KF2{50%{transform:rotate(-8deg)}}` },

{ name: 'deadline', cat: 'work', label: 'Deadline', syn: ['deadline', 'due', 'due friday', 'eod', 'by end of day', 'cutoff', 'last day', 'crunch time'], hook: 'rule:date + /due|deadline|by/', hover: 'hourglass turns over',
  body: `<g class="hg"><path d="M6.4 3.6h11.2M6.4 20.4h11.2"/><path d="M7.8 3.6v2.2c0 2.2 4.2 4 4.2 6.2s-4.2 4-4.2 6.2v2.2M16.2 3.6v2.2c0 2.2-4.2 4-4.2 6.2s4.2 4 4.2 6.2v2.2"/><path class="d" style="--duo:.4" d="M9.2 19c.7-1.6 1.7-2.5 2.8-2.7 1.1.2 2.1 1.1 2.8 2.7Z"/><path class="d" style="--duo:.22" d="M9.2 6.4h5.6c-.8 1.2-1.8 2-2.8 2.6-1-.6-2-1.4-2.8-2.6Z"/></g>`,
  base: `& .hg{transform-origin:12px 12px}`,
  mo: `@H .hg{transform:rotate(180deg);transition-duration:.7s}` },

{ name: 'one-on-one', cat: 'work', label: '1:1', syn: ['1:1', '1-1', 'one on one', 'catch up with', 'check-in', 'coffee chat', 'mentoring'], hook: 'jev:life=meeting(1:1) · entity person', hover: 'the two bubbles lean in',
  defs: `<mask id="&-m" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#fff" stroke="none"/><path class="b2" d="M10.6 14.6a5.2 5.2 0 1 1 9.6 2.8l.6 2.8-2.9-.7a5.2 5.2 0 0 1-7.3-4.9Z" fill="#000" stroke="#000" stroke-width="3.2"/></mask>`,
  body: `<path class="b1" mask="url(#&-m)" d="M13.4 9.4a5.2 5.2 0 1 0-9.6 2.8l-.6 2.8 2.9-.7a5.2 5.2 0 0 0 7.3-4.9Z"/><path class="b2 f" style="--duo:.14" d="M10.6 14.6a5.2 5.2 0 1 1 9.6 2.8l.6 2.8-2.9-.7a5.2 5.2 0 0 1-7.3-4.9Z"/>`,
  mo: `@H .b1{transform:translate(.5px,.4px)} @H .b2{transform:translate(-.5px,-.4px)}` },

{ name: 'presentation', cat: 'work', label: 'Presentation', syn: ['presentation', 'presented', 'demo', 'talk', 'pitch', 'slides', 'keynote', 'demo day'], hook: 'jev:life=presentation · date', hover: 'bars rise on the board',
  body: `<rect class="f" style="--duo:.06" x="3.4" y="3.6" width="17.2" height="11.6" rx="2.4"/><path d="M12 15.2v3M8.4 20.4l3.6-2.2 3.6 2.2"/><path class="b1" d="M8 12V10"/><path class="b2" d="M12 12V7.4"/><path class="b3" d="M16 12V8.8"/>`,
  base: `& .b1{transform-origin:8px 12px} & .b2{transform-origin:12px 12px;--dl:.06s} & .b3{transform-origin:16px 12px;--dl:.12s}`,
  mo: `@H .b1,@H .b2,@H .b3{animation:KF .5s ${EO} var(--dl) both} @keyframes KF{0%{transform:scaleY(0)}100%{transform:none}}` },

/* =============================== SOCIAL =============================== */
{ name: 'friend', cat: 'social', label: 'Friend', syn: ['friend', 'friends', 'hung out', 'saw', 'drinks with', 'catch up with', 'mate', 'bestie'], hook: 'entity:person · jev:life=social', hover: 'the friend leans in',
  defs: `<mask id="&-m" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#fff" stroke="none"/><g fill="#000" stroke="#000" stroke-width="3.2"><circle cx="9.2" cy="8.4" r="3"/><path d="M3.4 19.6v-.8a5 5 0 0 1 5-5h1.6a5 5 0 0 1 5 5v.8Z"/></g></mask>`,
  body: `<g class="bf" mask="url(#&-m)"><circle cx="16" cy="7.4" r="2.7"/><path d="M14 13h2.4a4.4 4.4 0 0 1 4.4 4.4v.8"/></g><g class="fr"><circle cx="9.2" cy="8.4" r="3"/><path class="f" style="--duo:.14" d="M3.4 19.6v-.8a5 5 0 0 1 5-5h1.6a5 5 0 0 1 5 5v.8"/></g>`,
  mo: `@H .bf{transform:translateX(-.6px) rotate(-3deg)} ` },

{ name: 'family', cat: 'social', label: 'Family', syn: ['family', 'mum', 'mom', 'dad', 'parents', 'kids', 'sister', 'brother', 'grandma', 'in-laws'], hook: 'entity:person(family)', hover: 'the small one hops',
  body: `<circle cx="7.2" cy="7" r="2.4"/><circle cx="16.8" cy="7" r="2.4"/><path d="M3.2 19.4v-2.4a4 4 0 0 1 4-4 4 4 0 0 1 2.6 1M20.8 19.4v-2.4a4 4 0 0 0-4-4 4 4 0 0 0-2.6 1"/><g class="ch"><circle class="s" cx="12" cy="12.6" r="1.7"/><path class="f" style="--duo:.2" d="M9.4 19.4v-.6a2.6 2.6 0 0 1 5.2 0v.6"/></g>`,
  mo: `@H .ch{animation:KF .5s ${E}} @keyframes KF{40%{transform:translateY(-1.4px)}70%{transform:translateY(.2px)}}` },

{ name: 'date', cat: 'social', label: 'Date', syn: ['date', 'date night', 'dinner date', 'first date', 'anniversary', 'partner', 'romantic'], hook: 'jev:life=social(date) · time', hover: 'heart beats twice',
  body: `<path class="ht f" style="--duo:.2" d="M12 19.8c-.3 0-8.4-4.9-8.4-10.5A4.4 4.4 0 0 1 12 7.1a4.4 4.4 0 0 1 8.4 2.2c0 5.6-8.1 10.5-8.4 10.5Z"/>`,
  base: `& .ht{transform-origin:12px 13px}`,
  mo: `@H .ht{animation:KF .8s ${E}} @keyframes KF{15%{transform:scale(1.1)}30%{transform:scale(.97)}45%{transform:scale(1.08)}70%{transform:none}}` },

{ name: 'party', cat: 'social', label: 'Party', syn: ['party', 'birthday', 'celebration', 'drinks', 'wedding', 'gig', 'night out', 'bday'], hook: 'jev:life=social(event) · date', hover: 'confetti pops',
  body: `<path class="f" style="--duo:.16" d="M4 20l4.2-11.4 7.2 7.2Z"/><g class="cf"><circle class="s c1" cx="17.6" cy="5.2" r="1"/><circle class="s c2" cx="11.6" cy="3.8" r=".9"/><circle class="s c3" cx="20.2" cy="12.8" r=".9"/><path class="c4" d="M13.6 7.6c.6-1.6 1.8-2.2 3-2"/><path class="c5" d="M16.4 10.4c1.4-.6 2.8-.3 3.4.6"/></g>`,
  base: `& .cf{transform-origin:11.8px 12.2px}`,
  mo: `@H .cf{animation:KF .6s ${EO}} @keyframes KF{0%{transform:scale(.6);opacity:.2}60%{transform:scale(1.14)}100%{transform:none}}` },

{ name: 'message', cat: 'social', label: 'Message', syn: ['texted', 'messaged', 'dm', 'whatsapp', 'imessage', 'slack', 'replied to', 'chat'], hook: 'jev:life=message · entity person', hover: 'typing dots bounce',
  body: `<path class="f" style="--duo:.1" d="M12 4.2c4.6 0 8.2 3 8.2 6.9S16.6 18 12 18c-1 0-2-.1-2.9-.4L5 19.4l.9-3.4c-1.3-1.3-2.1-3-2.1-4.9 0-3.9 3.6-6.9 8.2-6.9Z"/><circle class="s d1" cx="8.6" cy="11.1" r="1.05"/><circle class="s d2" cx="12" cy="11.1" r="1.05"/><circle class="s d3" cx="15.4" cy="11.1" r="1.05"/>`,
  base: `& .d2{--dl:.1s} & .d3{--dl:.2s}`,
  mo: `@H .d1,@H .d2,@H .d3{animation:KF .5s ${E} var(--dl) 2} @keyframes KF{40%{transform:translateY(-1.2px)}}` },

{ name: 'gift', cat: 'social', label: 'Gift', syn: ['gift', 'present', 'bought a gift', 'got a present', 'surprise', 'birthday present'], hook: 'jev:life=gift · money', hover: 'lid lifts',
  body: `<path class="f" style="--duo:.12" d="M4.8 11.4h14.4v6.8a2 2 0 0 1-2 2H6.8a2 2 0 0 1-2-2Z"/><path d="M12 11.4v8.8"/><g class="ld"><rect x="3.4" y="7.8" width="17.2" height="3.6" rx="1.4"/><path d="M12 7.8v3.6"/><path d="M12 7.8C10.8 5.2 7.4 4.2 7.4 6.4c0 1.4 2.4 1.4 4.6 1.4Zm0 0c1.2-2.6 4.6-3.6 4.6-1.4 0 1.4-2.4 1.4-4.6 1.4Z"/></g>`,
  base: `& .ld{transform-origin:12px 11.4px}`,
  mo: `@H .ld{transform:translateY(-1.4px) rotate(-5deg)}` },

/* =============================== PLACES =============================== */
{ name: 'home', cat: 'places', label: 'Home', syn: ['home', 'at home', 'got home', 'wfh', 'stayed in', 'back home', 'house'], hook: 'entity:place(home)', hover: 'the door lights up',
  body: `<path class="f" style="--duo:.06" d="M4.4 10.6 12 4.4l7.6 6.2v7.4a2.2 2.2 0 0 1-2.2 2.2H6.6a2.2 2.2 0 0 1-2.2-2.2Z"/><path class="dr f" style="--duo:0" d="M10 20.2v-4.4a2 2 0 0 1 4 0v4.4"/>`,
  mo: `@H .dr{fill-opacity:.42}` },

{ name: 'office', cat: 'places', label: 'Office', syn: ['office', 'at the office', 'in office', 'went in', 'coworking', 'hq', 'studio'], hook: 'entity:place(work)', hover: 'windows light in turn',
  body: `<rect class="f" style="--duo:.05" x="5.4" y="3.4" width="13.2" height="17" rx="2.2"/><rect class="w w1 d" style="--duo:.5" x="8.4" y="6.6" width="2.4" height="2.4" rx=".7"/><rect class="w w2 d" style="--duo:.5" x="13.2" y="6.6" width="2.4" height="2.4" rx=".7"/><rect class="w w3 d" style="--duo:.5" x="8.4" y="11" width="2.4" height="2.4" rx=".7"/><rect class="w w4 d" style="--duo:.5" x="13.2" y="11" width="2.4" height="2.4" rx=".7"/><path d="M10.6 20.4v-3.2h2.8v3.2"/>`,
  base: `& .w2{--dl:.08s} & .w3{--dl:.16s} & .w4{--dl:.24s}`,
  mo: `@H .w{animation:KF .5s ease var(--dl) both} @keyframes KF{0%{fill-opacity:.15}100%{fill-opacity:1}}` },

{ name: 'cafe', cat: 'places', label: 'Café', syn: ['café', 'cafe', 'coffee shop', 'worked from a café', 'bakery', 'brunch spot'], hook: 'entity:place(café)', hover: 'awning flutters',
  body: `<g class="aw"><path d="M3.6 8.4 5 4.4h14l1.4 4"/><path class="f" style="--duo:.14" d="M3.6 8.4a2.1 2.1 0 0 0 4.2 0 2.1 2.1 0 0 0 4.2 0 2.1 2.1 0 0 0 4.2 0 2.1 2.1 0 0 0 4.2 0Z"/></g><path d="M5 12.2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/><rect class="f" style="--duo:.2" x="7.8" y="13" width="4.4" height="3.6" rx="1.2"/><path d="M14.6 20.2v-6.6h1.8v6.6"/>`,
  base: `& .aw{transform-origin:12px 4.4px}`,
  mo: `@H .aw{animation:KF .7s ${E}} @keyframes KF{30%{transform:scaleY(1.1)}60%{transform:scaleY(.96)}}` },

{ name: 'commute', cat: 'places', label: 'Commute', syn: ['commute', 'train', 'tube', 'subway', 'bus', 'metro', 'on the train', 'drove in', 'traffic'], hook: 'jev:life=commute · duration', hover: 'train pulls in, lamps blink',
  body: `<g class="tn"><rect class="f" style="--duo:.08" x="5.4" y="3.4" width="13.2" height="13.8" rx="3.6"/><path d="M5.4 10.2h13.2"/><path d="M9.8 6.2h4.4" style="opacity:.5"/><circle class="lp s" cx="8.8" cy="13.6" r="1"/><circle class="lp s" cx="15.2" cy="13.6" r="1"/></g><path d="M8.4 17.4 6.6 20.4M15.6 17.4l1.8 3"/>`,
  base: `& .tn{transform-origin:12px 17.2px}`,
  mo: `@H .tn{transform:scale(1.05)} @H .lp{animation:KF .6s steps(1)} @keyframes KF{50%{opacity:.25}}` },

{ name: 'travel', cat: 'places', label: 'Travel', syn: ['travel', 'trip', 'packed', 'holiday', 'vacation', 'away', 'hotel', 'airbnb', 'weekend away'], hook: 'jev:life=travel · date range', hover: 'suitcase tips onto its wheels',
  body: `<g class="sc"><rect class="f" style="--duo:.1" x="4.6" y="7.4" width="14.8" height="11.6" rx="2.6"/><path d="M9.4 7.4V5.6a1.2 1.2 0 0 1 1.2-1.2h2.8a1.2 1.2 0 0 1 1.2 1.2v1.8"/><path d="M8.6 7.4v11.6M15.4 7.4v11.6" style="opacity:.55"/><circle class="s" cx="7.6" cy="20.6" r=".95"/><circle class="s" cx="16.4" cy="20.6" r=".95"/></g>`,
  base: `& .sc{transform-origin:7.6px 20.6px}`,
  mo: `@H .sc{transform:rotate(-9deg)}` },

{ name: 'flight', cat: 'places', label: 'Flight', syn: ['flight', 'flew', 'flying', 'plane', 'airport', 'layover', 'landed', 'boarding'], hook: 'jev:life=travel(flight) · time', hover: 'plane climbs',
  body: `<g transform="rotate(45 12 12)"><g class="pl"><path class="f" style="--duo:.12" d="M12 2.8c.9 0 1.6 1 1.6 2.4v4.2l6.4 3.8v1.9l-6.4-1.9v4.2l2 1.5v1.5L12 19.4l-3.6 1v-1.5l2-1.5v-4.2L4 15.1v-1.9l6.4-3.8V5.2c0-1.4.7-2.4 1.6-2.4Z"/></g></g>`,
  mo: `@H .pl{transform:translateY(-1.3px)}` },

{ name: 'outdoors', cat: 'places', label: 'Outdoors', syn: ['outdoors', 'outside', 'park', 'nature', 'woods', 'garden', 'beach', 'fresh air', 'camping'], hook: 'jev:life=outdoors', hover: 'trees sway',
  body: `<g class="t1"><path class="f" style="--duo:.14" d="M9.4 3.8 4.8 11.6h2.6l-3.2 5.6h10.4l-3.2-5.6H14Z"/><path d="M9.4 17.2v3.2"/></g><g class="t2"><circle class="f" style="--duo:.14" cx="17.4" cy="11.4" r="3"/><path d="M17.4 14.4v6"/></g>`,
  base: `& .t1{transform-origin:9.4px 20.4px} & .t2{transform-origin:17.4px 20.4px;--dl:.08s}`,
  mo: `@H .t1,@H .t2{animation:KF 1s ease-in-out var(--dl)} @keyframes KF{30%{transform:rotate(4deg)}65%{transform:rotate(-3deg)}}` },

{ name: 'errands', cat: 'places', label: 'Errands', syn: ['errands', 'post office', 'pharmacy', 'bank', 'returns', 'pick up', 'drop off', 'dry cleaning'], hook: 'jev:life=errand · kind=task', hover: 'the route runs to the pin',
  body: `<path class="rt" d="M6.4 16.4c0-2.8 2.6-3.6 5.4-3.6s5.8-.6 5.8-3" style="stroke-dasharray:.01 2.9"/><circle class="f" style="--duo:.2" cx="6.4" cy="18" r="1.8"/><g class="pn"><path class="f" style="--duo:.2" d="M17.6 10.2c-2-2.1-3.4-3.6-3.4-5.4a3.4 3.4 0 0 1 6.8 0c0 1.8-1.4 3.3-3.4 5.4Z"/><circle class="s" cx="17.6" cy="4.8" r="1"/></g>`,
  mo: `@H .rt{animation:KF .8s linear} @H .pn{animation:KF2 .6s ${E} .2s} @keyframes KF{to{stroke-dashoffset:-5.8}} @keyframes KF2{40%{transform:translateY(-1.2px)}}` },

{ name: 'groceries', cat: 'places', label: 'Groceries', syn: ['groceries', 'grocery run', 'supermarket', 'food shop', 'tesco', 'trader joe\'s', 'shopping', 'big shop'], hook: 'jev:life=groceries · money', hover: 'greens pop up',
  body: `<path class="f" style="--duo:.12" d="M5.4 9.4h13.2l-1 9.2a1.8 1.8 0 0 1-1.8 1.6H8.2a1.8 1.8 0 0 1-1.8-1.6Z"/><g class="gr"><path d="M13 9.4c0-2.4 1-4.4 3-5.4M13 9.4c-.4-1.8-1.8-3-3.6-3.2"/><path d="M8.4 9.4 7 4.2" /></g>`,
  mo: `@H .gr{transform:translateY(-1.2px)}` },

/* =============================== LEARNING =============================== */
{ name: 'reading', cat: 'learning', label: 'Reading', syn: ['read', 'reading', 'finished the book', 'chapter', 'kindle', 'novel', 'pages'], hook: 'jev:life=reading · pages/min', hover: 'a page turns',
  body: `<path class="f" style="--duo:.08" d="M12 6.8c-1.8-1.6-4.4-2.2-8.4-2v12.4c4-.2 6.6.4 8.4 2 1.8-1.6 4.4-2.2 8.4-2V4.8c-4-.2-6.6.4-8.4 2Z"/><path d="M12 6.8v12.4"/><path class="pg d" style="--duo:.22" d="M12 6.8c1.8-1.6 4.4-2.2 8.4-2v12.4c-4-.2-6.6.4-8.4 2Z"/>`,
  base: `& .pg{transform-origin:12px 12px;opacity:0}`,
  mo: `@H .pg{animation:KF .7s ${E}} @keyframes KF{0%{opacity:.9;transform:none}100%{opacity:0;transform:scaleX(-1)}}` },

{ name: 'writing', cat: 'learning', label: 'Writing', syn: ['wrote', 'writing', 'journal', 'journaled', 'drafted', 'words', 'morning pages', 'essay', 'blog post'], hook: 'jev:life=writing · words', hover: 'the nib writes',
  body: `<g class="nb"><g transform="rotate(40 12 12)"><path class="f" style="--duo:.14" d="M12 19.8 8.4 13.4l1.2-4.8h4.8l1.2 4.8Z"/><path d="M12 19.4v-4"/><path d="M9.6 8.6V5.4a1.2 1.2 0 0 1 1.2-1.2h2.4a1.2 1.2 0 0 1 1.2 1.2v3.2"/></g></g><path class="ln" pathLength="1" d="M3.2 20.4c1.2-.9 2.2-.9 3.6 0"/>`,
  base: `& .ln{stroke-dasharray:1 2;stroke-dashoffset:0}`,
  mo: `@H .nb{transform:translate(.6px,-.3px)} @H .ln{animation:KF .6s ${E}} @keyframes KF{0%{stroke-dashoffset:1}100%{stroke-dashoffset:0}}` },

{ name: 'study', cat: 'learning', label: 'Study', syn: ['study', 'studied', 'revision', 'course', 'lecture', 'homework', 'exam', 'learning', 'flashcards'], hook: 'jev:life=study · duration', hover: 'the top book slides',
  body: `<rect class="f" style="--duo:.1" x="3.8" y="15.6" width="16.4" height="4.4" rx="1.4"/><rect x="5.6" y="11" width="13.4" height="4.6" rx="1.4"/><g class="tb"><rect class="f" style="--duo:.2" x="4.8" y="6.2" width="12.4" height="4.4" rx="1.4" transform="rotate(-6 11 8.4)"/></g><path d="M7.4 15.6v4.4" style="opacity:.5"/>`,
  base: `& .tb{transform-origin:5px 10.6px}`,
  mo: `@H .tb{transform:translateX(1px) rotate(-4deg)}` },

{ name: 'practice', cat: 'learning', label: 'Practice', syn: ['practice', 'practised', 'practiced', 'rehearsed', 'drills', 'scales', 'reps', 'piano practice'], hook: 'jev:life=practice · streak', hover: 'the metronome ticks',
  body: `<path class="f" style="--duo:.08" d="M9.6 3.8h4.8a1 1 0 0 1 1 .8l3.2 14.4a1 1 0 0 1-1 1.2H6.4a1 1 0 0 1-1-1.2L8.6 4.6a1 1 0 0 1 1-.8Z"/><path d="M6.8 16.4h10.4"/><g class="pd"><path d="M12 16.4 15.6 7"/><circle class="s" cx="14.4" cy="10.2" r="1.3"/></g>`,
  base: `& .pd{transform-origin:12px 16.4px}`,
  mo: `@H .pd{animation:KF 1.2s cubic-bezier(.45,0,.55,1)} @keyframes KF{25%{transform:rotate(-42deg)}50%{transform:none}75%{transform:rotate(-42deg)}}` },

{ name: 'music', cat: 'learning', label: 'Music', syn: ['music', 'played guitar', 'piano', 'listened to', 'album', 'concert', 'playlist', 'sang'], hook: 'jev:life=music', hover: 'notes bob',
  body: `<g class="nt"><path d="M9.6 17.4V6.6l9.2-2.2v10.8"/><path d="M9.6 9.4l9.2-2.2" style="opacity:.5"/><ellipse class="s" cx="7.4" cy="17.6" rx="2.4" ry="1.9" transform="rotate(-18 7.4 17.6)"/><ellipse class="s" cx="16.6" cy="15.4" rx="2.4" ry="1.9" transform="rotate(-18 16.6 15.4)"/></g>`,
  base: `& .nt{transform-origin:12px 18px}`,
  mo: `@H .nt{animation:KF .8s ${E}} @keyframes KF{30%{transform:rotate(-6deg) translateY(-.6px)}65%{transform:rotate(3deg)}}` },

{ name: 'drawing', cat: 'learning', label: 'Drawing', syn: ['drew', 'drawing', 'sketched', 'painting', 'painted', 'illustration', 'doodle', 'figma'], hook: 'jev:life=making(art)', hover: 'paint dots swell',
  body: `<path class="f" style="--duo:.08" d="M12 3.6c-4.8 0-8.4 3.6-8.4 8.2 0 4.8 3.8 8.6 8.6 8.6 1.2 0 1.8-.8 1.8-1.6 0-1.4-1.4-1.8-1.4-3.2 0-1 .8-1.8 1.8-1.8h2.2c2.2 0 3.8-1.6 3.8-3.8 0-3.6-3.8-6.4-8.6-6.4Z"/><circle class="p p1 s" cx="7.8" cy="11" r="1.2"/><circle class="p p2 s" cx="10.6" cy="7.4" r="1.2"/><circle class="p p3 s" cx="15" cy="7.8" r="1.2"/><circle class="p p4 s" cx="8.4" cy="15.2" r="1.2"/>`,
  base: `& .p1{transform-origin:7.8px 11px} & .p2{transform-origin:10.6px 7.4px;--dl:.06s} & .p3{transform-origin:15px 7.8px;--dl:.12s} & .p4{transform-origin:8.4px 15.2px;--dl:.18s}`,
  mo: `@H .p{animation:KF .5s ${E} var(--dl)} @keyframes KF{40%{transform:scale(1.35)}}` },

{ name: 'photo', cat: 'learning', label: 'Photo', syn: ['photo', 'photos', 'shot', 'took pictures', 'film roll', 'photowalk', 'camera'], hook: 'jev:life=making(photo) · image fragment', hover: 'lens focuses, flash blinks',
  body: `<path class="f" style="--duo:.08" d="M3.4 9.4a2.2 2.2 0 0 1 2.2-2.2h2.2l1.4-2.2h5.6l1.4 2.2h2.2a2.2 2.2 0 0 1 2.2 2.2v8.4a2.2 2.2 0 0 1-2.2 2.2H5.6a2.2 2.2 0 0 1-2.2-2.2Z"/><circle class="ln" cx="12" cy="13.2" r="3.6"/><circle class="fl s" cx="17.4" cy="10" r=".85"/>`,
  base: `& .ln{transform-origin:12px 13.2px}`,
  mo: `@H .ln{animation:KF .5s ${E}} @H .fl{animation:KF2 .4s steps(1)} @keyframes KF{40%{transform:scale(.82)}} @keyframes KF2{50%{opacity:.2}}` },

{ name: 'podcast', cat: 'learning', label: 'Podcast', syn: ['podcast', 'listened to', 'episode', 'audiobook', 'recorded', 'radio'], hook: 'jev:life=listening', hover: 'sound rings out',
  body: `<rect class="f" style="--duo:.14" x="9" y="3.4" width="6" height="10.4" rx="3"/><path d="M6.4 11a5.6 5.6 0 0 0 11.2 0M12 16.6v3.8M8.8 20.4h6.4"/><path class="sw" d="M3.6 7.6a7 7 0 0 0 0 5.6M20.4 7.6a7 7 0 0 1 0 5.6" style="opacity:0"/>`,
  mo: `@H .sw{animation:KF .9s ${E}} @keyframes KF{30%{opacity:.8}100%{opacity:0;transform:scale(1.04)}}` },

/* =============================== MONEY =============================== */
{ name: 'spent', cat: 'money', label: 'Spent', syn: ['spent', 'bought', 'paid', 'purchase', '$', '£', '€', '₹', 'cost me', 'splurged'], hook: 'rule:amount + /spent|paid|bought/ → metric spend', hover: 'card taps',
  body: `<g class="cd"><rect class="f" style="--duo:.08" x="3" y="5.8" width="18" height="12.4" rx="2.6"/><path d="M3 9.8h18"/><path d="M6.6 14.6h3.2"/></g>`,
  base: `& .cd{transform-origin:12px 12px}`,
  mo: `@H .cd{animation:KF .5s ${E}} @keyframes KF{40%{transform:translate(.6px,-.9px) rotate(-5deg)}}` },

{ name: 'received', cat: 'money', label: 'Received', syn: ['got paid', 'payday', 'salary', 'invoice paid', 'refund', 'earned', 'received', 'paid me'], hook: 'rule:amount + /got paid|received|refund/', hover: 'money drops into the wallet',
  body: `<path class="f" style="--duo:.1" d="M20.4 12.2V11a2.6 2.6 0 0 0-2.6-2.6H6A2.6 2.6 0 0 0 3.4 11v6.4A2.6 2.6 0 0 0 6 20h11.8a2.6 2.6 0 0 0 2.6-2.6v-1.2"/><path d="M15.2 12.2h5.4v4h-5.4a2 2 0 0 1 0-4Z"/><g class="ar"><path d="M9.6 2.8v3.4M7.6 4.6l2 2 2-2"/></g>`,
  mo: `@H .ar{animation:KF .6s ${E}} @keyframes KF{45%{transform:translateY(2.4px);opacity:0}46%{transform:translateY(-1.6px);opacity:0}100%{transform:none;opacity:1}}` },

{ name: 'bill', cat: 'money', label: 'Bill', syn: ['bill', 'rent', 'paid rent', 'electricity', 'invoice', 'utilities', 'council tax', 'phone bill'], hook: 'rule:amount + /bill|rent|invoice/ · recurring', hover: 'the receipt prints its lines',
  body: `<path class="f" style="--duo:.06" d="M6 3.6h12v16.8l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4-2 1.4Z"/><path class="l l1" pathLength="1" d="M9 8h6"/><path class="l l2" pathLength="1" d="M9 11.2h6"/><path class="l l3" pathLength="1" d="M9 14.4h3.4"/>`,
  base: `& .l{stroke-dasharray:1 2} & .l2{--dl:.08s} & .l3{--dl:.16s}`,
  mo: `@H .l{animation:KF .4s ${E} var(--dl) both} @keyframes KF{0%{stroke-dashoffset:1}100%{stroke-dashoffset:0}}` },

{ name: 'subscription', cat: 'money', label: 'Subscription', syn: ['subscription', 'renewed', 'monthly', 'annual plan', 'netflix', 'spotify', 'membership', 'auto-renew'], hook: 'rule:amount + /monthly|renew|sub/ · recurring', hover: 'the cycle turns',
  body: `<g class="cy"><path d="M19.2 9.4a7.6 7.6 0 0 0-13.4-2.2M5.4 3.6v3.8h3.8"/><path d="M4.8 14.6a7.6 7.6 0 0 0 13.4 2.2M18.6 20.4v-3.8h-3.8"/></g><circle class="f" style="--duo:.22" cx="12" cy="12" r="2.6"/>`,
  base: `& .cy{transform-origin:12px 12px}`,
  mo: `@H .cy{transform:rotate(180deg);transition-duration:.8s}` },

{ name: 'save', cat: 'money', label: 'Save', syn: ['saved', 'savings', 'put aside', 'emergency fund', 'isa', 'invested', 'no-spend day'], hook: 'rule:amount + /saved|put aside/', hover: 'the jar fills',
  defs: `<clipPath id="&-j"><path d="M7 7.4h10v1.2c1.4.8 2.2 2.2 2.2 3.8v5.4a2.4 2.4 0 0 1-2.4 2.4H7.2a2.4 2.4 0 0 1-2.4-2.4v-5.4c0-1.6.8-3 2.2-3.8Z"/></clipPath>`,
  body: `<g clip-path="url(#&-j)"><path class="lv d" style="--duo:.26" d="M3 15.4h18V22H3Z"/></g><path d="M7 7.4h10v1.2c1.4.8 2.2 2.2 2.2 3.8v5.4a2.4 2.4 0 0 1-2.4 2.4H7.2a2.4 2.4 0 0 1-2.4-2.4v-5.4c0-1.6.8-3 2.2-3.8Z"/><rect x="6.6" y="3.8" width="10.8" height="3.6" rx="1.4"/>`,
  mo: `@H .lv{transform:translateY(-2.2px)}` },

/* =============================== HOME =============================== */
{ name: 'laundry', cat: 'home', label: 'Laundry', syn: ['laundry', 'washing', 'did a wash', 'folded clothes', 'ironing', 'hung the washing'], hook: 'jev:life=chore(laundry) · kind=task', hover: 'the drum spins',
  defs: `<clipPath id="&-d"><circle cx="12" cy="14" r="4.2"/></clipPath>`,
  body: `<rect class="f" style="--duo:.06" x="4.2" y="3.4" width="15.6" height="17.2" rx="3"/><path d="M4.2 7.6h15.6"/><circle class="s" cx="7.4" cy="5.5" r=".8"/><circle class="s" cx="9.8" cy="5.5" r=".8"/><circle cx="12" cy="14" r="4.4"/><g clip-path="url(#&-d)"><g class="dm"><path class="d" style="--duo:.22" d="M6.8 14.4c1.7-1 3.5 1 5.2 0s3.5-1 5.2 0V20H6.8Z"/></g></g>`,
  base: `& .dm{transform-origin:12px 14px}`,
  mo: `@H .dm{animation:KF 1s cubic-bezier(.45,0,.35,1)} @keyframes KF{to{transform:rotate(360deg)}}` },

{ name: 'cleaning', cat: 'home', label: 'Cleaning', syn: ['cleaned', 'cleaning', 'tidied', 'hoovered', 'vacuumed', 'mopped', 'scrubbed', 'decluttered'], hook: 'jev:life=chore(clean) · kind=task', hover: 'a puff of mist',
  body: `<path class="f" style="--duo:.12" d="M8.2 10.2h5.4l1.2 2.4v6a1.8 1.8 0 0 1-1.8 1.8H8.8a1.8 1.8 0 0 1-1.8-1.8v-6Z"/><path d="M9.2 10.2V7.6h3.4v2.6"/><path d="M8.2 7.6V5a1.2 1.2 0 0 1 1.2-1.2h4.4l1.6 1.8h-1.8v2"/><g class="ms"><circle class="s m1" cx="18.2" cy="3.8" r=".75"/><circle class="s m2" cx="19.4" cy="6" r=".75"/><circle class="s m3" cx="18.2" cy="8.2" r=".75"/></g>`,
  base: `& .ms{transform-origin:15.6px 6px}`,
  mo: `@H .ms{animation:KF .6s ${EO}} @keyframes KF{0%{transform:scale(.5);opacity:0}50%{opacity:1}100%{transform:none}}` },

{ name: 'dishes', cat: 'home', label: 'Dishes', syn: ['dishes', 'washing up', 'did the dishes', 'dishwasher', 'unloaded the dishwasher'], hook: 'jev:life=chore(dishes)', hover: 'bubbles float up',
  body: `<circle class="f" style="--duo:.06" cx="10.4" cy="13" r="7"/><circle cx="10.4" cy="13" r="3.8" style="opacity:.5"/><circle class="b1" cx="18.4" cy="5.8" r="2"/><circle class="b2" cx="20.1" cy="10" r="1.05"/>`,
  base: `& .b2{--dl:.1s}`,
  mo: `@H .b1,@H .b2{animation:KF .9s ${E} var(--dl)} @keyframes KF{50%{transform:translateY(-1.4px);opacity:.4}}` },

{ name: 'plants', cat: 'home', label: 'Plants', syn: ['watered the plants', 'plants', 'gardening', 'repotted', 'garden', 'weeding', 'planted'], hook: 'jev:life=chore(plants) · recurring', hover: 'leaves sway',
  body: `<path class="f" style="--duo:.12" d="M7.4 13.6h9.2l-1 5.6a1.4 1.4 0 0 1-1.4 1.2H9.8a1.4 1.4 0 0 1-1.4-1.2Z"/><path d="M6.4 13.6h11.2"/><path d="M12 13.6V8.8"/><path class="lL f" style="--duo:.22" d="M12 10.6c-.4-2.8-2.6-4.4-5.4-4.2.2 2.8 2.4 4.4 5.4 4.2Z"/><path class="lR f" style="--duo:.22" d="M12 8.8c.2-2.8 2.2-4.8 5.2-4.8 0 3-2.2 4.8-5.2 4.8Z"/>`,
  base: `& .lL{transform-origin:12px 10.6px} & .lR{transform-origin:12px 8.8px;--dl:.06s}`,
  mo: `@H .lL{animation:KF 1s ease-in-out} @H .lR{animation:KF2 1s ease-in-out .06s} @keyframes KF{35%{transform:rotate(-9deg)}70%{transform:rotate(4deg)}} @keyframes KF2{35%{transform:rotate(9deg)}70%{transform:rotate(-4deg)}}` },

{ name: 'pet', cat: 'home', label: 'Pet', syn: ['dog', 'cat', 'fed the cat', 'walked the dog', 'vet', 'pet', 'puppy', 'litter'], hook: 'entity:pet · jev:life=pet', hover: 'the paw presses',
  body: `<g class="pw"><path class="f" style="--duo:.2" d="M12 12c2.6 0 4.8 2.4 4.8 4.6 0 1.6-1.2 2.6-2.6 2.6-.9 0-1.4-.4-2.2-.4s-1.3.4-2.2.4c-1.4 0-2.6-1-2.6-2.6 0-2.2 2.2-4.6 4.8-4.6Z"/><ellipse class="s" cx="6.4" cy="10.2" rx="1.5" ry="1.9" transform="rotate(-24 6.4 10.2)"/><ellipse class="s" cx="9.6" cy="6.6" rx="1.6" ry="2.1" transform="rotate(-8 9.6 6.6)"/><ellipse class="s" cx="14.4" cy="6.6" rx="1.6" ry="2.1" transform="rotate(8 14.4 6.6)"/><ellipse class="s" cx="17.6" cy="10.2" rx="1.5" ry="1.9" transform="rotate(24 17.6 10.2)"/></g>`,
  base: `& .pw{transform-origin:12px 19px}`,
  mo: `@H .pw{animation:KF .45s ${E}} @keyframes KF{40%{transform:scale(.9)}}` },

/* =============================== TIME =============================== */
{ name: 'morning', cat: 'time', label: 'Morning', syn: ['morning', 'this morning', 'am', 'first thing', 'early', 'before work'], hook: 'rule:time <12:00 · context of writing', hover: 'the sun climbs its arc', ...MORNING },
{ name: 'afternoon', cat: 'time', label: 'Afternoon', syn: ['afternoon', 'this afternoon', 'after lunch', 'pm', 'midday'], hook: 'rule:time 12:00–17:00', hover: 'the sun moves on', ...AFTERNOON },
{ name: 'evening', cat: 'time', label: 'Evening', syn: ['evening', 'tonight', 'after work', 'sunset', 'dusk'], hook: 'rule:time 17:00–22:00', hover: 'the sun settles to the line', ...EVENING },

{ name: 'late-night', cat: 'time', label: 'Late night', syn: ['late night', 'midnight', 'up late', 'couldn\'t stop', '2am', 'night owl', 'past midnight'], hook: 'rule:time 22:00–04:00', hover: 'the moon tilts, a star glints',
  body: `<path class="mn f" style="--duo:.14" d="${MOON_NIGHT}"/><path class="st s" d="${sparkle(17.2, 6, 2.2)}"/><circle class="s" cx="20" cy="11.4" r=".8"/>`,
  base: `& .mn{transform-origin:11.2px 12.6px} & .st{transform-origin:17.2px 6px}`,
  mo: `@H .mn{transform:rotate(-12deg)} @H .st{animation:KF .6s ${E} .1s} @keyframes KF{40%{transform:scale(1.35) rotate(20deg)}}` },

{ name: 'weekend', cat: 'time', label: 'Weekend', syn: ['weekend', 'saturday', 'sunday', 'sat', 'sun', 'day off', 'long weekend'], hook: 'rule:date → weekday in {sat,sun}', hover: 'the weekend lights up',
  body: `<rect class="f" style="--duo:.05" x="3.6" y="5" width="16.8" height="15" rx="3"/><path d="M8.4 3.4v3.2M15.6 3.4v3.2M3.6 9.6h16.8"/><circle class="s" cx="7.2" cy="14.2" r=".9" style="opacity:.55"/><circle class="s" cx="10.2" cy="14.2" r=".9" style="opacity:.55"/><rect class="we f" style="--duo:.28" x="12.6" y="12.6" width="5.4" height="3.2" rx="1.6"/>`,
  base: `& .we{transform-origin:12.6px 14.2px}`,
  mo: `@H .we{fill-opacity:.6;animation:KF .5s ${EO}} @keyframes KF{0%{transform:scaleX(.3)}100%{transform:none}}` },

/* =============================== WEATHER =============================== */
{ name: 'sunny', cat: 'weather', label: 'Sunny', syn: ['sunny', 'sun', 'beautiful day', 'clear skies', 'bright'], hook: 'jev:life=weather(sun)', hover: 'rays turn, core breathes',
  body: `<circle class="cr f" style="--duo:.24" cx="12" cy="12" r="3.9"/><g class="ry"><path d="${rays(12, 12, 6.4, 8.4, 8, 90)}"/></g>`,
  base: `& .ry,& .cr{transform-origin:12px 12px}`,
  mo: `@H .ry{transform:rotate(45deg)} @H .cr{transform:scale(1.08)}` },

{ name: 'rain', cat: 'weather', label: 'Rain', syn: ['rain', 'rainy', 'raining', 'pouring', 'drizzle', 'got soaked', 'storm'], hook: 'jev:life=weather(rain)', hover: 'drops fall',
  body: `<path class="f" style="--duo:.12" d="M7.2 14.2h10a3.6 3.6 0 0 0 .5-7.2 5.4 5.4 0 0 0-10.4-.9A4.05 4.05 0 0 0 7.2 14.2Z"/><path class="dp d1" d="M8.4 17.2l-.8 1.8"/><path class="dp d2" d="M12.2 17.2l-.8 1.8"/><path class="dp d3" d="M16 17.2l-.8 1.8"/>`,
  base: `& .d2{--dl:.12s} & .d3{--dl:.06s}`,
  mo: `@H .dp{animation:KF .6s cubic-bezier(.5,0,.8,.6) var(--dl) 2} @keyframes KF{0%{transform:none;opacity:1}70%{transform:translate(-.6px,1.6px);opacity:0}71%{transform:translate(.4px,-1px);opacity:0}100%{transform:none;opacity:1}}` },

{ name: 'cold', cat: 'weather', label: 'Cold', syn: ['cold', 'freezing', 'snow', 'frost', 'icy', 'chilly', 'bitter'], hook: 'jev:life=weather(cold)', hover: 'the flake turns',
  body: `<g class="sf"><path d="${snowflake(12, 12, 8.4, 5.9, 1.8)}"/></g>`,
  base: `& .sf{transform-origin:12px 12px}`,
  mo: `@H .sf{transform:rotate(60deg)}` },

{ name: 'hot', cat: 'weather', label: 'Hot', syn: ['hot', 'heatwave', 'boiling', 'sweltering', 'humid', 'scorching', 'sweaty'], hook: 'jev:life=weather(hot)', hover: 'heat shimmers',
  body: `<circle class="f" style="--duo:.28" cx="7.6" cy="7.6" r="3.1"/><path d="${rays(7.6, 7.6, 5, 6.4, 8, 90).split('M').filter(Boolean).filter((_, i) => i !== 5).map((x) => 'M' + x).join('')}"/><path class="h h1" d="M12.4 11c-1 1.3 1 2.6 0 3.9s1 2.6 0 3.9"/><path class="h h2" d="M16 11c-1 1.3 1 2.6 0 3.9s1 2.6 0 3.9"/><path class="h h3" d="M19.6 11c-1 1.3 1 2.6 0 3.9s1 2.6 0 3.9"/>`,
  base: `& .h2{--dl:.1s} & .h3{--dl:.2s}`,
  mo: `@H .h{animation:KF .8s ease-in-out var(--dl) 2} @keyframes KF{50%{transform:translateY(-.9px);opacity:.55}}` },
];
