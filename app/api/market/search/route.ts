import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getCachedSearch, getClientKey, setCachedSearch, type MarketSearchResult } from '@/lib/server/market-data';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() || '';
  if (q.length < 2) {
    return NextResponse.json({ results: [] as MarketSearchResult[] });
  }

  const clientKey = getClientKey(req);
  if (!checkRateLimit(`market-search:${clientKey}`, 60)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const cached = getCachedSearch(q);
  if (cached) return NextResponse.json({ results: cached });

  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0`;
    const res = await fetch(url, { method: 'GET', headers: { accept: 'application/json' }, cache: 'no-store' });
    if (!res.ok) {
      return NextResponse.json({ results: [] as MarketSearchResult[] });
    }
    const json = (await res.json()) as any;
    const results: MarketSearchResult[] = (json?.quotes || [])
      .filter((item: any) => item?.symbol && item?.shortname)
      .slice(0, 8)
      .map((item: any) => ({
        symbol: String(item.symbol),
        description: String(item.shortname || item.longname || item.symbol),
        exchange: String(item.exchDisp || item.exchange || ''),
      }));

    setCachedSearch(q, results);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] as MarketSearchResult[] });
  }
}
