import { Icon, MorphIcon } from '@unlocalhosted/metalui/icons';
import type { ButtonState } from '@unlocalhosted/metalui';

/** The authored Save act at rest, with one persistent glyph becoming the committed result. */
export function SaveGlyph({ state }: { state: ButtonState }) {
  return <span className="relative inline-flex">
    <MorphIcon name={state === 'done' ? 'check' : state === 'error' ? 'sync-error' : 'save'} className={state === 'idle' ? 'invisible' : undefined} />
    <Icon name="save" className={state === 'idle' ? 'absolute inset-0' : 'hidden'} />
  </span>;
}
