import * as React from 'react';
import { Link, useSearchParams } from 'react-router';
import { Button, Field } from '@unlocalhosted/metalui';
import { Icon } from '@unlocalhosted/metalui/icons';
import { CATALOG, CATALOG_GROUPS, catalogMatches } from '../app/catalog';
import LibrarySpecimen from '../ui/LibrarySpecimen';
import './library.css';

export default function Library() {
  const [params, setParams] = useSearchParams();
  // Router navigation can settle after the next input event. Keep consecutive filter
  // edits based on the latest intent, including an immediate reset followed by typing.
  const pendingParams = React.useRef(params);
  React.useEffect(() => { pendingParams.current = params; }, [params]);
  const query = params.get('q') ?? '';
  const group = CATALOG_GROUPS.some(item => item.id === params.get('group')) ? params.get('group')! : 'all';
  const [active, setActive] = React.useState<string | null>(null);
  const matches = CATALOG.filter(part => catalogMatches(part, query));
  const visible = matches.filter(part => group === 'all' || part.group?.id === group);
  const groups = [...CATALOG_GROUPS, { id: 'other', title: 'More controls', description: '', names: [] as readonly string[] }];

  function update(key: string, value: string) {
    const next = new URLSearchParams(pendingParams.current);
    if (!value || value === 'all') next.delete(key); else next.set(key, value);
    setActive(null);
    pendingParams.current = next;
    setParams(next, { replace: true, preventScrollReset: true });
  }

  return (
    <div className="library mu-stack gap-mu-section">
      <header className="library-heading mu-stack gap-mu-related">
        <div className="mu-cluster gap-mu-group library-title-row">
          <h1>Component library</h1>
          <span className="library-count">{CATALOG.length} controls</span>
        </div>
        <p>Find the right piece. See its material, try how it feels, then open the details.</p>
        <div className="library-related mu-cluster gap-mu-related">
          <span>Building something bigger?</span>
          <Link to="/layers">Explore objects, instruments & places <Icon name="external" size={12} /></Link>
        </div>
      </header>

      <div className="library-discovery mu-stack gap-mu-group">
        <div className="library-search-row mu-cluster gap-mu-group">
          <Field size="regular" className="library-search">
            <Icon name="search" size={16} />
            <Field.Input aria-label="Search components" placeholder="Search by name or purpose…" value={query} onChange={event => update('q', event.target.value)} />
            {query && <button type="button" aria-label="Clear search" onClick={() => update('q', '')}><Icon name="close" size={14} /></button>}
          </Field>
          <p className="library-result" role="status" aria-live="polite">{visible.length} {visible.length === 1 ? 'component' : 'components'}{query ? ` matching “${query}”` : ''}</p>
        </div>
        <div className="library-filters mu-cluster gap-mu-space-8" role="group" aria-label="Filter by purpose">
          <button type="button" aria-pressed={group === 'all'} onClick={() => update('group', 'all')}>All <span>{matches.length}</span></button>
          {CATALOG_GROUPS.map(item => <button key={item.id} type="button" aria-pressed={group === item.id} onClick={() => update('group', item.id)}>{item.title}<span>{matches.filter(part => part.group?.id === item.id).length}</span></button>)}
        </div>
      </div>

      {visible.length === 0 ? (
        <section className="library-empty mu-stack gap-mu-related" aria-labelledby="library-empty-title">
          <h2 id="library-empty-title">No components found</h2>
          <p>Try a name like “Button” or a purpose like “choose”.{group !== 'all' ? ' You can also search across every group.' : ''}</p>
          <div className="mu-cluster gap-mu-related">
            {group !== 'all' && <Button onClick={() => update('group', 'all')}>Search all components</Button>}
            <Button onClick={() => { setActive(null); pendingParams.current = new URLSearchParams(); setParams({}, { replace: true, preventScrollReset: true }); }}>Reset filters</Button>
          </div>
        </section>
      ) : groups.map(section => {
        const entries = visible.filter(part => section.id === 'other' ? !part.group : part.group?.id === section.id);
        if (!entries.length) return null;
        entries.sort((a, b) => section.names.indexOf(a.name as never) - section.names.indexOf(b.name as never));
        return (
          <section key={section.id} id={`library-${section.id}`} className="library-section mu-stack gap-mu-group" aria-labelledby={`library-heading-${section.id}`}>
            <header className="library-section-heading mu-cluster gap-mu-group">
              <h2 id={`library-heading-${section.id}`}>{section.title}<span>{entries.length}</span></h2>
              <p>{section.description}</p>
            </header>
            <div className="library-grid mu-auto-grid gap-mu-group">
              {entries.map(part => {
                const trying = active === part.name;
                return (
                  <article key={part.name} className="library-card mu-stack gap-mu-space-16" data-component={part.name}>
                    <div className="library-preview" data-active={trying || undefined}>
                      <div className="library-specimen" inert={!trying} aria-hidden={!trying || undefined}>
                        <LibrarySpecimen key={`${part.name}-${trying}`} name={part.name} active={trying} />
                      </div>
                      <button type="button" className="library-try" aria-pressed={trying} aria-label={`${trying ? 'Stop trying' : 'Try'} ${part.label}`} onClick={() => setActive(trying ? null : part.name)}>{trying ? 'Done' : 'Try it'}<Icon name={trying ? 'check' : 'select'} size={12} /></button>
                    </div>
                    <div className="library-card-copy mu-stack gap-mu-space-6">
                      <h3><Link to={part.page!}>{part.label}<Icon name="external" size={16} /></Link></h3>
                      <p>{part.summary}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
      <footer className="library-footer mu-cluster gap-mu-group">
        <p>Shared materials. One light. Built to be handled.</p>
        <Link to="/foundations/materials">Meet the materials <Icon name="external" size={14} /></Link>
      </footer>
    </div>
  );
}
