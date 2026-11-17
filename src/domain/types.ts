export type Role = 'Estimator' | 'Admin';

export type Screen =
  | 'contracts'
  | 'contract'
  | 'import'
  | 'quotes'
  | 'editor'
  | 'preview'
  | 'queue'
  | 'ref'
  | 'audit';

export type ContractStatus = 'Active' | 'Expiring' | 'Expired';
export type QuoteStatus = 'Draft' | 'Finalised' | 'Closed';

export interface Valve {
  tag: string;
  serial: string;
}

export interface Cost {
  label: string;
  amount: string;
}

/** The five identity attributes that form a contract rate key. */
export interface Identity {
  cat: string;
  model: string;
  size: string;
  rating: string;
  svc: string;
}

export interface Line extends Identity {
  id: number;
  desc: string;
  qty: number;
  rate: number | null;
  ver: string | null;
  extras: Cost[];
  valves: Valve[];
  open: boolean;
}

export interface QuoteHeader {
  date: string;
  validity: string;
  wo: string;
  rfq: string;
  evmc: string;
  attn: string;
}

export interface Boilerplate {
  tc: string;
  notes: string;
}

export interface Quote {
  id: string;
  cid: string;
  no: string;
  status: QuoteStatus;
  createdAt: string;
  finBy: string | null;
  finAt: string | null;
  hdr: QuoteHeader;
  lines: Line[];
  qx: Cost[];
  bpSnap: Boilerplate | null;
}

export interface Contract {
  id: string;
  ct: string;
  arc: string;
  customer: string;
  legal: string;
  start: string;
  end: string;
  status: ContractStatus;
  pct: string;
  remaining: string;
  tcv: number;
  f: number;
  services: string[];
  termText: string;
}

export interface RateRow extends Identity {
  rate: number;
  ver: string;
}

export interface AddedRate {
  rate: number;
  ver: string;
  from: string;
  reason: string;
  by: string;
}

export interface AuditEntry {
  at: string;
  who: string;
  role: Role;
  area: string;
  action: string;
  obj: string;
}

export interface DraftLine extends Identity {
  id: number | null;
  desc: string;
  qty: string;
  extras: Cost[];
}

export interface Totals {
  sub: number;
  lx: number;
  qx: number;
  nc: number;
  valves: number;
  miss: number;
  priced: number;
  grand: number;
}
