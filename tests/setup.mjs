// Lets node:test import components that import their own CSS (the bundler's job in apps).
import { register } from 'node:module';
register('data:text/javascript,' + encodeURIComponent(`
export async function load(url, context, next) {
  if (url.endsWith('.css')) return { format: 'module', source: 'export default {}', shortCircuit: true };
  return next(url, context);
}`));
