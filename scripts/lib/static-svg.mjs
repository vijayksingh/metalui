// The static bake: the icon at rest, accents dropped. Shared by the SVG export and the morph geometry.
export const SW = 1.7;

// Hidden-at-rest parts are accents (class "ac"); rest poses are attributes in each act's body.

// live: the same bake for an icon's act (the SwiftUI player): accents, data-part and pathLength stay.
export function staticSvg(ic, sw = SW, body = ic.body, { live = false } = {}) {
  const id = `mu-${ic.name}`;
  let s = (ic.defs && !body.includes('<defs>') ? `<defs>${ic.defs}</defs>` : '') + body;
  s = s.replace(/&-/g, id + '-');
  s = s.replace(/<(\w+)([^>]*?)(\/?)>/g, (m, tag, attrs, sc) => {
    const cm = attrs.match(/\sclass="([^"]*)"/);
    const classes = cm ? cm[1].split(/\s+/) : [];
    // Accents (class "ac") are hidden at rest and only exist during an act.
    if (!live && classes.includes('ac')) return sc ? '' : m;
    let a = attrs.replace(/\sclass="[^"]*"/, '');
    if (!live) a = a.replace(/\sdata-part="[^"]*"/, '');
    const st = a.match(/\sstyle="([^"]*)"/);
    let duo = 0.14, swMul = null;
    if (st) {
      const dm = st[1].match(/--duo:([\d.]+)/); if (dm) duo = +dm[1];
      const sm = st[1].match(/calc\(var\(--sw\) \* ([\d.]+)\)/); if (sm) swMul = +sm[1];
      const rest = st[1].replace(/--duo:[\d.]+;?/, '').replace(/stroke-width:calc\(var\(--sw\) \* [\d.]+\);?/, '').replace(/opacity:[\d.]+;?/, (o) => { a += ` opacity="${o.split(':')[1].replace(';', '')}"`; return ''; }).trim();
      a = a.replace(/\sstyle="[^"]*"/, rest ? ` style="${rest}"` : '');
    }
    if (swMul) a += ` stroke-width="${+(sw * swMul).toFixed(2)}"`;
    if (classes.includes('f')) a += ` fill="currentColor" fill-opacity="${duo}"`;
    if (classes.includes('s')) a += ` fill="currentColor" stroke="none"`;
    if (classes.includes('d')) a += ` fill="currentColor" fill-opacity="${duo}" stroke="none"`;
    return `<${tag}${a}${sc}>`;
  });
  if (!live) s = s.replace(/\spathLength="1"/g, '');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${s}</svg>\n`;
}
