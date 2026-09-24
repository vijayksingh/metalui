'use client';

import * as React from 'react';
import { Well } from '../../components/well/well';
import { Surface } from '../../components/surface/surface';
import { Label } from '../../components/label/label';
import { Row } from '../../components/row/row';

/* ─────────────────────────────────────────────────────────
 * REGION (the reference design's .region): a composition
 *   Well(region) or Surface(lens) › Region.Header › Region.Name (Label title) + Region.Rule (Label engraved)
 *   + Region.Count (Label count); a pinned lens adds Region.Body › Region.Row (Row list) × n
 *
 * rest    a sunk well; the head names it, says the rule it carries, counts what is inside
 * over    a block is dragged above it: the well lights (green fill, 1 pt ring) and the rule turns
 *         accent to say "drop to mark tasks done", on settle; the host lands the block on the object spring
 * dim     an in-place lens has no match inside: .35
 * past    it did not exist at the scrubbed time: 0, and it takes no pointer
 * lens    a pinned lens: a frosted plate listing its matches as rows
 * rename  the name becomes a field; Enter commits, Escape restores
 * ───────────────────────────────────────────────────────── */

/* Layout from the region group. The whole fades on settle: .35 when dim, gone (and no pointer) in the
 * past; its transition replaces the well's, adding opacity. */
const ROOT = 'mu-region !region-motion data-dim:opacity-region-dim data-past:opacity-0 data-past:pointer-events-none';
const HEAD = 'mu-region-head absolute inset-x-0 top-0 bottom-auto box-border h-region-head-height pt-region-head-pad-top px-region-head-pad-x pb-0 flex items-baseline gap-region-head-gap cursor-grab';
const NAME = 'mu-region-name min-w-region-name-min';
const RULE = 'mu-region-rule flex-1 min-w-0 overflow-hidden text-ellipsis';
const BODY = 'mu-region-body absolute left-region-body-inset right-region-body-inset top-region-body-top bottom-region-body-inset overflow-hidden';
const ROW_META = 'mu-region-row-meta ml-auto pt-region-row-meta-top';

export interface RegionRootProps extends React.HTMLAttributes<HTMLDivElement> {
  over?: boolean;
  dim?: boolean;
  past?: boolean;
  /** A pinned lens: a frosted plate whose body lists rows. */
  lens?: boolean;
  width?: number;
  height?: number;
}

const Root = React.forwardRef<HTMLDivElement, RegionRootProps>(function RegionRoot({ over, dim, past, lens, width, height, className, style, ...props }, ref) {
  const shared = {
    ref: ref as React.Ref<HTMLElement>,
    role: 'group',
    radius: 'region' as const,
    'data-over': over ? '' : undefined,
    'data-dim': dim ? '' : undefined,
    'data-past': past ? '' : undefined,
    'data-lens': lens ? '' : undefined,
    className: className ? `${ROOT} ${className}` : ROOT,
    style: width === undefined ? style : { width, height, ...style },
    ...props,
  };
  return lens ? <Surface material="lens" {...shared} /> : <Well variant="region" over={over} {...shared} />;
});

function Header({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={className ? `${HEAD} ${className}` : HEAD} {...props} />;
}

export interface RegionNameProps {
  name: string;
  renaming?: boolean;
  onRename?: (name: string) => void;
  onRenameCancel?: () => void;
}

/** The name, in the title role; a field while renaming. Empty: "name this region" in ink3. */
function Name({ name, renaming, onRename, onRenameCancel }: RegionNameProps) {
  const [draft, setDraft] = React.useState(name);
  React.useEffect(() => { if (renaming) setDraft(name); }, [renaming, name]);
  if (!renaming) return <Label variant="title" className={NAME} placeholder="name this region">{name}</Label>;
  return (
    <Label
      as="input"
      variant="title"
      className={NAME}
      placeholder="name this region"
      aria-label="Region name"
      autoFocus
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => onRename?.(draft.trim())}
      onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
        if (e.key === 'Enter') { e.preventDefault(); onRename?.(draft.trim()); }
        if (e.key === 'Escape') { e.preventDefault(); onRenameCancel?.(); }
      }}
    />
  );
}

/** The rule in words; accent while a block is over the region. */
function Rule({ accent, className, ...props }: React.HTMLAttributes<HTMLElement> & { accent?: boolean }) {
  return <Label variant="engraved" tone={accent ? 'accent' : undefined} className={className ? `${RULE} ${className}` : RULE} {...props} />;
}

function Count({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return <Label variant="count" className={className ? `mu-region-count ${className}` : 'mu-region-count'} {...props} />;
}

function Body({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={className ? `${BODY} ${className}` : BODY} {...props} />;
}

export interface RegionRowProps extends React.HTMLAttributes<HTMLElement> {
  checked?: boolean;
  /** A leading checkbox (Checkbox size="row") for task rows. */
  lead?: React.ReactNode;
  /** A trailing engraving: the day, a count. */
  meta?: React.ReactNode;
}

/** A row in a pinned lens region: Row(list). Ticking its checkbox ticks the real block. */
function RegionRow({ checked, lead, meta, className, children, ...props }: RegionRowProps) {
  return (
    <Row.Root variant="list" tabIndex={0} checked={checked} className={className ? `mu-region-row ${className}` : 'mu-region-row'} {...props}>
      {lead}
      <Row.Text>{children}</Row.Text>
      {meta && <Label variant="engraved" className={ROW_META}>{meta}</Label>}
    </Row.Root>
  );
}

export interface RegionProps extends Omit<RegionRootProps, 'children'>, RegionNameProps {
  /** What the rule does, as the head says it: "marks tasks done", "tags them #poster". */
  rule?: string;
  /** What the rule does to a block dropped now: "drop to mark tasks done". Shown while over. */
  dropRule?: string;
  /** Blocks inside. */
  count?: number;
  width: number;
  height: number;
  /** A pinned lens region's rows. */
  children?: React.ReactNode;
}

/** A drawn rectangle with a name that carries a rule. Placement is meaning, and reversible. */
const RegionBlock = React.forwardRef<HTMLDivElement, RegionProps>(function Region(
  { name, rule, dropRule, count, over, lens, renaming, onRename, onRenameCancel, children, ...props },
  ref,
) {
  return (
    <Root ref={ref} over={over} lens={lens} aria-label={name ? `Region ${name}${rule ? `, ${rule}` : ''}` : 'Unnamed region'} {...props}>
      <Header>
        <Name name={name} renaming={renaming} onRename={onRename} onRenameCancel={onRenameCancel} />
        <Rule accent={over && !!dropRule}>{over && dropRule ? dropRule : rule}</Rule>
        {count ? <Count>{count}</Count> : null}
      </Header>
      {lens && <Body>{children}</Body>}
    </Root>
  );
});

export const Region = Object.assign(RegionBlock, { Root, Header, Name, Rule, Count, Body, Row: RegionRow });
export { RegionRow };
