# Avatar

A person, as a small raised disc. React: `Avatar` and `AvatarGroup` from `@unlocalhosted/metalui`, on Base UI Avatar. SwiftUI: `MetalAvatar` (work in progress). An object: the disc is the raised `surface`, presence is the LED part; the `avatar` recipe adds sizes, the ring and the group's spread.

## Use it for

- Showing who: an author, who is here, who something is shared with.

## Don't use it for

- Things that are not people (use an icon or a glyph), or a person's details (link to them; a preview card can show more).

## Anatomy

- Disc: raised surface, round; small 24, regular 32, large 44.
- Initials: the first letters of the first and last names, ink2, in the size's type.
- Photo: covers the disc once it has loaded.
- Presence: the LED at the lower right on a 2 ring of the page's ground.
- Group: discs overlap by 8, each ringed in the ground; past `max` (4), a +N disc.

## States and motion

| State | Look | Motion |
|---|---|---|
| loading | the initials | – |
| loaded | the photo | fades in on the settle spring |
| broken photo | the initials stay | – |
| group, hover | the discs apart | one grid step each, on the object spring |
| group, leave | back together | release spring |

Reduce Motion: the photo appears at once; the group does not spread.

## API

| React | SwiftUI |
|---|---|
| `Avatar` `name`, `aria-label`, `src`, `size` (`small`, `regular`, `large`), `presence` (`live`, `waiting`, `off`) | `MetalAvatar(name:image:accessibilityLabel:)` |
| `AvatarGroup` `people`, `max` (4), `size`, `aria-label` | – |

## Keyboard and accessibility

- By default, an avatar is an image named by the person's name (and presence: "Ana Rocha, here"). React `aria-label` and SwiftUI `accessibilityLabel` name it independently from the initials source. React's explicit label replaces the complete default label, so include presence in it when relevant: `<Avatar name="A Rocha" aria-label="Ana Rocha, host, here" presence="live" />` displays AR and announces "Ana Rocha, host, here". Each `AvatarGroup.people` entry accepts the same `aria-label` override.
- An explicit empty label (`aria-label=""` or `accessibilityLabel: ""`) hides the disc from assistive technology. Use this when adjacent text or the containing control already conveys the person's identity and presence.
- A group is a named `group`; the +N disc says "3 more". Avatars take no focus; wrap one in a link or button when it goes somewhere.

## Rules

- Always give the name for initials. Omit the optional accessible label to use the name and presence by default.
- Colour never carries presence alone: include it in a custom label or adjacent text, too.
