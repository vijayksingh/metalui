import { Link, useLocation, useSearchParams } from 'react-router';
import { Field } from '@unlocalhosted/metalui';
import { Icon } from '@unlocalhosted/metalui/icons';
import { NAV } from '../app/nav';
import { PARTS } from '../app/parts';
import './library.css';

export default function SectionIndex() {
  const { pathname } = useLocation();
  const [params, setParams] = useSearchParams();
  const group = NAV.find(group => group.to === pathname)!;
  const query = params.get('q') ?? '';
  const items = group.items.map(item => ({ ...item, description: PARTS.find(part => part.page === item.to)?.description }));
  const found = items.filter(item => `${item.label} ${item.description ?? ''}`.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <div className="library mu-stack gap-mu-section">
      <header className="library-heading mu-stack gap-mu-related">
        <div className="library-title-row mu-cluster gap-mu-group"><h1>{group.label}</h1><span className="library-count">{items.length} guides</span></div>
        <p>{group.description}</p>
      </header>
      <div className="library-search-row mu-cluster gap-mu-group">
        <Field className="library-search"><Icon name="search" size={16} /><Field.Input aria-label={`Search ${group.label.toLowerCase()}`} placeholder={`Search ${group.label.toLowerCase()}…`} value={query} onChange={event => setParams(event.target.value ? { q: event.target.value } : {}, { replace: true, preventScrollReset: true })} /></Field>
        <p className="library-result" role="status">{found.length} {found.length === 1 ? 'guide' : 'guides'}</p>
      </div>
      <div className="section-directory mu-auto-grid gap-mu-group">
        {found.map(item => <Link key={item.to} to={item.to} className="section-entry mu-stack gap-mu-related" state={{ sectionSearch: params.toString() }}>
          <div className="mu-cluster gap-mu-related"><h2>{item.label}</h2><Icon name="chevron" turn={270} size={16} animate={false} /></div>
          <p>{item.description ?? `Open the ${item.label.toLowerCase()} guide for examples and usage.`}</p>
        </Link>)}
      </div>
      {!found.length && <div className="library-empty mu-stack gap-mu-related"><h2>No guides found</h2><p>Try another name or clear your search.</p><button type="button" className="type-ui text-ink" onClick={() => setParams({})}>Clear search</button></div>}
    </div>
  );
}
