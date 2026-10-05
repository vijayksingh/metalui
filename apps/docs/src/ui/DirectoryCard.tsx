import * as React from 'react';
import { Link } from 'react-router';
import { Icon } from '@unlocalhosted/metalui/icons';
import { useCatalogTransition } from '../app/catalog-transition';

/** One link covers a dormant specimen and its explanation; controls never steal input. */
export function DirectoryCard({ to, label, caption, index, search, target, children }: {
  to: string; label: string; caption: string; index: string; search: string; target?: string; children: React.ReactNode;
}) {
  const root = React.useRef<HTMLElement>(null);
  const name = to.split('/').at(-1)!;
  useCatalogTransition(to, root, '.place-card-copy h2 > span', target);
  return <article ref={root} className="place-card mu-stack gap-mu-related" data-item={name} data-place={index === '/places' ? name : undefined}>
    {children}
    <Link to={to} viewTransition className="place-card-copy mu-stack gap-mu-related" state={{ sectionSearch: search, sectionIndex: index }}>
      <div className="mu-cluster gap-mu-related"><h2><span className="inline-block">{label}</span></h2><Icon name="chevron" turn={270} size={16} animate={false} /></div>
      <p>{caption}</p>
    </Link>
  </article>;
}
