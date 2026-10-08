'use client';

import * as React from 'react';
import { CheckboxGroup as BaseCheckboxGroup } from '@base-ui/react/checkbox-group';
import { Checkbox } from '../checkbox/checkbox';

/* ─────────────────────────────────────────────────────────
 * CHECKBOX GROUP, several independent choices in a form, on Base UI CheckboxGroup
 *
 *   rows      the row-size checkbox beside its label; the whole row is the hit area, and pressing it
 *             anywhere gives the checkbox's press (as the radio group's rows do)
 *   parent    optional: ticks or clears every row; some ticked shows the mixed look, a dash drawn
 *             left to right on the dark key; mixed → all bends the dash into the tick (settle spring)
 *   cascade   ticking several at once (the parent) ticks them from the top, one row every
 *             30 ms: each key goes dark in turn, and its pen draws the checkbox's own tick a beat
 *             later (the checkbox's storyboard: short leg, a dwell at the corner, the long leg sprung)
 *   clear     clearing several at once clears them together: every tick withdraws at once, then the
 *             keys go light. Letting go is quicker than taking
 *   focus     the green ring on the checkbox; Tab moves row to row, Space ticks
 *   disabled  the row at 40 %
 * Reduce Motion: no cascade (its steps scale with the part travel); ticks and the dash are whole at once.
 * The checkboxes are the checkbox recipe; the checkbox-group recipe adds rows and the cascade.
 * Slots: CheckboxGroup.Root, CheckboxGroup.Parent, CheckboxGroup.Item.
 * ───────────────────────────────────────────────────────── */

const ROOT = 'mu-checkbox-group grid gap-checkbox-group-gap';
const ROW = 'mu-checkbox-group-row inline-flex items-center gap-checkbox-group-row-gap min-h-checkbox-group-row-height type-ui text-ink cursor-pointer select-none w-max checkbox-group-cascade checkbox-group-press has-data-disabled:opacity-checkbox-group-disabled has-data-disabled:cursor-default';
const CHILD = 'ps-checkbox-group-indent';

const CascadeCtx = React.createContext<{ step: (value: string) => number; hasParent: boolean }>({ step: () => 0, hasParent: false });

export interface CheckboxGroupProps extends Omit<BaseCheckboxGroup.Props, 'className' | 'value' | 'defaultValue' | 'onValueChange'> {
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  /** Every item's value, in order: needed for a parent, and the order of the cascade. */
  allValues?: string[];
  className?: string;
}

function Root({ value, defaultValue, onValueChange, allValues, className, children, ...props }: CheckboxGroupProps) {
  const [own, setOwn] = React.useState<string[]>(defaultValue ?? []);
  const current = value ?? own;
  const [added, setAdded] = React.useState<string[]>([]);
  const order = allValues ?? [];
  const hasParent = React.Children.toArray(children).some((c) => React.isValidElement(c) && c.type === Parent);
  const step = React.useCallback((v: string) => {
    const i = added.indexOf(v);
    return i < 0 ? 0 : i;
  }, [added]);
  return (
    <CascadeCtx.Provider value={{ step, hasParent }}>
      <BaseCheckboxGroup
        className={className ? `${ROOT} ${className}` : ROOT}
        value={current}
        allValues={allValues}
        onValueChange={(next) => {
          const fresh = (next as string[]).filter((v) => !current.includes(v));
          setAdded(fresh.length > 1 ? [...fresh].sort((a, b) => order.indexOf(a) - order.indexOf(b)) : []);
          if (value === undefined) setOwn(next as string[]);
          onValueChange?.(next as string[]);
        }}
        {...props}
      >
        {children}
      </BaseCheckboxGroup>
    </CascadeCtx.Provider>
  );
}

/** Ticks or clears every item; half-filled when some are ticked. */
function Parent({ children, disabled }: { children: React.ReactNode; disabled?: boolean }) {
  return (
    <label className={ROW}>
      <Checkbox size="row" parent disabled={disabled} />
      <span className="mu-checkbox-group-label">{children}</span>
    </label>
  );
}

export interface CheckboxGroupItemProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
}

/** One choice: the checkbox and its label. */
function Item({ value, children, disabled }: CheckboxGroupItemProps) {
  const { step, hasParent } = React.useContext(CascadeCtx);
  return (
    <label className={hasParent ? `${ROW} ${CHILD}` : ROW} style={{ '--mu-cascade-step': step(value) } as React.CSSProperties}>
      <Checkbox size="row" value={value} disabled={disabled} />
      <span className="mu-checkbox-group-label">{children}</span>
    </label>
  );
}

export const CheckboxGroup = Object.assign(Root, { Parent, Item, Root });
