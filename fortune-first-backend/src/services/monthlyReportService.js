const db = require('../models/db');
const ApiError = require('../utils/apiError');
const { uploadBuffer } = require('../utils/cloudinary');
const redis = require('../utils/redis');

const uniqueViolation = (error) => error.code === '23505';

const REPORTS_CACHE_PREFIX = 'monthly_reports';
// These numbers hardly ever change (at most once a month, when a new report
// is added) — a long safety-net TTL is fine since every write below clears
// the cache immediately anyway.
const REPORTS_CACHE_TTL = 6 * 60 * 60; // 6 hours

const reportsCacheKey = ({ month, year, page = 1, limit = 12 }) =>
  `${REPORTS_CACHE_PREFIX}:${month || 'all'}:${year || 'all'}:${page}:${limit}`;

// Every filtered/paginated view of the reports list is its own cache entry
// — there's no cheap way to know in advance which combinations are cached,
// so any write just clears all of them. The key space stays small (however
// many month/year/page combinations have actually been viewed).
const invalidateReportsCache = async () => {
  try {
    const keys = await redis.keys(`${REPORTS_CACHE_PREFIX}:*`);
    if (keys.length) await redis.del(...keys);
  } catch (error) {
    console.error('Failed to invalidate monthly reports cache:', error.message);
  }
};

/**
 * Create a new monthly report. The PDF is the actual artifact — required,
 * uploaded to Cloudinary — everything else is just three headline numbers.
 * @param {{ month: number, year: number, operatingCapitalTotal: number, totalPayout: number, totalProfit: number }} data
 * @param {string} createdBy - user id
 * @param {{ buffer: Buffer }} pdfFile
 */
const createReport = async (data, createdBy, pdfFile) => {
  if (!pdfFile) throw ApiError.badRequest('A PDF file is required');
  const uploaded = await uploadBuffer(pdfFile.buffer, 'monthly_reports');

  try {
    const { rows } = await db.query(
      `INSERT INTO monthly_reports (month, year, operating_capital_total, total_payout, total_profit, pdf_url, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [data.month, data.year, data.operatingCapitalTotal, data.totalPayout, data.totalProfit, uploaded.secure_url, createdBy]
    );
    await invalidateReportsCache();
    return rows[0];
  } catch (error) {
    if (uniqueViolation(error)) {
      throw ApiError.conflict(`A report for ${data.month}/${data.year} already exists`);
    }
    throw error;
  }
};

/**
 * Update an existing report. A replacement PDF is optional — if omitted,
 * the existing one stays.
 * @param {string} id
 * @param {{ month: number, year: number, operatingCapitalTotal: number, totalPayout: number, totalProfit: number }} data
 * @param {{ buffer: Buffer } | null} pdfFile
 */
const updateReport = async (id, data, pdfFile) => {
  let pdfUrl = null;
  if (pdfFile) {
    const uploaded = await uploadBuffer(pdfFile.buffer, 'monthly_reports');
    pdfUrl = uploaded.secure_url;
  }

  try {
    const { rows } = await db.query(
      `UPDATE monthly_reports
       SET month = $1, year = $2, operating_capital_total = $3, total_payout = $4, total_profit = $5,
           pdf_url = COALESCE($6, pdf_url), updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [data.month, data.year, data.operatingCapitalTotal, data.totalPayout, data.totalProfit, pdfUrl, id]
    );
    if (!rows[0]) throw ApiError.notFound('Report not found');
    await invalidateReportsCache();
    return rows[0];
  } catch (error) {
    if (uniqueViolation(error)) {
      throw ApiError.conflict(`A report for ${data.month}/${data.year} already exists`);
    }
    throw error;
  }
};

const deleteReport = async (id) => {
  const { rows } = await db.query(`DELETE FROM monthly_reports WHERE id = $1 RETURNING id`, [id]);
  if (!rows[0]) throw ApiError.notFound('Report not found');
  await invalidateReportsCache();
};

/**
 * @param {{ month?: number, year?: number, page?: number, limit?: number }} options
 */
const getReports = async ({ month, year, page = 1, limit = 12 } = {}) => {
  const cacheKey = reportsCacheKey({ month, year, page, limit });
  const cached = await redis.get(cacheKey).catch(() => null);
  if (cached) return JSON.parse(cached);

  const offset = (page - 1) * limit;
  const conditions = [];
  const values = [];

  if (month) {
    values.push(month);
    conditions.push(`month = $${values.length}`);
  }
  if (year) {
    values.push(year);
    conditions.push(`year = $${values.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await db.query(`SELECT COUNT(*) FROM monthly_reports ${whereClause}`, values);

  // Payout/profit aggregate across every report matching the current
  // filters, not just the current page — so the summary cards stay accurate
  // while paging.
  const summaryResult = await db.query(
    `SELECT
       COALESCE(SUM(total_payout), 0) AS total_payout,
       COALESCE(SUM(total_profit), 0) AS total_profit
     FROM monthly_reports ${whereClause}`,
    values
  );

  // Operating capital is a forward-looking snapshot ("capital earmarked for
  // next month"), not something that makes sense to sum across months — so
  // the card shows the single latest report's value, independent of the
  // month/year filters above.
  const latestResult = await db.query(
    `SELECT operating_capital_total FROM monthly_reports ORDER BY year DESC, month DESC LIMIT 1`
  );

  const { rows } = await db.query(
    `SELECT id, month, year, operating_capital_total, total_payout, total_profit, pdf_url, created_by, created_at, updated_at
     FROM monthly_reports
     ${whereClause}
     ORDER BY year DESC, month DESC
     LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, limit, offset]
  );

  const total = parseInt(countResult.rows[0].count, 10);
  const result = {
    reports: rows,
    pagination: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
    summary: {
      count: total,
      latestOperatingCapital: latestResult.rows[0] ? Number(latestResult.rows[0].operating_capital_total) : 0,
      totalPayout: Number(summaryResult.rows[0].total_payout),
      totalProfit: Number(summaryResult.rows[0].total_profit),
    },
  };

  await redis.set(cacheKey, JSON.stringify(result), 'EX', REPORTS_CACHE_TTL).catch(() => {});
  return result;
};

const getReportById = async (id) => {
  const { rows } = await db.query(`SELECT * FROM monthly_reports WHERE id = $1`, [id]);
  if (!rows[0]) throw ApiError.notFound('Report not found');
  return rows[0];
};

module.exports = { createReport, updateReport, deleteReport, getReports, getReportById };
