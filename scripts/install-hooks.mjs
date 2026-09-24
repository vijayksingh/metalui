#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
execFileSync('git', ['config', '--local', 'core.hooksPath', resolve(root, '.githooks')], { cwd: root });
console.log('MetalUI pre-commit hook installed.');
