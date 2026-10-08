'use client';

import * as React from 'react';
import { Field as BaseField } from '@base-ui/react/field';
import { Well } from '../well/well';
import { Kbd } from '../kbd/kbd';

/* FIELD: text input in a well, a leading glyph and trailing keycaps.
 *   large     44 (the palette's field): the caret is the focus, since a palette's field always has it
 *   regular   32, compact 28: the form sizes (they match the select); focus shows the flush green ring
 *   invalid   the foundation's invalid ring on the well; the input says aria-invalid
 *   disabled  the well at 40 %; the input is disabled
 * SEARCH FIELD: a button in a well that opens search (the dock's search well), light or graphite.
 * Field slots: Field.Root, Field.Icon, Field.Input, Field.Trail. */

export type FieldSize = 'large' | 'regular' | 'compact';

/* Styled with the theme's utilities (the field recipe on the well recipe). */
const FRAME = 'mu-field relative flex items-center cursor-text data-disabled:opacity-field-state-disabled data-disabled:cursor-default data-invalid:invalid-ring has-[input[data-invalid]]:invalid-ring has-[input[data-disabled]]:opacity-field-state-disabled';
const SIZES: Record<FieldSize, string> = {
  large: 'gap-field-field-gap h-field-field-height ps-field-field-pad-left pe-field-field-pad-right rounded-field-field-radius text-field-field-hint [&>.mu-field-icon>svg]:size-field-field-glyph',
  regular: 'gap-field-regular-gap h-field-regular-height ps-field-regular-pad-left pe-field-regular-pad-right rounded-field-regular-radius text-field-field-hint focus-within:focus-ring-flush [&>.mu-field-icon>svg]:size-field-regular-glyph',
  compact: 'gap-field-compact-gap h-field-compact-height ps-field-compact-pad-left pe-field-compact-pad-right rounded-field-compact-radius text-field-field-hint focus-within:focus-ring-flush [&>.mu-field-icon>svg]:size-field-compact-glyph',
};
const ICON = 'mu-field-icon inline-grid flex-none';
const INPUT = {
  large: 'mu-field-input text-entry flex-1 min-w-0 p-0 border-0 outline-none bg-transparent type-field-field text-field-field-ink caret-field-field-caret placeholder:text-field-field-hint focus-visible:outline-none disabled:cursor-default',
  form: 'mu-field-input text-entry flex-1 min-w-0 h-full p-0 border-0 outline-none bg-transparent type-ui text-field-field-ink caret-field-field-caret placeholder:text-field-field-hint focus-visible:outline-none disabled:cursor-default',
};
const TRAIL = 'mu-field-trail inline-flex items-center ms-auto';
const SEARCH = {
  graphite: 'mu-search-field box-border flex items-center gap-field-search-gap h-field-search-height min-w-field-search-min-width ps-field-search-pad-left pe-field-search-pad-right border-0 rounded-field-search-radius type-field-search cursor-text [&>.mu-field-icon>svg]:size-field-search-glyph [&>.mu-kbd]:ms-auto focus-visible:focus-ring-flush text-field-search-ink recipe-well-graphite',
  light: 'mu-search-field box-border flex items-center gap-field-search-gap h-field-search-height min-w-field-search-min-width ps-field-search-pad-left pe-field-search-pad-right border-0 rounded-field-search-radius type-field-search cursor-text [&>.mu-field-icon>svg]:size-field-search-glyph [&>.mu-kbd]:ms-auto focus-visible:focus-ring-flush text-field-field-hint recipe-well-field',
};

const FieldCtx = React.createContext<{ size: FieldSize; invalid?: boolean; disabled?: boolean }>({ size: 'large' });

export interface FieldRootProps extends React.HTMLAttributes<HTMLElement> {
  tone?: 'light' | 'graphite';
  /** large (44, the palette's field, the default), regular (32) or compact (28) for forms. */
  size?: FieldSize;
  /** The value will not be accepted: the invalid ring, and aria-invalid on the input. */
  invalid?: boolean;
  disabled?: boolean;
}

const Root = React.forwardRef<HTMLElement, FieldRootProps>(function FieldRoot({ tone = 'light', size = 'large', invalid, disabled, className, ...props }, ref) {
  const own = `${FRAME} ${SIZES[size]}`;
  return (
    <FieldCtx.Provider value={{ size, invalid, disabled }}>
      <Well ref={ref} as="label" variant={tone === 'graphite' ? 'graphite' : 'field'} data-size={size} data-invalid={invalid ? '' : undefined} data-disabled={disabled ? '' : undefined} className={className ? `${own} ${className}` : own} {...props} />
    </FieldCtx.Provider>
  );
});
function Icon({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span aria-hidden className={className ? `${ICON} ${className}` : ICON} {...props} />;
}
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function FieldInput({ className, ...props }, ref) {
  const { size, invalid, disabled } = React.useContext(FieldCtx);
  const own = size === 'large' ? INPUT.large : INPUT.form;
  // Base UI's control: inside a FormField it takes the label, description and error, and the field's states.
  return <BaseField.Control ref={ref} autoComplete="off" spellCheck={false} aria-invalid={invalid || undefined} disabled={disabled} className={className ? `${own} ${className}` : own} {...(props as BaseField.Control.Props)} />;
});
function Trail({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={className ? `${TRAIL} ${className}` : TRAIL} {...props} />;
}

export const Field = Object.assign(Root, { Icon, Input, Trail, Root });

export interface SearchFieldProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** What the well says: "Lens or action". */
  placeholder: string;
  icon?: React.ReactNode;
  /** The key that opens it (a keycap at the end): "⌘K". */
  shortcut?: string;
  tone?: 'light' | 'graphite';
}

/** A button in a well that opens search. */
export const SearchField = React.forwardRef<HTMLButtonElement, SearchFieldProps>(function SearchField({ placeholder, icon, shortcut = '⌘K', tone = 'graphite', className, type = 'button', ...props }, ref) {
  return (
    <button ref={ref} type={type} data-tone={tone} aria-keyshortcuts={shortcut === '⌘K' ? 'Meta+K' : undefined} className={className ? `${SEARCH[tone]} ${className}` : SEARCH[tone]} {...props}>
      {icon && <span aria-hidden className={ICON}>{icon}</span>}
      <span className="mu-search-field-text">{placeholder}</span>
      {shortcut && <Kbd surface={tone === 'graphite' ? 'strip' : 'default'} size="default">{shortcut}</Kbd>}
    </button>
  );
});
