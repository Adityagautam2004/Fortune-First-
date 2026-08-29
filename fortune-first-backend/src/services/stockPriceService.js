const axios = require('axios');
const redis = require('../utils/redis');
const ApiError = require('../utils/apiError');

// Yahoo Finance's public, unofficial JSON endpoints — no API key required.
// There's no SLA on these; if that becomes a problem, swap the two calls
// below for a keyed provider (e.g. Twelve Data, Finnhub) without touching
// any caller of searchSymbols/getQuote/getQuotes.
const SEARCH_URL = 'https://query1.finance.yahoo.com/v1/finance/search';
const CHART_URL = (symbol) => `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`;
const HEADERS = { 'User-Agent': 'Mozilla/5.0' };

const SEARCH_CACHE_TTL = 3600; // symbol/name pairs barely change — cache an hour
const QUOTE_CACHE_TTL = 20; // short TTL keeps prices "live" while sparing the free API

/**
 * Autocomplete-style symbol search for the "Add Stock" flow.
 * @param {string} query
 * @returns {Promise<{ symbol: string, name: string, exchange: string }[]>}
 */
const searchSymbols = async (query) => {
  const q = query.trim();
  if (!q) return [];

  const cacheKey = `stock_search:${q.toLowerCase()}`;
  const cached = await redis.get(cacheKey).catch(() => null);
  if (cached) return JSON.parse(cached);

  const { data } = await axios.get(SEARCH_URL, {
    params: { q, quotesCount: 8, newsCount: 0 },
    headers: HEADERS,
    timeout: 5000,
  });

  const results = (data.quotes || [])
    .filter((item) => item.symbol && (item.shortname || item.longname))
    .map((item) => ({
      symbol: item.symbol,
      name: item.shortname || item.longname,
      exchange: item.exchange || item.exchDisp || '',
    }));

  await redis.set(cacheKey, JSON.stringify(results), 'EX', SEARCH_CACHE_TTL).catch(() => {});
  return results;
};

/**
 * Live quote for a single symbol.
 * @param {string} symbol
 * @returns {Promise<{ price: number, previousClose: number|null, currency: string|null }>}
 */
const getQuote = async (symbol) => {
  const cacheKey = `stock_quote:${symbol}`;
  const cached = await redis.get(cacheKey).catch(() => null);
  if (cached) return JSON.parse(cached);

  const { data } = await axios.get(CHART_URL(symbol), { headers: HEADERS, timeout: 5000 });
  const meta = data?.chart?.result?.[0]?.meta;
  if (!meta || typeof meta.regularMarketPrice !== 'number') {
    throw ApiError.badRequest(`Could not find a live price for symbol "${symbol}"`);
  }

  const quote = {
    price: meta.regularMarketPrice,
    previousClose: meta.previousClose ?? meta.chartPreviousClose ?? null,
    currency: meta.currency || null,
  };

  await redis.set(cacheKey, JSON.stringify(quote), 'EX', QUOTE_CACHE_TTL).catch(() => {});
  return quote;
};

/**
 * Live quotes for many symbols at once. Never throws for an individual
 * failed lookup — the caller gets `null` for that symbol instead, so one
 * bad/delisted symbol doesn't take down the whole portfolio view.
 * @param {string[]} symbols
 * @returns {Promise<Record<string, { price: number, previousClose: number|null, currency: string|null } | null>>}
 */
const getQuotes = async (symbols) => {
  const unique = [...new Set(symbols)];
  const entries = await Promise.all(
    unique.map(async (symbol) => {
      try {
        return [symbol, await getQuote(symbol)];
      } catch {
        return [symbol, null];
      }
    })
  );
  return Object.fromEntries(entries);
};

module.exports = { searchSymbols, getQuote, getQuotes };
