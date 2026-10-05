'use client';

import * as React from 'react';
import { motionReduced as reduced, useReducedMotion } from '@unlocalhosted/metalui';
import { Attachment, Button, IconButton, Led, ScrollArea, Select, Skeleton, SwapText, Textarea, Tooltip, type LedKind } from '@unlocalhosted/metalui';
import { MorphIcon, PlusIcon, RedoIcon } from '@unlocalhosted/metalui/icons';

/* ─────────────────────────────────────────────────────────
 * AI COMPOSER · a chat thread with a composer at its foot
 *
 *   rest      a raised slab: the thread (a log that scrolls) over the composer, a raised plate
 *             holding the attached files, the text well, and a strip of keys: attach, the model,
 *             and Send (dark cap, disabled while there is nothing to send)
 *   write     the well grows a line at a time on the settle spring (the Textarea's own), up to
 *             six lines, then scrolls; ↩ sends, ⇧↩ is a new line
 *   attach    the attach key opens the file picker; each file lands above the text as an
 *             Attachment (object spring, from one nest above); its × lets it leave (release)
 *
 *   send
 *      0 ms   the message lands at the foot of the thread: from one nest below, on the object
 *             spring with its small overshoot; the well empties and shrinks; the files go with it
 *      0 ms   the send key's glyph morphs arrow → square and its label turns Send → Stop on the drum
 *      0 ms   the reply's header appears: its lamp breathes (waiting) and "Thinking" beside the
 *             model's name; one sunk skeleton line waits where the first words will stand
 *      think  (Fast 700 ms · Thorough 1200 ms) the skeleton gives way to words: they arrive at
 *             the model's pace (Fast 26, Thorough 16 words a second) with a green caret at the end;
 *             the lamp is lit steady and the header says "Writing"
 *      done   the caret goes, the lamp goes off; Copy and Retry fade in under the reply (settle);
 *             the key morphs back to Send
 *   stop      Stop (or ⎋ in the well) ends the reply where it is; the header says "Stopped"
 *   follow    while you are at the foot, the thread follows the words; scroll up and it stays put,
 *             and a "Jump to latest" key rises at its right edge from one nest below (settle), clear
 *             of the reply's own keys on the left; pressing it glides down and follows again
 *   copy      Copy writes the reply to the clipboard: paste → check morph, "Copied" on the drum;
 *             after 1.6 s both turn back
 *   retry     the last reply is written again, as a new take
 *
 * Reduce Motion: nothing slides or lands; the reply arrives a phrase at a time, without a caret;
 * the glyphs and labels change in place; Jump to latest jumps.
 * Layout follows the block's own width (a container): under 28rem the thread's gutters narrow and
 * a message may take the full width.
 * ───────────────────────────────────────────────────────── */

const TIMING = {
  copied:     1600, // ms the Copy key says "Copied"
  chunkEvery: 450,  // ms between phrases under Reduce Motion
};

const MODELS = [
  { value: 'fast', label: 'Fast', think: 700, pace: 26 },       // think: ms before the first word; pace: words a second
  { value: 'thorough', label: 'Thorough', think: 1200, pace: 16 },
] as const;

const THREAD = {
  height:     560, // px, the whole block; the thread takes what the composer leaves
  followSlop: 24,  // px from the foot that still counts as "at the foot"
  chunkWords: 10,  // words per phrase under Reduce Motion
  minRows:    1,
  maxRows:    6,
};

/* ── Data ──────────────────────────────────────────────────── */

type ModelId = (typeof MODELS)[number]['value'];
type Status = 'waiting' | 'writing' | 'done' | 'stopped';
type Attached = { id: number; name: string; size: number };
type Message =
  | { id: number; role: 'user'; text: string; files: Attached[] }
  | { id: number; role: 'assistant'; model: ModelId; words: string[]; shown: number; status: Status; take: number };

/** Sample replies, written again in turn by Retry. Paragraphs are split by a blank line. */
const REPLIES = [
  'Here is a first pass at the release note:\n\nThe spring tokens now carry their own durations, so a component that reads --mu-spring-settle-d stays in step when the curve is tuned. Reduce Motion sets every travel to zero and keeps the crossfades, which means labels still change and nothing slides.\n\nIf you want it shorter, I would keep the second sentence and drop the rest.',
  'A shorter take:\n\nSprings now ship with their durations, so tuning a curve retimes every component that uses it. Under Reduce Motion nothing travels; changes crossfade in place.',
  'Another angle, for people upgrading:\n\nNothing to change in your code. If you hard-coded a duration next to a MetalUI spring, replace it with the token, and it will follow the spring from now on. Reduce Motion is handled for you.',
];

const OPENING: Message[] = [
  { id: 1, role: 'user', text: 'Can you draft a release note for the spring token change?', files: [] },
  { id: 2, role: 'assistant', model: 'thorough', words: REPLIES[0].split(' '), shown: Infinity, status: 'done', take: 0 },
];

/* ── Motion helpers ────────────────────────────────────────── */

/** A spring's duration (ms, zero under Reduce Motion) and curve, read from the element's own tokens. */
function spring(el: Element, name: 'settle' | 'object') {
  const s = getComputedStyle(el);
  const ms = parseFloat(s.getPropertyValue(`--mu-spring-${name}-d`)) * 1000 * (parseFloat(s.getPropertyValue(`--mu-travel-${name}`)) || 0);
  return { ms, easing: s.getPropertyValue(`--mu-spring-${name}`).trim() || 'ease-out' };
}

/** Reduce Motion, as the tokens see it (the media query or the site's own switch). */

/** A message lands: from one nest below, on the object spring. */
function useLand<T extends HTMLElement>(on: boolean) {
  const ref = React.useRef<T>(null);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !on) return;
    const { ms, easing } = spring(el, 'object');
    const nest = getComputedStyle(el).getPropertyValue('--mu-nest').trim() || '6px';
    if (ms > 0) el.animate([{ opacity: 0, translate: `0 ${nest}` }, { opacity: 1, translate: '0 0' }], { duration: ms, easing });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return ref;
}

/* ── Messages ──────────────────────────────────────────────── */

function UserMessage({ message, land }: { message: Extract<Message, { role: 'user' }>; land: boolean }) {
  const ref = useLand<HTMLElement>(land);
  return (
    <article ref={ref} aria-label="You" className="grid justify-items-end gap-6 pl-48 @max-md/block:pl-32">
      {message.files.length > 0 && (
        <div className="flex flex-wrap justify-end gap-6">
          {message.files.map((f) => <Attachment key={f.id} name={f.name} size={f.size} />)}
        </div>
      )}
      {message.text && (
        <p className="m-0 max-w-full whitespace-pre-wrap break-words px-14 py-10 rounded-card recipe-surface-raise-sm type-content text-ink">{message.text}</p>
      )}
    </article>
  );
}

const HEADER: Record<Status, { led: LedKind; words: string }> = {
  waiting: { led: 'waiting', words: 'Thinking' },
  writing: { led: 'live', words: 'Writing' },
  done: { led: 'off', words: '' },
  stopped: { led: 'off', words: 'Stopped' },
};

function Reply({ message, last, busy, still, onRetry }: { message: Extract<Message, { role: 'assistant' }>; last: boolean; busy: boolean; still: boolean; onRetry: () => void }) {
  const [copied, setCopied] = React.useState(false);
  const text = message.words.slice(0, message.shown).join(' ');
  const settled = message.status === 'done' || message.status === 'stopped';
  const header = HEADER[message.status];
  const model = MODELS.find((m) => m.value === message.model)!.label;
  const actions = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), TIMING.copied);
    return () => window.clearTimeout(t);
  }, [copied]);

  // Copy and Retry fade in once the reply has settled (not for the replies already there).
  const wasSettled = React.useRef(settled);
  React.useLayoutEffect(() => {
    const el = actions.current;
    if (!el || wasSettled.current || !settled) return;
    wasSettled.current = true;
    const { ms, easing } = spring(el, 'settle');
    el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms || 1, easing });
  }, [settled]);

  const copy = async () => {
    try { await navigator.clipboard.writeText(text); } catch { /* a page without clipboard access still says so */ }
    setCopied(true);
  };

  return (
    <article aria-label={`Assistant, ${model}`} aria-busy={!settled} className="grid gap-8">
      <header className="flex items-center gap-8 type-meta text-ink2">
        <Led kind={header.led} size="small" gesture={message.status === 'waiting' ? 'breathe' : 'steady'} />
        <span>Assistant · {model}</span>
        <span className="text-ink3" data-status={message.status}><SwapText value={header.words} /></span>
      </header>
      {message.status === 'waiting' ? (
        <Skeleton.Text lines={1} width="62%" />
      ) : (
        <p className="m-0 whitespace-pre-wrap break-words type-content text-ink" data-reply-text>
          {text}
          {message.status === 'writing' && !still && (
            <span aria-hidden data-caret className="ml-2 inline-block h-16 w-2 translate-y-2 rounded-pill bg-green-deep" />
          )}
        </p>
      )}
      {settled && (
        <div ref={actions} className="flex items-center gap-6">
          <Button size="compact" onClick={copy} icon={<MorphIcon name={copied ? 'check' : 'paste'} />}>
            <SwapText value={copied ? 'Copied' : 'Copy'} />
          </Button>
          {last && (
            <Button size="compact" onClick={onRetry} disabled={busy} icon={<RedoIcon />}>Retry</Button>
          )}
        </div>
      )}
    </article>
  );
}

/* ── The block ─────────────────────────────────────────────── */

export interface AiComposerProps {
  /** Scales every model's pace (words a second); 1 is as listed in MODELS. */
  pace?: number;
  /** Scales every model's thinking time before the first word. */
  think?: number;
  className?: string;
}

/** A chat thread with a composer: attachments, a model, and replies that stream in with stop, copy and retry. */
export function AiComposer({ pace = 1, think = 1, className }: AiComposerProps) {
  const [messages, setMessages] = React.useState<Message[]>(OPENING);
  const [draft, setDraft] = React.useState('');
  const [files, setFiles] = React.useState<Attached[]>([]);
  const [model, setModel] = React.useState<ModelId>('fast');
  const [away, setAway] = React.useState(false); // scrolled up, away from the foot
  const root = React.useRef<HTMLElement>(null);
  const viewport = React.useRef<HTMLDivElement>(null);
  const well = React.useRef<HTMLTextAreaElement>(null);
  const picker = React.useRef<HTMLInputElement>(null);
  const seq = React.useRef(OPENING.length + 1);
  const pinned = React.useRef(true);
  const jumping = React.useRef(false);
  const landed = React.useRef(new Set<number>(OPENING.map((m) => m.id)));

  const live = [...messages].reverse().find((m) => m.role === 'assistant' && (m.status === 'waiting' || m.status === 'writing')) as Extract<Message, { role: 'assistant' }> | undefined;
  const still = useReducedMotion();
  const busy = !!live;
  const empty = draft.trim() === '' && files.length === 0;

  const toFoot = (smooth: boolean) => {
    const v = viewport.current;
    if (!v) return;
    v.scrollTo({ top: v.scrollHeight, behavior: smooth && !reduced(v) ? 'smooth' : 'auto' });
  };

  // Where the person is: at the foot the thread follows; away, it stays put and offers a way back.
  const onScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const v = event.currentTarget;
    const atFoot = v.scrollHeight - v.scrollTop - v.clientHeight <= THREAD.followSlop;
    if (jumping.current) { if (atFoot) jumping.current = false; else return; }
    pinned.current = atFoot;
    setAway(!atFoot);
  };

  React.useEffect(() => {
    const v = viewport.current;
    if (!v) return;
    const onPerson = () => { jumping.current = false; };
    v.addEventListener('wheel', onPerson, { passive: true });
    v.addEventListener('touchmove', onPerson, { passive: true });
    toFoot(false);
    return () => { v.removeEventListener('wheel', onPerson); v.removeEventListener('touchmove', onPerson); };
  }, []);

  // Follow the words while at the foot.
  React.useLayoutEffect(() => {
    if (pinned.current && !jumping.current) toFoot(false);
  }, [messages]);

  // The live reply: think, then words at the model's pace (a phrase at a time under Reduce Motion).
  React.useEffect(() => {
    if (!live) return;
    const m = MODELS.find((x) => x.value === live.model)!;
    const step = still ? THREAD.chunkWords : 1;
    const wait = live.status === 'waiting' ? m.think * think : still ? TIMING.chunkEvery : 1000 / (m.pace * pace);
    const t = window.setTimeout(() => {
      setMessages((all) => all.map((x) => {
        if (x.id !== live.id || x.role !== 'assistant') return x;
        if (x.status === 'waiting') return { ...x, status: 'writing', shown: step };
        const shown = Math.min(x.words.length, x.shown + step);
        return { ...x, shown, status: shown >= x.words.length ? 'done' : 'writing' };
      }));
    }, wait);
    return () => window.clearTimeout(t);
  }, [live, pace, think]);

  const reply = (take: number): Message => ({ id: seq.current++, role: 'assistant', model, words: REPLIES[take % REPLIES.length].split(' '), shown: 0, status: 'waiting', take });

  const send = () => {
    if (empty || busy) return;
    const takes = messages.filter((m) => m.role === 'assistant').length;
    setMessages((all) => [...all, { id: seq.current++, role: 'user', text: draft.trim(), files }, reply(takes)]);
    setDraft('');
    setFiles([]);
    pinned.current = true;
    setAway(false);
  };

  const stop = () => {
    if (!live) return;
    setMessages((all) => all.map((x) => (x.id === live.id && x.role === 'assistant' ? { ...x, status: 'stopped', shown: Math.min(x.shown, x.words.length), words: x.words.slice(0, x.shown) } : x)));
    well.current?.focus();
  };

  const retry = () => {
    const last = messages[messages.length - 1];
    if (busy || last?.role !== 'assistant') return;
    setMessages((all) => [...all.slice(0, -1), reply(last.take + 1)]);
    pinned.current = true;
  };

  const keys = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape' && busy) { e.preventDefault(); stop(); return; }
    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return;
    e.preventDefault();
    send();
  };

  const attach = (list: FileList | null) => {
    if (!list?.length) return;
    setFiles((was) => [...was, ...Array.from(list, (f) => ({ id: seq.current++, name: f.name, size: f.size }))]);
    if (picker.current) picker.current.value = '';
    well.current?.focus();
  };

  const jump = () => {
    jumping.current = true;
    pinned.current = true;
    setAway(false);
    toFoot(true);
  };

  return (
    <section ref={root} aria-label="Assistant" className={`block-ai-composer @container/block flex w-full flex-col overflow-hidden rounded-surface-radius-hero recipe-surface-raise ${className ?? ''}`} style={{ height: THREAD.height }}>
      <header className="flex items-baseline justify-between gap-12 px-20 pt-16 pb-8">
        <h2 className="m-0 type-title text-ink">Assistant</h2>
        <span className="type-meta text-ink3">Sample replies</span>
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <ScrollArea viewportRef={viewport} onScroll={onScroll} className="min-h-0 flex-1 pt-mu-space-12">
          <div role="log" aria-live="polite" aria-label="Conversation" className="grid gap-20 px-20 py-12 @max-md/block:px-14">
            {messages.map((m, i) => {
              const land = !landed.current.has(m.id);
              landed.current.add(m.id);
              return m.role === 'user'
                ? <UserMessage key={m.id} message={m} land={land} />
                : <Reply key={m.id} message={m} last={i === messages.length - 1} busy={busy} still={still} onRetry={retry} />;
            })}
          </div>
        </ScrollArea>
        <div className="pointer-events-none absolute inset-x-0 bottom-8 flex justify-end px-20 @max-md/block:px-14">
          <Button
            size="compact"
            onClick={jump}
            inert={!away}
            aria-hidden={!away}
            icon={<MorphIcon name="chevron" />}
            className={`transition-[opacity,translate] duration-settle ease-settle reduced-motion:transition-none ${away ? 'pointer-events-auto opacity-100' : 'translate-y-6 opacity-0'}`}
          >
            Jump to latest
          </Button>
        </div>
      </div>

      <div role="group" aria-label="Composer" className="m-12 mt-4 grid gap-8 p-8 rounded-card recipe-surface-raise-sm">
        {files.length > 0 && (
          <div className="flex flex-wrap gap-6">
            {files.map((f) => (
              <Attachment key={f.id} name={f.name} size={f.size} onRemove={() => { setFiles((was) => was.filter((x) => x.id !== f.id)); well.current?.focus(); }} />
            ))}
          </div>
        )}
        <Textarea
          ref={well}
          aria-label="Message"
          placeholder="Ask for a draft, a summary, a fix…"
          minRows={THREAD.minRows}
          maxRows={THREAD.maxRows}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={keys}
        />
        <div className="flex items-center gap-6">
          <input ref={picker} type="file" multiple hidden aria-hidden tabIndex={-1} data-attach-input onChange={(e) => attach(e.target.files)} />
          <Tooltip label="Attach files">
            <IconButton label="Attach files" icon={<PlusIcon />} onClick={() => picker.current?.click()} />
          </Tooltip>
          <Select size="compact" aria-label="Model" value={model} onValueChange={setModel} options={MODELS.map(({ value, label }) => ({ value, label }))} />
          <span className="flex-1" />
          <span aria-hidden className="type-meta text-ink3 @max-md/block:hidden">⇧↩ new line</span>
          <Button
            cap="primary"
            onClick={busy ? stop : send}
            disabled={!busy && empty}
            icon={<MorphIcon name={busy ? 'rectangle' : 'arrow'} />}
          >
            <SwapText value={busy ? 'Stop' : 'Send'} />
          </Button>
        </div>
      </div>
    </section>
  );
}
