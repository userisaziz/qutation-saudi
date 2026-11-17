import { useMemo } from 'react';
import { ArrowLeftIcon, PrinterIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SERVICE_PROPOSAL_LABEL } from '@/domain/catalog';
import { dottedDate, fmt, inches, num } from '@/domain/format';
import { totals } from '@/domain/pricing';
import { USERS } from '@/data/seed';
import { usePortal } from '@/state/portal';
import type { Boilerplate, Quote } from '@/domain/types';
import { cn } from '@/lib/utils';

/**
 * The artefact. Everything upstream of this screen is a workbench; this is the
 * page the customer signs, so it borrows the client's own form — white paper,
 * black rules, serif body, the olive head band on the price schedule — and
 * nothing else on it is app chrome. A draft carries the watermark and refuses
 * the PDF; a finalised sheet is frozen text.
 */

interface ScheduleRow {
  n: number;
  wo: string;
  desc: string;
  tag: string | null;
  size: string;
  qty: string;
  unit: string;
  total: string;
  excluded: boolean;
}

export default function Preview() {
  const { state, quote: q, quoteContract: C, role, actions } = usePortal();
  const locked = q.status !== 'Draft';
  const T = totals(q);
  const bp = q.bpSnap ?? state.bp[q.cid];
  const wo = q.hdr.wo || '—';

  const doc = useMemo(() => build(q, bp), [q, bp]);

  return (
    <div className="flex flex-col gap-3">
      <div data-print="chrome" className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" onClick={() => actions.go('editor')}>
          <ArrowLeftIcon /> Back to quotation
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-ink-3">
            {locked
              ? `Frozen snapshot · finalised ${q.finAt} by ${q.finBy}`
              : 'Draft preview: the PDF unlocks when the quotation is finalised'}
          </span>
          <Button onClick={issue} disabled={!locked} title={locked ? undefined : 'Finalise first'}>
            <PrinterIcon /> Download PDF
          </Button>
        </div>
      </div>

      <div className="flex justify-center bg-paper py-1">
        <article
          data-print="sheet"
          className="relative w-full max-w-[820px] overflow-hidden rounded-lg border border-rule bg-doc-paper px-[clamp(20px,5vw,56px)] pt-10 pb-14 font-doc shadow-sheet text-[13.5px] leading-snug text-doc-ink"
        >
          {!locked && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[28deg] text-[clamp(60px,14vw,120px)] leading-none font-extrabold tracking-[0.1em] whitespace-nowrap text-doc-mark"
            >
              DRAFT
            </span>
          )}

          <div className="relative flex flex-col gap-4">
            <h3 className="text-center text-[15px] font-extrabold">Techno-Commercial Proposal</h3>

            <table className="w-full table-fixed border-collapse text-[13px]">
              <tbody>
                <HeadRow k="Project Title" v={doc.project} k2="Client" v2={C.customer} />
                <HeadRow k="Proposal No" v={q.hdr.evmc || '—'} k2="RFP No" v2={wo} />
                <HeadRow k="Date" v={dottedDate(q.hdr.date)} k2="Rev" v2={doc.rev} />
                <tr>
                  <th
                    scope="row"
                    className="w-[18%] border border-doc-ink px-2 py-1 text-left align-top font-extrabold"
                  >
                    Attention to
                  </th>
                  <td colSpan={3} className="border border-doc-ink px-2 py-1 align-top break-words">
                    {q.hdr.attn || '—'}
                  </td>
                </tr>
                <tr>
                  <th
                    scope="row"
                    className="w-[18%] border border-doc-ink px-2 py-1 text-left align-top font-extrabold"
                  >
                    Subject
                  </th>
                  <td colSpan={3} className="border border-doc-ink px-2 py-1 align-top break-words">
                    {doc.subject}
                  </td>
                </tr>
              </tbody>
            </table>

            <p>
              With reference to your inquiry, we have pleasure in submitting our{' '}
              <b className="font-extrabold">Techno-Commercial proposal</b> for your review and
              approval.
            </p>
            <p>
              <span className="font-extrabold underline">Scope of work:</span> {doc.project}
            </p>

            <div className="pt-2">
              <p className="mb-1 text-[14.5px] font-extrabold underline">Price Schedule</p>
              <div data-print="schedule" className="overflow-x-auto">
                <table className="w-full min-w-[680px] border-collapse text-[13px]">
                  <caption className="sr-only">
                    Priced lines, additional costs and the VAT-inclusive total for quotation {q.no}
                  </caption>
                  <thead>
                    <tr className="bg-doc-head">
                      {(
                        [
                          'S.No',
                          'WO#',
                          'Description',
                          'Size',
                          'Qty',
                          'U/Price each',
                          'Total price',
                        ] as const
                      ).map((h, i) => (
                        <th
                          key={h}
                          scope="col"
                          className={cn(
                            'border border-doc-ink px-1.5 py-1 font-extrabold',
                            i === 0 || i === 3 || i === 4
                              ? 'text-center'
                              : i >= 5
                                ? 'text-right'
                                : 'text-left',
                          )}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {doc.rows.map((r) => (
                      <tr key={r.n}>
                        <td className="w-9 border border-doc-ink px-1.5 py-1 text-center align-middle">
                          {r.n}
                        </td>
                        <td className="w-[72px] border border-doc-ink px-1.5 py-1 align-middle break-words">
                          {r.wo}
                        </td>
                        <td className="border border-doc-ink px-1.5 py-1 align-middle break-words">
                          <span className="block">{r.desc}</span>
                          {r.tag && <span className="block">{r.tag}</span>}
                        </td>
                        <td className="w-[60px] border border-doc-ink px-1.5 py-1 text-center align-middle">
                          {r.size}
                        </td>
                        <td className="w-10 border border-doc-ink px-1.5 py-1 text-center align-middle">
                          {r.qty}
                        </td>
                        <td className="w-[84px] border border-doc-ink px-1.5 py-1 text-right align-middle font-extrabold">
                          {r.unit}
                        </td>
                        <td
                          className={cn(
                            'w-[96px] border border-doc-ink px-1.5 py-1 text-right align-middle font-extrabold',
                            r.excluded && 'text-bad',
                          )}
                        >
                          {r.total}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td
                        colSpan={6}
                        className="border border-doc-ink px-1.5 py-1 text-right font-extrabold"
                      >
                        Total SAR
                      </td>
                      <td className="border border-doc-ink px-1.5 py-1 text-right font-extrabold">
                        {fmt(T.grand)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-1 text-xs text-ink-3 md:hidden">
                Scroll the schedule sideways to see the rates.
              </p>

              {!locked && T.nc > 0 && (
                <p role="status" className="mt-1 font-doc text-xs text-bad">
                  Draft only. Not-contracted lines are excluded from the total and must be priced
                  before this proposal can be issued.
                </p>
              )}
            </div>

            {doc.notes.length > 0 && (
              <div className="pt-2">
                <p className="font-extrabold underline">Note</p>
                <dl className="flex flex-col gap-0.5">
                  {doc.notes.map((x) => (
                    <div key={x.n} className="grid grid-cols-[52px_minmax(0,1fr)]">
                      <dt className="pr-3 text-right">{x.n}</dt>
                      <dd className="min-w-0 break-words">{x.t}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            <div className="pt-3">
              <p className="font-extrabold underline">Terms &amp; Conditions</p>
              <ul className="flex flex-col gap-px">
                {doc.terms.map((t, i) => (
                  <li key={i} className="break-words">
                    <b className="font-extrabold">{t.k}:</b> {t.v}
                  </li>
                ))}
              </ul>
            </div>

            <p className="pt-3">
              We look forward to your favourable response. Should you need any further information
              or clarification, please feel free to contact us.
            </p>

            <div className="flex flex-col gap-px pt-2">
              <span>Best Regards,</span>
              <b className="mt-5 font-extrabold">{q.finBy || USERS[role].name}</b>
              <span>Estimation Engineer</span>
              <span>Expertise ValvServe, Al Jubail</span>
            </div>
          </div>
        </article>
      </div>
    </div>
  );

  /** The browser's own print-to-PDF; there is no document service behind this build. */
  function issue() {
    actions.downloadPdf();
    window.print();
  }
}

function HeadRow({ k, v, k2, v2 }: { k: string; v: string; k2: string; v2: string }) {
  return (
    <tr>
      <th
        scope="row"
        className="w-[18%] border border-doc-ink px-2 py-1 text-left align-top font-extrabold"
      >
        {k}
      </th>
      <td className="w-[32%] border border-doc-ink px-2 py-1 align-top break-words">{v}</td>
      <th
        scope="row"
        className="w-[16%] border border-doc-ink px-2 py-1 text-left align-top font-extrabold"
      >
        {k2}
      </th>
      <td className="border border-doc-ink px-2 py-1 align-top break-words">{v2}</td>
    </tr>
  );
}

/** Split the free-text boilerplate into the two shapes the client's form expects. */
function build(q: Quote, bp: Boilerplate | null | undefined) {
  const svcs = [...new Set(q.lines.map((l) => l.svc))];
  const items = q.lines.map((l) => `${l.qty}Ea ${l.model} ${inches(l.size)}`).join(', ');
  const project = q.lines.length
    ? `${svcs.length === 1 ? `${SERVICE_PROPOSAL_LABEL[svcs[0]]} of ` : 'Valve services for '}${items}`
    : '—';
  const where =
    svcs.length > 0 && svcs.every((s) => /Site/.test(s)) ? ' at site' : ' at Jubail workshop';
  const wo = q.hdr.wo || '—';

  const rows: ScheduleRow[] = [];
  const push = (r: Omit<ScheduleRow, 'n'>) => rows.push({ n: rows.length + 1, ...r });

  q.lines.forEach((l) => {
    const nc = l.rate == null;
    const tags = l.valves.map((v) => v.tag).filter(Boolean);
    push({
      wo,
      desc: `${SERVICE_PROPOSAL_LABEL[l.svc]} of ${l.qty}Ea ${inches(l.size)} ${l.model}`,
      tag: tags.length ? `Tag: ${tags.join(', ')}` : null,
      size: inches(l.size),
      qty: String(l.qty),
      unit: l.rate == null ? '—' : fmt(l.rate),
      total: l.rate == null ? 'Not contracted' : fmt(l.rate * l.qty),
      excluded: nc,
    });
    l.extras.forEach((e) =>
      push({
        wo,
        desc: e.label || 'Additional cost',
        tag: null,
        size: '',
        qty: '',
        unit: '',
        total: nc ? 'Excluded' : fmt(num(e.amount)),
        excluded: nc,
      }),
    );
  });
  q.qx.forEach((e) =>
    push({
      wo,
      desc: e.label || 'Additional cost',
      tag: null,
      size: '',
      qty: '',
      unit: '',
      total: fmt(num(e.amount)),
      excluded: false,
    }),
  );

  const revMatch = /-R(\d+)$/.exec(q.no);
  const notes = lines(bp?.notes).map((t, i) => ({ n: `${i + 1}.`, t: t.replace(/^\d+\.\s*/, '') }));
  const terms = lines(bp?.tc)
    .map((t) => {
      const m = /^(?:\d+\.\s*)?([^:]{1,40}):\s*(.*)$/.exec(t);
      return m ? { k: m[1], v: m[2] } : { k: 'Note', v: t };
    })
    .concat([{ k: 'Quote Validity', v: `${q.hdr.validity} Days from the date of this Offer` }]);

  return {
    project,
    subject: `${project}${where}`,
    rows,
    notes,
    terms,
    rev: revMatch ? revMatch[1].padStart(2, '0') : '00',
  };
}

const lines = (text?: string) =>
  (text || '')
    .split('\n')
    .map((t) => t.trim())
    .filter(Boolean);
