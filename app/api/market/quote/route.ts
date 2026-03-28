import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getCachedQuote, getClientKey, setCachedQuote, type MarketQuoteResult } from '@/lib/server/market-data';

const COMMON_HEADERS = {
  accept: 'application/json',
  'user-agent': 'Mozilla/5.0 (compatible; BLA/1.0; +https://blabolt.local)',
};

async function fetchYahooQuote(symbol: string): Promise<MarketQuoteResult | null> {
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`;
  const res = await fetch(url, { method: 'GET', headers: COMMON_HEADERS, cache: 'no-store' });
  if (!res.ok) return null;
  const json = (await res.json()) as any;
  const quote = json?.quoteResponse?.result?.[0];
  const price = Number(quote?.regularMarketPrice);
  if (!Number.isFinite(price)) return null;
  return {
    price,
    asOfDateTime: quote?.regularMarketTime
      ? new Date(Number(quote.regularMarketTime) * 1000).toISOString()
      : new Date().toISOString(),
    sourceName: 'Yahoo Finance',
    exchange: String(quote?.fullExchangeName || quote?.exchange || ''),
  };
}

async function fetchYahooChartFallback(symbol: string): Promise<MarketQuoteResult | null> {
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`;
  const res = await fetch(url, { method: 'GET', headers: COMMON_HEADERS, cache: 'no-store' });
  if (!res.ok) return null;
  const json = (await res.json()) as any;
  const result = json?.chart?.result?.[0];
  const meta = result?.meta || {};
  const price = Number(meta?.regularMarketPrice ?? meta?.chartPreviousClose);
  if (!Number.isFinite(price)) return null;
  return {
    price,
    asOfDateTime: meta?.regularMarketTime
      ? new Date(Number(meta.regularMarketTime) * 1000).toISOString()
      : new Date().toISOString(),
    sourceName: 'Yahoo Finance',
    exchange: String(meta?.fullExchangeName || meta?.exchangeName || ''),
  };
}

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol')?.trim().toUpperCase() || '';
  if (!symbol) {
    return NextResponse.json({ error: 'Missing symbol' }, { status: 400 });
  }

  const clientKey = getClientKey(req);
  if (!checkRateLimit(`market-quote:${clientKey}`, 60)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const cached = getCachedQuote(symbol);
  if (cached) return NextResponse.json(cached);

  try {
    const quoteResult = (await fetchYahooQuote(symbol)) || (await fetchYahooChartFallback(symbol));
    if (!quoteResult) return NextResponse.json({ error: 'Quote unavailable' }, { status: 404 });

    setCachedQuote(symbol, quoteResult);
    return NextResponse.json(quoteResult);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch quote' }, { status: 502 });
  }
}
