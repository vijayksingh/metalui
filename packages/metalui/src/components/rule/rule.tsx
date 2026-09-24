'use client';

import * as React from 'react';
import './rule.css';

/* RULE: an engraved groove between groups; graphite on dark chrome. */

export interface RuleProps extends React.HTMLAttributes<HTMLSpanElement> {
  orientation?: 'vertical' | 'horizontal';
  tone?: 'default' | 'graphite';
}

export function Rule({ orientation = 'vertical', tone = 'default', className, ...props }: RuleProps) {
  return <span role="separator" aria-orientation={orientation} data-tone={tone} className={className ? `mu-rule ${className}` : 'mu-rule'} {...props} />;
}
