const VALID = /^[A-Z0-9]{1,6}(?:[.\-][A-Z0-9]{1,4})?$/;

export function normalizeTicker(raw: string): string {
  let s = raw.toUpperCase().replace(/[\r\n\t]/g, ' ').trim();
  s = s.replace(/^\$/, '').replace(/\s+/g, '');
  s = s.replace(/^[^A-Z0-9]+|[^A-Z0-9.\-]+$/g, '');
  if (!VALID.test(s)) throw new Error(`“${raw.trim()}” doesn't look like a stock ticker.`);
  return s;
}

export function yahooSymbol(ticker: string): string {
  return ticker.replace('.', '-');
}
