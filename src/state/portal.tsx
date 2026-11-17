import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { CONTRACT_BY_ID, CONTRACTS, SERVICE_DESCRIPTION, VALVE_MODELS } from '@/domain/catalog';
import { boilerplateFor, INITIAL_AUDIT, INITIAL_QUOTES, USERS } from '@/data/seed';
import { publishedMap } from '@/data/schedule';
import { fitValves, keyOf, resolveRate, totals, TODAY, withinTermOf } from '@/domain/pricing';
import { fmt, num } from '@/domain/format';
import type {
  AddedRate,
  AuditEntry,
  Boilerplate,
  DraftLine,
  Line,
  Quote,
  QuoteHeader,
  Role,
  Screen,
} from '@/domain/types';

export type Ctab = 'rates' | 'services' | 'bp' | 'quotes';
export type Rtab = 'cats' | 'sizes' | 'ratings' | 'uom';

export interface ResForm {
  rate: string;
  from: string;
  reason: string;
  err: boolean;
}

export interface ImportState {
  step: 1 | 2 | 3;
  file: string | null;
  reason: string;
}

export interface State {
  screen: Screen | null;
  role: Role | null;
  qid: string;
  cid: string;
  menu: boolean;
  cSearch: string;
  ctab: Ctab;
  sf: { cat: string; rating: string; svc: string; q: string };
  page: number;
  qlf: { cid: string; st: string };
  rtab: Rtab;
  af: { area: string; q: string };
  quotes: Quote[];
  adds: Record<string, AddedRate>;
  res: Record<string, ResForm>;
  bp: Record<string, Boilerplate>;
  audit: AuditEntry[];
  imp: ImportState;
  sheet: DraftLine;
  err: boolean;
  toast: { title: string; body: string } | null;
}

const blankLine = (): DraftLine => ({
  id: null,
  cat: '',
  model: '',
  size: '',
  rating: '',
  svc: '',
  desc: '',
  qty: '1',
  extras: [],
});

const initialState = (): State => ({
  // No sign-in gate: the demo opens straight into the tool as the Estimator;
  // the account menu switches role for the Admin-only surfaces.
  screen: 'contracts',
  role: 'Estimator',
  qid: 'q147',
  cid: 'c1',
  menu: false,
  cSearch: '',
  ctab: 'rates',
  sf: { cat: '', rating: '', svc: '', q: '' },
  page: 0,
  qlf: { cid: '', st: 'All' },
  rtab: 'cats',
  af: { area: '', q: '' },
  quotes: INITIAL_QUOTES,
  adds: {},
  res: {},
  bp: Object.fromEntries(CONTRACTS.map((c) => [c.id, boilerplateFor(c)])),
  audit: INITIAL_AUDIT,
  imp: { step: 1, file: null, reason: '' },
  sheet: blankLine(),
  err: false,
  toast: null,
});

let lineSeq = 500;
let quoteSeq = 150;

const nowStamp = () => {
  const d = new Date();
  return `${TODAY} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export function usePortalState() {
  const [state, setState] = useState<State>(initialState);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const set = useCallback((patch: Partial<State> | ((s: State) => Partial<State>)) => {
    setState((s) => ({ ...s, ...(typeof patch === 'function' ? patch(s) : patch) }));
  }, []);

  const role: Role = state.role ?? 'Estimator';
  const isAdmin = role === 'Admin';

  const quote = state.quotes.find((q) => q.id === state.qid) ?? state.quotes[0];
  const contract = CONTRACT_BY_ID[state.cid];
  const quoteContract = CONTRACT_BY_ID[quote.cid];

  const showQuote = useCallback((fn: (q: Quote) => Quote) => {
    setState((s) => ({ ...s, quotes: s.quotes.map((q) => (q.id === s.qid ? fn(q) : q)) }));
  }, []);

  const showLine = useCallback(
    (id: number, fn: (l: Line) => Line) => {
      showQuote((q) => ({ ...q, lines: q.lines.map((l) => (l.id === id ? fn(l) : l)) }));
    },
    [showQuote],
  );

  const pushAudit = useCallback((area: string, action: string, obj: string, asRole: Role) => {
    setState((s) => ({
      ...s,
      audit: [
        { at: nowStamp(), who: USERS[asRole].name, role: asRole, area, action, obj },
        ...s.audit,
      ],
    }));
  }, []);

  const notify = useCallback((title: string, body: string) => {
    window.clearTimeout(timer.current);
    setState((s) => ({ ...s, toast: { title, body } }));
    timer.current = window.setTimeout(() => setState((s) => ({ ...s, toast: null })), 3600);
  }, []);

  const go = useCallback((screen: Screen, patch: Partial<State> = {}) => {
    setState((s) => ({ ...s, screen, menu: false, ...patch }));
  }, []);

  const publish = useCallback(
    (cid: string, key: string, rate: number, from: string, reason: string, by: Role) => {
      const c = CONTRACT_BY_ID[cid];
      setState((s) => ({
        ...s,
        adds: {
          ...s.adds,
          [`${cid}|${key}`]: { rate, ver: 'v2', from, reason, by: USERS[by].name },
        },
        quotes: s.quotes.map((q) =>
          q.cid !== cid || q.status !== 'Draft'
            ? q
            : {
                ...q,
                lines: q.lines.map((l) =>
                  l.rate == null && keyOf(l) === key ? { ...l, rate, ver: 'v2' } : l,
                ),
              },
        ),
      }));
      const [model, size, rating, svc] = key.split('|').slice(1);
      pushAudit(
        'Rate',
        `Published ${model} ${size}, ${rating}, ${svc} at SAR ${fmt(rate)} (v2, from ${from}) — reason: ${reason}`,
        c.ct,
        by,
      );
      notify(
        `Rate published to ${c.ct}`,
        `SAR ${fmt(rate)} / EA. Blank lines on draft quotations have been filled.`,
      );
    },
    [notify, pushAudit],
  );

  const setHeader = useCallback(
    (k: keyof QuoteHeader, v: string) => {
      showQuote((q) => ({ ...q, hdr: { ...q.hdr, [k]: v } }));
    },
    [showQuote],
  );

  const setQuoteCost = useCallback(
    (i: number, patch: Partial<{ label: string; amount: string }>) => {
      showQuote((q) => ({ ...q, qx: q.qx.map((z, j) => (j === i ? { ...z, ...patch } : z)) }));
    },
    [showQuote],
  );

  const addQuoteCost = useCallback(() => {
    showQuote((q) => ({ ...q, qx: [...q.qx, { label: '', amount: '' }] }));
  }, [showQuote]);

  const removeQuoteCost = useCallback(
    (i: number) => {
      showQuote((q) => ({ ...q, qx: q.qx.filter((_, j) => j !== i) }));
    },
    [showQuote],
  );

  const setLineCost = useCallback(
    (id: number, i: number, patch: Partial<{ label: string; amount: string }>) => {
      showLine(id, (l) => ({
        ...l,
        extras: l.extras.map((y, j) => (j === i ? { ...y, ...patch } : y)),
      }));
    },
    [showLine],
  );

  const addLineCost = useCallback(
    (id: number) => {
      showLine(id, (l) => ({ ...l, open: true, extras: [...l.extras, { label: '', amount: '' }] }));
    },
    [showLine],
  );

  const removeLineCost = useCallback(
    (id: number, i: number) => {
      showLine(id, (l) => ({ ...l, extras: l.extras.filter((_, j) => j !== i) }));
    },
    [showLine],
  );

  const setValve = useCallback(
    (id: number, i: number, patch: Partial<{ tag: string; serial: string }>) => {
      showLine(id, (l) => ({
        ...l,
        valves: l.valves.map((w, j) => (j === i ? { ...w, ...patch } : w)),
      }));
    },
    [showLine],
  );

  const toggleLine = useCallback(
    (id: number) => showLine(id, (l) => ({ ...l, open: !l.open })),
    [showLine],
  );

  const removeLine = useCallback(
    (id: number) => {
      showQuote((q) => ({ ...q, lines: q.lines.filter((l) => l.id !== id) }));
    },
    [showQuote],
  );

  const setSheet = useCallback((patch: Partial<DraftLine>) => {
    setState((s) => ({ ...s, sheet: { ...s.sheet, ...patch }, err: false }));
  }, []);

  const pickIdentity = useCallback((k: 'cat' | 'model' | 'size' | 'rating' | 'svc', v: string) => {
    setState((s) => {
      const next: DraftLine = { ...s.sheet, [k]: v };
      if (k === 'cat' && !VALVE_MODELS[next.cat || '']?.includes(next.model)) next.model = '';
      if (k === 'svc' && !next.desc) next.desc = SERVICE_DESCRIPTION[v] ?? '';
      return { ...s, sheet: next, err: false };
    });
  }, []);

  const editLine = useCallback((l: Line) => {
    setState((s) => ({ ...s, sheet: { ...l, qty: String(l.qty), extras: [] }, err: false }));
    requestAnimationFrame(() =>
      document.getElementById('composer')?.scrollIntoView({ block: 'center', behavior: 'smooth' }),
    );
  }, []);

  const cancelSheet = useCallback(
    () => setState((s) => ({ ...s, sheet: blankLine(), err: false })),
    [],
  );

  const saveLine = useCallback(() => {
    const draft = state.sheet;
    if (!draft.cat || !draft.model || !draft.size || !draft.rating || !draft.svc) {
      setState((s) => ({ ...s, err: true }));
      return;
    }
    const qty = Math.max(1, Math.min(200, parseInt(draft.qty, 10) || 1));
    const original = draft.id != null ? (quote.lines.find((x) => x.id === draft.id) ?? null) : null;
    const keep = !!original && original.rate != null && keyOf(original) === keyOf(draft);
    const rate = keep
      ? original!.rate
      : resolveRate(quoteContract, draft, publishedMap(state.adds, quote.cid));
    const added = state.adds[`${quote.cid}|${keyOf(draft)}`];
    const committed: Line = {
      id: draft.id ?? 0,
      cat: draft.cat,
      model: draft.model,
      size: draft.size,
      rating: draft.rating,
      svc: draft.svc,
      desc: draft.desc,
      qty,
      rate: rate ?? null,
      ver: rate == null ? null : keep ? original!.ver : added ? 'v2' : 'v1',
      extras: original ? original.extras : [],
      valves: [],
      open: false,
    };
    if (original) {
      showQuote((q) => ({
        ...q,
        lines: q.lines.map((l) =>
          l.id === draft.id ? { ...committed, open: l.open, valves: fitValves(l.valves, qty) } : l,
        ),
      }));
    } else {
      lineSeq += 1;
      showQuote((q) => ({
        ...q,
        lines: [...q.lines, { ...committed, id: lineSeq, valves: fitValves([], qty) }],
      }));
    }
    setState((s) => ({ ...s, sheet: blankLine(), err: false }));
    if (rate == null) {
      pushAudit(
        'Quotation',
        `Line saved not contracted (${draft.model} ${draft.size}, ${draft.rating}, ${draft.svc})`,
        quote.no,
        role,
      );
      notify(
        'Saved as not contracted',
        `No rate on ${quoteContract.ct}. Excluded from total and sent to the Admin rate queue.`,
      );
    }
  }, [notify, pushAudit, quote, quoteContract, role, showQuote, state.adds, state.sheet]);

  const newQuote = useCallback(() => {
    quoteSeq += 1;
    const id = `q${quoteSeq}`;
    const no = `QT-2026-0${quoteSeq}`;
    setState((s) => ({
      ...s,
      quotes: [
        {
          id,
          cid: s.cid,
          no,
          status: 'Draft',
          createdAt: TODAY,
          finBy: null,
          finAt: null,
          bpSnap: null,
          hdr: { date: TODAY, validity: '60', wo: '', rfq: '', evmc: '', attn: '' },
          lines: [],
          qx: [],
        },
        ...s.quotes,
      ],
      qid: id,
      screen: 'editor',
      sheet: blankLine(),
    }));
    pushAudit('Quotation', `Created on ${CONTRACT_BY_ID[state.cid].ct}`, no, role);
  }, [pushAudit, role, state.cid]);

  const saveDraft = useCallback(() => {
    const t = totals(quote);
    pushAudit(
      'Quotation',
      `Draft saved${t.nc ? ` with ${t.nc} not-contracted line(s)` : ''}`,
      quote.no,
      role,
    );
    notify('Draft saved', `${quote.no} · ${quote.lines.length} lines`);
  }, [notify, pushAudit, quote, role]);

  const finalisable = useCallback((q: Quote) => {
    const t = totals(q);
    return (
      q.lines.length > 0 &&
      t.nc === 0 &&
      t.miss === 0 &&
      !!q.hdr.wo.trim() &&
      withinTermOf(CONTRACT_BY_ID[q.cid], q.hdr.date)
    );
  }, []);

  const finalise = useCallback(() => {
    if (quote.status !== 'Draft' || !finalisable(quote)) return;
    showQuote((q) => ({
      ...q,
      status: 'Finalised',
      finBy: USERS[role].name,
      finAt: TODAY,
      bpSnap: { ...state.bp[q.cid] },
    }));
    pushAudit('Quotation', 'Finalised — gate re-checked, proposal snapshot frozen', quote.no, role);
    notify(
      'Quotation finalised',
      `${quote.no} is frozen. Download the proposal PDF from here or the preview.`,
    );
  }, [finalisable, notify, pushAudit, quote, role, showQuote, state.bp]);

  const markClosed = useCallback(() => {
    showQuote((q) => ({ ...q, status: 'Closed' }));
    pushAudit('Quotation', 'Marked closed', quote.no, role);
  }, [pushAudit, quote.no, role, showQuote]);

  const revise = useCallback(() => {
    quoteSeq += 1;
    const id = `q${quoteSeq}`;
    const m = /-R(\d+)$/.exec(quote.no);
    const no = m ? quote.no.replace(/-R\d+$/, `-R${Number(m[1]) + 1}`) : `${quote.no}-R1`;
    setState((s) => ({
      ...s,
      quotes: [
        {
          ...quote,
          id,
          no,
          status: 'Draft',
          createdAt: TODAY,
          finBy: null,
          finAt: null,
          bpSnap: null,
          hdr: { ...quote.hdr, date: TODAY },
          lines: quote.lines.map((l) => ({
            ...l,
            id: (lineSeq += 1),
            extras: l.extras.map((e) => ({ ...e })),
            valves: l.valves.map((v) => ({ ...v })),
          })),
          qx: quote.qx.map((x) => ({ ...x })),
        },
        ...s.quotes,
      ],
      qid: id,
      sheet: blankLine(),
    }));
    pushAudit('Quotation', `Revision created from ${quote.no}`, no, role);
    notify('Revision created', `${no} is a new draft. ${quote.no} stays unchanged.`);
  }, [notify, pushAudit, quote, role]);

  const downloadPdf = useCallback(() => {
    notify('Proposal PDF generated', `Techno commercial proposal -WO ${quote.hdr.wo}.pdf`);
  }, [notify, quote.hdr.wo]);

  const openGap = useCallback(
    (cid: string, key: string, quoteId: string) => {
      setState((s) => ({
        ...s,
        quotes: s.quotes.map((q) =>
          q.id !== quoteId
            ? q
            : { ...q, lines: q.lines.map((l) => (keyOf(l) === key ? { ...l, open: true } : l)) },
        ),
      }));
      go('editor', { qid: quoteId, cid });
    },
    [go],
  );

  const setResolve = useCallback((lineId: number, patch: Partial<ResForm>) => {
    setState((s) => {
      const current: ResForm = s.res[lineId] ?? { rate: '', from: TODAY, reason: '', err: false };
      return { ...s, res: { ...s.res, [lineId]: { ...current, ...patch } } };
    });
  }, []);

  const resolveLine = useCallback(
    (l: Line) => {
      const form: ResForm = state.res[l.id] ?? { rate: '', from: TODAY, reason: '', err: false };
      if (num(form.rate) <= 0 || !form.reason.trim()) {
        setResolve(l.id, { err: true });
        return;
      }
      publish(quote.cid, keyOf(l), num(form.rate), form.from, form.reason.trim(), role);
    },
    [publish, quote.cid, role, setResolve, state.res],
  );

  const switchRole = useCallback(() => {
    setState((s) => ({ ...s, role: s.role === 'Admin' ? 'Estimator' : 'Admin', menu: false }));
  }, []);

  const saveBoilerplate = useCallback((cid: string, patch: Partial<Boilerplate>) => {
    setState((s) => ({ ...s, bp: { ...s.bp, [cid]: { ...s.bp[cid], ...patch } } }));
  }, []);

  const commitImport = useCallback(() => {
    const c = CONTRACT_BY_ID[state.cid];
    setState((s) => ({ ...s, imp: { ...s.imp, step: 3 } }));
    pushAudit(
      'Rate sheet',
      `Imported ${c.arc} price sheet — 406 rows, 3 rate changes published as v2 — reason: ${state.imp.reason || 'not given'}`,
      c.ct,
      role,
    );
  }, [pushAudit, role, state.cid, state.imp.reason]);

  const startImport = useCallback(() => {
    setState((s) => ({
      ...s,
      screen: 'import',
      menu: false,
      imp: { step: 1, file: null, reason: '' },
    }));
  }, []);

  const actions = useMemo(
    () => ({
      set,
      go,
      notify,
      pushAudit,
      showQuote,
      showLine,
      publish,
      setHeader,
      addQuoteCost,
      setQuoteCost,
      removeQuoteCost,
      addLineCost,
      setLineCost,
      removeLineCost,
      setValve,
      toggleLine,
      removeLine,
      setSheet,
      pickIdentity,
      editLine,
      cancelSheet,
      saveLine,
      newQuote,
      saveDraft,
      finalise,
      markClosed,
      revise,
      downloadPdf,
      openGap,
      setResolve,
      resolveLine,
      switchRole,
      finalisable,
      saveBoilerplate,
      commitImport,
      startImport,
    }),
    [
      set,
      go,
      notify,
      pushAudit,
      showQuote,
      showLine,
      publish,
      setHeader,
      addQuoteCost,
      setQuoteCost,
      removeQuoteCost,
      addLineCost,
      setLineCost,
      removeLineCost,
      setValve,
      toggleLine,
      removeLine,
      setSheet,
      pickIdentity,
      editLine,
      cancelSheet,
      saveLine,
      newQuote,
      saveDraft,
      finalise,
      markClosed,
      revise,
      downloadPdf,
      openGap,
      setResolve,
      resolveLine,
      switchRole,
      finalisable,
      saveBoilerplate,
      commitImport,
      startImport,
    ],
  );

  return { state, setState, role, isAdmin, quote, contract, quoteContract, actions };
}

export type Portal = ReturnType<typeof usePortalState>;

const PortalContext = createContext<Portal | null>(null);

export function PortalProvider({ children }: { children: ReactNode }) {
  const portal = usePortalState();
  return <PortalContext.Provider value={portal}>{children}</PortalContext.Provider>;
}

export function usePortal(): Portal {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error('usePortal must be used inside PortalProvider');
  return ctx;
}
