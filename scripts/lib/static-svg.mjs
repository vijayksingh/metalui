// The static bake (identical to the Kamui builder): the icon at rest, with transient parts
// dropped and rest-pose transforms baked in. Shared by the SVG export and the morph geometry.
export const SW = 1.7;

const DROP = { select: ['rip'], text: ['car'], draw: ['ln'], search: ['gl'] };
const BAKE = {
  tidy: { t1: 'transform="translate(1.6 0) rotate(-5 7.2 6.4)"', t2: 'transform="translate(2.8 0) rotate(5 7.2 12)"', t3: 'transform="translate(.9 0) rotate(-3 7.2 17.6)"' },
  group: { c1: 'transform="rotate(-8 9.7 16.4)"', c2: 'transform="rotate(5 14.3 17.4)"' },
  ungroup: { u1: 'transform="rotate(-6 7.2 12.8)"', u2: 'transform="rotate(6 16.8 12.8)"' },
  synced: { ring: 'stroke-dasharray="85 15"' },
  'sync-error': { ring: 'stroke-dasharray="85 15"' },
  offline: { ring: 'stroke-dasharray="76 24"' },
  pin: { sh: 'opacity=".35"' },
};
export function staticSvg(ic, sw = SW, body = ic.body) {
  const drop = DROP[ic.name] || [], bake = BAKE[ic.name] || {};
  const id = `mu-${ic.name}`;
  let s = (ic.defs && !body.includes('<defs>') ? `<defs>${ic.defs}</defs>` : '') + body;
  s = s.replace(/&-/g, id + '-');
  s = s.replace(/<(\w+)([^>]*?)(\/?)>/g, (m, tag, attrs, sc) => {
    const cm = attrs.match(/\sclass="([^"]*)"/);
    const classes = cm ? cm[1].split(/\s+/) : [];
    if (classes.some((c) => drop.includes(c))) return sc ? '' : m;
    let a = attrs.replace(/\sclass="[^"]*"/, '');
    const st = a.match(/\sstyle="([^"]*)"/);
    let duo = 0.14, swMul = null;
    if (st) {
      const dm = st[1].match(/--duo:([\d.]+)/); if (dm) duo = +dm[1];
      const sm = st[1].match(/calc\(var\(--sw\) \* ([\d.]+)\)/); if (sm) swMul = +sm[1];
      const rest = st[1].replace(/--duo:[\d.]+;?/, '').replace(/stroke-width:calc\([^)]*\)\)?;?/, '').replace(/opacity:[\d.]+;?/, (o) => { a += ` opacity="${o.split(':')[1].replace(';', '')}"`; return ''; }).trim();
      a = a.replace(/\sstyle="[^"]*"/, rest ? ` style="${rest}"` : '');
    }
    if (swMul) a += ` stroke-width="${+(sw * swMul).toFixed(2)}"`;
    if (classes.includes('f')) a += ` fill="currentColor" fill-opacity="${duo}"`;
    if (classes.includes('s')) a += ` fill="currentColor" stroke="none"`;
    if (classes.includes('d')) a += ` fill="currentColor" fill-opacity="${duo}" stroke="none"`;
    for (const c of classes) if (bake[c]) a += ' ' + bake[c];
    return `<${tag}${a}${sc}>`;
  });
  s = s.replace(/\spathLength="1"/g, '');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${s}</svg>\n`;
}
