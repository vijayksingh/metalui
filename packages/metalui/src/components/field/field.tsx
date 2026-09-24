'use client';

import * as React from 'react';
import { Well } from '../well/well';
import { Kbd } from '../kbd/kbd';

/* FIELD: text input in a well, a leading glyph and trailing keycaps (the palette's field).
 * SEARCH FIELD: a button in a well that opens search (the dock's search well), light or graphite.
 * Field slots: Field.Root, Field.Icon, Field.Input, Field.Trail. */

/* Styled with the theme's utilities (the field recipe on the well recipe). */
const FIELD = 'mu-field flex items-center gap-field-field-gap h-field-field-height pl-field-field-pad-left pr-field-field-pad-right rounded-field-field-radius text-field-field-hint cursor-text [&>.mu-field-icon>svg]:size-field-field-glyph';
const ICON = 'mu-field-icon inline-grid flex-none';
const INPUT = 'mu-field-input flex-1 min-w-0 p-0 border-0 outline-none bg-transparent type-field-field text-field-field-ink caret-field-field-caret placeholder:text-field-field-hint focus-visible:outline-none';
const TRAIL = 'mu-field-trail inline-flex items-center ml-auto';
const SEARCH = {
  graphite: 'mu-search-field box-border flex items-center gap-field-search-gap h-field-search-height min-w-field-search-min-width pl-field-search-pad-left pr-field-search-pad-right border-0 rounded-field-search-radius type-field-search cursor-text [&>.mu-field-icon>svg]:size-field-search-glyph [&>.mu-kbd]:ml-auto focus-visible:focus-ring-flush text-field-search-ink recipe-well-graphite',
  light: 'mu-search-field box-border flex items-center gap-field-search-gap h-field-search-height min-w-field-search-min-width pl-field-search-pad-left pr-field-search-pad-right border-0 rounded-field-search-radius type-field-search cursor-text [&>.mu-field-icon>svg]:size-field-search-glyph [&>.mu-kbd]:ml-auto focus-visible:focus-ring-flush text-field-field-hint recipe-well-field',
};

const Root = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement> & { tone?: 'light' | 'graphite' }>(function FieldRoot({ tone = 'light', className, ...props }, ref) {
  return <Well ref={ref} as="label" variant={tone === 'graphite' ? 'graphite' : 'field'} className={className ? `${FIELD} ${className}` : FIELD} {...props} />;
});
function Icon({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span aria-hidden className={className ? `${ICON} ${className}` : ICON} {...props} />;
}
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function FieldInput({ className, ...props }, ref) {
  return <input ref={ref} autoComplete="off" spellCheck={false} className={className ? `${INPUT} ${className}` : INPUT} {...props} />;
});
function Trail({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={className ? `${TRAIL} ${className}` : TRAIL} {...props} />;
}

export const Field = Object.assign(Root, { Root, Icon, Input, Trail });

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
