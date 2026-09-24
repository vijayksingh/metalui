'use client';

import * as React from 'react';
import { Surface } from '../../components/surface/surface';
import { Label } from '../../components/label/label';
import { Rule } from '../../components/rule/rule';
import { Kbd } from '../../components/kbd/kbd';

/* ─────────────────────────────────────────────────────────
 * SETTINGS (a block): the settings of an app, as sections of rows
 *   Settings.Section  an engraved heading over a raised card (Surface raise-lite, card radius)
 *   Settings.Row      a name and an optional detail on the left, one control on the right
 *                     (a Switch, a Button, a Segmented, a value); rows are split by engraved
 *                     rules inset to the text
 *   Settings.Keys     a shortcut row: what it does, and its keys as keycaps
 * Layout only (the settings group); every paint is its parts'. A row never raises on hover:
 * only its control acts.
 * ───────────────────────────────────────────────────────── */

const SECTION = 'mu-settings-section flex flex-col gap-settings-heading-gap';
const HEADING = 'px-settings-heading-pad-x';
const CARD = 'flex flex-col';
const ROW = 'mu-settings-row flex items-center gap-settings-row-gap min-h-settings-row-min py-settings-row-pad-y px-settings-row-pad-x';
const TEXT = 'flex min-w-0 flex-1 flex-col gap-settings-detail-gap';
const CONTROL = 'flex flex-none items-center gap-settings-keys-gap';
const RULE = 'mx-settings-row-pad-x';

function Root({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={className ? `mu-settings flex flex-col gap-settings-section-gap ${className}` : 'mu-settings flex flex-col gap-settings-section-gap'} {...props} />;
}

/** A titled group of rows. */
function Section({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  const rows = React.Children.toArray(children).filter(Boolean);
  return (
    <section className={className ? `${SECTION} ${className}` : SECTION} aria-label={title}>
      <Label variant="engraved" as="h3" className={HEADING}>{title}</Label>
      <Surface material="raise-lite" radius="card" className={CARD}>
        {rows.flatMap((row, i) => (i ? [<Rule key={`r${i}`} className={RULE} />, row] : [row]))}
      </Surface>
    </section>
  );
}

export interface SettingsRowProps {
  /** What the setting is, as a person would say it: "Sync this canvas". */
  name: React.ReactNode;
  /** One short line of what it does or what it is now. */
  detail?: React.ReactNode;
  /** The one control: a Switch, a Button, a Segmented, or a value. */
  children?: React.ReactNode;
  /** An id for the name, so a control can be labelled by it (aria-labelledby). */
  id?: string;
}

/** One setting: its name and detail, and its control. */
function Row({ name, detail, children, id }: SettingsRowProps) {
  return (
    <div className={ROW}>
      <div className={TEXT}>
        <Label variant="name" id={id}>{name}</Label>
        {detail && <Label variant="detail">{detail}</Label>}
      </div>
      {children && <div className={CONTROL}>{children}</div>}
    </div>
  );
}

/** A shortcut: what it does, and its keys (each string one keycap). */
function Keys({ name, keys }: { name: React.ReactNode; keys: string[] }) {
  return (
    <Row name={name}>
      {keys.map((k) => <Kbd key={k}>{k}</Kbd>)}
    </Row>
  );
}

export const Settings = Object.assign(Root, { Root, Section, Row, Keys });
