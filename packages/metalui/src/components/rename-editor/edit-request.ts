'use client';
import * as React from 'react';
import type { ButtonState } from '../button/button';

/** Internal request lifecycle shared by small edit recipes; not a public form framework. */
export function useEditRequest(options: {
  onCommit: (value: string) => void | Promise<void>;
  onCommitted?: (value: string, original: string) => void;
  onPendingChange?: (pending: boolean) => void;
}) {
  const [state, setState] = React.useState<ButtonState>('idle');
  const [failure, setFailure] = React.useState<string | null>(null);
  const running = React.useRef(false);
  const generation = React.useRef(0);
  const callbacks = React.useRef(options); callbacks.current = options;
  React.useEffect(() => () => { generation.current++; callbacks.current.onPendingChange?.(false); }, []);
  const commit = async (value: string, original: string) => {
    if (running.current) return;
    running.current = true; const request = ++generation.current;
    callbacks.current.onPendingChange?.(true); setFailure(null); setState('waiting');
    try {
      await callbacks.current.onCommit(value);
      if (generation.current !== request) return;
      setState('done'); callbacks.current.onCommitted?.(value, original);
    } catch (error) {
      if (generation.current !== request) return;
      setFailure(error instanceof Error ? error.message : 'Could not save. Try again.');
      setState('error'); callbacks.current.onPendingChange?.(false); running.current = false;
    }
  };
  const reset = () => { if (!running.current) { setFailure(null); setState('idle'); } };
  const finish = () => { callbacks.current.onPendingChange?.(false); running.current = false; };
  return { state, failure, commit, reset, finish };
}
