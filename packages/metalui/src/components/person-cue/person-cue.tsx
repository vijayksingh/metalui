'use client';
import * as React from 'react';
import { mergeProps } from '@base-ui/react/merge-props';
import { Select as BaseSelect } from '@base-ui/react/select';
import { Icon } from '../../icons/Icon';
import { TickGlyph } from '../../icons/TickGlyph';
import { SwapText } from '../../motion/swap';
import { usePortalColorway } from '../../theme/portal-colorway';
import { Tooltip } from '../tooltip/tooltip';
import { Mark } from '../mark/mark';
import { MARK_GLYPH_SIZE } from '../mark/identity.generated';
import { ListGlide, menuParts } from '../menu/menu';

export interface PersonCueChoice {
  /** Exact name written into the document. Identity and recognition belong to the host. */
  value: string;
  label?: string;
  /** A host-provided Avatar Object, or another meaning glyph. The control never creates a person. */
  avatar?: React.ReactNode;
  disabled?: boolean;
}
export interface PersonCueProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'value' | 'onChange' | 'children'> {
  value: string;
  choices: readonly PersonCueChoice[];
  label: string;
  disabled?: boolean;
  readOnly?: boolean;
  raw?: boolean;
  /** Suppress the visual first-use hint when an enclosing provenance tooltip owns help. */
  hint?: boolean;
  editing?: boolean;
  className?: string;
  /** Props reach the actual operable trigger, including provenance descriptions and focus events. */
  triggerProps?: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'value' | 'disabled' | 'className'>;
  onBegin?: () => boolean | void;
  onChange: (words: string) => boolean | void;
  onCommit?: () => void;
  onCancel?: () => void;
}

/* PERSON CUE STORYBOARD
 * rest    exact source name; all host names reserve its footprint; host avatar is a Mark meaning slot
 * open    one source snapshot; Base Select opens the shared names plate and owns focus/typeahead
 * choose  one confirmed name replaces the range and commits once; the existing drum changes words
 * cancel  Escape/outside/unmount/vocabulary change ends the snapshot, with no invented identity
 * Reduced motion keeps the donor plate fade and the drum crossfade. No clock runs at rest.
 */
function offset() {
  if (typeof window === 'undefined') return 6;
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--mu-r-select-pop-offset')) || 6;
}
export const PersonCue = React.forwardRef<HTMLButtonElement, PersonCueProps>(function PersonCue(props, ref) {
  const { value, choices, label, disabled = false, readOnly = false, raw = false, hint = true, className, triggerProps, editing: _editing, onBegin: _onBegin, onChange: _onChange, onCommit: _onCommit, onCancel: _onCancel, ...triggerEvents } = props;
  const [open, setOpen] = React.useState(false);
  const [hintOpen, setHintOpen] = React.useState(false);
  const [anchor, setAnchor] = React.useState<HTMLButtonElement | null>(null);
  const colorway = usePortalColorway(anchor);
  const callbacks = React.useRef(props); callbacks.current = props;
  const transaction = React.useRef<{ original: string; vocabulary: string } | null>(null);
  const vocabulary = JSON.stringify(choices.map(choice => [choice.value, !!choice.disabled]));
  const valid = choices.length > 0 && choices.every(choice => !!choice.value) && new Set(choices.map(choice => choice.value)).size === choices.length;
  const mutable = valid && !disabled && !readOnly && choices.some(choice => !choice.disabled);
  const current = choices.find(choice => choice.value === value);
  function cancel(render = true) {
    const held = transaction.current; if (!held) return;
    transaction.current = null;
    if (render) setOpen(false);
    callbacks.current.onCancel?.();
  }
  const latestCancel = React.useRef(cancel); latestCancel.current = cancel;
  React.useEffect(() => {
    const held = transaction.current;
    if (held && (!mutable || held.original !== value || held.vocabulary !== vocabulary || props.editing === false)) latestCancel.current();
  }, [mutable, value, vocabulary, props.editing]);
  React.useEffect(() => () => latestCancel.current(false), []);
  const triggerRef = React.useCallback((element: HTMLButtonElement | null) => {
    setAnchor(element);
    if (typeof ref === 'function') ref(element); else if (ref) ref.current = element;
  }, [ref]);
  const glyph = (choice?: PersonCueChoice) => choice?.avatar ?? <Icon name="person" size={MARK_GLYPH_SIZE} />;
  const own = 'mu-person-cue person-cue relative inline-grid align-baseline border-0 bg-transparent p-0 type-content text-ink select-none focus-visible:focus-ring data-disabled:opacity-field-state-disabled';
  const names = [...new Set([...choices.map(choice => choice.value), value])];
  const description = [...new Set(["Choose a known person. Arrows or type a name, Return chooses, Escape cancels.", triggerEvents["aria-description"], triggerProps?.["aria-description"]].filter(Boolean))].join(" ");
  return <BaseSelect.Root<string> value={value} open={open} disabled={disabled || !valid}
    onOpenChange={next => {
      if (!next) { cancel(); setOpen(false); return; }
      if (!mutable || callbacks.current.onBegin?.() === false) return;
      transaction.current = { original: value, vocabulary }; setOpen(true);
    }}
    onValueChange={next => {
      if (!transaction.current || next == null || !choices.some(choice => choice.value === next && !choice.disabled)) return;
      if (next !== value && callbacks.current.onChange(next) === false) { cancel(); return; }
      transaction.current = null; setOpen(false); callbacks.current.onCommit?.();
    }}>
    <BaseSelect.Trigger {...mergeProps({ onFocus: () => setHintOpen(true), onBlur: () => setHintOpen(false) }, triggerEvents, triggerProps ?? {})} ref={triggerRef} aria-label={`${label}: ${value}`} aria-readonly={readOnly || undefined}
      data-value={value} data-readonly={readOnly || undefined} className={className ? `${own} ${className}` : own} aria-description={description}>
      {names.map(name => <span key={name} aria-hidden className="invisible col-start-1 row-start-1 whitespace-nowrap">{name}</span>)}
      <Tooltip label="Choose a known person · Arrows or type a name" open={hint && hintOpen && !open && mutable} onOpenChange={next => setHintOpen(next)}><span className="col-start-1 row-start-1 justify-self-start"><Mark kind="duration" meaning="person" meaningLabel={value} meaningGlyph={glyph(current)} raw={raw}><SwapText value={value} /></Mark></span></Tooltip>
    </BaseSelect.Trigger>
    <BaseSelect.Portal>
      <BaseSelect.Positioner data-mu-colorway={colorway} className="mu-menu-positioner z-menu-z" align="start" sideOffset={offset()}>
        <BaseSelect.Popup className={`${menuParts.PLATE} relative`} aria-label={label}>
          <ListGlide />
          {choices.map(choice => <BaseSelect.Item key={choice.value} value={choice.value} disabled={choice.disabled} aria-label={choice.label && choice.label !== choice.value ? `${choice.label} (${choice.value})` : choice.value} className={menuParts.LIVE_ROW}>
            <span aria-hidden className={menuParts.GLYPH}>{glyph(choice)}</span>
            <BaseSelect.ItemText className={menuParts.LABEL}>{choice.label ?? choice.value}</BaseSelect.ItemText>
            <BaseSelect.ItemIndicator keepMounted render={(indicatorProps, state) => <TickGlyph {...indicatorProps as React.SVGProps<SVGSVGElement>} mark={state.selected ? 'tick' : null} className="mu-select-mark select-mark" />} />
          </BaseSelect.Item>)}
        </BaseSelect.Popup>
      </BaseSelect.Positioner>
    </BaseSelect.Portal>
  </BaseSelect.Root>;
});
