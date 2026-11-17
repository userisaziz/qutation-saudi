import type { Contract, RateRow } from '@/domain/types';

/**
 * Synthetic reference data for a demo build. No real customer, contract,
 * ARC, work-order or instrument-tag numbers appear anywhere in this file.
 */

export const VALVE_MODELS: Record<string, string[]> = {
  'Safety Valve': ['Conventional PSV', 'Pilot PSV', 'PRV'],
  'Gate Valve': ['Wedge Gate', 'Through-Conduit Gate'],
  'Ball Valve': ['Floating Ball', 'Trunnion Ball'],
  'Globe Valve': ['Standard Globe'],
  'Check Valve': ['Swing Check', 'Dual-Plate Check'],
};

export const CATEGORY_LIST = Object.keys(VALVE_MODELS);

export const CATEGORY_CODE: Record<string, string> = {
  'Safety Valve': 'SV',
  'Gate Valve': 'GV',
  'Ball Valve': 'BV',
  'Globe Valve': 'GL',
  'Check Valve': 'CV',
};

export const LINE_ICON: Record<string, string> = {
  'Safety Valve': 'ic-valve-psv',
  'Gate Valve': 'ic-valve-gate',
  'Ball Valve': 'ic-valve-ball',
  'Globe Valve': 'ic-valve-globe',
  'Check Valve': 'ic-valve-check',
};

const CATEGORY_BASE: Record<string, number> = {
  'Safety Valve': 520,
  'Gate Valve': 440,
  'Ball Valve': 400,
  'Globe Valve': 470,
  'Check Valve': 360,
};

export const MODEL_FACTOR: Record<string, number> = {
  'Conventional PSV': 1,
  'Pilot PSV': 1.45,
  PRV: 0.9,
  'Wedge Gate': 1,
  'Through-Conduit Gate': 1.25,
  'Floating Ball': 1,
  'Trunnion Ball': 1.4,
  'Standard Globe': 1,
  'Swing Check': 1,
  'Dual-Plate Check': 0.85,
};

export const SIZES = [
  '0.5 x 1',
  '1 x 2',
  '1.5 x 2.5',
  '2 x 3',
  '3 x 4',
  '4 x 6',
  '6 x 8',
  '8 x 10',
  '12 x 16',
];
export const DN = ['DN15', 'DN25', 'DN40', 'DN50', 'DN80', 'DN100', 'DN150', 'DN200', 'DN300'];
const SIZE_FACTOR = [0.8, 1, 1.2, 1.4, 1.8, 2.3, 3, 3.8, 5.2];

/** Rating is priced as a band, not an individual pressure class. */
export const RATINGS = ['150~600 LB', '900~2500 LB'];
export const HIGH_BAND = RATINGS[1];

export const SERVICE_BUNDLES = [
  'Testing and Calibration at Contract Workshop',
  'Testing and Calibration at Site',
  'OH Level-1',
  'OH Level-2',
  'Repair and Lapping',
];

export const SERVICE_FACTOR: Record<string, number> = {
  'Testing and Calibration at Contract Workshop': 0.5,
  'Testing and Calibration at Site': 0.65,
  'OH Level-1': 1,
  'OH Level-2': 1.55,
  'Repair and Lapping': 0.8,
};

export const SERVICE_CODE: Record<string, string> = {
  'Testing and Calibration at Contract Workshop': 'TW',
  'Testing and Calibration at Site': 'TS',
  'OH Level-1': 'O1',
  'OH Level-2': 'O2',
  'Repair and Lapping': 'RL',
};

export const SERVICE_DESCRIPTION: Record<string, string> = {
  'Testing and Calibration at Contract Workshop':
    'Bench pop test, set-pressure calibration and certification at the contract workshop.',
  'Testing and Calibration at Site': 'In-situ testing and calibration with a mobile test rig.',
  'OH Level-1': 'Strip, clean, inspect, replace soft goods, reassemble and test.',
  'OH Level-2': 'Level-1 scope plus seat/disc machining and hard-part replacement.',
  'Repair and Lapping': 'Seat and disc lapping, minor repairs and retest.',
};

export const SERVICE_SHORT: Record<string, string> = {
  'Testing and Calibration at Contract Workshop': 'Test & Cal · Workshop',
  'Testing and Calibration at Site': 'Test & Cal · Site',
  'Repair and Lapping': 'Repair & Lapping',
};

export const SERVICE_PROPOSAL_LABEL: Record<string, string> = {
  'Testing and Calibration at Contract Workshop': 'Testing and Calibration',
  'Testing and Calibration at Site': 'Testing and Calibration',
  'OH Level-1': 'Overhauling (Level-1)',
  'OH Level-2': 'Overhauling (Level-2)',
  'Repair and Lapping': 'Repair and Lapping',
};

export const CONTRACTS: Contract[] = [
  {
    id: 'c1',
    ct: 'CT-2024-018',
    arc: 'A-77420',
    customer: 'RASHEED PETROCHEMICALS',
    legal: 'Rasheed Industrialization Petrochemical Co.',
    start: '01/04/24',
    end: '31/03/29',
    status: 'Active',
    pct: '54%',
    remaining: '2 yrs 2 mo',
    tcv: 18500000,
    f: 1,
    services: SERVICE_BUNDLES,
    termText: '',
  },
  {
    id: 'c2',
    ct: 'CT-2022-007',
    arc: 'A-71106',
    customer: 'SUMARIA CHEMICAL',
    legal: 'Sumaria Chemical Company',
    start: '01/01/22',
    end: '31/12/26',
    status: 'Expiring',
    pct: '96%',
    remaining: '2 mo',
    tcv: 24000000,
    f: 1.08,
    services: SERVICE_BUNDLES.slice(0, 4),
    termText: '',
  },
  {
    id: 'c3',
    ct: 'CT-2025-002',
    arc: 'A-78903',
    customer: 'YAMBUR REFINING',
    legal: 'Yambur Aramco Refining Co.',
    start: '01/06/25',
    end: '31/05/30',
    status: 'Active',
    pct: '29%',
    remaining: '3 yrs 5 mo',
    tcv: 9200000,
    f: 0.95,
    services: [SERVICE_BUNDLES[0], SERVICE_BUNDLES[2], SERVICE_BUNDLES[3]],
    termText: '',
  },
  {
    id: 'c4',
    ct: 'CT-2020-011',
    arc: 'A-64210',
    customer: 'MAWRED UTILITY',
    legal: 'Power & Water Utility Co. for Jubail and Yambur',
    start: '01/01/21',
    end: '31/12/25',
    status: 'Expired',
    pct: '100%',
    remaining: '—',
    tcv: 12750000,
    f: 1.02,
    services: SERVICE_BUNDLES.slice(0, 4),
    termText: '',
  },
];

export const CONTRACT_BY_ID: Record<string, Contract> = {};
CONTRACTS.forEach((c) => {
  CONTRACT_BY_ID[c.id] = c;
  c.termText = `${c.start} – ${c.end}`;
});

/** Rate cards do not exist for every combination; base() returns null for dead ends. */
export function lookupRate(
  c: Contract,
  cat: string,
  model: string,
  size: string,
  rating: string,
  svc: string,
): number | null {
  if (!c.services.includes(svc)) return null;
  const i = SIZES.indexOf(size);
  const hi = rating === HIGH_BAND;
  if (model === 'Pilot PSV' && hi && i >= 6) return null;
  if (model === 'PRV' && svc === 'OH Level-2') return null;
  if (model === 'Trunnion Ball' && i < 2) return null;
  if (cat === 'Check Valve' && svc === 'Testing and Calibration at Site') return null;
  if (cat === 'Safety Valve' && i === 8 && hi) return null;
  return (
    Math.round(
      (CATEGORY_BASE[cat] *
        MODEL_FACTOR[model] *
        SIZE_FACTOR[i] *
        (hi ? 1.6 : 1) *
        SERVICE_FACTOR[svc] *
        c.f) /
        5,
    ) * 5
  );
}

export const RATE_SCHEDULE: Record<string, RateRow[]> = {};
CONTRACTS.forEach((c) => {
  const rows: RateRow[] = [];
  CATEGORY_LIST.forEach((cat) =>
    VALVE_MODELS[cat].forEach((model) =>
      SIZES.forEach((size) =>
        RATINGS.forEach((rating) =>
          c.services.forEach((svc) => {
            const rate = lookupRate(c, cat, model, size, rating, svc);
            if (rate != null) rows.push({ cat, model, size, rating, svc, rate, ver: 'v1' });
          }),
        ),
      ),
    ),
  );
  RATE_SCHEDULE[c.id] = rows;
});

export const dnOf = (size: string) => DN[SIZES.indexOf(size)] || '';
