'use client';

import * as React from 'react';
import { motionReduced as reduced } from '@unlocalhosted/metalui';
import {
  Avatar, Button, Field, FormField, Led, Radio, RadioGroup, Select, Tabs, TabList, TabPanel, SwapText, Switch, Switcher, Textarea,
} from '@unlocalhosted/metalui';
import { Icon, MorphIcon } from '@unlocalhosted/metalui/icons';

/* ─────────────────────────────────────────────────────────
 * SETTINGS · a workspace's preferences: who you are, what reaches you, how it looks
 *
 *   rest      a raised slab: the title and workspace; a section nav on the left (Profile,
 *             Notifications, Appearance) under one lifted highlight; the section's panel beside it
 *
 *   section   choosing one: the highlight glides to it (settle spring, the Tabs track's own); the new
 *             panel comes in one nest from the side the highlight went, fading (settle); the old
 *             one leaves at once. Edits are kept: nothing is lost by leaving a section.
 *
 *   edit      the first value that differs from what's saved:
 *      0 ms   the save bar rises from the block's bottom edge on the object spring (its own height
 *             and a nest, fading in); "Unsaved changes" and the count, "1 change"
 *   more      the count turns on the drum ("1 change" → "2 changes"); undoing an edit by hand
 *             counts down, and at none the bar leaves (release spring)
 *
 *   invalid   on leaving a field, or on Save: the field's ring turns red and its error row grows
 *             open under it (FormField, settle); typing a good value closes it
 *   refused   Save with a field not accepted: the section turns to Profile if it has to, focus goes
 *             to the first field not accepted, and the status says why. Nothing is saved.
 *
 *   save      the Save key, or ⌘S / Ctrl+S anywhere in the block
 *      0 ms   the key goes down and stays down; its glyph morphs document → clock and the label
 *             turns to "Saving…" on the drum; Discard is held off
 *   ~700 ms   (the sample wait, or your onSave) the glyph morphs clock → check, "Saved"; the title
 *             says "Changes saved"
 *   +900 ms   the bar sinks away on the release spring; focus, if it was in the bar, goes to the
 *             section's title
 *
 *   discard   every value returns to what's saved at once; errors close; the bar leaves (release)
 *
 *   colorway  Bone / Graphite paints the block itself (data-mu-colorway on its root), at once
 *   density   Compact tightens the rows and takes the compact field and switch sizes
 *   motion    Reduce motion (data-mu-motion on its root) makes every change in the block instant
 *
 * Reduce Motion (the system's, the site's, or the block's own switch): everything changes at once;
 * the bar is there or not; the drum crossfades.
 * Layout follows the block's own width (a container): from 36rem the nav sits on the left; under
 * that it is a Select at the top, and the save bar keeps only its count.
 * ───────────────────────────────────────────────────────── */

const TIMING = {
  saving:    700,  // ms of the sample wait before "Saved" (onSave replaces it)
  savedHold: 900,  // ms "Saved" holds before the bar leaves
};

const LIMITS = {
  bio: 160, // characters
};

/* ── Data ──────────────────────────────────────────────────── */

type Section = 'profile' | 'notifications' | 'appearance';

/**
 * A section's glyph, with a waiting lamp on its corner while the section holds unsaved edits.
 * Inert: in Chrome a tab's svg takes a Tab stop of its own.
 */
function Glyph({ name, dirty }: { name: 'me' | 'clock' | 'layout'; dirty: boolean }) {
  return (
    <span inert className="relative inline-grid">
      <Icon name={name} size={16} />
      {dirty && <Led kind="waiting" size="small" gesture="rise" className="absolute -top-1 -right-2" />}
    </span>
  );
}
type Frequency = 'hourly' | 'daily' | 'twice-weekly';
type Colorway = 'bone' | 'graphite';
type Density = 'comfortable' | 'compact';

export interface SettingsValues {
  photo: string | null;
  name: string;
  email: string;
  bio: string;
  digests: boolean;
  mentions: boolean;
  weekly: boolean;
  frequency: Frequency;
  colorway: Colorway;
  density: Density;
  reduceMotion: boolean;
}

const SECTIONS: { value: Section; label: string; about: string; glyph: 'me' | 'clock' | 'layout'; keys: (keyof SettingsValues)[] }[] = [
  { value: 'profile', label: 'Profile', about: 'How people in Lisbon Studio see you.', glyph: 'me', keys: ['photo', 'name', 'email', 'bio'] },
  { value: 'notifications', label: 'Notifications', about: 'What reaches your inbox, and how often.', glyph: 'clock', keys: ['digests', 'mentions', 'weekly', 'frequency'] },
  { value: 'appearance', label: 'Appearance', about: 'How this workspace looks and moves for you.', glyph: 'layout', keys: ['colorway', 'density', 'reduceMotion'] },
];

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: 'hourly', label: 'Every hour' },
  { value: 'daily', label: 'Once a day' },
  { value: 'twice-weekly', label: 'Twice a week' },
];

const COLORWAYS: { value: Colorway; label: string }[] = [
  { value: 'bone', label: 'Bone' },
  { value: 'graphite', label: 'Graphite' },
];

const SAVED: SettingsValues = {
  photo: null,
  name: 'Marta Silva',
  email: 'marta@lisbonstudio.com',
  bio: 'Designs the booking flow. Mostly on Lisbon time, sometimes on São Paulo’s.',
  digests: true,
  mentions: true,
  weekly: false,
  frequency: 'daily',
  colorway: 'bone',
  density: 'comfortable',
  reduceMotion: false,
};

const KEYS = Object.keys(SAVED) as (keyof SettingsValues)[];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Checked = 'name' | 'email';
const CHECKED: Checked[] = ['name', 'email']; // in the order they sit, for focus on a refused save

function errorsOf(v: SettingsValues): Record<Checked, string> {
  const email = v.email.trim();
  return {
    name: v.name.trim() ? '' : 'Enter your name.',
    email: !email ? 'Enter your email address.' : EMAIL.test(email) ? '' : 'Enter an email address, like marta@example.com.',
  };
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/* ── Motion helpers ────────────────────────────────────────── */



/** A spring's duration (ms, zero under Reduce Motion) and curve, read from the element's own tokens. */
function spring(el: Element, name: 'settle' | 'object' | 'release') {
  const s = getComputedStyle(el);
  const ms = reduced(el) ? 0 : parseFloat(s.getPropertyValue(`--mu-spring-${name}-d`)) * 1000 * (parseFloat(s.getPropertyValue(`--mu-travel-${name}`)) || 0);
  return { ms, easing: s.getPropertyValue(`--mu-spring-${name}`).trim() || 'ease-out' };
}

const nestOf = (el: Element) => parseFloat(getComputedStyle(el).getPropertyValue('--mu-motion-nest')) || 6;

/* ── Parts ─────────────────────────────────────────────────── */

/** A setting that is on or off: its words on the left (clicking them toggles), the switch on the right. */
function SwitchRow({ id, title, about, checked, onChange, small }: {
  id: string; title: string; about: string; checked: boolean; onChange: (on: boolean) => void; small: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-16">
      <span className="grid min-w-0 gap-2">
        <label htmlFor={id} id={`${id}-t`} className="cursor-pointer select-none type-ui text-ink">{title}</label>
        <span id={`${id}-d`} className="type-meta text-ink3">{about}</span>
      </span>
      <Switch id={id} size={small ? 'small' : 'regular'} checked={checked} onCheckedChange={onChange} aria-labelledby={`${id}-t`} aria-describedby={`${id}-d`} />
    </div>
  );
}

/** A group's words above it, the way a FormField labels a single control. */
function GroupLabel({ id, children, about }: { id: string; children: React.ReactNode; about?: React.ReactNode }) {
  return (
    <span className="grid gap-2">
      <span id={id} className="type-ui text-ink">{children}</span>
      {about && <span id={`${id}-d`} className="type-meta text-ink3">{about}</span>}
    </span>
  );
}

/* ── The block ─────────────────────────────────────────────── */

export interface SettingsProps {
  /** What's saved when it opens. The sample data by default; its colorway follows `colorway`. */
  initial?: SettingsValues;
  /** The block's colorway before anything is changed (the page's own, usually). */
  colorway?: Colorway;
  /** Saves the values; the key waits while it runs. Without it, a short sample wait. */
  onSave?: (values: SettingsValues) => Promise<void> | void;
  className?: string;
}

/** A workspace's preferences: profile, notifications and appearance, saved together from one bar. */
export function Settings({ initial, colorway = 'bone', onSave, className }: SettingsProps) {
  const ids = React.useId();
  const start = React.useMemo(() => initial ?? { ...SAVED, colorway }, [initial, colorway]);
  const [saved, setSaved] = React.useState<SettingsValues>(start);
  const [draft, setDraft] = React.useState<SettingsValues>(start);
  const [section, setSection] = React.useState<Section>('profile');
  const [touched, setTouched] = React.useState<Record<Checked, boolean>>({ name: false, email: false });
  const [phase, setPhase] = React.useState<'editing' | 'saving' | 'saved'>('editing');
  const [status, setStatus] = React.useState('');

  const root = React.useRef<HTMLElement>(null);
  const heading = React.useRef<HTMLHeadingElement>(null);
  const bar = React.useRef<HTMLDivElement>(null);
  const photoInput = React.useRef<HTMLInputElement>(null);
  const fields = { name: React.useRef<HTMLInputElement>(null), email: React.useRef<HTMLInputElement>(null) };
  const focusNext = React.useRef<Checked | null>(null);

  // The page's colorway, until this block's own is changed and saved.
  React.useEffect(() => {
    if (initial) return;
    setSaved((s) => ({ ...s, colorway }));
    setDraft((d) => (d.colorway === saved.colorway ? { ...d, colorway } : d));
  }, [colorway]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = <K extends keyof SettingsValues>(key: K, value: SettingsValues[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const changed = KEYS.filter((k) => draft[k] !== saved[k]);
  const count = changed.length;
  const dirty = (s: Section) => SECTIONS.find((x) => x.value === s)!.keys.some((k) => changed.includes(k));
  const errors = errorsOf(draft);
  const shown = { name: touched.name ? errors.name : '', email: touched.email ? errors.email : '' };
  const compact = draft.density === 'compact';

  // Tabs owns panel motion; focus after validation remains the host's responsibility.
  React.useLayoutEffect(() => {
    if (focusNext.current) {
      fields[focusNext.current].current?.focus();
      focusNext.current = null;
    }
  }, [section]); // eslint-disable-line react-hooks/exhaustive-deps

  /* The bar: here while anything differs, or while a save runs and says so. */
  const wanted = count > 0 || phase !== 'editing';
  const [present, setPresent] = React.useState(wanted);
  const held = React.useRef({ count, phase }); // what the bar says as it leaves
  if (wanted) held.current = { count, phase };
  React.useEffect(() => { if (wanted) setPresent(true); }, [wanted]);
  React.useLayoutEffect(() => {
    const el = bar.current;
    if (!el) return;
    const nest = nestOf(el);
    if (wanted) {
      const { ms, easing } = spring(el, 'object');
      if (ms && !el.dataset.risen) el.animate([{ opacity: 0, transform: `translateY(calc(100% + ${nest}px))` }, { opacity: 1, transform: 'none' }], { duration: ms, easing });
      el.dataset.risen = '';
      return;
    }
    // Leaving: focus in the bar goes to the section's title first, never to the page.
    const hadFocus = el.contains(document.activeElement);
    if (hadFocus) heading.current?.focus();
    const { ms, easing } = spring(el, 'release');
    if (!ms) { setPresent(false); return; }
    el.style.pointerEvents = 'none';
    const a = el.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateY(calc(100% + ${nest}px))` }], { duration: ms, easing, fill: 'forwards' });
    a.finished.then(() => setPresent(false), () => {});
    return () => { a.cancel(); el.style.pointerEvents = ''; };
  }, [wanted, present]);

  React.useEffect(() => {
    if (phase !== 'saved') return;
    const t = window.setTimeout(() => setPhase('editing'), TIMING.savedHold);
    return () => window.clearTimeout(t);
  }, [phase]);

  const save = async () => {
    if (phase === 'saving') return;
    if (!count) { setStatus('Nothing to save'); return; }
    setTouched({ name: true, email: true });
    const first = CHECKED.find((k) => errors[k]);
    if (first) {
      setStatus(`Not saved. ${errors[first]}`);
      if (section !== 'profile') { focusNext.current = first; setSection('profile'); }
      else fields[first].current?.focus();
      return;
    }
    const snapshot = draft;
    setPhase('saving');
    setStatus(`Saving ${plural(count, 'change', 'changes')}…`);
    if (onSave) await onSave(snapshot);
    else await new Promise((done) => window.setTimeout(done, TIMING.saving));
    setSaved(snapshot);
    setPhase('saved');
    setStatus(`Saved ${plural(count, 'change', 'changes')}`);
  };

  const discard = () => {
    if (phase === 'saving' || !count) return;
    setDraft(saved);
    setTouched({ name: false, email: false });
    setStatus(`Discarded ${plural(count, 'change', 'changes')}`);
  };

  const choosePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    set('photo', URL.createObjectURL(file));
    setStatus(`Photo changed to ${file.name}`);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 's') {
      e.preventDefault(); // not the browser's Save Page
      void save();
    }
  };

  const about = SECTIONS.find((s) => s.value === section)!;
  const busy = phase === 'saving';
  const saying = held.current;
  const fieldSize = compact ? 'compact' : 'regular';
  const rows = compact ? 'gap-12' : 'gap-20';

  return (
    <section
      ref={root}
      aria-labelledby={`${ids}-title`}
      data-mu-colorway={draft.colorway}
      data-mu-motion={draft.reduceMotion ? 'reduce' : undefined}
      data-density={draft.density}
      onKeyDown={onKeyDown}
      className={`@container/block relative grid w-full max-w-[52rem] overflow-clip rounded-surface-radius-hero text-ink recipe-surface-raise ${className ?? ''}`}
    >
      <header className="grid gap-2 border-b border-rule px-20 pt-20 pb-16">
        <h2 id={`${ids}-title`} className="m-0 type-display text-ink">Settings</h2>
        <p className="m-0 type-meta text-ink2">Lisbon Studio · your account</p>
      </header>

      <Tabs orientation="vertical" value={section} onValueChange={setSection} className="grid! min-w-0 gap-0! @xl/block:grid-cols-[11rem_minmax(0,1fr)]">
        {/* Sections: a list on the left from 36rem, a Select above the panel under it */}
        <div className="hidden border-r border-rule py-8 @xl/block:block">
          <TabList aria-label="Settings sections" className="w-full" size={compact ? 'compact' : 'regular'} items={SECTIONS.map(s => ({
            value: s.value, label: s.label, icon: <Glyph name={s.glyph} dirty={dirty(s.value)} />,
            'aria-describedby': dirty(s.value) ? `${ids}-dirty` : undefined,
          }))} />
          <span id={`${ids}-dirty`} hidden>Has unsaved changes</span>
        </div>

        <div className="@container/panel grid min-w-0 content-start gap-16 px-20 pt-16 pb-[5.5rem]">
          <div className="@xl/block:hidden">
            <Select
              aria-label="Settings section"
              className="w-full"
              value={section}
              onValueChange={setSection}
              options={SECTIONS.map((s) => ({ value: s.value, label: s.label, lead: <Glyph name={s.glyph} dirty={dirty(s.value)} /> }))}
            />
          </div>

          <TabPanel value={section} className={`grid min-w-0 content-start ${rows}`}>
            <div className="grid gap-2">
              {/* Narrow, the Select above already names the section; the title stays for assistive tech and focus. */}
              <h3 ref={heading} tabIndex={-1} id={`${ids}-section`} className="m-0 type-title text-ink outline-none sr-only @xl/block:not-sr-only">{about.label}</h3>
              <p className="m-0 type-meta text-ink3">{about.about}</p>
            </div>

            {section === 'profile' && (
              <>
                <div className="flex items-center gap-16">
                  {/* While the name is empty, the disc keeps the saved one's initials rather than guessing. */}
                  <Avatar name={draft.name.trim() || saved.name} src={draft.photo ?? undefined} size="large" />
                  <div className="grid justify-items-start gap-6">
                    <Button size="compact" icon={<Icon name="image" />} onClick={() => photoInput.current?.click()}>Change photo</Button>
                    <span className="type-meta text-ink3">JPG or PNG, square works best</span>
                    <input ref={photoInput} type="file" accept="image/*" aria-label="Profile photo" tabIndex={-1} className="sr-only" onChange={choosePhoto} />
                  </div>
                </div>

                <div className={`grid ${compact ? 'gap-12' : 'gap-16'} @md/panel:grid-cols-2`}>
                  <FormField invalid={!!shown.name}>
                    <FormField.Label>Name</FormField.Label>
                    <Field size={fieldSize}>
                      <Field.Input ref={fields.name} autoComplete="name" value={draft.name} onChange={(e) => set('name', e.target.value)} onBlur={() => setTouched((t) => ({ ...t, name: true }))} />
                    </Field>
                    <FormField.Error match={!!shown.name}>{shown.name}</FormField.Error>
                  </FormField>
                  <FormField invalid={!!shown.email}>
                    <FormField.Label>Email</FormField.Label>
                    <Field size={fieldSize}>
                      <Field.Input ref={fields.email} type="email" inputMode="email" autoComplete="email" value={draft.email} onChange={(e) => set('email', e.target.value)} onBlur={() => setTouched((t) => ({ ...t, email: true }))} />
                    </Field>
                    <FormField.Error match={!!shown.email}>{shown.email}</FormField.Error>
                  </FormField>
                </div>

                <FormField>
                  <FormField.Label>Bio</FormField.Label>
                  <FormField.Description>A line or two on your profile card.</FormField.Description>
                  <Textarea
                    size={compact ? 'compact' : 'regular'}
                    counterThreshold={0}
                    maxLength={LIMITS.bio}
                    minRows={compact ? 2 : 3}
                    value={draft.bio}
                    onChange={(e) => set('bio', e.target.value)}
                  />
                </FormField>
              </>
            )}

            {section === 'notifications' && (
              <>
                <div className={`grid ${rows}`}>
                  <SwitchRow id={`${ids}-digests`} small={compact} title="Email digests" about="A roundup of what you missed." checked={draft.digests} onChange={(v) => set('digests', v)} />
                  <SwitchRow id={`${ids}-mentions`} small={compact} title="Mentions" about="An email when someone mentions you." checked={draft.mentions} onChange={(v) => set('mentions', v)} />
                  <SwitchRow id={`${ids}-weekly`} small={compact} title="Weekly summary" about="Monday morning: the workspace’s week in one email." checked={draft.weekly} onChange={(v) => set('weekly', v)} />
                </div>
                <div className={`grid gap-10 border-t border-rule ${compact ? 'pt-12' : 'pt-16'}`}>
                  <GroupLabel id={`${ids}-freq`} about={<SwapText value={draft.digests ? 'How often the digest comes.' : 'Turn on email digests to choose.'} />}>Digest frequency</GroupLabel>
                  <RadioGroup
                    aria-labelledby={`${ids}-freq`}
                    aria-describedby={`${ids}-freq-d`}
                    orientation="horizontal"
                    disabled={!draft.digests}
                    value={draft.frequency}
                    onValueChange={(v) => set('frequency', v as Frequency)}
                  >
                    {FREQUENCIES.map((f) => <Radio key={f.value} value={f.value}>{f.label}</Radio>)}
                  </RadioGroup>
                </div>
              </>
            )}

            {section === 'appearance' && (
              <>
                <div className="grid gap-10">
                  <GroupLabel id={`${ids}-colorway`} about="Paints this block now; saved, it’s yours everywhere.">Colorway</GroupLabel>
                  <div>
                    <Switcher aria-label="Colorway" size={compact ? 'compact' : 'regular'} value={draft.colorway} onValueChange={(v) => set('colorway', v)} options={COLORWAYS} />
                  </div>
                </div>
                <div className="grid gap-10">
                  <GroupLabel id={`${ids}-density`} about="Compact fits more on a screen.">Density</GroupLabel>
                  <RadioGroup aria-labelledby={`${ids}-density`} orientation="horizontal" value={draft.density} onValueChange={(v) => set('density', v as Density)}>
                    <Radio value="comfortable">Comfortable</Radio>
                    <Radio value="compact">Compact</Radio>
                  </RadioGroup>
                </div>
                <div className={`border-t border-rule ${compact ? 'pt-12' : 'pt-16'}`}>
                  <SwitchRow id={`${ids}-motion`} small={compact} title="Reduce motion" about="Everything changes at once; nothing travels or springs." checked={draft.reduceMotion} onChange={(v) => set('reduceMotion', v)} />
                </div>
              </>
            )}
          </TabPanel>
        </div>
      </Tabs>

      {/* The save bar: pinned to the bottom of the block, or of the window while the block runs past it */}
      <div className="pointer-events-none sticky bottom-0 z-10 h-0">
        {present && (
          <div
            ref={bar}
            role="region"
            aria-label="Unsaved changes"
            className="pointer-events-auto absolute inset-x-12 bottom-12 flex items-center justify-between gap-12 rounded-pill py-6 pr-6 pl-18 recipe-surface-pop"
          >
            <span className="flex min-w-0 items-baseline gap-8">
              <span className="sr-only type-ui text-ink @md/block:not-sr-only">
                <SwapText value={saying.phase === 'saved' ? 'Changes saved' : saying.phase === 'saving' ? 'Saving changes' : 'Unsaved changes'} />
              </span>
              <span className="truncate type-meta text-ink2 tabular-nums"><SwapText value={plural(saying.count, 'change', 'changes')} /></span>
            </span>
            <span className="flex flex-none items-center gap-6">
              <Button icon={<Icon name="undo" />} onClick={discard} aria-disabled={busy || saying.phase === 'saved' || undefined}>Discard</Button>
              <Button
                cap="primary"
                onClick={() => void save()}
                state={phase === 'saving' ? 'waiting' : phase === 'saved' ? 'done' : 'idle'}
                waitingLabel="Saving…" doneLabel="Saved"
                aria-keyshortcuts="Meta+S Control+S"
                icon={<MorphIcon name={saying.phase === 'saved' ? 'check' : saying.phase === 'saving' ? 'clock' : 'document'} />}
              >
                Save
              </Button>
            </span>
          </div>
        )}
      </div>

      <p role="status" className="sr-only">{status}</p>
    </section>
  );
}
