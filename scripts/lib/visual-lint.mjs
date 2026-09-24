import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { relative, resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';

export function walk(dir, extensions) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === 'node_modules' || entry.name === '.build') return [];
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path, extensions) : extensions.some((ext) => path.endsWith(ext)) ? [path] : [];
  });
}

export function staged(root) {
  return new Set(execFileSync('git', ['diff', '--cached', '--name-only', '-z', '--diff-filter=ACM'], { cwd: root })
    .toString().split('\0').filter(Boolean));
}

const numeric = String.raw`-?(?:\d*\.\d+|\d+(?:\.\d+)?)`;
const dimensions = new RegExp(String.raw`\b(?:${numeric})(?:px|pt|rem|em)\b`, 'i');
const color = /#[\da-f]{3,8}\b|\b(?:rgba?|hsla?)\s*\(/i;
const time = new RegExp(String.raw`\b${numeric}(?:ms|s)\b`, 'i');
const rules = [
  ['color', color],
  ['color', /\bColor\s*\(\s*(?:red|white)\s*:/],
  ['opacity', new RegExp(String.raw`\.opacity\s*\(\s*${numeric}\s*\)`)],
  ['shadow', /\b(?:box-shadow|boxShadow)\s*:\s*[^;]*\d|\.shadow\s*\([^)]*\d/i],
  ['radius', /\b(?:border-radius|borderRadius|cornerRadius)\s*[:(]\s*[^;)]*\d/i],
  ['font', /\b(?:font-size|fontSize|font-weight|fontWeight|font)\s*:\s*[^;]*\d|\.font\s*\(\s*\.system\s*\([^)]*\d|\.fontWeight\s*\([^)]*\d/i],
  ['duration', /\b(?:transition|animation)(?:-[\w-]+)?\s*:[^;]*(?:\d+(?:\.\d+)?m?s|cubic-bezier\s*\(|steps\s*\(|\bease(?:-in|-out|-in-out)?\b)|\b(?:duration|delay|easing)\s*:\s*(?:\d|cubic-bezier|ease-)|\.(?:easeIn|easeOut|easeInOut|linear|spring|timingCurve)\s*\([^)]*\d/i],
  ['spacing', /\b(?:padding|margin|gap)(?:-[\w-]+)?\s*:\s*[^;]*\d|\.(?:padding|frame)\s*\([^)]*\d/i],
];

function stripComments(line, extension) {
  if (extension === '.css') return line.replace(/\/\*.*?\*\//g, '');
  return line.replace(/\/\/.*$/, '');
}

export function lintFile(path, display, sourceOverride) {
  if (/\.generated\./.test(path) || /\/components\/(?:tokens|theme)\.css$/.test(path)) return [];
  const source = sourceOverride ?? readFileSync(path, 'utf8');
  const extension = path.endsWith('.css') ? '.css' : '.code';
  const findings = [];
  source.split('\n').forEach((raw, i) => {
    const line = stripComments(raw, extension).replace(/var\(\s*--mu-[\w-]+\s*\)/g, 'TOKEN');
    if (!line.trim()) return;
    for (const [rule, regex] of rules) {
      if (regex.test(line)) findings.push({ file: display, line: i + 1, rule, text: line.trim().slice(0, 180) });
    }
    if (extension === '.css') {
      if (dimensions.test(line) && /\b(?:padding|margin|gap|font-size|border-radius|box-shadow)\b/.test(line) && !findings.some((f) => f.file === display && f.line === i + 1 && ['spacing', 'font', 'radius', 'shadow'].includes(f.rule)))
        findings.push({ file: display, line: i + 1, rule: 'dimension', text: line.trim().slice(0, 180) });
      if (time.test(line) && /\b(?:transition|animation|duration|delay)\b/.test(line) && !findings.some((f) => f.file === display && f.line === i + 1 && f.rule === 'duration'))
        findings.push({ file: display, line: i + 1, rule: 'duration', text: line.trim().slice(0, 180) });
    }
  });
  return findings;
}

function globRegex(glob) {
  return new RegExp('^' + glob.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, '\u0000').replace(/\*/g, '[^/]*').replace(/\u0000/g, '.*') + '$');
}

export function applyAllowlist(findings, path) {
  const entries = JSON.parse(readFileSync(path, 'utf8'));
  if (!Array.isArray(entries)) throw new Error(`${path}: allowlist must be an array`);
  for (const [i, e] of entries.entries()) {
    if (!e.file || !e.pattern || typeof e.reason !== 'string' || !e.reason.trim()) throw new Error(`${path}: entry ${i + 1} needs file, pattern, and reason`);
    globRegex(e.file);
    new RegExp(e.pattern);
  }
  return findings.filter((f) => !entries.some((e) => globRegex(e.file).test(f.file) && new RegExp(e.pattern).test(`${f.rule}: ${f.text}`)));
}

export function report(findings) {
  const counts = {};
  for (const f of findings) {
    counts[f.rule] = (counts[f.rule] ?? 0) + 1;
    console.log(`${f.file}:${f.line}: ${f.rule}: ${f.text}`);
  }
  console.log(`Visual lint: ${findings.length} finding(s) ${JSON.stringify(counts)}`);
  return findings.length ? 1 : 0;
}
