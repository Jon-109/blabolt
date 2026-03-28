import type { NextRequest } from 'next/server';

type CacheEntry<T> = { expiresAt: number; value: T };
type RateEntry = { resetAt: number; count: number };

const FIVE_MIN_MS = 5 * 60 * 1000;
const ONE_MIN_MS = 60 * 1000;

const searchCache = new Map<string, CacheEntry<unknown>>();
const quoteCache = new Map<string, CacheEntry<unknown>>();
const rateLimiter = new Map<string, RateEntry>();

export type MarketSearchResult = {
  symbol: string;
  description: string;
  exchange: string;
};

export type MarketQuoteResult = {
  price: number;
  asOfDateTime: string;
  sourceName: string;
  exchange: string;
};

export function getClientKey(req: NextRequest): string {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown-ip';
  const ua = req.headers.get('user-agent') || 'unknown-ua';
  return `${ip}:${ua.slice(0, 64)}`;
}

export function checkRateLimit(key: string, maxPerMinute: number): boolean {
  const now = Date.now();
  const existing = rateLimiter.get(key);
  if (!existing || now > existing.resetAt) {
    rateLimiter.set(key, { count: 1, resetAt: now + ONE_MIN_MS });
    return true;
  }
  if (existing.count >= maxPerMinute) return false;
  existing.count += 1;
  rateLimiter.set(key, existing);
  return true;
}

function readCache<T>(cache: Map<string, CacheEntry<unknown>>, key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value as T;
}

function writeCache<T>(cache: Map<string, CacheEntry<unknown>>, key: string, value: T): void {
  cache.set(key, { value, expiresAt: Date.now() + FIVE_MIN_MS });
}

export function getCachedSearch(query: string): MarketSearchResult[] | null {
  return readCache<MarketSearchResult[]>(searchCache, query.toLowerCase().trim());
}

export function setCachedSearch(query: string, value: MarketSearchResult[]): void {
  writeCache(searchCache, query.toLowerCase().trim(), value);
}

export function getCachedQuote(symbol: string): MarketQuoteResult | null {
  return readCache<MarketQuoteResult>(quoteCache, symbol.toUpperCase().trim());
}

export function setCachedQuote(symbol: string, value: MarketQuoteResult): void {
  writeCache(quoteCache, symbol.toUpperCase().trim(), value);
}
