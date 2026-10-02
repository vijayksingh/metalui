'use client';

import * as React from 'react';
import { Avatar as BaseAvatar } from '@base-ui/react/avatar';
import { Led, type LedKind } from '../led/led';

/* ─────────────────────────────────────────────────────────
 * AVATAR and AVATAR GROUP, a person as a small raised disc
 *
 *   rest      the initials engraved in ink2 on the raised surface
 *   photo     fades in over the initials on the settle spring once it has loaded; a broken photo
 *             never shows (the initials stay)
 *   presence  the LED part at the lower right, on a ring of the page's ground
 *   group     discs overlap, each ringed in the ground; a +N disc counts the rest
 *   open      hovering the group spreads the discs one grid step apart on the object spring (a
 *             stack opening); letting go settles them back on the release spring
 * Reduce Motion: the photo appears at once; the stack does not spread.
 * An object: it stands for a person. It uses the raised surface and the LED part.
 * ───────────────────────────────────────────────────────── */

export type AvatarSize = 'small' | 'regular' | 'large';

const DISC = 'mu-avatar relative inline-grid flex-none place-items-center rounded-full recipe-surface-raise-sm select-none';
const SIZE: Record<AvatarSize, string> = {
  small: 'size-avatar-size-small type-meta',
  regular: 'size-avatar-size-regular type-ui',
  large: 'size-avatar-size-large type-title',
};
const INITIALS = 'mu-avatar-initials text-ink2 uppercase';
const PHOTO = 'mu-avatar-photo absolute inset-0 size-full rounded-full object-cover avatar-photo';
const PRESENCE = 'mu-avatar-presence absolute right-0 bottom-0 inline-grid place-items-center leading-none rounded-full avatar-ring';

/** The first letters of the first and last words: "Ana Rocha" → "AR". */
export function initialsOf(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? '') + (words.length > 1 ? words[words.length - 1][0] : '')).toUpperCase();
}

export interface AvatarProps {
  /** The name used for initials and, by default, the accessible label. */
  name: string;
  /** Complete accessible label, independent of initials. Include presence when relevant; "" makes the disc decorative. */
  'aria-label'?: string;
  /** Their photo. */
  src?: string;
  size?: AvatarSize;
  /** Their presence, as the LED part: live (here), waiting (away), off. */
  presence?: Extract<LedKind, 'live' | 'waiting' | 'off'>;
  className?: string;
}

/** A person as a small raised disc: a photo, or their initials. */
export function Avatar({ name, 'aria-label': accessibleLabel, src, size = 'regular', presence, className }: AvatarProps) {
  const own = `${DISC} ${SIZE[size]}`;
  const decorative = accessibleLabel === '';
  const label = accessibleLabel ?? (presence ? `${name}, ${presence === 'live' ? 'here' : presence === 'waiting' ? 'away' : 'offline'}` : name);
  return (
    <BaseAvatar.Root role={decorative ? undefined : 'img'} aria-label={decorative ? undefined : label} aria-hidden={decorative || undefined} className={className ? `${own} ${className}` : own}>
      <BaseAvatar.Fallback className={INITIALS}>{initialsOf(name)}</BaseAvatar.Fallback>
      {src && <BaseAvatar.Image src={src} alt="" className={PHOTO} />}
      {presence && <span className={PRESENCE}><Led kind={presence} size={size === 'large' ? 'default' : 'small'} /></span>}
    </BaseAvatar.Root>
  );
}

export interface AvatarGroupProps {
  /** People, in order. */
  people: Pick<AvatarProps, 'name' | 'src' | 'presence' | 'aria-label'>[];
  /** How many discs before a +N disc counts the rest (4). */
  max?: number;
  size?: AvatarSize;
  /** Names the group for assistive tech: "Shared with". */
  'aria-label': string;
  className?: string;
}

/** People together: overlapping discs that spread when hovered. */
export function AvatarGroup({ people, max = 4, size = 'regular', className, ...aria }: AvatarGroupProps) {
  const shown = people.length > max ? people.slice(0, max - 1) : people;
  const rest = people.length - shown.length;
  const own = 'mu-avatar-group inline-flex items-center avatar-stack';
  return (
    <div role="group" aria-label={aria['aria-label']} className={className ? `${own} ${className}` : own}>
      {shown.map((p, i) => (
        <span key={p.name} className="inline-flex rounded-full avatar-ring" style={{ '--mu-avatar-i': i } as React.CSSProperties}>
          <Avatar {...p} size={size} />
        </span>
      ))}
      {rest > 0 && (
        <span className="inline-flex rounded-full avatar-ring" style={{ '--mu-avatar-i': shown.length } as React.CSSProperties}>
          <span role="img" aria-label={`${rest} more`} className={`${DISC} ${SIZE[size]} text-ink2 tabular-nums`}>+{rest}</span>
        </span>
      )}
    </div>
  );
}
