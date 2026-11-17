import { ArrowRightIcon, CheckIcon, UploadIcon } from 'lucide-react';
import { Icon } from '@/components/app/Icon';
import { Money } from '@/components/app/Money';
import { Panel } from '@/components/app/Panel';
import { Plate, PlateRow } from '@/components/app/Plate';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { CONTRACT_BY_ID } from '@/domain/catalog';
import { usePortal } from '@/state/portal';
import type { ImportState } from '@/state/portal';
import { cn } from '@/lib/utils';

/**
 * The one way a whole rate sheet is republished: an Admin uploads the
 * customer's price sheet, the rows are validated against the reference set,
 * and the accepted rows go out as a new version of the schedule. Lines already
 * priced on a quotation keep the rate they were saved with.
 */

const STEPS = ['Upload', 'Validate', 'Commit'] as const;

/**
 * Fixed demo figures from the prototype. There is no parser or import service
 * behind this screen, so these are the values it always shows — they are not
 * read from the chosen file.
 */
const DEMO = {
  rows: '412',
  valid: '406',
  fresh: '9',
  skipped: '2',
  changed: '3',
  fileSize: '84 KB',
};

const MOCK_NOTE =
  'Mock of the backend import step: no file is read here, and the row counts are fixed demo values.';

interface RateChange {
  combo: string;
  from: number;
  to: number;
}

const CHANGES: RateChange[] = [
  { combo: 'Gate Valve · Wedge Gate · 6 x 8 · 150~600 LB · OH Level-1', from: 1320, to: 1380 },
  {
    combo: 'Safety Valve · Conventional PSV · 2 x 3 · 150~600 LB · Testing at Workshop',
    from: 365,
    to: 380,
  },
  {
    combo: 'Check Valve · Swing Check · 4 x 6 · 900~2500 LB · OH Level-2',
    from: 2050,
    to: 2110,
  },
];

interface SkippedRow {
  row: string;
  message: string;
}

const SKIPPED: SkippedRow[] = [
  { row: 'Row 118', message: 'Unknown valve model "PSV-CONV" — not in reference data' },
  {
    row: 'Row 301',
    message:
      'Rate cell is empty for Ball Valve · Trunnion Ball · 8 x 10 · 900~2500 LB · OH Level-2',
  },
];

export default function Import() {
  const { state, actions } = usePortal();
  const C = CONTRACT_BY_ID[state.cid];
  const im = state.imp;
  const step = im.step;

  const toRates = () => actions.go('contract', { cid: C.id, ctab: 'rates', page: 0 });
  const patch = (next: Partial<ImportState>) => actions.set({ imp: { ...im, ...next } });

  return (
    <div className="flex flex-col gap-3">
      <p className="max-w-prose text-sm text-ink-3">
        {C.customer} · {C.ct} · ARC {C.arc}. Imported rates are published as new versions; lines
        already priced keep their frozen rate.
      </p>

      <ol className="flex flex-wrap items-center gap-2">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const done = step > n;
          const on = step === n;
          return (
            <li
              key={label}
              className="flex items-center gap-2"
              aria-current={on ? 'step' : undefined}
            >
              <span
                className={cn(
                  'grid size-6 shrink-0 place-items-center border border-rule text-xs font-extrabold',
                  done || on ? 'bg-ink text-paper-3' : 'bg-paper-2 text-ink-3',
                )}
              >
                {done ? <CheckIcon className="size-3.5" aria-hidden="true" /> : n}
              </span>
              <span className={cn('text-sm', on ? 'font-medium text-ink' : 'text-ink-3')}>
                {label}
              </span>
              {i < STEPS.length - 1 && <span className="h-px w-10 bg-rule" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>

      {step === 1 && (
        <Panel title="Upload" bodyClass="flex flex-col gap-4">
          <p className="text-xs text-ink-3">{MOCK_NOTE}</p>

          <button
            type="button"
            className="flex cursor-pointer flex-col items-center gap-2 border border-dashed border-ink px-5 py-10 text-center whitespace-nowrap hover:bg-paper-2"
            onClick={() => patch({ file: `${C.arc}_price_sheet_2026-10.xlsx` })}
          >
            <UploadIcon className="size-6" aria-hidden="true" />
            <span className="font-medium whitespace-nowrap">
              Drop the price sheet here, or browse
            </span>
            <span className="max-w-prose text-sm whitespace-nowrap text-ink-3">
              .xlsx or .csv; one row per category, model, size, rating and service
            </span>
          </button>

          {im.file && (
            <div className="flex flex-wrap items-center gap-3 border border-rule bg-paper-3 p-3">
              <Icon id="ic-source-page" size={18} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium">{im.file}</span>
                <span className="text-xs text-ink-3">
                  {DEMO.rows} rows · {DEMO.fileSize}
                </span>
              </span>
              <Button type="button" onClick={() => patch({ step: 2 })}>
                Validate
              </Button>
            </div>
          )}
        </Panel>
      )}

      {step === 2 && (
        <>
          <PlateRow className="grid-cols-2 xl:grid-cols-4">
            <Plate className="border-0" label="Rows read" value={DEMO.rows} />
            <Plate
              className="border-0"
              label="Valid"
              value={<span className="text-good">{DEMO.valid}</span>}
            />
            <Plate className="border-0" label="New combinations" value={DEMO.fresh} />
            <Plate
              className="border-0"
              label="Skipped"
              value={<span className="text-bad">{DEMO.skipped}</span>}
            />
          </PlateRow>

          <Panel title="Validate" bodyClass="flex flex-col gap-4">
            <p className="text-xs text-ink-3">{MOCK_NOTE}</p>

            <div className="flex flex-col gap-1.5">
              <h3 className="text-sm font-medium">Rows that will be skipped</h3>
              <ul className="flex flex-col divide-y divide-rule border-y border-rule">
                {SKIPPED.map((s) => (
                  <li key={s.row} className="flex flex-col gap-0.5 py-2 sm:flex-row sm:gap-3">
                    <span className="w-20 shrink-0 text-xs text-ink-3 tabular-nums">{s.row}</span>
                    <span className="text-sm text-bad">{s.message}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-1.5">
              <h3 className="text-sm font-medium">Rate changes (published as new versions)</h3>
              <ul className="flex flex-col divide-y divide-rule border-y border-rule">
                {CHANGES.map((c) => (
                  <li
                    key={c.combo}
                    className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 py-2"
                  >
                    <span className="min-w-0 flex-1 text-sm">{c.combo}</span>
                    <span className="flex items-baseline gap-2">
                      <Money
                        value={c.from}
                        currency={false}
                        size="sm"
                        className="text-ink-3 line-through"
                      />
                      <ArrowRightIcon className="size-3.5 shrink-0 text-ink-4" aria-hidden="true" />
                      <Money value={c.to} size="sm" />
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <Field>
              <FieldLabel htmlFor="import-reason">Reason for import</FieldLabel>
              <Input
                id="import-reason"
                value={im.reason}
                placeholder="e.g. Annual price sheet reissue from customer"
                onChange={(e) => patch({ reason: e.target.value })}
              />
            </Field>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-3">
              <Button type="button" variant="outline" onClick={() => patch({ step: 1 })}>
                Back
              </Button>
              <Button type="button" onClick={actions.commitImport}>
                Commit {DEMO.valid} rows
              </Button>
            </div>
          </Panel>
        </>
      )}

      {step === 3 && (
        <Panel title="Commit" bodyClass="flex flex-col gap-4">
          <p className="text-2xs text-ink-3">{MOCK_NOTE}</p>

          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <span className="grid size-10 place-items-center border border-good bg-good-soft text-good">
              <CheckIcon className="size-5" aria-hidden="true" />
            </span>
            <span className="text-md font-extrabold">Rate sheet committed</span>
            <p className="max-w-prose text-sm text-ink-3">
              {DEMO.valid} rows published to {C.ct}. {DEMO.changed} changed rates apply to new lines
              only; priced and finalised lines keep the rate they were saved with.
            </p>
            <Button type="button" variant="outline" className="mt-2" onClick={toRates}>
              Back to contract
            </Button>
          </div>
        </Panel>
      )}
    </div>
  );
}
