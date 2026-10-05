/** The enlarged master glyph receives the catalog glyph; size cuts stay separate. */
export function iconDetailTarget(path: string) {
  return /^\/icons\/(?:life\/)?[^/]+\/?$/.test(path) && !['/icons/life', '/icons/guide', '/icons/life/guide', '/icons/morph'].includes(path.replace(/\/$/, ''))
    ? '.icon-detail-specimen > svg'
    : undefined;
}
