const db = require('../models/db');
const cache = require('../utils/cache');
const { generateReportPDF } = require('../utils/pdf');

// Each report PDF is rendered by a fresh headless Chromium — the most
// expensive thing this API does. The output only changes when the
// customer's payouts or profile change, and every such write calls
// cache.invalidateCustomerCaches(), so the TTL is just a safety net.
const REPORT_CACHE_TTL = 24 * 60 * 60; // 24 hours

const getProfile = async (customerId) => {
  const { rows } = await db.query(
    `SELECT name, email, phone, profile_picture_url, client_code FROM users WHERE id = $1 AND role = 'customer'`,
    [customerId]
  );
  return rows[0] || null;
};

/**
 * Full payout-history report.
 * @returns {Promise<{ profile: object, pdf: Buffer } | null>} null when the customer doesn't exist
 */
const getFullReport = async (customerId) => {
  const profile = await getProfile(customerId);
  if (!profile) return null;

  const key = cache.customerReportKey(customerId, 'full');
  const cached = await cache.getBuffer(key);
  if (cached) return { profile, pdf: cached };

  const { rows } = await db.query(
    `SELECT mr.month, mr.year, mr.invested_amount, mr.return_pct, mr.payout_amount
     FROM monthly_returns mr
     WHERE mr.customer_id = $1 ORDER BY mr.year DESC, mr.month DESC`,
    [customerId]
  );
  const pdf = await generateReportPDF(profile, rows);
  await cache.setBuffer(key, pdf, REPORT_CACHE_TTL);
  return { profile, pdf };
};

/**
 * Single-month report.
 * @returns {Promise<{ profile: object, pdf: Buffer } | null>} null when the customer or month has no record
 */
const getMonthlyReport = async (customerId, month, year) => {
  const profile = await getProfile(customerId);
  if (!profile) return null;

  const key = cache.customerReportKey(customerId, `${year}-${month}`);
  const cached = await cache.getBuffer(key);
  if (cached) return { profile, pdf: cached };

  const { rows } = await db.query(
    `SELECT mr.month, mr.year, mr.invested_amount, mr.return_pct, mr.payout_amount
     FROM monthly_returns mr
     WHERE mr.customer_id = $1 AND mr.month = $2 AND mr.year = $3`,
    [customerId, month, year]
  );
  if (rows.length === 0) return null;

  const pdf = await generateReportPDF(profile, rows);
  await cache.setBuffer(key, pdf, REPORT_CACHE_TTL);
  return { profile, pdf };
};

module.exports = { getFullReport, getMonthlyReport };
