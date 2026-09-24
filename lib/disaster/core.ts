import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type Category = 'power' | 'water' | 'comm';
export type Carrier = 'docomo' | 'au' | 'rakuten';
export type ReportState = 'warning' | 'active' | 'restored';

export interface Report {
  id: string;
  category: Category;
  carrier: Carrier | null;
  lat: number;
  lng: number;
  sign_at: string | null;
  onset_at: string | null;
  restored_at: string | null;
  created_at: string;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  power: '停電',
  water: '断水',
  comm: '通信障害',
};

export const CARRIER_LABELS: Record<Carrier, string> = {
  docomo: 'ドコモ',
  au: 'au',
  rakuten: '楽天モバイル',
};

export const STATE_COLORS: Record<ReportState, string> = {
  warning: '#f59e0b',
  active: '#dc2626',
  restored: '#16a34a',
};

export const CARRIER_COLORS: Record<Carrier, string> = {
  docomo: '#cc0000',
  au: '#ff8000',
  rakuten: '#c800a1',
};

export const CARRIER_COLOR_FALLBACK = '#888';

export const EXPIRE_MS = 200 * 3600000;

const isoMs = (x: string | null): number | null => (x ? new Date(x).getTime() : null);

export function stateAt(r: Report, t: number): ReportState | null {
  const onset = isoMs(r.onset_at);
  const sign = isoMs(r.sign_at);
  const restored = isoMs(r.restored_at);
  const base = onset ?? sign;
  if (restored === null && base !== null && t - base >= EXPIRE_MS) return null;
  if (restored !== null && restored <= t) return 'restored';
  if (onset !== null && onset <= t) return 'active';
  if (sign !== null && sign <= t && (onset === null || t < onset)) return 'warning';
  return null;
}

export function labelHtml(r: Report, s: ReportState, viewTime: number): string {
  const c = CATEGORY_LABELS[r.category];
  const carrier = r.carrier ? `（${CARRIER_LABELS[r.carrier]}）` : '';
  if (s === 'warning') return `${c}${carrier}<br>予兆`;
  if (s === 'restored') return `${c}${carrier}<br>復旧済み`;
  const h = Math.max(0, Math.floor((viewTime - (isoMs(r.onset_at ?? r.sign_at) as number)) / 3600000));
  return `${c}${carrier}<br>障害中（${h}時間経過）`;
}

export type ReportLog = Record<string, number[]>;

export const getReportLog = (): ReportLog => {
  try {
    const parsed = JSON.parse(localStorage.getItem('report_log') || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).map(([key, values]) => [
        key,
        Array.isArray(values) ? values.filter((v) => Number.isFinite(v)) : [],
      ])
    ) as ReportLog;
  } catch (_) {
    return {};
  }
};

export const setReportLog = (log: ReportLog): void => {
  try {
    localStorage.setItem('report_log', JSON.stringify(log));
  } catch (_) {}
};

export const checkReportRateLimit = (now: number, key: string): string | null => {
  const hourAgo = now - 60 * 60 * 1000;
  const log = getReportLog();
  const entries = Array.isArray(log[key])
    ? log[key].filter((t) => t > hourAgo && t <= now)
    : [];
  const latest = entries.length ? Math.max(...entries) : 0;
  if (latest && now - latest < 20 * 1000) {
    const remaining = Math.ceil((20 * 1000 - (now - latest)) / 1000);
    return `連続送信はできません。あと${remaining}秒お待ちください。`;
  }
  if (entries.length >= 5) {
    return '同じ分野の1時間あたり送信上限（5件）に達しています。';
  }
  return null;
};

export const recordReport = (key: string, now: number): void => {
  const log = getReportLog();
  log[key] = (log[key] || []).filter((time) => now - time < 3600000);
  log[key].push(now);
  setReportLog(log);
};

export interface Area {
  id: string;
  name: string;
  bounds: [[number, number], [number, number]];
}

export const AREAS: Area[] = [
  { id: 'tokunoshima', name: '徳之島', bounds: [[27.65, 128.87], [27.90, 129.05]] },
  { id: 'amami', name: '奄美大島', bounds: [[28.03, 129.08], [28.55, 129.75]] },
];

export const ALL_BOUNDS: [[number, number], [number, number]] = AREAS.reduce(
  (acc, a) => {
    acc[0][0] = Math.min(acc[0][0], a.bounds[0][0]);
    acc[0][1] = Math.min(acc[0][1], a.bounds[0][1]);
    acc[1][0] = Math.max(acc[1][0], a.bounds[1][0]);
    acc[1][1] = Math.max(acc[1][1], a.bounds[1][1]);
    return acc;
  },
  [
    [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY],
    [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY],
  ] as [[number, number], [number, number]]
);

const SUPABASE_URL = 'https://ovhhjbelgjosvqknozsn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_yzxBkwjyRuLppxnGG_8i6A_9iMFw6VV';

let supabaseClient: SupabaseClient | null = null;
let supabaseInitialized = false;

export const getSupabase = (): SupabaseClient | null => {
  if (supabaseInitialized) return supabaseClient;
  supabaseInitialized = true;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;
  const configured = !url.includes('YOUR_') && !key.includes('YOUR_');
  supabaseClient = configured ? createClient(url, key) : null;
  return supabaseClient;
};

export function sampleReports(now: number): Report[] {
  return [
    { id: 's1', category: 'power', carrier: null, lat: 27.7266, lng: 128.9395, sign_at: new Date(now - 8 * 3600000).toISOString(), onset_at: new Date(now - 5 * 3600000).toISOString(), restored_at: null, created_at: new Date(now - 8 * 3600000).toISOString() },
    { id: 's2', category: 'water', carrier: null, lat: 27.745, lng: 128.965, sign_at: new Date(now - 30 * 3600000).toISOString(), onset_at: null, restored_at: null, created_at: new Date(now - 30 * 3600000).toISOString() },
    { id: 's3', category: 'comm', carrier: 'docomo', lat: 27.70, lng: 128.91, sign_at: null, onset_at: new Date(now - 12 * 3600000).toISOString(), restored_at: new Date(now - 3 * 3600000).toISOString(), created_at: new Date(now - 12 * 3600000).toISOString() },
    { id: 's4', category: 'comm', carrier: 'au', lat: 27.76, lng: 128.98, sign_at: new Date(now - 2 * 3600000).toISOString(), onset_at: null, restored_at: null, created_at: new Date(now - 2 * 3600000).toISOString() },
  ];
}
