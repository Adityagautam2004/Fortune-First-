const axios = require('axios');
const db = require('../models/db');
const cache = require('../utils/cache');
const ApiError = require('../utils/apiError');
const { htmlToPdf } = require('../utils/pdf');
const { renderStatementHtml } = require('../utils/statementTemplate');

// Client investment statements (monthly / financial-year / since inception).
// Each PDF is rendered by a fresh headless Chromium — the most expensive thing
// this API does — so finished statements are cached per customer and period.
// Every write that changes a customer's figures calls
// cache.invalidateCustomerCaches(), so the TTL is only a safety net; a period
// that is still running gets a short TTL so its "as of" date stays current.
const CLOSED_PERIOD_TTL = 24 * 60 * 60;
const OPEN_PERIOD_TTL = 60 * 60;

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const pad = (n) => String(n).padStart(2, '0');
const isoDate = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
const localIso = (date) => isoDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
const addDays = (iso, days) => {
  const [y, m, d] = iso.split('-').map(Number);
  return localIso(new Date(y, m - 1, d + days));
};

/** Indian financial year that contains `date` — FY 2025 = 1 Apr 2025 to 31 Mar 2026. */
const financialYearOf = (date = new Date()) => (date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1);

/**
 * A statement period as half-open ISO dates [start, endExclusive).
 * @param {{ type: 'monthly', month: number, year: number } | { type: 'annual', fy: number } | { type: 'full' }} spec
 * @param {string} inceptionIso - the client's first activity date, used for 'full'
 */
const resolvePeriod = (spec, inceptionIso) => {
  const todayIso = localIso(new Date());
  const tomorrowIso = addDays(todayIso, 1);
  let period;

  if (spec.type === 'monthly') {
    const start = isoDate(spec.year, spec.month, 1);
    const next = spec.month === 12 ? isoDate(spec.year + 1, 1, 1) : isoDate(spec.year, spec.month + 1, 1);
    period = { type: 'monthly', start, endExclusive: next, label: `${MONTH_NAMES[spec.month - 1]} ${spec.year}`, title: 'Monthly Investment Statement', cacheSuffix: `monthly-${spec.year}-${pad(spec.month)}` };
  } else if (spec.type === 'annual') {
    period = {
      type: 'annual',
      start: isoDate(spec.fy, 4, 1),
      endExclusive: isoDate(spec.fy + 1, 4, 1),
      label: `FY ${spec.fy}–${String(spec.fy + 1).slice(-2)} (April ${spec.fy} – March ${spec.fy + 1})`,
      title: 'Annual Investment Statement',
      cacheSuffix: `annual-${spec.fy}`,
    };
  } else {
    period = { type: 'full', start: inceptionIso, endExclusive: tomorrowIso, label: 'Since inception', title: 'Consolidated Investment Statement', cacheSuffix: 'full' };
  }

  if (period.start > todayIso) throw ApiError.badRequest('The selected period has not started yet');

  // A period that hasn't ended yet is reported "to date" (as of today).
  period.isOpen = period.endExclusive > tomorrowIso || period.type === 'full';
  period.asOf = period.endExclusive > tomorrowIso ? todayIso : addDays(period.endExclusive, -1);
  if (period.type === 'full') period.asOf = todayIso;
  return period;
};

// Embed the client's photo as a data URI so the PDF never depends on a slow
// or failing remote image load; falls back to initials in the template.
const fetchImageDataUri = async (url) => {
  if (!url) return null;
  try {
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 5000, maxContentLength: 5 * 1024 * 1024 });
    const type = String(res.headers['content-type'] || '');
    if (!type.startsWith('image/')) return null;
    return `data:${type};base64,${Buffer.from(res.data).toString('base64')}`;
  } catch (error) {
    console.error('Statement: could not load client photo:', error.message);
    return null;
  }
};

const getProfile = async (customerId) => {
  const { rows } = await db.query(
    `SELECT u.name, u.email, u.phone, u.profile_picture_url, u.client_code, u.created_at,
            rm.name AS relationship_manager, rm.phone AS relationship_manager_phone,
            LEAST(
              u.created_at::date,
              COALESCE((SELECT MIN(investment_date) FROM investments WHERE customer_id = u.id), u.created_at::date)
            ) AS inception_date
     FROM users u
     LEFT JOIN users rm ON rm.id = u.assigned_to
     WHERE u.id = $1 AND u.role = 'customer'`,
    [customerId]
  );
  return rows[0] || null;
};

/**
 * Every figure on the statement. "Active investment" follows the same rule
 * as payouts and the dashboard: active investments minus completed
 * withdrawals. Only payouts actually paid are reported.
 */
const collectStatementData = async (customerId, period) => {
  const { start, endExclusive } = period;
  const q = (sql, params) => db.query(sql, params).then((r) => r.rows);

  const [balances, investments, withdrawals, payouts, lifetime] = await Promise.all([
    q(
      `SELECT
         COALESCE((SELECT SUM(amount) FROM investments WHERE customer_id = $1 AND status = 'active' AND investment_date < $2::date), 0) AS invested_before,
         COALESCE((SELECT SUM(amount) FROM withdrawals WHERE customer_id = $1 AND status = 'completed' AND withdrawal_date < $2::date), 0) AS withdrawn_before`,
      [customerId, start]
    ),
    q(
      `SELECT investment_date AS date, amount FROM investments
       WHERE customer_id = $1 AND status = 'active' AND investment_date >= $2::date AND investment_date < $3::date
       ORDER BY investment_date ASC`,
      [customerId, start, endExclusive]
    ),
    q(
      `SELECT withdrawal_date AS date, amount FROM withdrawals
       WHERE customer_id = $1 AND status = 'completed' AND withdrawal_date >= $2::date AND withdrawal_date < $3::date
       ORDER BY withdrawal_date ASC`,
      [customerId, start, endExclusive]
    ),
    q(
      `SELECT month, year, invested_amount, return_pct, payout_amount, payout_date FROM monthly_returns
       WHERE customer_id = $1 AND payout_status = 'paid'
         AND make_date(year, month, 1) >= $2::date AND make_date(year, month, 1) < $3::date
       ORDER BY year ASC, month ASC`,
      [customerId, start, endExclusive]
    ),
    q(
      `SELECT
         COALESCE((SELECT SUM(amount) FROM investments WHERE customer_id = $1 AND status = 'active' AND investment_date < $2::date), 0) AS total_invested,
         COALESCE((SELECT SUM(amount) FROM withdrawals WHERE customer_id = $1 AND status = 'completed' AND withdrawal_date < $2::date), 0) AS total_withdrawn,
         COALESCE((SELECT SUM(payout_amount) FROM monthly_returns WHERE customer_id = $1 AND payout_status = 'paid' AND make_date(year, month, 1) < $2::date), 0) AS total_payouts,
         (SELECT COUNT(*) FROM monthly_returns WHERE customer_id = $1 AND payout_status = 'paid' AND make_date(year, month, 1) < $2::date) AS payout_count`,
      [customerId, endExclusive]
    ),
  ]);

  const num = (v) => Number(v) || 0;
  const opening = num(balances[0].invested_before) - num(balances[0].withdrawn_before);
  const added = investments.reduce((s, r) => s + num(r.amount), 0);
  const withdrawn = withdrawals.reduce((s, r) => s + num(r.amount), 0);
  const totalPayouts = payouts.reduce((s, r) => s + num(r.payout_amount), 0);
  const totalBase = payouts.reduce((s, r) => s + num(r.invested_amount), 0);

  return {
    summary: {
      openingBalance: opening,
      added,
      investmentCount: investments.length,
      withdrawn,
      withdrawalCount: withdrawals.length,
      closingBalance: opening + added - withdrawn,
      totalPayouts,
      payoutCount: payouts.length,
      // Payout-weighted: total paid ÷ total capital it was paid on, per month.
      avgMonthlyReturn: totalBase > 0 ? (totalPayouts / totalBase) * 100 : 0,
    },
    payouts,
    movements: [
      ...investments.map((r) => ({ date: r.date, type: 'investment', amount: num(r.amount) })),
      ...withdrawals.map((r) => ({ date: r.date, type: 'withdrawal', amount: num(r.amount) })),
    ].sort((a, b) => new Date(a.date) - new Date(b.date)),
    lifetime: {
      totalInvested: num(lifetime[0].total_invested),
      totalWithdrawn: num(lifetime[0].total_withdrawn),
      activeInvestment: num(lifetime[0].total_invested) - num(lifetime[0].total_withdrawn),
      totalPayouts: num(lifetime[0].total_payouts),
      payoutCount: parseInt(lifetime[0].payout_count, 10) || 0,
    },
  };
};

/**
 * Build (or serve from cache) a client's statement PDF.
 * @param {string} customerId
 * @param {{ type: 'monthly', month: number, year: number } | { type: 'annual', fy: number } | { type: 'full' }} spec
 * @returns {Promise<{ profile: object, period: object, pdf: Buffer } | null>} null when the customer doesn't exist
 */
const getStatement = async (customerId, spec) => {
  const profile = await getProfile(customerId);
  if (!profile) return null;

  const period = resolvePeriod(spec, localIso(new Date(profile.inception_date)));
  const key = cache.customerReportKey(customerId, period.cacheSuffix);
  const cached = await cache.getBuffer(key);
  if (cached) return { profile, period, pdf: cached };

  const [data, photo] = await Promise.all([
    collectStatementData(customerId, period),
    fetchImageDataUri(profile.profile_picture_url),
  ]);
  const html = renderStatementHtml({ profile, photo, period, ...data, generatedAt: new Date() });
  const pdf = await htmlToPdf(html);
  await cache.setBuffer(key, pdf, period.isOpen ? OPEN_PERIOD_TTL : CLOSED_PERIOD_TTL);
  return { profile, period, pdf };
};

module.exports = {
  getStatement,
  getFullReport: (customerId) => getStatement(customerId, { type: 'full' }),
  financialYearOf,
};
