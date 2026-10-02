'use client';
import * as React from 'react';
import { EnumCue, type EnumCueProps } from '../enum-cue/enum-cue';
import { Combobox } from '../combobox/combobox';
import { Mark } from '../mark/mark';
import { tagColor } from '../mark/identity.generated';

const valid = (tag: string) => /^#[\p{L}\p{N}\p{M}_-]+$/u.test(tag);
const recent = (tags: readonly string[]) => [...new Set(tags.filter(valid))];
export interface TagCueProps extends Omit<EnumCueProps, 'choices'> { recentTags: readonly string[] }
/** Recent source tags reuse the finite-state control; their colour remains their canonical identity. */
const Root = React.forwardRef<HTMLElement, TagCueProps>(function TagCueRoot({ value, recentTags, ...props }, ref) {
  const tags = recent(recentTags);
  if (valid(value) && !tags.includes(value)) tags.unshift(value);
  return <EnumCue {...props} ref={ref} value={value} choices={tags.map(tag => ({ value: tag, tint: tagColor(tag) }))} />;
});
export interface TagPickerProps {
  recentTags: readonly string[];
  label: string;
  onChoose: (tag: string) => void;
  disabled?: boolean;
}
/** Open after the host captures its unfinished # range. Choosing, rather than searching, edits source. */
function Picker({ recentTags, label, onChoose, disabled }: TagPickerProps) {
  return <Combobox items={recent(recentTags)} value={null} onValueChange={tag => { if (tag) onChoose(tag); }}
    aria-label={label} placeholder="Find a recent tag" emptyText="No recent tags" disabled={disabled} defaultOpen autoFocus renderItem={tag => <Mark kind="tag">{tag}</Mark>} />;
}
export const TagCue = Object.assign(Root, { Picker });
