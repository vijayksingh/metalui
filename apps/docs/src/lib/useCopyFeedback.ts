import * as React from 'react';

/** A clipboard result belongs to the content that was copied; repeated success renews its pause. */
export function useCopyFeedback(context: string, pause = 1600) {
  const [state, setState] = React.useState<'idle' | 'copied' | 'failed'>('idle');
  const request = React.useRef(0);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => {
    setState('idle');
    return () => {
      request.current += 1;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [context]);
  const copy = async (write: () => Promise<void>) => {
    const current = ++request.current;
    if (timer.current) clearTimeout(timer.current);
    try {
      await write();
      if (request.current !== current) return;
      setState('copied');
      timer.current = setTimeout(() => { if (request.current === current) setState('idle'); }, pause);
    } catch {
      if (request.current === current) setState('failed');
    }
  };
  return { state, copy };
}
