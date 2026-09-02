// NSE/BSE cash-market hours: Mon-Fri, 9:15 AM - 3:30 PM IST. The dashboard
// treats prices as "live" through a 4:00 PM after-market buffer, then frozen
// until the next trading day's open — this is the boundary caching decisions
// (stockPriceService, stockPortfolioService) key off of.
//
// Known limitation: NSE holidays aren't tracked here (the calendar changes
// every year and isn't worth hardcoding) — on a holiday this just means one
// avoidable refresh that day, never a correctness problem.
const IST_OFFSET_MINUTES = 5 * 60 + 30;
const MARKET_OPEN_MINUTES = 9 * 60 + 15; // 9:15 AM
const MARKET_CLOSE_MINUTES = 16 * 60; // 4:00 PM (includes the after-market buffer)

function toIST(date) {
  const utcMs = date.getTime() + date.getTimezoneOffset() * 60_000;
  return new Date(utcMs + IST_OFFSET_MINUTES * 60_000);
}

function isWeekend(istDate) {
  const day = istDate.getDay();
  return day === 0 || day === 6;
}

/** Whether the market is currently in its live trading + after-market window. */
function isMarketOpen(date = new Date()) {
  const ist = toIST(date);
  if (isWeekend(ist)) return false;
  const minutes = ist.getHours() * 60 + ist.getMinutes();
  return minutes >= MARKET_OPEN_MINUTES && minutes < MARKET_CLOSE_MINUTES;
}

/** The next moment prices can start moving again (skips weekends). */
function nextMarketOpen(date = new Date()) {
  const ist = toIST(date);
  const candidate = new Date(ist);
  candidate.setHours(9, 15, 0, 0);

  const minutesNow = ist.getHours() * 60 + ist.getMinutes();
  if (minutesNow >= MARKET_OPEN_MINUTES) {
    // Already past today's open (whether still trading, in the after-market
    // buffer, or fully closed for the night) — the next open is tomorrow.
    candidate.setDate(candidate.getDate() + 1);
  }

  while (isWeekend(candidate)) {
    candidate.setDate(candidate.getDate() + 1);
  }

  return candidate;
}

/**
 * Cache TTL, in seconds, appropriate for right now: short while the market
 * is live (so prices stay fresh), long while it's closed (so a closed-hours
 * cache self-heals at the next open even if an explicit invalidation is ever
 * missed) — used as the safety-net expiry, not the primary freshness signal.
 */
function cacheTtlSeconds(date = new Date(), liveTtlSeconds = 20) {
  if (isMarketOpen(date)) return liveTtlSeconds;
  const ist = toIST(date);
  const next = nextMarketOpen(date);
  return Math.max(60, Math.round((next.getTime() - ist.getTime()) / 1000));
}

module.exports = { isMarketOpen, nextMarketOpen, cacheTtlSeconds };
