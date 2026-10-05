import * as React from 'react';
import {
  Accordion, AlertDialog, Breadcrumbs, Button, ButtonGroup, Checkbox, CheckboxGroup,
  ColourCue, Combobox, CommandPalette, DateCue, DatePicker, Dialog, DrawTools,
  EnumCue, Fan, Field, FormField, IconButton, Kbd, Link, LinkCue, MarkLine,
  Menu, MenuItem, Menubar, Meter, NavigationMenu, NumberField, NumericCue,
  Pagination, PersonCue, Popover, PreviewCard, Progress, Radio, RadioGroup,
  RenameEditor, ScrollArea, Select, Settings, Sheet, Slider, Spinner, StatusBadge,
  Switch, Switcher, TabList, TabPanel, Tabs, TagCue, Textarea, ToastProvider,
  Toggle, Toolbar, ToolButton, ToolStrip, Tooltip, TooltipProvider, useToast,
  type DrawTool, type NumericCueValue,
} from '@unlocalhosted/metalui';
import { Icon } from '@unlocalhosted/metalui/icons';

const OPTIONS = [{ value: 'personal', label: 'Personal' }, { value: 'team', label: 'Team' }, { value: 'shared', label: 'Shared' }];
const TODAY = '2026-10-05'; // Fixed illustrative date: browsing never changes the specimen.
const TODAY_DATE = new Date(2026, 9, 5);
const MONEY = [{ id: 'USD', label: 'dollars', factor: 1, step: 1, format: (n: number) => `$${n}`, source: (n: number) => `$${n}` }];

function ToastTrigger() {
  const toast = useToast();
  return <Button icon={<Icon name="check" />} onClick={() => toast.show({ title: 'Changes saved', sub: 'Your sample settings are up to date.' })}>Save settings</Button>;
}

/** Small, local examples of the published controls. No page mounts, network calls or app actions. */
export default function LibrarySpecimen({ name, active }: { name: string; active: boolean }) {
  const [checked, setChecked] = React.useState(true);
  const [value, setValue] = React.useState('personal');
  const [number, setNumber] = React.useState(60);
  const [result, setResult] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [file, setFile] = React.useState('Field notes.txt');
  const [colour, setColour] = React.useState('#FF6B3D');
  const [day, setDay] = React.useState(TODAY);
  const [amount, setAmount] = React.useState<NumericCueValue>({ value: 40, unit: 'USD' });
  const [person, setPerson] = React.useState('Alex');
  const [tag, setTag] = React.useState('#design');
  const [url, setUrl] = React.useState('https://metalui.dev');
  const [tool, setTool] = React.useState<DrawTool | null>('pen');
  const [ink, setInk] = React.useState<'ink' | 'red' | 'blue' | 'green' | 'amber'>('ink');
  const [width, setWidth] = React.useState<'fine' | 'regular' | 'bold'>('regular');
  const full = (node: React.ReactNode) => <div className="library-specimen-full mu-stack gap-mu-related">{node}</div>;
  const actions = <><MenuItem onSelect={() => setResult('Sample duplicated')}>Duplicate</MenuItem><MenuItem onSelect={() => setResult('Sample pinned')}>Pin</MenuItem></>;
  const reply = result && <span className="library-specimen-reply" role="status">{result}</span>;

  switch (name) {
    case 'button': return <div className="mu-stack gap-mu-related items-center"><Button cap="primary" icon={<Icon name={result ? 'check' : 'save'} />} onClick={() => setResult('Saved')}>{result || 'Save changes'}</Button><Button size="compact" onClick={() => setResult('')}>Cancel</Button></div>;
    case 'icon-button': return <div className="mu-cluster gap-mu-related"><IconButton variant="tool" label="Pin sample" icon={<Icon name="pin" />} pressed={checked} onClick={() => setChecked(!checked)} /><IconButton variant="ghost" label="Duplicate sample" icon={<Icon name="duplicate" />} onClick={() => setResult('Copied')} />{reply}</div>;
    case 'button-group': return <ButtonGroup aria-label="Sample history"><Button icon={<Icon name="undo" />} onClick={() => setResult('Undo')}>Undo</Button><Button icon={<Icon name="redo" />} onClick={() => setResult('Redo')}>Redo</Button>{reply}</ButtonGroup>;
    case 'toggle': return <Toggle pressed={checked} onPressedChange={setChecked} lamp>Snap to grid</Toggle>;
    case 'menu': return <div className="mu-stack gap-mu-related items-center"><Menu heading="Sample note" trigger={<Button icon={<Icon name="more" />}>Actions</Button>}>{actions}</Menu>{reply}</div>;
    case 'toolbar': return <Toolbar aria-label="Sample tools"><ToolButton label="Select" icon={<Icon name="select" />} pressed={value === 'personal'} onClick={() => setValue('personal')} /><ToolButton label="Write" icon={<Icon name="text" />} pressed={value === 'team'} onClick={() => setValue('team')} /><ToolButton label="Draw" icon={<Icon name="pen" />} pressed={value === 'shared'} onClick={() => setValue('shared')} /></Toolbar>;
    case 'field': return full(<Field size="regular"><Icon name="search" size={14} /><Field.Input aria-label="Find a note" placeholder="Find a note…" /></Field>);
    case 'textarea': return full(<Textarea aria-label="Sample note" placeholder="Leave a little room for ideas…" />);
    case 'select': return <Select aria-label="Workspace" options={OPTIONS} defaultValue="personal" />;
    case 'combobox': return full(<Combobox aria-label="Find a workspace" items={['Personal', 'Team', 'Shared', 'Archive']} placeholder="Find a workspace…" />);
    case 'checkbox': return <div className="mu-stack gap-mu-related"><label className="mu-cluster gap-mu-space-8 type-ui"><Checkbox aria-label="Keep a local copy" checked={checked} onCheckedChange={on => setChecked(!!on)} />Keep a local copy</label><label className="mu-cluster gap-mu-space-8 type-ui"><Checkbox aria-label="Include attachments" defaultChecked={false} />Include attachments</label></div>;
    case 'checkbox-group': return <CheckboxGroup defaultValue={['notes']} allValues={['notes', 'images']}><CheckboxGroup.Item value="notes">Notes</CheckboxGroup.Item><CheckboxGroup.Item value="images">Images</CheckboxGroup.Item></CheckboxGroup>;
    case 'radio': return <RadioGroup aria-label="Export format" defaultValue="png"><Radio value="png">PNG</Radio><Radio value="svg">SVG</Radio></RadioGroup>;
    case 'switch': return <label className="mu-cluster gap-mu-related type-ui">Live sync<Switch aria-label="Live sync" checked={checked} onCheckedChange={setChecked} /></label>;
    case 'slider': return full(<Slider aria-label="Volume" value={number} onValueChange={setNumber} showValue startIcon={<Icon name="volume" />} format={n => `${n}%`} />);
    case 'number-field': return <NumberField aria-label="Copies" defaultValue={2} min={1} max={10} />;
    case 'switcher': return <Switcher aria-label="Workspace view" value={value} onValueChange={setValue} options={OPTIONS} />;
    case 'calendar': return <DatePicker aria-label="Choose a date" defaultValue={TODAY_DATE} defaultMonth={TODAY_DATE} today={TODAY_DATE} />;
    case 'form-field': return full(<FormField name="sample-title"><FormField.Label>Project name</FormField.Label><Field size="regular"><Field.Input placeholder="Untitled project" /></Field><FormField.Description>You can change this later.</FormField.Description></FormField>);
    case 'rename-editor': return full(active ? <RenameEditor value={file} file label="Rename sample file" onRename={setFile} onCancel={() => setResult('Rename cancelled')} onDone={() => setResult('Name saved')} /> : <div className="mu-stack gap-mu-related items-center"><span className="type-ui">{file}</span><Button icon={<Icon name="pen" />} onClick={() => setResult('Choose Try it to rename')}>Rename…</Button></div>);
    case 'tabs': return full(<Tabs defaultValue="notes"><TabList aria-label="Sample content" items={[{ value: 'notes', label: 'Notes' }, { value: 'files', label: 'Files' }]} /><TabPanel value="notes"><p className="library-sample-line">A place for small ideas.</p></TabPanel><TabPanel value="files"><p className="library-sample-line">Two files, kept together.</p></TabPanel></Tabs>);
    case 'accordion': return full(<Accordion><Accordion.Item value="export"><Accordion.Trigger>Export options</Accordion.Trigger><Accordion.Panel>PNG, SVG or PDF.</Accordion.Panel></Accordion.Item><Accordion.Item value="sharing"><Accordion.Trigger>Sharing</Accordion.Trigger><Accordion.Panel>Only people you invite.</Accordion.Panel></Accordion.Item></Accordion>);
    case 'link': return <Link href="/foundations/materials">Explore materials</Link>;
    case 'breadcrumbs': return <Breadcrumbs aria-label="Sample path" items={[{ id: 'home', label: 'Library', href: '/components' }, { id: 'notes', label: 'Notes' }, { id: 'draft', label: 'Draft' }]} />;
    case 'pagination': return <Pagination aria-label="Sample result pages" page={Math.round(number / 20)} count={5} onPageChange={n => setNumber(n * 20)} siblings={0} />;
    case 'menubar': return <div className="mu-stack gap-mu-related items-center"><Menubar aria-label="Sample app commands"><Menubar.Menu label="File">{actions}</Menubar.Menu><Menubar.Menu label="Edit"><MenuItem onSelect={() => setResult('Undo')}>Undo</MenuItem><MenuItem onSelect={() => setResult('Redo')}>Redo</MenuItem></Menubar.Menu></Menubar>{reply}</div>;
    case 'navigation-menu': return <NavigationMenu aria-label="Sample site sections"><NavigationMenu.Item label="Explore"><NavigationMenu.Link href="/foundations" description="Materials, spacing and motion.">Foundations</NavigationMenu.Link><NavigationMenu.Link href="/icons" description="Glyphs that move.">Icons</NavigationMenu.Link></NavigationMenu.Item></NavigationMenu>;
    case 'scroll-area': return full(<ScrollArea className="library-scroll-sample"><div className="mu-stack gap-mu-related">{['Field notes', 'Sketchbook', 'Collected links', 'Reading list', 'Weekend plans', 'Small ideas'].map(text => <p className="library-sample-line" key={text}>{text}</p>)}</div></ScrollArea>);
    case 'dialog': return <><Button onClick={() => setOpen(true)}>Open dialog</Button>{active && <Dialog open={open} onOpenChange={setOpen}><Dialog.Popup aria-describedby="catalog-dialog-description"><Dialog.Title>A little more space</Dialog.Title><p id="catalog-dialog-description" className="type-body text-ink2">Focus stays here until you are finished.</p><Dialog.Actions><Button onClick={() => setOpen(false)}>Done</Button></Dialog.Actions></Dialog.Popup></Dialog>}</>;
    case 'alert-dialog': return <><Button cap="destructive" onClick={() => setOpen(true)}>Discard draft</Button>{active && <AlertDialog open={open} onOpenChange={setOpen}><AlertDialog.Popup><AlertDialog.Title>Discard this sample?</AlertDialog.Title><AlertDialog.Description>This is a local example. Your work is untouched.</AlertDialog.Description><AlertDialog.Actions><AlertDialog.Cancel /><AlertDialog.Confirm onClick={() => setResult('Sample discarded')}>Discard</AlertDialog.Confirm></AlertDialog.Actions></AlertDialog.Popup></AlertDialog>}</>;
    case 'sheet': return <Sheet side="right"><Sheet.Trigger render={<Button icon={<Icon name="sidebar" />}>Open inspector</Button>} /><Sheet.Popup><Sheet.Title>Sample inspector</Sheet.Title><Sheet.Description>Keep the workspace in view.</Sheet.Description><Sheet.Close render={<Button>Done</Button>} /></Sheet.Popup></Sheet>;
    case 'popover': return <Popover><Popover.Trigger><Button icon={<Icon name="share" />}>Share</Button></Popover.Trigger><Popover.Content><Popover.Title>Sample sharing</Popover.Title><Popover.Description>Choose who can see this note.</Popover.Description><Popover.Body><Select aria-label="Sample permission" options={[{ value: 'view', label: 'Can view' }, { value: 'edit', label: 'Can edit' }]} defaultValue="view" /></Popover.Body></Popover.Content></Popover>;
    case 'tooltip': return <TooltipProvider><Tooltip label="Keep this note close"><IconButton variant="ghost" label="Pin sample note" icon={<Icon name="pin" />} /></Tooltip></TooltipProvider>;
    case 'preview-card': return <PreviewCard preview={{ title: 'Soft Hardware', description: 'Shared materials for objects you can operate.', host: 'metalui.dev' }}><Link href="/foundations/materials">Soft Hardware</Link></PreviewCard>;
    case 'command-palette': return <><Button icon={<Icon name="search" />} onClick={() => setOpen(true)}>Find a command <Kbd size="small">⌘K</Kbd></Button>{active && <CommandPalette open={open} onOpenChange={setOpen} aria-label="Sample commands" items={[{ id: 'note', label: 'New note', section: 'Create' }, { id: 'folder', label: 'New folder', section: 'Create' }]} onRun={item => { setResult(item.label); setOpen(false); }} />}{reply}</>;
    case 'status': return <div className="mu-stack gap-mu-related items-center"><StatusBadge led="live">Synced</StatusBadge><StatusBadge led="waiting">Draft</StatusBadge></div>;
    case 'progress': return full(<><Progress value={number} state="running" label="Export" showValue /><Button size="compact" onClick={() => setNumber(number === 100 ? 0 : Math.min(100, number + 20))}>{number === 100 ? 'Reset' : 'Advance'}</Button></>);
    case 'meter': return full(<><Meter value={number} label="Level" showValue /><Button size="compact" onClick={() => setNumber(number >= 100 ? 0 : number + 20)}>Change level</Button></>);
    case 'spinner': return <div className="mu-stack gap-mu-related items-center"><Button cap="primary" aria-busy icon={<Spinner showDelay={0} minVisible={0} longAfter={0} label="Sample saving" />} onClick={() => setResult('Sample saved')}>Save</Button><span className="type-ui text-ink2">Waiting stays inside the action.</span>{reply}</div>;
    case 'toast': return <ToastProvider><ToastTrigger /></ToastProvider>;
    case 'fan': return <Fan aria-label="Canvas mode"><Fan.Label>Tools</Fan.Label><Fan.Picker label="Mode" value={value} options={[{ value: 'personal', label: 'Select', icon: <Icon name="select" /> }, { value: 'team', label: 'Write', icon: <Icon name="text" /> }, { value: 'shared', label: 'Draw', icon: <Icon name="pen" /> }]} onValueChange={setValue} /></Fan>;
    case 'draw-tools': return <div className="library-wide-specimen"><DrawTools tool={tool} onToolChange={setTool} ink={ink} onInkChange={setInk} width={width} onWidthChange={setWidth} /></div>;
    case 'tool-strip': return <div className="mu-stack gap-mu-related items-center"><span className="type-ui text-ink2">3 notes · select to reveal actions</span><Button icon={<Icon name="group" />} onClick={() => setResult('3 notes selected')}>Select all</Button>{active && result && <div className="library-wide-specimen"><ToolStrip label="3 notes" count={3} items={[{ label: 'Pin', icon: <Icon name="pin" />, onSelect: () => setResult('Pinned') }, { label: 'Copy', icon: <Icon name="copy" />, onSelect: () => setResult('Copied') }]} /></div>}{reply}</div>;
    case 'settings': return full(<Settings><Settings.Section title="Workspace"><Settings.Row name="Live sync"><Switch aria-label="Sample live sync" defaultChecked /></Settings.Row><Settings.Row name="Quiet mode"><Switch aria-label="Sample quiet mode" /></Settings.Row></Settings.Section></Settings>);
    case 'colour-cue': return <MarkLine>Paint <ColourCue label="Paint colour" value={colour} onChange={setColour} />.</MarkLine>;
    case 'date-cue': return <MarkLine>Meet <DateCue value={day} today={TODAY} min="2026-10-01" max="2026-10-31" footprint={['next Wednesday', '2026-10-31']} label="Meeting day" onValueChange={setDay} />.</MarkLine>;
    case 'numeric-cue': return <MarkLine>Budget <NumericCue value={amount} units={MONEY} footprint={['$100']} min={0} max={100} label="Budget" kind="amount" onValueChange={setAmount} />.</MarkLine>;
    case 'enum-cue': return <MarkLine>Task <EnumCue value={checked ? 'in progress' : 'done'} choices={[{ value: 'in progress' }, { value: 'done' }]} label="Task state" onChange={next => setChecked(next === 'in progress')} />.</MarkLine>;
    case 'person-cue': return <MarkLine>Ask <PersonCue value={person} choices={[{ value: 'Alex' }, { value: 'Sam' }, { value: 'Morgan' }]} label="Assigned person" onChange={setPerson} />.</MarkLine>;
    case 'tag-cue': return <MarkLine>Filed in <TagCue value={tag} recentTags={['#design', '#notes', '#ideas']} label="Project tag" onChange={setTag} />.</MarkLine>;
    case 'link-cue': return <MarkLine><LinkCue value={url} footprint={['https://metalui.dev/foundations']} label="Reference" onChange={setUrl} /></MarkLine>;
    default: return <span className="library-sample-line">Preview coming soon. Open the guide below.</span>;
  }
}
