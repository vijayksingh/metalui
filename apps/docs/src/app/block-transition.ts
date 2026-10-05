const BLOCK_NAMES = new Set(['ai-composer', 'share-panel', 'availability-picker', 'task-inbox', 'settings', 'studio-week']);

export function blockSourceTarget(path: string) {
  if (!path.startsWith('/blocks/')) return undefined;
  const name = path.split('/').at(-1)!;
  return BLOCK_NAMES.has(name) ? `.block-${name}` : undefined;
}

export function blockDetailTarget(path: string) {
  const target = blockSourceTarget(path);
  return target ? `.stage ${target}` : undefined;
}
