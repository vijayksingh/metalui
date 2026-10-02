import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Button, Calendar, DatePicker, FormField, Form } from '@unlocalhosted/metalui';
import { type SpringName } from '../../../../../packages/metalui/src/motion/springs.generated';
import { SPRING_NAMES, springVars } from '../../ui/springTuning';
import reactSource from '../../../../../packages/metalui/src/components/calendar/calendar.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/theme.css?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalCalendar.swift?raw';
import agentSource from '../../../../../packages/metalui/src/components/calendar/calendar.agent.md?raw';
import { ComponentPage } from '../../ui/ComponentPage';

/* ─────────────────────────────────────────────────────────
 * MONTH TUNER: the page's DialKit panel
 *
 *   spring   the spring the month's arrival rides (the choice lands on the part spring)
 *   travel   how far a new month comes from
 * ───────────────────────────────────────────────────────── */

const SEP_30 = new Date(2026, 8, 30);

function Month({ label, min, max = new Date(2027, 11, 31) }: { label: string; min?: Date; max?: Date }) {
  const [day, setDay] = React.useState<Date | null>(SEP_30);
  return (
    <div className="grid justify-items-center gap-8">
      <Calendar aria-label={label} value={day} onValueChange={setDay} defaultMonth={SEP_30} locale="en-GB" min={min} max={max} />
      <span className="type-meta text-ink3">{day ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'full' }).format(day) : 'No day chosen'}</span>
    </div>
  );
}

function MonthTuner() {
  const d = useDialKit('Calendar month', {
    spring: { type: 'select', options: SPRING_NAMES, default: 'settle' },
    travel: [8, 0, 32],
    slow: [1, 1, 10],
    earliestDay: [1, 1, 30, 1],
    latestDay: [30, 1, 30, 1],
  });
  const vars = { ...springVars('settle', d.spring as SpringName, d.slow), '--mu-motion-content': `${d.travel}px` } as React.CSSProperties;
  return <div data-testid="calendar-month-tuner" className="flex justify-center" style={vars}><Month label="Tuned calendar" min={new Date(2026, 8, Math.min(d.earliestDay, d.latestDay))} max={new Date(2026, 8, Math.max(d.earliestDay, d.latestDay))} /></div>;
}

function ControlledMonth() {
  const [day, setDay] = React.useState<Date | null>(SEP_30);
  const [month, setMonth] = React.useState(SEP_30);
  const [fixed, setFixed] = React.useState(false);
  const [requests, setRequests] = React.useState(0);
  const [delayed, setDelayed] = React.useState(false);
  const pending = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  React.useEffect(() => () => clearTimeout(pending.current), []);
  return (
    <div className="mu-stack items-center">
      <div className="mu-cluster justify-center">
        <Button onClick={() => setDay(new Date(2026, 9, 15))}>Choose 15 October</Button>
        <Button onClick={() => setDay(day ? new Date(day) : null)}>Refresh chosen day</Button>
        <Button onClick={() => setMonth(new Date(2026, 9, 1))}>Show October</Button>
        <Button aria-pressed={delayed} onClick={() => setDelayed(!delayed)}>Defer month change</Button>
        <Button aria-pressed={fixed} onClick={() => setFixed(!fixed)}>Keep month fixed</Button>
      </div>
      <Calendar aria-label="Controlled calendar" value={day} onValueChange={setDay} month={month} onMonthChange={(next) => {
        setRequests((n) => n + 1);
        clearTimeout(pending.current);
        if (!fixed) {
          if (delayed) pending.current = setTimeout(() => setMonth(next), 150);
          else setMonth(next);
        }
      }} locale="en-GB" />
      <output className="type-meta text-ink2">Month requests: {requests}</output>
      <Calendar aria-label="Following calendar" value={day} onValueChange={setDay} locale="en-GB" />
    </div>
  );
}


function SelectionModes() {
  const [range, setRange] = React.useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [many, setMany] = React.useState<Date[]>([]);
  return <div className="mu-stack gap-mu-group">
    <div className="mu-stack items-center"><Calendar mode="range" aria-label="Trip range" value={range} onValueChange={setRange} defaultMonth={SEP_30} months={2} min={new Date(2026, 8, 1)} max={new Date(2026, 9, 31)} minDays={2} maxDays={10} isDateUnavailable={(d) => d.getMonth() === 8 && d.getDate() === 20} unavailableLabel="Booked" locale="en-GB" weekNumbers markedDays={(d) => d.getDate() === 15 ? 'Concert' : false} /><output className="type-meta text-ink2">{range.start ? range.start.toLocaleDateString('en-GB') : 'No start'} – {range.end ? range.end.toLocaleDateString('en-GB') : 'No end'}</output></div>
    <div className="mu-cluster justify-center items-start gap-mu-group">
      <div className="mu-stack items-center"><Calendar mode="multiple" aria-label="Working days" value={many} onValueChange={setMany} defaultMonth={SEP_30} locale="en-GB" weekStartsOn={0} isDateUnavailable={(d) => d.getDay() === 0 || d.getDay() === 6} unavailableLabel="Weekend" /><output className="type-meta text-ink2">{many.length} days chosen</output><DatePicker mode="multiple" aria-label="Visit days" name="visits" value={many} onValueChange={setMany} defaultMonth={SEP_30} locale="en-GB" /></div>
      <div className="mu-stack"><span className="type-ui text-ink">Eligible dates: 10–20 September</span><DatePicker aria-label="Limited date" min={new Date(2026, 8, 10)} max={new Date(2026, 8, 20)} defaultMonth={SEP_30} locale="en-GB" /></div>
    </div>
  </div>;
}


function PickerForms() {
  const [submitted, setSubmitted] = React.useState('');
  const [rangeSubmitted, setRangeSubmitted] = React.useState('');
  const [date, setDate] = React.useState<Date | null>(null);
  const [range, setRange] = React.useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [instant, setInstant] = React.useState<Date | null>(new Date('2026-09-30T14:00:00Z'));
  const [zone, setZone] = React.useState('America/New_York');
  return <div className="mu-stack gap-mu-group">
    <Form aria-label="Date entry form" className="mu-stack" onSubmit={(e) => { e.preventDefault(); setSubmitted(JSON.stringify(Object.fromEntries(new FormData(e.currentTarget)))); }}>
      <FormField><FormField.Label>Delivery day</FormField.Label><DatePicker aria-label="Delivery day" name="delivery" required value={date} onValueChange={setDate} defaultMonth={SEP_30} min={new Date(2026, 8, 1)} max={new Date(2026, 9, 31)} isDateUnavailable={(d) => d.getDay() === 0 || d.getDay() === 6} unavailableLabel="Choose a working day" locale="en-GB" /><FormField.Description>Required working day in September or October.</FormField.Description><FormField.Error /></FormField>
      <Button type="submit">Save delivery</Button><output aria-label="Submitted dates" className="type-meta text-ink2">{submitted || 'No form submitted'}</output>
    </Form>
    <Form aria-label="Range entry form" className="mu-stack" onSubmit={(e) => { e.preventDefault(); setRangeSubmitted(JSON.stringify(Object.fromEntries(new FormData(e.currentTarget)))); }}>
    <FormField><FormField.Label>Holiday range</FormField.Label><DatePicker mode="range" aria-label="Holiday range" name="holiday" required value={range} onValueChange={setRange} defaultMonth={SEP_30} months={2} minDays={2} maxDays={14} locale="en-GB" presets={[{ label: 'Last 7 days', value: () => { const end = new Date(2026, 8, 30); return { start: new Date(2026, 8, 24), end }; } }]} /></FormField>
      <Button type="submit">Save holiday</Button><output aria-label="Submitted range" className="type-meta text-ink2">{rangeSubmitted || 'No range submitted'}</output>
    </Form>
    <FormField><FormField.Label>Read-only date</FormField.Label><DatePicker aria-label="Read-only date" value={SEP_30} readOnly locale="en-GB" /></FormField>
    <FormField disabled><FormField.Label>Disabled date</FormField.Label><DatePicker aria-label="Disabled date" value={SEP_30} locale="en-GB" /></FormField>
    <FormField><FormField.Label>Appointment</FormField.Label><DatePicker aria-label="Appointment" name="appointment" value={instant} onValueChange={setInstant} showTime timeZone={zone} onTimeZoneChange={setZone} timeZones={['America/New_York', 'Asia/Kolkata', 'UTC']} locale="en-GB" /><FormField.Description>The same instant displayed in your chosen time zone. DST gaps are refused; overlaps choose the first occurrence.</FormField.Description></FormField>
    <output aria-label="Appointment instant" className="type-meta text-ink2">{instant?.toISOString() ?? 'No appointment'}</output>
  </div>;
}

export default function CalendarPage() {
  const [due, setDue] = React.useState<Date | null>(null);
  return (
    <ComponentPage
      title="Calendar"
      lede="Choose a day, a range or independent dates. The chosen day lands into a raised thumb; turning the month, the title turns on the drum and the days come in from the side you head to. The date picker opens it from a form field."
      play={{ lede: 'Choose days, turn the month, or Tab in and use the arrow keys and Page Up / Down.', caption: 'September 2026 · weeks start on Monday (en-GB)', node: (
        <div className="flex flex-wrap items-start justify-center gap-40">
          <Month label="Trip day" />
          <div className="w-[240px]">
            <FormField>
              <FormField.Label>Due date</FormField.Label>
              <DatePicker aria-label="Due date" value={due} onValueChange={setDue} locale="en-GB" />
            </FormField>
          </div>
        </div>
      ) }}
      more={[{ id: 'entry', title: 'Date entry and forms', lede: 'Type the date segments in your browser’s locale, or choose from the calendar. Clear, Today and validated presets share the same value. Named hidden inputs submit ISO dates; required, read-only and FormField disabled state apply to the entire control. An appointment adds time and an IANA time zone.', node: <PickerForms /> }, { id: 'selections', title: 'Ranges and working days', lede: 'A trip spans 2–10 inclusive days across two months. Working days toggle independently; weekends announce why they cannot be chosen. ISO week numbers and event marks stay visible. Open the month title to jump to a year or month.', node: <SelectionModes /> }, { id: 'month', title: 'Tune the month', lede: 'The Calendar month panel swaps the spring the thumb and the month ride, sets how far a new month comes from, stretches time, and sets the first and last eligible September days.', node: <MonthTuner /> }, { id: 'controlled-month', title: 'Control the month', lede: 'Choose a day elsewhere: the following calendar reveals it. The controlled calendar keeps its own displayed month. Its host can accept a month request or keep the month fixed.', node: <ControlledMonth /> }]}
      usage={`const [day, setDay] = React.useState<Date | null>(null);

<Calendar aria-label="Trip day" value={day} onValueChange={setDay} min={new Date()} />

<DatePicker aria-label="Due date" name="due" required value={day} onValueChange={setDay} />

<Calendar mode="range" value={range} onValueChange={setRange} months={2} minDays={2} />`}
      sources={[
        { id: 'react', label: 'React', code: reactSource },
        { id: 'css', label: 'CSS', code: cssSource },
        { id: 'swift', label: 'SwiftUI', code: swiftSource },
        { id: 'agent', label: 'Agent guide', code: agentSource },
      ]}
      rules={[
        { id: 'CA1', title: 'Six rows, always', body: 'Every month shows six weeks, so the calendar never changes height.', origin: 'Ours' },
        { id: 'CA2', title: 'The month says which way', body: 'Later months come from the right and the title turns up; earlier ones the other way.', origin: 'Ours' },
        { id: 'CA3', title: 'The reader\'s week', body: 'The week starts where the locale starts it.', origin: 'Ours' },
      ]}
    />
  );
}
