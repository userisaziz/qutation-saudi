import { useMemo } from 'react';
import { DownloadIcon, PlusIcon } from 'lucide-react';
import { Plate, PlateRow } from '@/components/app/Plate';
import { DataTable, type Column } from '@/components/app/DataTable';
import { EmptyHint } from '@/components/app/EmptyHint';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { CONTRACT_TONE, GAP_TONE, QUOTE_TONE } from '@/config/tones';
import {
  CATEGORY_LIST,
  CONTRACT_BY_ID,
  RATINGS,
  SERVICE_DESCRIPTION,
  dnOf,
} from '@/domain/catalog';
import { fmt } from '@/domain/format';
import { gapSummary, totals } from '@/domain/pricing';
import { scheduleOf } from '@/data/schedule';
import { usePortal } from '@/state/portal';
import type { Ctab } from '@/state/portal';
import type { Contract, Quote, RateRow } from '@/domain/types';
import { cn } from '@/lib/utils';

/**
 * One contract: the term it runs to, the flat rate lines it locks, the
 * wording every proposal from it carries, and the quotations already drawn
 * against it. Rates are fixed for the whole term and VAT inclusive, so no
 * screen here computes a price — it resolves one.
 */
const PER_PAGE = 12;
const ALL = 'all';

const TABS: Array<{ id: Ctab; label: string }> = [
  { id: 'rates', label: 'Rate schedule' },
  { id: 'services', label: 'Services' },
  { id: 'bp', label: 'T&C / Notes' },
  { id: 'quotes', label: 'Quotations' },
];

export default function ContractDetail() {
  const { state, actions, isAdmin } = usePortal();
  const C = CONTRACT_BY_ID[state.cid];
  const schedule = useMemo(() => scheduleOf(state.adds, C.id), [state.adds, C.id]);
  const quotes = useMemo(() => state.quotes.filter((q) => q.cid === C.id), [state.quotes, C.id]);
  const live = C.status !== 'Expired';

  const counts: Record<Ctab, number | null> = {
    rates: schedule.length,
    services: C.services.length,
    bp: null,
    quotes: quotes.length,
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl">{C.customer}</h1>
            <span
              className={cn(
                'rounded-full border px-2.5 py-1 text-2xs leading-none font-medium',
                CONTRACT_TONE[C.status],
              )}
            >
              {C.status}
            </span>
          </div>
          <p className="text-sm text-ink-3">
            {C.legal} · {C.ct} · ARC {C.arc}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <Button variant="outline" onClick={actions.startImport}>
              <DownloadIcon /> Import rate sheet
            </Button>
          )}
          <Button
            onClick={actions.newQuote}
            disabled={!live}
            title={live ? undefined : 'Contract term has ended'}
          >
            <PlusIcon /> New quotation
          </Button>
        </div>
      </div>

      <PlateRow className="grid-cols-2 lg:grid-cols-5">
        <Plate label="Term" value="5 years" sub={C.termText} />
        <Plate label="Remaining" value={C.remaining} sub={`${C.pct} elapsed`} emphasis />
        <Plate
          label="Total contract value"
          value={`SAR ${(C.tcv / 1e6).toFixed(2)}M`}
          sub={`ACV SAR ${(C.tcv / 5e6).toFixed(2)}M`}
        />
        <Plate
          label="Rate lines"
          value={String(schedule.length)}
          sub="Flat for full term · VAT incl."
          emphasis
        />
        <Plate
          label="Service bundles"
          value={String(C.services.length)}
          sub="Defined on this contract"
        />
      </PlateRow>

      <Tabs
        value={state.ctab}
        onValueChange={(v) => actions.set({ ctab: v as Ctab, page: 0 })}
        className="gap-4"
      >
        <TabsList className="w-full justify-start gap-0 overflow-x-auto border-b border-b-rule bg-transparent p-0">
          {TABS.map((t) => (
            <TabsTrigger
              key={t.id}
              value={t.id}
              className="h-auto rounded-none border-0 border-b-2 border-b-transparent px-3 text-ink-3 shadow-none data-[state=active]:border-b-ink data-[state=active]:bg-transparent data-[state=active]:text-ink"
            >
              {t.label}
              {counts[t.id] != null && (
                <em className="ml-1.5 text-ink-3 not-italic">{counts[t.id]}</em>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {state.ctab === 'rates' && <Rates contract={C} />}
      {state.ctab === 'services' && <Services contract={C} schedule={schedule} />}
      {state.ctab === 'bp' && <Boilerplate contract={C} />}
      {state.ctab === 'quotes' && <ContractQuotes quotes={quotes} />}
    </div>
  );
}

/** The locked schedule, filtered and paged. Read-only: rates change by import or by the queue, never here. */
function Rates({ contract }: { contract: Contract }) {
  const { state, actions, setState } = usePortal();
  const rows = useMemo(() => scheduleOf(state.adds, contract.id), [state.adds, contract.id]);
  const v = state.sf;

  const filtered = useMemo(() => {
    const text = v.q.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (!v.cat || r.cat === v.cat) &&
        (!v.rating || r.rating === v.rating) &&
        (!v.svc || r.svc === v.svc) &&
        (!text || `${r.model} ${r.size} ${dnOf(r.size)}`.toLowerCase().includes(text)),
    );
  }, [rows, v.cat, v.rating, v.svc, v.q]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const page = Math.min(state.page, pages - 1);
  const slice = useMemo(
    () => filtered.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE),
    [filtered, page],
  );

  const setFilter = (k: 'cat' | 'rating' | 'svc', value: string) =>
    setState((s) => ({ ...s, sf: { ...s.sf, [k]: value === ALL ? '' : value }, page: 0 }));

  const columns: Column<RateRow>[] = [
    { key: 'cat', header: 'Category', width: 'w-[10%]', mobile: 'meta', cell: (r) => r.cat },
    { key: 'model', header: 'Model', width: 'w-[18%]', mobile: 'primary', cell: (r) => r.model },
    {
      key: 'size',
      header: 'Size',
      width: 'w-[13%]',
      mobile: 'meta',
      cell: (r) => `${r.size} · ${dnOf(r.size)}`,
    },
    {
      key: 'rating',
      header: 'Rating',
      width: 'w-[12%]',
      mobile: 'meta',
      cell: (r) => <span className="text-ink-3">{r.rating}</span>,
    },
    {
      key: 'svc',
      header: 'Service',
      width: 'w-[20%]',
      mobile: 'meta',
      cell: (r) => <span className="text-ink-3">{r.svc}</span>,
    },
    {
      key: 'uom',
      header: 'UOM',
      width: 'w-[5%]',
      mobile: 'hide',
      cell: () => <span className="text-ink-3">EA</span>,
    },
    {
      key: 'rate',
      header: 'Rate (SAR)',
      width: 'w-[11%] text-right',
      mobile: 'figure',
      cell: (r) => <span className="font-extrabold">{fmt(r.rate)}</span>,
    },
    {
      key: 'ver',
      header: 'Version',
      width: 'w-[11%]',
      mobile: 'meta',
      cell: (r) => (
        <span className={cn('text-xs', r.ver === 'v2' ? 'text-clay' : 'text-ink-3')}>
          {r.ver === 'v2' ? 'v2 · Admin' : 'v1 · import'}
        </span>
      ),
    },
  ];

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect
          label="Filter by category"
          value={v.cat || ALL}
          onChange={(x) => setFilter('cat', x)}
          options={[
            { value: ALL, label: 'All categories' },
            ...CATEGORY_LIST.map((x) => ({ value: x, label: x })),
          ]}
        />
        <FilterSelect
          label="Filter by rating"
          value={v.rating || ALL}
          onChange={(x) => setFilter('rating', x)}
          options={[
            { value: ALL, label: 'All ratings' },
            ...RATINGS.map((x) => ({ value: x, label: x })),
          ]}
        />
        <FilterSelect
          label="Filter by service"
          value={v.svc || ALL}
          onChange={(x) => setFilter('svc', x)}
          options={[
            { value: ALL, label: 'All services' },
            ...contract.services.map((x) => ({ value: x, label: x })),
          ]}
        />
        <Input
          value={v.q}
          placeholder="Model or size"
          aria-label="Search rate schedule"
          className="w-full max-w-45"
          onChange={(e) => setState((s) => ({ ...s, sf: { ...s.sf, q: e.target.value }, page: 0 }))}
        />
      </div>

      <DataTable
        columns={columns}
        rows={slice}
        rowKey={(r, i) => `${r.cat}|${r.model}|${r.size}|${r.rating}|${r.svc}|${i}`}
        empty={
          <EmptyHint
            title="No rates match these filters"
            body="Clear a filter, or search by the valve model and the size marked on the work order."
          />
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-ink-3">
          {filtered.length
            ? `Showing ${page * PER_PAGE + 1}–${Math.min(filtered.length, page * PER_PAGE + PER_PAGE)} of ${filtered.length} rates`
            : '0 rates'}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => actions.set({ page: Math.max(0, page - 1) })}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pages - 1}
            onClick={() => actions.set({ page: Math.min(pages - 1, page + 1) })}
          >
            Next
          </Button>
        </div>
      </div>
    </>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-auto min-w-40" size="sm" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** The scopes this contract pays for, and how many rate lines each one carries. */
function Services({ contract, schedule }: { contract: Contract; schedule: RateRow[] }) {
  return (
    <>
      <div className="flex flex-col gap-px overflow-hidden rounded-lg border border-rule bg-rule">
        {contract.services.map((s) => (
          <div
            key={s}
            className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 bg-paper-3 px-3 py-2.5"
          >
            <span className="flex min-w-0 basis-full flex-col gap-1 sm:basis-auto">
              <b className="font-semibold">{s}</b>
              <span className="max-w-prose text-sm text-ink-3">{SERVICE_DESCRIPTION[s]}</span>
            </span>
            <span className="text-sm whitespace-nowrap text-ink-3">
              {schedule.filter((r) => r.svc === s).length} rates
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-ink-3">
        Service bundles are defined per contract. OH Level-1 and OH Level-2 are separately priced
        scopes.
      </p>
    </>
  );
}

/** The wording printed on every proposal drawn from this contract. */
function Boilerplate({ contract }: { contract: Contract }) {
  const { state, actions, isAdmin, role } = usePortal();
  const bp = state.bp[contract.id];

  const save = () => {
    actions.pushAudit(
      'Boilerplate',
      'Updated Terms & Conditions and notes — reason: proposal wording review',
      contract.ct,
      role,
    );
    actions.notify('Boilerplate saved', `T&C and notes updated on ${contract.ct}`);
  };

  return (
    <>
      <div className="grid gap-3 lg:grid-cols-2">
        <label className="flex flex-col gap-2 rounded-lg border border-rule bg-paper-3 p-3">
          <span className="text-sm font-medium">Terms &amp; Conditions</span>
          <Textarea
            rows={9}
            value={bp.tc}
            disabled={!isAdmin}
            onChange={(e) => actions.saveBoilerplate(contract.id, { tc: e.target.value })}
          />
        </label>
        <label className="flex flex-col gap-2 rounded-lg border border-rule bg-paper-3 p-3">
          <span className="text-sm font-medium">Notes</span>
          <Textarea
            rows={9}
            value={bp.notes}
            disabled={!isAdmin}
            onChange={(e) => actions.saveBoilerplate(contract.id, { notes: e.target.value })}
          />
        </label>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="max-w-prose text-sm text-ink-3">
          Printed on every proposal for {contract.ct}. Finalised proposals keep the text they were
          issued with.
        </span>
        {isAdmin && <Button onClick={save}>Save boilerplate</Button>}
      </div>
    </>
  );
}

/** Quotations already drawn against this contract. */
function ContractQuotes({ quotes }: { quotes: Quote[] }) {
  const { actions } = usePortal();

  if (!quotes.length) {
    return (
      <EmptyHint
        title="No quotations on this contract yet"
        body="Start one from New quotation; lines are priced straight off this schedule."
      />
    );
  }

  const columns: Column<Quote>[] = [
    {
      key: 'no',
      header: 'Quotation',
      width: 'w-[16%]',
      mobile: 'primary',
      cell: (q) => <b className="font-semibold">{q.no}</b>,
    },
    { key: 'wo', header: 'WO', width: 'w-[12%]', mobile: 'meta', cell: (q) => q.hdr.wo || '—' },
    {
      key: 'evmc',
      header: 'EVMC',
      width: 'w-[12%]',
      mobile: 'hide',
      cell: (q) => <span className="text-ink-3">{q.hdr.evmc || '—'}</span>,
    },
    { key: 'date', header: 'Issued', width: 'w-[10%]', mobile: 'meta', cell: (q) => q.hdr.date },
    {
      key: 'gaps',
      header: 'Open gaps',
      width: 'w-[20%]',
      mobile: 'meta',
      cell: (q) => {
        const [label, tone] = gapSummary(q);
        return <span className={cn('text-sm', GAP_TONE[tone])}>{label}</span>;
      },
    },
    {
      key: 'total',
      header: 'Total (SAR)',
      width: 'w-[15%] text-right',
      mobile: 'figure',
      cell: (q) => <span className="font-semibold">{fmt(totals(q).grand)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      width: 'w-[15%]',
      mobile: 'hide',
      cell: (q) => (
        <span
          className={cn(
            'inline-block rounded-full border px-2.5 py-1 text-2xs leading-none font-medium',
            QUOTE_TONE[q.status],
          )}
        >
          {q.status}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={quotes}
      rowKey={(q) => q.id}
      onRow={(q) => actions.go('editor', { qid: q.id, cid: q.cid })}
    />
  );
}
