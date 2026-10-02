import { expect, test } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { createRequire } from 'node:module';

// Installing the shared morph item must give a real consumer every file it needs.
test('a copied registry morph installs and compiles the Copy-to-Copied pattern', async ({ request }) => {
  const consumer = mkdtempSync(join(tmpdir(), 'metalui-morph-consumer-'));
  const installed = new Set<string>();
  async function install(name: string) {
    if (installed.has(name)) return;
    installed.add(name);
    const response = await request.get(`/r/${name}.json`);
    expect(response.ok()).toBeTruthy();
    const item = await response.json();
    for (const dependency of item.registryDependencies ?? []) {
      await install(new URL(dependency).pathname.split('/').at(-1)!.replace('.json', ''));
    }
    for (const file of item.files) {
      const target = join(consumer, file.target);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, file.content);
    }
  }
  try {
    await install('morph-icons');
    symlinkSync(resolve('node_modules'), join(consumer, 'node_modules'), 'dir');
    writeFileSync(join(consumer, 'index.tsx'), `import { MorphIcon } from './components/metalui/icons/MorphIcon';
export function CopyResult({ copied }: { copied: boolean }) {
  return <MorphIcon name={copied ? 'check' : 'copy'} title={copied ? 'Copied' : 'Copy'} />;
}
`);
    const require = createRequire(import.meta.url);
    execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'), '--noEmit', '--strict', '--skipLibCheck',
      '--jsx', 'react-jsx', '--module', 'ESNext', '--moduleResolution', 'Bundler', '--target', 'ES2022', join(consumer, 'index.tsx')],
    { cwd: consumer, stdio: 'pipe' });
  } finally {
    rmSync(consumer, { recursive: true, force: true });
  }
});
