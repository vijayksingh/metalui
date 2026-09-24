'use client';

import * as React from 'react';
import { Well } from '../well/well';
import { Kbd } from '../kbd/kbd';
import './field.css';

/* FIELD: text input in a well, a leading glyph and trailing keycaps (the palette's field).
 * SEARCH FIELD: a button in a well that opens search (the dock's search well), light or graphite.
 * Field slots: Field.Root, Field.Icon, Field.Input, Field.Trail. */

const Root = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement> & { tone?: 'light' | 'graphite' }>(function FieldRoot({ tone = 'light', className, ...props }, ref) {
  return <Well ref={ref} as="label" variant={tone === 'graphite' ? 'graphite' : 'field'} className={className ? `mu-field ${className}` : 'mu-field'} {...props} />;
});
function Icon({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span aria-hidden className={className ? `mu-field-icon ${className}` : 'mu-field-icon'} {...props} />;
}
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function FieldInput({ className, ...props }, ref) {
  return <input ref={ref} autoComplete="off" spellCheck={false} className={className ? `mu-field-input ${className}` : 'mu-field-input'} {...props} />;
});
function Trail({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={className ? `mu-field-trail ${className}` : 'mu-field-trail'} {...props} />;
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
    <button ref={ref} type={type} data-tone={tone} aria-keyshortcuts={shortcut === '⌘K' ? 'Meta+K' : undefined} className={className ? `mu-search-field ${className}` : 'mu-search-field'} {...props}>
      {icon && <span aria-hidden className="mu-field-icon">{icon}</span>}
      <span className="mu-search-field-text">{placeholder}</span>
      {shortcut && <Kbd surface={tone === 'graphite' ? 'strip' : 'default'} size="default">{shortcut}</Kbd>}
    </button>
  );
});
