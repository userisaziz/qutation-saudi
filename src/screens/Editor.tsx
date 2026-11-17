import { useMemo } from 'react';
import type { ReactNode } from 'react';
import {
  CheckIcon,
  DownloadIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  TriangleAlertIcon,
  XIcon,
} from 'lucide-react';
import { Icon } from '@/components/app/Icon';
import { Plate, PlateRow } from '@/components/app/Plate';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { QUOTE_TONE } from '@/config/tones';
import {
  CATEGORY_CODE,
  CATEGORY_LIST,
  DN,
  LINE_ICON,
  RATINGS,
  SERVICE_CODE,
  SERVICE_SHORT,
  SIZES,
  VALVE_MODELS,
} from '@/domain/catalog';
import { addDays, fmt } from '@/domain/format';
import { keyOf, resolveRate, sizeText, totals, withinTermOf } from '@/domain/pricing';
import { publishedMap, scheduleOf } from '@/data/schedule';
import { usePortal } from '@/state/portal';
import type { Contract, Identity, Line, Quote, QuoteHeader } from '@/domain/types';
import { cn } from '@/lib/utils';

/**
 * The composer. One line is five positions — category, model, size, flange
 * rating, service bundle — and those five either resolve a locked rate on
 * this contract or they do not, in which case the line is flagged and the
 * total refuses it. Everything else on this screen is around that.
 */

const ID_KEYS = ['cat', 'model', 'size', 'rating', 'svc'] as const;
type IdentityKey = (typeof ID_KEYS)[number];
/** Radix reserves the empty string for its own placeholder. */
const NONE = '_none';

interface Check {
  ok: boolean;
  label: string;
  detail?: string;
}

export default function Editor() {
  const { quote: q, quoteContract: C, isAdmin, actions } = usePortal();
  const locked = q.status !== 'Draft';
  const isDraft = !locked;
  const T = totals(q);
  const gaps = T.nc + T.miss;

  const checks = useMemo<Check[]>(
    () => [
      { ok: q.lines.length > 0, label: 'Add at least one line' },
      { ok: T.nc === 0, label: 'Lines without a contract rate', detail: String(T.nc) },
      { ok: T.miss === 0, label: 'Valves missing a tag', detail: String(T.miss) },
      { ok: !!q.hdr.wo.trim(), label: 'Work order no. missing' },
      { ok: withinTermOf(C, q.hdr.date), label: 'Issue date outside term' },
    ],
    [C, T.miss, T.nc, q.hdr.wo, q.hdr.date, q.lines.length],
  );
  const can = isDraft && checks.every((c) => c.ok);

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl">{q.no}</h1>
              <span
                className={cn(
                  'rounded-full border px-2.5 py-1 text-2xs leading-none font-medium',
                  QUOTE_TONE[q.status],
                )}
              >
                {q.status}
              </span>
            </div>
            <span className="text-sm text-ink-3">
              {C.customer} · WO {q.hdr.wo || '—'} · created {q.createdAt}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => actions.go('preview')}>
              <EyeIcon /> Preview proposal
            </Button>
            {isDraft && (
              <>
                <Button variant="outline" onClick={actions.saveDraft}>
                  Save draft
                </Button>
                <Button
                  onClick={actions.finalise}
                  disabled={!can}
                  title={can ? undefined : 'Resolve the checklist first'}
                >
                  Finalise quotation
                </Button>
              </>
            )}
            {q.status === 'Finalised' && (
              <>
                <Button variant="outline" onClick={actions.markClosed}>
                  Mark closed
                </Button>
                <Button variant="outline" onClick={actions.revise}>
                  Create revision
                </Button>
              </>
            )}
            {locked && (
              <Button onClick={actions.downloadPdf}>
                <DownloadIcon /> Download PDF
              </Button>
            )}
          </div>
        </div>

        <PlateRow className="grid-cols-2 xl:grid-cols-4">
          <Plate label="Total" value={fmt(T.grand)} sub="SAR, VAT inclusive" emphasis tone="ink" />
          <Plate label="Lines" value={String(q.lines.length)} sub={`${T.priced} priced`} emphasis />
          <Plate label="Valves" value={String(T.valves)} sub="one tag row each" emphasis />
          <Plate
            label="Open gaps"
            value={String(gaps)}
            sub={gaps ? 'blocking finalise' : 'nothing outstanding'}
            tone={gaps ? 'amber' : 'paper'}
            emphasis
          />
        </PlateRow>
      </section>

      {locked && (
        <div className="flex gap-3 rounded-lg border border-rule bg-paper-3 p-3 shadow-card">
          <Icon id="ic-rate-locked" size={18} className="mt-0.5 shrink-0 text-ink" />
          <div className="flex min-w-0 flex-col gap-1">
            <b className="font-semibold">
              {q.status === 'Finalised' ? `Finalised ${q.finAt} by ${q.finBy}` : 'Closed'}
            </b>
            <p className="max-w-prose text-sm text-ink-3">
              This quotation is immutable: rates, lines and boilerplate are frozen as issued.
              Corrections become a new quotation via Create revision.
            </p>
          </div>
        </div>
      )}

      {isDraft && T.nc > 0 && (
        <div className="flex gap-3 rounded-lg border border-amber bg-amber p-3 text-ink">
          <TriangleAlertIcon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          <div className="flex min-w-0 flex-col gap-1">
            <b className="font-semibold">{`${T.nc} ${T.nc > 1 ? 'lines are' : 'line is'} not contracted`}</b>
            <p className="max-w-prose text-sm">
              {isAdmin
                ? `Publish the missing rate on the flagged line below, or from the Rate queue. It fills every blank line for that combination on ${C.ct}.`
                : 'Saved and excluded from the total. Finalising stays blocked until an Admin publishes the rate.'}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-4">
          <Details q={q} contract={C} locked={locked} />

          <section className="overflow-hidden rounded-lg border border-rule bg-paper-3 shadow-card">
            <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-rule px-4 py-3">
              <h2 className="text-lg">
                Line items <span className="text-ink-3">({q.lines.length})</span>
              </h2>
              <span className="inline-flex items-center gap-1.5 text-xs text-ink-3">
                <Icon id="ic-rate-locked" size={14} /> Rates locked to {C.ct}
              </span>
            </header>

            <div className="flex flex-col">
              {q.lines.map((l) => (
                <LineRow key={l.id} line={l} contract={C} locked={locked} isAdmin={isAdmin} />
              ))}

              {!q.lines.length && (
                <div className="border-b border-rule px-3 py-6 text-center">
                  <b className="block text-md font-extrabold">No line items yet</b>
                  <span className="text-sm text-ink-3">Add the first valve batch below.</span>
                </div>
              )}

              {isDraft && <Composer contract={C} />}
            </div>
          </section>

          <QuoteCosts q={q} locked={locked} />
        </div>

        <aside className="min-w-0">
          <div className="xl:sticky xl:top-32">
            <Summary q={q} contract={C} isDraft={isDraft} can={can} checks={checks} />
          </div>
        </aside>
      </div>
    </div>
  );
}

/** References from the customer's inquiry and the SAP log. */
function Details({ q, contract: C, locked }: { q: Quote; contract: Contract; locked: boolean }) {
  const { actions } = usePortal();
  const dateOk = withinTermOf(C, q.hdr.date);

  const text = (k: keyof QuoteHeader, label: string, placeholder: string) => (
    <label key={k} className="flex min-w-0 flex-col gap-1">
      <span className="text-xs text-ink-3">{label}</span>
      <Input
        value={q.hdr[k]}
        disabled={locked}
        placeholder={placeholder}
        onChange={(e) => actions.setHeader(k, e.target.value)}
      />
    </label>
  );

  return (
    <section className="overflow-hidden rounded-lg border border-rule bg-paper-3 shadow-card">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-rule px-4 py-3">
        <h2 className="text-lg">Quotation details</h2>
        <p className="text-xs text-ink-3">
          References from the customer&rsquo;s inquiry and the SAP log.
        </p>
      </header>
      <div className="grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-4">
        <ReadonlyField label="Contract" value={C.ct} />
        <ReadonlyField label="ARC contract no." value={C.arc} />
        {text('wo', 'Work order no.', 'e.g. WO-8842117')}
        {text('rfq', 'RFQ no.', '')}
        {text('evmc', 'EVMC no.', 'SAP doc no.')}
        {text('attn', 'Attention to', '')}

        <label className="flex min-w-0 flex-col gap-1">
          <span className="text-xs text-ink-3">Issue date</span>
          <Input
            value={q.hdr.date}
            disabled={locked}
            placeholder="DD/MM/YY"
            aria-invalid={!dateOk && !locked ? true : undefined}
            className={cn(!dateOk && !locked && 'border-bad')}
            onChange={(e) => actions.setHeader('date', e.target.value)}
          />
          {!dateOk && !locked && (
            <span className="text-xs text-bad">Outside contract term {C.termText}</span>
          )}
        </label>

        <label className="flex min-w-0 flex-col gap-1">
          <span className="text-xs text-ink-3">Offer validity</span>
          <Select
            value={q.hdr.validity}
            onValueChange={(v) => actions.setHeader('validity', v)}
            disabled={locked}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['30', '60', '90'].map((d) => (
                <SelectItem key={d} value={d}>
                  {d} days
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-ink-3">
            Valid until {addDays(q.hdr.date, Number(q.hdr.validity))}
          </span>
        </label>
      </div>
    </section>
  );
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex min-w-0 flex-col gap-1">
      <span className="text-xs text-ink-3">{label}</span>
      <span className="min-h-(--control-h) rounded-md border border-rule bg-paper-2 px-2.5 py-1.5 break-words">
        {value}
      </span>
    </span>
  );
}

/** One line: the head is the decision, the panel underneath is the evidence. */
function LineRow({
  line: l,
  contract: C,
  locked,
  isAdmin,
}: {
  line: Line;
  contract: Contract;
  locked: boolean;
  isAdmin: boolean;
}) {
  const { state, actions } = usePortal();
  const nc = l.rate == null;
  const costs = l.extras.reduce((a, e) => a + Number(e.amount.replace(/[^0-9.]/g, '') || 0), 0);
  const done = l.valves.filter((v) => v.tag).length;
  const tagsMissing = done < l.qty && !locked;
  const total = l.rate == null ? null : l.rate * l.qty + costs;
  const showResolve = nc && isAdmin && !locked;
  const showWaiting = nc && !isAdmin && !locked;
  const form = state.res[l.id] ?? { rate: '', from: '', reason: '', err: false };

  const blanks = useMemo(() => {
    let lines = 0;
    let qs = 0;
    state.quotes
      .filter((x) => x.cid === C.id && x.status === 'Draft')
      .forEach((x) => {
        const n = x.lines.filter((y) => y.rate == null && keyOf(y) === keyOf(l)).length;
        if (n) {
          lines += n;
          qs += 1;
        }
      });
    return lines
      ? `${lines} ${lines > 1 ? 'lines' : 'line'} on ${qs} ${qs > 1 ? 'quotations' : 'quotation'}`
      : 'no blank lines';
  }, [C.id, l, state.quotes]);

  const state_tone = nc
    ? 'bg-amber text-ink'
    : tagsMissing
      ? 'bg-amber-soft text-ink'
      : 'bg-sage-pale text-forest';

  return (
    <Collapsible
      open={l.open}
      onOpenChange={() => actions.toggleLine(l.id)}
      className="border-b border-rule"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="h-auto min-w-0 flex-1 justify-start gap-2.5 border-rule px-0 py-0 text-left hover:bg-transparent"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-full border border-rule bg-paper-2 text-ink">
              <Icon id={LINE_ICON[l.cat]} size={18} />
            </span>
            <span className="flex min-w-0 flex-col items-start gap-0.5 text-left">
              <b className="truncate font-semibold">
                {l.cat} · {l.model}
              </b>
              <small className="truncate text-xs text-ink-3">
                {sizeText(l.size)} · {l.rating} · {SERVICE_SHORT[l.svc] ?? l.svc}
              </small>
              <span
                className={cn(
                  'mt-0.5 rounded-full px-2 py-0.5 text-2xs leading-none',
                  state_tone,
                )}
              >
                {nc ? 'Not contracted' : tagsMissing ? 'Tags missing' : 'Priced'}
              </span>
            </span>
          </Button>
        </CollapsibleTrigger>

        {/* Below sm the price cells claim their own right-aligned line; above they sit inline after the title. */}
        <div className="flex w-full items-end justify-end gap-3 sm:w-auto sm:justify-start sm:gap-4">
          <Cell label="Qty">
            <span className="font-extrabold">{l.qty}</span>
          </Cell>
          <Cell label="Unit rate">
            {l.rate == null ? (
              <span className="text-ink-4" aria-label="Not contracted">
                —
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-extrabold">
                <Icon id="ic-rate-locked" size={13} /> {fmt(l.rate)}
              </span>
            )}
          </Cell>
          <Cell label="Total">
            <span className="flex flex-col items-end">
              <span className={cn('font-extrabold', nc && 'font-normal text-ink-4')}>
                {total == null ? 'Excluded' : fmt(total)}
              </span>
              {costs > 0 && <small className="text-2xs text-ink-3">incl. costs {fmt(costs)}</small>}
            </span>
          </Cell>
          {!locked && (
            <Button
              variant="outline"
              size="icon"
              aria-label={`Edit line ${l.cat} ${l.model}`}
              onClick={() => actions.editLine(l)}
            >
              <PencilIcon />
            </Button>
          )}
        </div>
      </div>

      <CollapsibleContent>
        {showResolve && (
          <div className="mx-3 mb-3 flex flex-col gap-3 rounded-lg border border-rule bg-paper-2 p-3">
            <div className="flex flex-col gap-0.5">
              <b className="font-extrabold">Supply the contract rate for this combination</b>
              <span className="text-sm text-ink-3">
                Publishing adds it to {C.ct} and fills {blanks}. Priced and finalised lines are
                never changed.
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
              <Field label="Rate (SAR / EA)">
                <Input
                  value={form.rate}
                  inputMode="decimal"
                  placeholder="0.00"
                  aria-invalid={form.err ? true : undefined}
                  className={cn('text-right', form.err && 'border-bad')}
                  onChange={(e) => actions.setResolve(l.id, { rate: e.target.value, err: false })}
                />
              </Field>
              <Field label="Valid from">
                <Input
                  value={form.from}
                  placeholder="25/10/26"
                  onChange={(e) => actions.setResolve(l.id, { from: e.target.value })}
                />
              </Field>
              <Field label="Reason">
                <Input
                  value={form.reason}
                  placeholder={`e.g. Agreed with ${C.customer} procurement`}
                  aria-invalid={form.err ? true : undefined}
                  className={cn(form.err && 'border-bad')}
                  onChange={(e) => actions.setResolve(l.id, { reason: e.target.value, err: false })}
                />
              </Field>
              <Button onClick={() => actions.resolveLine(l)}>Publish to schedule</Button>
            </div>
            {form.err && (
              <span className="text-xs text-bad">A rate above zero and a reason are required.</span>
            )}
          </div>
        )}

        {showWaiting && (
          <div className="mx-3 mb-3 rounded-md border border-amber bg-amber px-3 py-2 text-sm text-ink">
            Waiting for an Admin rate · excluded from total
          </div>
        )}

        <div className="flex flex-col gap-3 px-3 pb-3">
          <p className="max-w-prose text-sm text-ink-3">{l.desc}</p>

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="flex flex-col gap-2 rounded-lg border border-rule bg-paper p-3">
              <span className="inline-flex items-center gap-1.5 text-sm font-medium">
                <Icon id="ic-tag" size={14} /> Valve tags
              </span>
              {l.valves.map((v, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-5 shrink-0 text-xs text-ink-3">{i + 1}</span>
                  <Input
                    value={v.tag}
                    disabled={locked}
                    placeholder="e.g. A10-PSV-08B"
                    aria-label={`Tag ${i + 1}`}
                    className={cn(!v.tag && !locked && 'border-amber')}
                    onChange={(e) => actions.setValve(l.id, i, { tag: e.target.value })}
                  />
                  <Input
                    value={v.serial}
                    disabled={locked}
                    placeholder="Serial"
                    aria-label={`Serial ${i + 1}`}
                    className={cn('max-w-36', !v.serial && !locked && 'border-amber')}
                    onChange={(e) => actions.setValve(l.id, i, { serial: e.target.value })}
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2 rounded-lg border border-rule bg-paper p-3">
              <span className="text-sm font-medium">Line costs</span>
              {l.extras.map((x, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={x.label}
                    disabled={locked}
                    placeholder="Parts, hydrotest…"
                    aria-label={`Cost ${i + 1} description`}
                    onChange={(e) => actions.setLineCost(l.id, i, { label: e.target.value })}
                  />
                  <Input
                    value={x.amount}
                    disabled={locked}
                    inputMode="decimal"
                    placeholder="0.00"
                    aria-label={`Cost ${i + 1} amount`}
                    className="w-24 text-right"
                    onChange={(e) => actions.setLineCost(l.id, i, { amount: e.target.value })}
                  />
                  {!locked && (
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label={`Remove cost ${i + 1}`}
                      onClick={() => actions.removeLineCost(l.id, i)}
                    >
                      <XIcon />
                    </Button>
                  )}
                </div>
              ))}
              {!locked && (
                <Button
                  variant="outline"
                  className="self-start"
                  onClick={() => actions.addLineCost(l.id)}
                >
                  <PlusIcon /> Add cost
                </Button>
              )}
            </div>
          </div>

          {!locked && (
            <Button
              variant="destructive"
              className="self-end"
              onClick={() => actions.removeLine(l.id)}
            >
              Remove line
            </Button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function Cell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="flex flex-col items-end gap-0.5 sm:min-w-20">
      <span className="text-2xs leading-none text-ink-3">{label}</span>
      <span className="text-right">{children}</span>
    </span>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-xs text-ink-3">{label}</span>
      {children}
    </label>
  );
}

/** The signature control: five positions, one locked rate, or none. */
function Composer({ contract: C }: { contract: Contract }) {
  const { state, actions, quote: q } = usePortal();
  const sh = state.sheet;
  const rows = useMemo(() => scheduleOf(state.adds, C.id), [state.adds, C.id]);

  const reach = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => ID_KEYS.forEach((k) => set.add(`${k}|${r[k]}`)));
    return (c: Identity) => ID_KEYS.every((k) => !c[k] || set.has(`${k}|${c[k]}`));
  }, [rows]);

  const published = useMemo(() => publishedMap(state.adds, C.id), [state.adds, C.id]);
  const original = sh.id != null ? (q.lines.find((x) => x.id === sh.id) ?? null) : null;
  // An edit keeps the line's frozen rate as long as its identity has not changed.
  const frozen = original?.rate == null || keyOf(original) !== keyOf(sh) ? null : original.rate;
  const resolved = resolveRate(C, sh, published);
  const rate = frozen ?? resolved;
  const added = state.adds[`${C.id}|${keyOf(sh)}`];

  const qty = parseInt(sh.qty, 10) || 0;
  const costs = sh.extras.reduce((a, e) => a + (Number(e.amount.replace(/[^0-9.]/g, '')) || 0), 0);
  const editing = sh.id != null;

  const models = sh.cat ? (VALVE_MODELS[sh.cat] ?? []) : [];

  const defs: Array<{
    key: IdentityKey;
    letter: string;
    label: string;
    options: Array<[string, string, string]>;
  }> = [
    {
      key: 'cat',
      letter: 'A',
      label: 'Valve category',
      options: CATEGORY_LIST.map((c) => [c, CATEGORY_CODE[c], c]),
    },
    {
      key: 'model',
      letter: 'B',
      label: 'Valve model',
      options: models.map((m, i) => [m, String(i + 1), m]),
    },
    {
      key: 'size',
      letter: 'C',
      label: 'Inlet × outlet',
      options: SIZES.map((s, i) => [s, String(i + 1).padStart(2, '0'), `${s} · ${DN[i]}`]),
    },
    {
      key: 'rating',
      letter: 'D',
      label: 'Flange rating',
      options: RATINGS.map((x, i) => [x, i ? 'H' : 'L', x]),
    },
    {
      key: 'svc',
      letter: 'E',
      label: 'Service bundle',
      options: C.services.map((x) => [x, SERVICE_CODE[x], x]),
    },
  ];

  const code = [
    sh.cat ? CATEGORY_CODE[sh.cat] : '··',
    sh.model && sh.cat ? String(models.indexOf(sh.model) + 1) : '·',
    sh.size ? String(SIZES.indexOf(sh.size) + 1).padStart(2, '0') : '··',
    sh.rating ? (sh.rating === RATINGS[1] ? 'H' : 'L') : '·',
    sh.svc ? SERVICE_CODE[sh.svc] : '··',
  ].join('-');

  const hint = state.err
    ? 'Choose all five attributes (A–E) before adding.'
    : rate === null
      ? `No rate on ${C.ct} for this combination. You can still add it; it is excluded from the total and sent to the Admin rate queue.`
      : rate
        ? `Rate read from ${C.ct}. Quantity ${qty} adds ${qty}${qty > 1 ? ' valve rows' : ' valve row'} for tags.`
        : 'Options marked not contracted have no rate alongside your other picks.';

  const rateSource =
    frozen != null
      ? `Frozen on this line · ${original?.ver || 'v1'}`
      : added
        ? `${C.ct} · v2 · published by ${added.by}`
        : `${C.ct} · ARC ${C.arc} · v1`;

  /** False once the positions picked so far cannot be satisfied by any rate row. */
  const reachable = reach(sh);

  return (
    <div id="composer" className="flex flex-col gap-3 bg-paper p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-base font-medium">
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-espresso text-paper">
            <PlusIcon size={13} />
          </span>
          {editing
            ? `Editing line ${q.lines.findIndex((x) => x.id === sh.id) + 1 || 1}`
            : 'New line'}
        </span>
        <span className="rounded-full bg-espresso px-3 py-1 text-sm font-semibold text-paper">
          {code}
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        {defs.map((d) => (
          <IdentitySelect
            key={d.key}
            def={d}
            sheet={sh}
            unreachable={!reachable}
            invalid={state.err}
            disabled={d.key === 'model' && !sh.cat}
            reach={reach}
            onPick={(v) => actions.pickIdentity(d.key, v)}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <Field label="Job description">
          <Input
            value={sh.desc}
            placeholder="Filled from the service bundle — edit if needed"
            onChange={(e) => actions.setSheet({ desc: e.target.value })}
          />
        </Field>
        <Field label="Qty (EA)">
          <Input
            type="number"
            min={1}
            value={sh.qty}
            className="w-24 text-right"
            onChange={(e) => actions.setSheet({ qty: e.target.value })}
          />
        </Field>

        <span className="flex min-w-36 flex-col gap-1" title={rateSource}>
          <span className="text-xs text-ink-3">Unit rate · read-only</span>
          <span
            className={cn(
              'inline-flex min-h-(--control-h) items-center gap-1.5 rounded-md border px-2.5 py-1.5',
              rate === null
                ? 'border-amber bg-amber text-ink'
                : rate == null
                  ? 'border-rule bg-paper-2 text-ink-4'
                  : 'border-espresso bg-espresso text-paper',
            )}
          >
            <Icon id="ic-rate-locked" size={14} />
            {rate === null ? (
              <b className="font-semibold">Not contracted</b>
            ) : rate == null ? (
              <span>Pick A–E</span>
            ) : (
              <b className="font-semibold">SAR {fmt(rate)}</b>
            )}
          </span>
        </span>

        <span className="flex min-w-32 flex-col gap-1">
          <span className="text-xs text-ink-3">Line total</span>
          <span
            className={cn(
              'inline-flex min-h-(--control-h) items-center rounded-md border border-rule bg-paper-3 px-2.5 py-1.5 font-semibold',
              rate == null && 'font-normal text-ink-4',
            )}
          >
            {rate == null ? (rate === null ? 'Excluded' : '—') : `SAR ${fmt(rate * qty + costs)}`}
          </span>
        </span>

        <span className="ml-auto flex items-center gap-2">
          {editing && (
            <Button variant="outline" onClick={actions.cancelSheet}>
              Cancel
            </Button>
          )}
          <Button onClick={actions.saveLine}>{editing ? 'Save changes' : 'Add line'}</Button>
        </span>
      </div>

      <span
        className={cn(
          'max-w-prose text-sm',
          state.err ? 'text-bad' : rate === null ? 'font-medium text-ink' : 'text-ink-3',
        )}
        role={state.err || rate === null ? 'status' : undefined}
      >
        {hint}
      </span>
    </div>
  );
}

function IdentitySelect({
  def,
  sheet,
  unreachable,
  invalid,
  disabled,
  reach,
  onPick,
}: {
  def: {
    key: IdentityKey;
    letter: string;
    label: string;
    options: Array<[string, string, string]>;
  };
  sheet: Identity;
  unreachable: boolean;
  invalid: boolean;
  disabled: boolean;
  reach: (c: Identity) => boolean;
  onPick: (value: string) => void;
}) {
  const cur = sheet[def.key];
  const bad = (!!cur && unreachable) || (invalid && !cur);

  const candidate = (value: string): Identity => {
    const cand: Identity = { ...sheet, [def.key]: value };
    if (def.key === 'cat' && !VALVE_MODELS[value]?.includes(cand.model)) cand.model = '';
    return cand;
  };

  return (
    <label className={cn('flex min-w-0 flex-col gap-1', disabled && 'opacity-60')}>
      <span className="text-xs text-ink-3">
        {def.letter}: {def.label}
      </span>
      <Select
        value={cur || NONE}
        onValueChange={(v) => onPick(v === NONE ? '' : v)}
        disabled={disabled}
      >
        <SelectTrigger
          className={cn('w-full', bad && 'border-bad')}
          aria-label={`${def.letter}: ${def.label}`}
          aria-invalid={bad ? true : undefined}
        >
          <SelectValue placeholder={disabled ? 'Pick A first' : 'Select…'} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>
            <span className="text-ink-3">{disabled ? 'Pick A first' : 'Select…'}</span>
          </SelectItem>
          {def.options.map(([value, code, label]) => {
            const bad = !reach(candidate(value));
            return (
              <SelectItem key={value} value={value}>
                <span className="inline-flex items-center gap-2">
                  <b className="font-semibold">{code}</b>
                  <span className="truncate">{label}</span>
                  {bad && (
                    <span className="ml-1 rounded-full bg-amber px-1.5 text-2xs text-ink">
                      not contracted
                    </span>
                  )}
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </label>
  );
}

/** Whole-quote costs: mobilisation, transport, site access. */
function QuoteCosts({ q, locked }: { q: Quote; locked: boolean }) {
  const { actions } = usePortal();
  const T = totals(q);

  return (
    <section className="overflow-hidden rounded-lg border border-rule bg-paper-3 shadow-card">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-rule px-4 py-3">
        <h2 className="text-lg">Quotation additional costs</h2>
        <p className="text-xs text-ink-3">
          Applies to the whole work order: mobilisation, transport, site access.
        </p>
      </header>

      <div className="flex flex-col gap-2 p-3">
        {q.qx.map((x, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              value={x.label}
              disabled={locked}
              placeholder="Cost description"
              aria-label={`Quotation cost ${i + 1} description`}
              onChange={(e) => actions.setQuoteCost(i, { label: e.target.value })}
            />
            <Input
              value={x.amount}
              disabled={locked}
              inputMode="decimal"
              placeholder="SAR 0.00"
              aria-label={`Quotation cost ${i + 1} amount`}
              className="w-28 text-right"
              onChange={(e) => actions.setQuoteCost(i, { amount: e.target.value })}
            />
            {!locked && (
              <Button
                variant="outline"
                size="icon"
                aria-label={`Remove quotation cost ${i + 1}`}
                onClick={() => actions.removeQuoteCost(i)}
              >
                <XIcon />
              </Button>
            )}
          </div>
        ))}
        {!locked && (
          <Button variant="outline" className="self-start" onClick={actions.addQuoteCost}>
            <PlusIcon /> Add cost
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-rule px-4 py-3">
        <span className="text-xs text-ink-3">Quotation costs</span>
        <span className="font-semibold">{fmt(T.qx)}</span>
      </div>
    </section>
  );
}

/** The gate. Finalising is not a button, it is the absence of blockers. */
function Summary({
  q,
  contract: C,
  isDraft,
  can,
  checks,
}: {
  q: Quote;
  contract: Contract;
  isDraft: boolean;
  can: boolean;
  checks: Check[];
}) {
  const { actions } = usePortal();
  const T = totals(q);
  const open = () => actions.go('contract', { cid: C.id, ctab: 'rates', page: 0 });

  return (
    <div className="flex flex-col gap-px overflow-hidden rounded-lg border border-rule bg-rule shadow-card">
      <div className="flex flex-col gap-1 border-b border-rule bg-espresso px-4 py-3 text-paper">
        <span className="text-2xs text-paper-2">Total, VAT inclusive</span>
        <span className="font-display text-3xl leading-none text-amber">SAR {fmt(T.grand)}</span>
      </div>

      <dl className="flex flex-col gap-px bg-rule px-0 text-sm">
        {[
          ['Lines', fmt(T.sub)],
          ['Line costs', fmt(T.lx)],
          ['Quotation costs', fmt(T.qx)],
        ].map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 bg-paper-3 px-4 py-2">
            <dt className="text-ink-3">{label}</dt>
            <dd className="font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      {T.nc > 0 && (
        <div className="border-y border-rule bg-amber px-3 py-2 text-sm text-ink">
          {`${T.nc} ${T.nc > 1 ? 'lines' : 'line'} excluded until rated`}
        </div>
      )}

      {isDraft && (
        <div className="flex flex-col gap-2 px-3 py-3">
          {can ? (
            <span className="inline-flex items-center gap-2 text-sm font-medium text-forest">
              <CheckIcon size={16} /> Ready to finalise
            </span>
          ) : (
            <>
              <span className="text-xs text-ink-3">Before finalising</span>
              <ul className="flex flex-col gap-1.5">
                {checks
                  .filter((c) => !c.ok)
                  .map((c) => (
                    <li key={c.label} className="flex items-baseline gap-2 text-sm">
                      <span
                        className="mt-1 inline-block size-2 shrink-0 rounded-full bg-amber"
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1">{c.label}</span>
                      {c.detail && <span className="font-semibold">{c.detail}</span>}
                    </li>
                  ))}
              </ul>
            </>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-rule bg-paper-2 px-3 py-2 text-sm">
        <span className="min-w-0 truncate">
          {C.ct} · ends {C.end}
        </span>
        <Button variant="link" size="sm" className="shrink-0 px-0" onClick={open}>
          <SearchIcon /> Schedule
        </Button>
      </div>
    </div>
  );
}
