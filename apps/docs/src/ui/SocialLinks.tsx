import * as React from 'react';

/* The maker's profiles and the source, as on dithered.dev: round marks in the masthead, and a labelled
 * group at the foot of the navigation where the masthead has no room (the phone's menu). The GitHub
 * mark carries the repository's live star count. */

const REPO = 'vijayksingh/metalui';
const STARS_KEY = 'metalui:github-stars';
const STARS_TTL = 60 * 60 * 1000;
let starsRequest: Promise<number | null> | null = null;

function readStars(): { count: number; at: number } | null {
  try { return JSON.parse(localStorage.getItem(STARS_KEY) ?? 'null'); } catch { return null; }
}

/* The count baked in at build time shows first; one live request per page load, at most one an hour
 * per visitor (the anonymous API allows 60 an hour per address), replaces it and is kept for next time. */
function fetchStars(): Promise<number | null> {
  starsRequest ??= fetch(`https://api.github.com/repos/${REPO}`, { headers: { Accept: 'application/vnd.github+json' } })
    .then((r) => (r.ok ? r.json() : null))
    .then((repo) => {
      const count = typeof repo?.stargazers_count === 'number' ? repo.stargazers_count : null;
      if (count !== null) try { localStorage.setItem(STARS_KEY, JSON.stringify({ count, at: Date.now() })); } catch { /* storage blocked */ }
      return count;
    })
    .catch(() => null);
  return starsRequest;
}

export function useGithubStars(): number | null {
  const [stars, setStars] = React.useState<number | null>(() => readStars()?.count ?? __GITHUB_STARS__);
  React.useEffect(() => {
    const kept = readStars();
    if (kept && Date.now() - kept.at < STARS_TTL) return;
    let live = true;
    fetchStars().then((count) => { if (live && count !== null) setStars(count); });
    return () => { live = false; };
  }, []);
  return stars;
}

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

const MARKS = {
  github: 'M12 .75a11.25 11.25 0 0 0-3.56 21.92c.56.1.77-.24.77-.54v-2.1c-3.13.68-3.79-1.33-3.79-1.33-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.69.08-.69 1.13.08 1.73 1.16 1.73 1.16 1 1.72 2.63 1.22 3.27.93.1-.73.39-1.22.71-1.5-2.5-.29-5.12-1.25-5.12-5.56 0-1.23.44-2.23 1.16-3.02-.12-.29-.5-1.43.11-2.98 0 0 .95-.3 3.1 1.16a10.78 10.78 0 0 1 5.64 0c2.15-1.46 3.09-1.16 3.09-1.16.61 1.55.23 2.69.11 2.98.72.79 1.16 1.79 1.16 3.02 0 4.32-2.63 5.27-5.13 5.55.4.35.76 1.03.76 2.08v3.11c0 .3.2.65.78.54A11.25 11.25 0 0 0 12 .75Z',
  x: 'M18.9 2H22l-6.77 7.74L23.2 22h-6.24l-4.89-7.42L5.57 22H2.44l8.17-9.34L.8 2h6.4l4.42 6.75L18.9 2ZM17.8 20h1.73L6.3 3.87H4.44L17.8 20Z',
  linkedin: 'M5.3 7.6H1.7V22h3.6V7.6ZM3.5 1a2.1 2.1 0 1 0 0 4.2 2.1 2.1 0 0 0 0-4.2ZM22 13.7c0-4.2-2.2-6.2-5.1-6.2-2.3 0-3.3 1.3-3.9 2.2V7.6H9.4V22H13v-8c0-2.1.4-4.1 3-4.1 2.5 0 2.5 2.4 2.5 4.2V22H22v-8.3Z',
} as const;

const LINKS: { mark: keyof typeof MARKS; href: string; label: string; short: string }[] = [
  { mark: 'github', href: `https://github.com/${REPO}`, label: 'MetalUI on GitHub', short: 'GitHub' },
  { mark: 'x', href: 'https://twitter.com/dprophecyguy', label: 'Vijay Singh on X (Twitter)', short: 'X / Twitter' },
  { mark: 'linkedin', href: 'https://www.linkedin.com/in/iamvijaysingh/', label: 'Vijay Singh on LinkedIn', short: 'LinkedIn' },
];

function Mark({ name }: { name: keyof typeof MARKS }) {
  return <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d={MARKS[name]} /></svg>;
}

/** The source with its star count, alone: the front door's corner, where the profiles don't belong. */
export function GithubStars() {
  const stars = useGithubStars();
  const label = stars !== null ? `MetalUI on GitHub, ${stars.toLocaleString('en')} ${stars === 1 ? 'star' : 'stars'}` : 'MetalUI on GitHub';
  return (
    <a className={stars !== null ? 'social-link social-stars' : 'social-link'} href={`https://github.com/${REPO}`} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}>
      <Mark name="github" />
      {stars !== null && <span className="social-count" aria-hidden="true">{compact.format(stars)}</span>}
    </a>
  );
}

/** Round marks for the masthead; `labelled` writes the names out, for the phone's menu. */
export function SocialLinks({ labelled = false }: { labelled?: boolean }) {
  const stars = useGithubStars();
  return (
    <div className={labelled ? 'social social-list' : 'social'} role="group" aria-label="MetalUI and its maker elsewhere">
      {LINKS.map((l) => {
        const count = l.mark === 'github' && stars !== null ? stars : null;
        const label = count !== null ? `${l.label}, ${count.toLocaleString('en')} ${count === 1 ? 'star' : 'stars'}` : l.label;
        return (
          <a key={l.mark} className={count !== null && !labelled ? 'social-link social-stars' : 'social-link'} href={l.href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}>
            <Mark name={l.mark} />
            {labelled && <span>{l.short}</span>}
            {count !== null && <span className="social-count" aria-hidden="true">{compact.format(count)}</span>}
          </a>
        );
      })}
    </div>
  );
}
