'use client';

import * as React from 'react';
import { motionReduced as reduced } from '@unlocalhosted/metalui';
import {
  Attachment, Avatar, Button, DropZone, Field, FormField, IconButton, Select, SwapText, Switch, Tooltip, TooltipProvider,
  type DropRefusal,
} from '@unlocalhosted/metalui';
import { Icon, MorphIcon } from '@unlocalhosted/metalui/icons';

/* ─────────────────────────────────────────────────────────
 * SHARE PANEL · sharing a folder with people: its files, who has it, and a link
 *
 *   rest      a raised slab: the folder's name and what it holds, a close key; Files (a drop zone,
 *             the files as attachments), People (an invite row, then each person with their
 *             permission), Link (who can open it, the link in a well, Copy link)
 *
 *   files     dropped or picked
 *      0 ms   each file lands under the zone on the object spring (one nest above)
 *      0 ms   its track fills in steps as it uploads (settle spring per step, one step a tick)
 *    100 %    the full track holds for a beat, then the line turns to the file's size
 *   refused   the zone shakes (refusal) and one line under it says which file and why
 *   failed    the line says so in red with Try again; again, the track starts from empty
 *
 *   invite    an email and a permission; ↩ or Invite
 *      0 ms   the new person lands at the end of the list on the object spring
 *      0 ms   the field empties and keeps focus; a polite status says who was invited
 *   refused   not an email, or already in: the field's ring turns red and the error row grows
 *             open under it (settle); typing again closes it
 *
 *   remove    a person's ×: the row steps one nest down and fades on the release spring, then the
 *             rows under it travel up (settle spring); focus moves to the next person's ×
 *   permission  a person's own select; the status says what they can do now
 *
 *   link      the switch slides on the part spring; the line under it turns on the drum
 *   copy      Copy link writes the link to the clipboard: its glyph morphs paste → check and the
 *             label turns to "Copied" on the drum; after 1.6 s both turn back
 *
 *   close     the × in the header, or ⎋ anywhere in the panel
 *
 * Reduce Motion: everything changes at once; nothing lands, leaves or travels; the drum crossfades.
 * Layout follows the block's own width (a container): under 28rem the invite row wraps, the email
 * on its own line.
 * ───────────────────────────────────────────────────────── */

const TIMING = {
  uploadTick: 220,  // ms between upload progress steps (the simulated network)
  doneHold:   360,  // ms a full track holds before the line turns to the file's size
  copied:     1600, // ms Copy link says "Copied"
};

const LIMITS = {
  maxSize: 25_000_000, // bytes, largest file the folder takes
};

/* ── Data ──────────────────────────────────────────────────── */

type Permission = 'view' | 'edit';
const PERMISSIONS: { value: Permission; label: string }[] = [
  { value: 'view', label: 'Can view' },
  { value: 'edit', label: 'Can edit' },
];
const can = (p: Permission) => (p === 'edit' ? 'can edit' : 'can view');

interface Person { id: string; name: string; email: string; permission: Permission | 'owner' }
interface Upload { id: string; name: string; size: number; progress?: number; error?: string }

const PEOPLE: Person[] = [
  { id: 'marta', name: 'Marta Silva', email: 'marta@example.com', permission: 'owner' },
  { id: 'joao', name: 'João Pereira', email: 'joao@example.com', permission: 'edit' },
  { id: 'ana', name: 'Ana Rocha', email: 'ana@example.com', permission: 'view' },
];
const FILES: Upload[] = [
  { id: 'itinerary', name: 'Itinerary, 12 to 16 October.pdf', size: 1_240_000 },
  { id: 'hotel', name: 'Hotel booking.pdf', size: 3_100_000, error: 'Connection lost' },
];
const LINK = 'https://metalui.dev/s/lisbon-trip-4k7q';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** "lena.fischer@example.com" → "Lena Fischer". */
function nameOf(email: string) {
  return email.split('@')[0].split(/[._-]+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(' ') || email;
}

/** One upload step, in percent: small files go quickly, large ones slowly. */
function stepOf(size: number) {
  return Math.max(6, Math.min(34, Math.round(40 - size / 250_000)));
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/* ── Motion helpers ────────────────────────────────────────── */



/** A spring's duration (ms, zero under Reduce Motion) and curve, read from the element's own tokens. */
function spring(el: Element, name: 'settle' | 'object' | 'release') {
  const s = getComputedStyle(el);
  const ms = reduced(el) ? 0 : parseFloat(s.getPropertyValue(`--mu-spring-${name}-d`)) * 1000 * (parseFloat(s.getPropertyValue(`--mu-travel-${name}`)) || 0);
  return { ms, easing: s.getPropertyValue(`--mu-spring-${name}`).trim() || 'ease-out' };
}

/**
 * Rows in one list: a row that is new lands from one nest above on the object spring; rows that
 * moved travel from where they were (FLIP, settle spring). The first render only records.
 */
function useRows(list: React.RefObject<HTMLElement | null>, order: string, land: boolean) {
  const tops = React.useRef<Map<string, number> | null>(null);
  React.useLayoutEffect(() => {
    const el = list.current;
    if (!el) return;
    const glide = spring(el, 'settle');
    const drop = spring(el, 'object');
    const nest = parseFloat(getComputedStyle(el).getPropertyValue('--mu-motion-nest')) || 6;
    const next = new Map<string, number>();
    el.querySelectorAll<HTMLElement>(':scope > [data-row]').forEach((row) => {
      const key = row.dataset.row!;
      next.set(key, row.offsetTop);
      if (!tops.current) return;
      const was = tops.current.get(key);
      if (was == null) {
        if (land && drop.ms > 0) row.animate([{ opacity: 0, transform: `translateY(${-nest}px)` }, { opacity: 1, transform: 'none' }], { duration: drop.ms, easing: drop.easing });
      } else if (was !== row.offsetTop && glide.ms > 0) {
        row.animate([{ transform: `translateY(${was - row.offsetTop}px)` }, { transform: 'none' }], { duration: glide.ms, easing: glide.easing });
      }
    });
    tops.current = next;
  }, [list, order, land]);
}

/** A row leaves one nest down, fading, on the release spring; then `done`. At once under Reduce Motion. */
function leave(row: HTMLElement | null, done: () => void) {
  if (!row) return done();
  const { ms, easing } = spring(row, 'release');
  if (!ms) return done();
  const nest = parseFloat(getComputedStyle(row).getPropertyValue('--mu-motion-nest')) || 6;
  row.style.pointerEvents = 'none';
  row.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateY(${nest}px)` }], { duration: ms, easing, fill: 'forwards' }).finished.then(done, done);
}

/* ── Parts of the panel ────────────────────────────────────── */

const X = <svg aria-hidden viewBox="0 0 10 10" className="size-attachment-remove-glyph" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><path d="M2.5 2.5l5 5M7.5 2.5l-5 5" /></svg>;

// A person: avatar, name and email, their permission, ×. Under 24rem the permission goes under the name.
const ROW = 'grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-12 gap-y-6 px-4 py-6 @sm/block:grid-cols-[auto_minmax(0,1fr)_auto_auto]';
const PERMISSION = 'col-start-2 row-start-2 justify-self-start @sm/block:col-start-3 @sm/block:row-start-1';

function Heading({ id, children }: { id: string; children: React.ReactNode }) {
  return <h3 id={id} className="m-0 type-title text-ink">{children}</h3>;
}

/* ── The block ─────────────────────────────────────────────── */

export interface SharePanelProps {
  /** The folder being shared. */
  folder?: string;
  /** Called by the close key and by ⎋. */
  onClose?: () => void;
  /** Move focus to the panel's title when it appears (a panel opened by a key). */
  autoFocus?: boolean;
  className?: string;
}

/** Share a folder: add its files, invite people with a permission, and turn on a link. */
export function SharePanel({ folder = 'Lisbon trip', onClose, autoFocus, className }: SharePanelProps) {
  const ids = React.useId();
  const root = React.useRef<HTMLElement>(null);
  const title = React.useRef<HTMLHeadingElement>(null);
  const email = React.useRef<HTMLInputElement>(null);
  const peopleList = React.useRef<HTMLUListElement>(null);
  const fileList = React.useRef<HTMLDivElement>(null);
  const linkField = React.useRef<HTMLInputElement>(null);
  const next = React.useRef(0);

  const [files, setFiles] = React.useState<Upload[]>(FILES);
  const [refusedNote, setRefusedNote] = React.useState('');
  const [people, setPeople] = React.useState<Person[]>(PEOPLE);
  const [draft, setDraft] = React.useState('');
  const [invitePermission, setInvitePermission] = React.useState<Permission>('view');
  const [inviteError, setInviteError] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [status, setStatus] = React.useState('');

  useRows(peopleList, people.map((p) => p.id).join('|'), true);
  useRows(fileList, files.map((f) => f.id).join('|'), false); // attachments land on their own

  React.useEffect(() => { if (autoFocus) title.current?.focus(); }, [autoFocus]);

  /* Upload: one step a tick for every file on its way; a full track holds, then turns to its size. */
  const uploading = files.some((f) => f.progress != null && f.progress < 100 && !f.error);
  React.useEffect(() => {
    if (!uploading) return;
    const t = window.setInterval(() => {
      setFiles((all) => all.map((f) => (f.progress == null || f.error || f.progress >= 100 ? f : { ...f, progress: Math.min(100, f.progress + stepOf(f.size)) })));
    }, TIMING.uploadTick);
    return () => window.clearInterval(t);
  }, [uploading]);
  const full = files.filter((f) => f.progress === 100).map((f) => f.id).join('|');
  React.useEffect(() => {
    if (!full) return;
    const done = full.split('|');
    const t = window.setTimeout(() => {
      setFiles((all) => all.map((f) => (done.includes(f.id) ? { ...f, progress: undefined } : f)));
      const names = files.filter((f) => done.includes(f.id)).map((f) => f.name);
      setStatus(names.length === 1 ? `Uploaded ${names[0]}` : `Uploaded ${names.length} files`);
    }, TIMING.doneHold);
    return () => window.clearTimeout(t);
  }, [full]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), TIMING.copied);
    return () => window.clearTimeout(t);
  }, [copied]);

  const onFiles = (taken: File[], refused: DropRefusal[]) => {
    const why = (r: DropRefusal) => `${r.file.name} is ${r.reason === 'size' ? 'over 25 MB' : 'not a file this folder takes'}`;
    setRefusedNote(refused.map(why).join('. '));
    if (taken.length) {
      setFiles((all) => [...all, ...taken.map((f) => ({ id: `f${next.current++}`, name: f.name, size: f.size, progress: 0 }))]);
    }
    setStatus([taken.length ? `Uploading ${plural(taken.length, 'file', 'files')}` : '', ...refused.map(why)].filter(Boolean).join('. '));
  };

  const retry = (id: string) => {
    setFiles((all) => all.map((f) => (f.id === id ? { ...f, error: undefined, progress: 0 } : f)));
    setStatus(`Uploading ${files.find((f) => f.id === id)?.name ?? 'the file'} again`);
  };

  const invite = (e: React.FormEvent) => {
    e.preventDefault();
    const address = draft.trim().toLowerCase();
    if (!EMAIL.test(address)) { setInviteError('Enter an email address, like lena@example.com.'); email.current?.focus(); return; }
    if (people.some((p) => p.email === address)) { setInviteError(`${address} already has access.`); email.current?.focus(); return; }
    setPeople((all) => [...all, { id: `p${next.current++}`, name: nameOf(address), email: address, permission: invitePermission }]);
    setDraft('');
    setInviteError('');
    setStatus(`Invited ${address}, ${can(invitePermission)}`);
    email.current?.focus();
  };

  const setPermission = (person: Person, permission: Permission) => {
    setPeople((all) => all.map((p) => (p.id === person.id ? { ...p, permission } : p)));
    setStatus(`${person.name} ${can(permission)} now`);
  };

  const remove = (person: Person, row: HTMLElement | null) => {
    // Focus goes to the next person's ×, or the one before, or the email field: never to the page.
    const keys = Array.from(peopleList.current?.querySelectorAll<HTMLButtonElement>('[data-remove]') ?? []);
    const at = keys.findIndex((k) => k.dataset.remove === person.id);
    const after = keys[at + 1] ?? keys[at - 1] ?? email.current;
    leave(row, () => {
      setPeople((all) => all.filter((p) => p.id !== person.id));
      setStatus(`Removed ${person.name}`);
    });
    after?.focus();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(LINK);
      setCopied(true);
      setStatus('Link copied');
    } catch {
      linkField.current?.select();
      setStatus('Couldn’t copy. The link is selected: press ⌘C to copy it.');
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    // ⎋ closes, including from a key with a tooltip; but not from a
    // select's open list (it is portalled: its keys reach here through React, not the DOM).
    if (e.key !== 'Escape' || !onClose || !root.current?.contains(e.target as Node)) return;
    e.preventDefault();
    onClose();
  };

  const members = people.length;

  return (
    <TooltipProvider>
      <section
        ref={root}
        aria-labelledby={`${ids}-title`}
        onKeyDown={onKeyDown}
        className={`block-share-panel @container/block grid w-full max-w-[36rem] gap-20 p-20 rounded-surface-radius-hero recipe-surface-raise ${className ?? ''}`}
      >
        <header className="flex items-start justify-between gap-12">
          <div className="grid min-w-0 gap-2">
            <h2 ref={title} id={`${ids}-title`} tabIndex={-1} className="m-0 truncate type-display text-ink outline-none">Share “{folder}”</h2>
            <p className="m-0 type-meta text-ink2">
              <SwapText value={plural(members, 'person', 'people')} /> · <SwapText value={plural(files.length, 'file', 'files')} />
            </p>
          </div>
          {onClose && (
            <Tooltip label="Close" shortcut="⎋">
              <IconButton label="Close" icon={<Icon name="close" />} onClick={onClose} />
            </Tooltip>
          )}
        </header>

        {/* People */}
        <section aria-labelledby={`${ids}-people`} className="grid gap-10">
          <Heading id={`${ids}-people`}>People</Heading>
          <form noValidate onSubmit={invite} className="grid grid-cols-[1fr_auto] items-start gap-8 @md/block:grid-cols-[1fr_auto_auto]">
            <FormField invalid={!!inviteError} className="col-span-2 @md/block:col-span-1">
              <FormField.Label className="sr-only">Email to invite</FormField.Label>
              <Field size="regular">
                <Field.Input
                  ref={email}
                  type="email"
                  inputMode="email"
                  placeholder="Email address"
                  value={draft}
                  onChange={(e) => { setDraft(e.target.value); if (inviteError) setInviteError(''); }}
                />
              </Field>
              <FormField.Error match={!!inviteError}>{inviteError}</FormField.Error>
            </FormField>
            <Select aria-label="Permission for the invite" className="w-full @md/block:w-auto" options={PERMISSIONS} value={invitePermission} onValueChange={setInvitePermission} />
            <Button type="submit" icon={<Icon name="plus" />}>Invite</Button>
          </form>
          <ul ref={peopleList} aria-label={`People with access to ${folder}`} className="m-0 grid list-none gap-2 p-0">
            {people.map((p) => (
              <li key={p.id} data-row={p.id} className={ROW}>
                <Avatar name={p.name} size="regular" />
                <span className="grid min-w-0 gap-1">
                  <span className="truncate type-ui text-ink">{p.name}{p.permission === 'owner' && <span className="text-ink3"> (you)</span>}</span>
                  <span className="truncate type-meta text-ink3">{p.email}</span>
                </span>
                {p.permission === 'owner' ? (
                  // The owner can't be removed: "Owner" in the permission's place, and the ×'s room kept so it lines up.
                  <>
                    <span className={`${PERMISSION} type-meta text-ink3 @sm/block:justify-self-end`}>Owner</span>
                    <span aria-hidden className="hidden w-icon-button-mini-w @sm/block:col-start-4 @sm/block:block" />
                  </>
                ) : (
                  <>
                    <Select size="compact" className={PERMISSION} aria-label={`Permission for ${p.name}`} options={PERMISSIONS} value={p.permission} onValueChange={(v) => setPermission(p, v)} />
                    <Tooltip label={`Remove ${p.name}`}>
                      <IconButton
                        variant="mini"
                        label={`Remove ${p.name}`}
                        data-remove={p.id}
                        className="col-start-3 row-start-1 @sm/block:col-start-4"
                        icon={X}
                        onClick={(e) => remove(p, e.currentTarget.closest('li'))}
                      />
                    </Tooltip>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* Link */}
        <section aria-labelledby={`${ids}-link`} className="grid gap-10 border-t border-rule pt-16">
          <Heading id={`${ids}-link`}>Link</Heading>
          <div className="flex items-center gap-12">
            <Switch id={`${ids}-access`} checked={open} onCheckedChange={setOpen} aria-labelledby={`${ids}-anyone`} aria-describedby={`${ids}-who`} />
            <span className="grid min-w-0 gap-1">
              <label htmlFor={`${ids}-access`} id={`${ids}-anyone`} className="type-ui text-ink cursor-pointer select-none">Anyone with the link</label>
              <span id={`${ids}-who`} className="type-meta text-ink3"><SwapText value={open ? 'Anyone who has it can view' : 'Only people invited can open it'} /></span>
            </span>
          </div>
          {/* Narrow, the link takes its own line so its end stays readable. */}
          <div className="flex flex-wrap items-center justify-end gap-8">
            <Field size="regular" className="min-w-[15rem] flex-1">
              <Field.Input ref={linkField} readOnly aria-label="Share link" value={LINK.replace('https://', '')} onFocus={(e) => e.currentTarget.select()} className="text-ink2" />
            </Field>
            <Button onClick={copy} icon={<MorphIcon name={copied ? 'check' : 'paste'} />}>
              <SwapText value={copied ? 'Copied' : 'Copy link'} />
            </Button>
          </div>
        </section>

        {/* Files */}
        <section aria-labelledby={`${ids}-files`} className="grid gap-10 border-t border-rule pt-16">
          <Heading id={`${ids}-files`}>Files</Heading>
          <DropZone compact onFiles={onFiles} maxSize={LIMITS.maxSize} description="Up to 25 MB each" icon={<Icon name="document" />} />
          {refusedNote && <p className="m-0 type-meta text-form-field-error-ink">{refusedNote}.</p>}
          <div ref={fileList} className="grid gap-8 [&>[data-row]>.mu-attachment]:max-w-none">
            {files.map((f) => (
              <div key={f.id} data-row={f.id}>
                <Attachment
                  name={f.name}
                  size={f.size}
                  progress={f.progress}
                  error={f.error}
                  onRetry={() => retry(f.id)}
                  onRemove={() => { setFiles((all) => all.filter((x) => x.id !== f.id)); setStatus(`Removed ${f.name}`); }}
                />
              </div>
            ))}
          </div>
        </section>

        <p role="status" className="sr-only">{status}</p>
      </section>
    </TooltipProvider>
  );
}
