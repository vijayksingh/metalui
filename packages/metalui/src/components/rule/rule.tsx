'use client';

import * as React from 'react';

/* RULE: an engraved groove between groups; graphite on dark chrome. Styled with the theme's
 * utilities (the rule recipe). */
export interface RuleProps extends React.HTMLAttributes<HTMLSpanElement> {
  orientation?: 'vertical' | 'horizontal';
  tone?: 'default' | 'graphite';
}

const ORIENTATIONS = {
  vertical: 'w-rule-thickness self-center mx-rule-margin',
  horizontal: 'h-rule-thickness',
};
const TONES = {
  default: 'recipe-rule',
  graphite: 'recipe-rule-graphite',
};

export function Rule({ orientation = 'vertical', tone = 'default', className, ...props }: RuleProps) {
  const own = `mu-rule block flex-none ${ORIENTATIONS[orientation]} ${TONES[tone]}`;
  return <span role="separator" aria-orientation={orientation} data-tone={tone} className={className ? `${own} ${className}` : own} {...props} />;
}
