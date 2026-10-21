export type Quote = {
  symbol: string;
  providerSymbol: string;
  name?: string;
  price: number;
  currency: string;
  change?: number;
  changePercent?: number;
  previousClose?: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
  marketState: string;
  exchange?: string;
  quoteTime: Date;
};

function finite(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

export async function fetchQuote(providerSymbol: string): Promise<Quote> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(providerSymbol)}?interval=1m&range=1d`;
    const res = await fetch(url, {signal: controller.signal, headers: {'Accept': 'application/json'}});
    if (res.status === 404) throw new Error('Ticker not found.');
    if (res.status === 429) throw new Error('Quote service is temporarily rate-limited. Try again shortly.');
    if (!res.ok) throw new Error(`Quote service returned ${res.status}.`);
    const json: any = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) throw new Error(json?.chart?.error?.description || 'No quote was returned for that ticker.');
    const meta = result.meta || {};
    const bars = result.indicators?.quote?.[0] || {};
    const last = (arr: unknown[]) => Array.isArray(arr) ? [...arr].reverse().find(v => finite(v) !== undefined) as number | undefined : undefined;
    const price = finite(meta.regularMarketPrice) ?? last(result.indicators?.adjclose?.[0]?.adjclose) ?? last(result.indicators?.quote?.[0]?.close);
    if (price === undefined) throw new Error('Price unavailable for that ticker.');
    const previousClose = finite(meta.chartPreviousClose) ?? finite(meta.previousClose);
    const change = previousClose !== undefined ? price - previousClose : undefined;
    const changePercent = previousClose ? (change! / previousClose) * 100 : undefined;
    const quoteEpoch = finite(meta.regularMarketTime) ?? last(result.timestamp) ?? Math.floor(Date.now() / 1000);
    const now = Date.now();
    const quoteMs = quoteEpoch * 1000;
    const marketState = inferMarketState(meta, quoteMs, now);
    return {
      symbol: providerSymbol,
      providerSymbol,
      name: meta.shortName || meta.longName || undefined,
      price,
      currency: meta.currency || 'USD',
      change,
      changePercent,
      previousClose,
      open: finite(meta.regularMarketOpen) ?? finite(bars.open?.[0]),
      high: finite(meta.regularMarketDayHigh) ?? maxFinite(bars.high),
      low: finite(meta.regularMarketDayLow) ?? minFinite(bars.low),
      volume: finite(meta.regularMarketVolume) ?? finite(last(bars.volume)),
      marketState,
      exchange: meta.fullExchangeName || meta.exchangeName || meta.exchange || undefined,
      quoteTime: new Date(quoteMs),
    };
  } catch (e: any) {
    if (e?.name === 'AbortError') throw new Error('Quote request timed out. Check Wi-Fi and try again.');
    if (/Network request failed/i.test(String(e?.message))) throw new Error('No internet connection. Connect to Wi-Fi and try again.');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

function maxFinite(a: unknown): number | undefined { const n = Array.isArray(a) ? a.filter(v => finite(v) !== undefined) as number[] : []; return n.length ? Math.max(...n) : undefined; }
function minFinite(a: unknown): number | undefined { const n = Array.isArray(a) ? a.filter(v => finite(v) !== undefined) as number[] : []; return n.length ? Math.min(...n) : undefined; }
function inferMarketState(meta: any, quoteMs: number, now: number): string {
  if (typeof meta.marketState === 'string') return title(meta.marketState);
  const ageMin = Math.abs(now - quoteMs) / 60000;
  return ageMin <= 20 ? 'Recent quote' : 'Last reported';
}
function title(s: string): string { return s.toLowerCase().replace(/(^|\s)\w/g, c => c.toUpperCase()); }

export function moneyText(v: number | undefined, currency: string): string {
  if (v === undefined) return '—';
  const prefix = currency === 'USD' ? '$' : currency === 'CAD' ? 'C$' : currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '';
  return `${prefix}${v.toFixed(v >= 1000 ? 2 : 2)}${prefix ? '' : ` ${currency}`}`;
}

export function insertionText(q: Quote): string {
  const sign = (q.change ?? 0) >= 0 ? '+' : '';
  const delta = q.changePercent === undefined ? '' : ` ${sign}${q.changePercent.toFixed(2)}%`;
  const stamp = q.quoteTime.toLocaleString('en-US', {month:'short', day:'numeric', year:'numeric', hour:'numeric', minute:'2-digit'});
  return `${q.symbol} ${moneyText(q.price, q.currency)}${delta} | ${stamp}`;
}
