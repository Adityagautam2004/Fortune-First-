const db = require('../models/db');
const ApiError = require('../utils/apiError');
const { uploadBuffer } = require('../utils/cloudinary');
const { generateMonthlyReportPdf } = require('../utils/reportPdf');

const JSONB_FIELDS = ['members', 'investmentPattern', 'partnerPayouts', 'withdrawals', 'investments'];
const CAMEL_TO_SNAKE = {
  totalAumNextMonth: 'total_aum_next_month',
  navPrevious: 'nav_previous',
  navUpdated: 'nav_updated',
  overallProfitPercentage: 'overall_profit_percentage',
  overallProfitAmount: 'overall_profit_amount',
  clientPayoutPercentage: 'client_payout_percentage',
  clientTotalMoney: 'client_total_money',
  clientPayoutAmount: 'client_payout_amount',
  clientPayoutStatus: 'client_payout_status',
  companyResultAmount: 'company_result_amount',
  profitSavingPercentage: 'profit_saving_percentage',
  profitSavingAmount: 'profit_saving_amount',
  profitSavingLeftAmount: 'profit_saving_left_amount',
  employeesPayoutAmount: 'employees_payout_amount',
  operatingCapitalTotal: 'operating_capital_total',
  investmentPattern: 'investment_pattern',
  partnerPayouts: 'partner_payouts',
  notes: 'notes',
  month: 'month',
  year: 'year',
  members: 'members',
  withdrawals: 'withdrawals',
  investments: 'investments',
};

/**
 * Builds the ordered [columns[], values[]] pair for an INSERT/UPDATE from a
 * validated, camelCase request body — JSONB fields get JSON.stringify'd
 * explicitly (pg's automatic serialization treats a bare JS array as a
 * Postgres ARRAY literal, not JSON, which breaks against a jsonb column).
 */
const toColumns = (data) =>
  Object.entries(CAMEL_TO_SNAKE).map(([camel, snake]) => [
    snake,
    JSONB_FIELDS.includes(camel) ? JSON.stringify(data[camel] ?? []) : data[camel],
  ]);

const uniqueViolation = (error) => error.code === '23505';

/**
 * Create a new monthly report, then immediately render + upload its
 * web-generated PDF. The row is inserted first so the PDF template can be
 * handed the exact same shape it'll be read back as later.
 * @param {object} data - validated, camelCase report fields
 * @param {string} createdBy - user id
 * @param {{ buffer: Buffer } | null} pdfFile - optional manually-authored PDF
 */
const createReport = async (data, createdBy, pdfFile) => {
  let pdfUrl = null;
  if (pdfFile) {
    const uploaded = await uploadBuffer(pdfFile.buffer, 'monthly_reports');
    pdfUrl = uploaded.secure_url;
  }

  const columns = toColumns(data);
  const columnNames = ['created_by', 'pdf_url', ...columns.map(([snake]) => snake)];
  const placeholders = columnNames.map((_, i) => `$${i + 1}`);
  const values = [createdBy, pdfUrl, ...columns.map(([, value]) => value)];

  let report;
  try {
    const { rows } = await db.query(
      `INSERT INTO monthly_reports (${columnNames.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
      values
    );
    report = rows[0];
  } catch (error) {
    if (uniqueViolation(error)) {
      throw ApiError.conflict(`A report for ${data.month}/${data.year} already exists`);
    }
    throw error;
  }

  report = await regenerateAndAttachPdf(report);
  return report;
};

/**
 * Update an existing report and regenerate its web PDF to match.
 * @param {string} id
 * @param {object} data - validated, camelCase report fields
 * @param {{ buffer: Buffer } | null} pdfFile - optional replacement manual PDF
 */
const updateReport = async (id, data, pdfFile) => {
  const columns = toColumns(data);
  const setClauses = columns.map(([snake], i) => `${snake} = $${i + 1}`);
  const values = columns.map(([, value]) => value);

  if (pdfFile) {
    const uploaded = await uploadBuffer(pdfFile.buffer, 'monthly_reports');
    setClauses.push(`pdf_url = $${values.length + 1}`);
    values.push(uploaded.secure_url);
  }

  setClauses.push(`updated_at = NOW()`);
  values.push(id);

  let report;
  try {
    const { rows } = await db.query(
      `UPDATE monthly_reports SET ${setClauses.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );
    report = rows[0];
  } catch (error) {
    if (uniqueViolation(error)) {
      throw ApiError.conflict(`A report for ${data.month}/${data.year} already exists`);
    }
    throw error;
  }
  if (!report) throw ApiError.notFound('Report not found');

  report = await regenerateAndAttachPdf(report);
  return report;
};

const regenerateAndAttachPdf = async (report) => {
  const pdfBuffer = await generateMonthlyReportPdf(report);
  const uploaded = await uploadBuffer(pdfBuffer, 'monthly_reports_generated');
  const { rows } = await db.query(
    `UPDATE monthly_reports SET generated_pdf_url = $1 WHERE id = $2 RETURNING *`,
    [uploaded.secure_url, report.id]
  );
  return rows[0];
};

const deleteReport = async (id) => {
  const { rows } = await db.query(`DELETE FROM monthly_reports WHERE id = $1 RETURNING id`, [id]);
  if (!rows[0]) throw ApiError.notFound('Report not found');
};

/**
 * @param {{ month?: number, year?: number, page?: number, limit?: number }} options
 */
const getReports = async ({ month, year, page = 1, limit = 12 } = {}) => {
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

  // The full members/investment_pattern/etc. JSONB blobs aren't needed for
  // a list view — keep the payload light.
  const { rows } = await db.query(
    `SELECT id, month, year, total_aum_next_month, nav_updated, overall_profit_percentage,
            overall_profit_amount, client_payout_amount, operating_capital_total,
            pdf_url, generated_pdf_url, created_by, created_at, updated_at
     FROM monthly_reports
     ${whereClause}
     ORDER BY year DESC, month DESC
     LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, limit, offset]
  );

  const total = parseInt(countResult.rows[0].count, 10);
  return {
    reports: rows,
    pagination: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
};

const getReportById = async (id) => {
  const { rows } = await db.query(`SELECT * FROM monthly_reports WHERE id = $1`, [id]);
  if (!rows[0]) throw ApiError.notFound('Report not found');
  return rows[0];
};

/**
 * Starting point for the "Add Report" form — the most recent report's
 * investment pattern and members list (names + last month's numbers, ready
 * to edit) plus its nav_updated as this new report's suggested nav_previous.
 */
const getPrefill = async () => {
  const { rows } = await db.query(
    `SELECT month, year, nav_updated, investment_pattern, members FROM monthly_reports ORDER BY year DESC, month DESC LIMIT 1`
  );
  const latest = rows[0];
  if (!latest) {
    return { previousMonth: null, previousYear: null, navPrevious: 0, investmentPattern: [], members: [] };
  }
  return {
    previousMonth: latest.month,
    previousYear: latest.year,
    navPrevious: parseFloat(latest.nav_updated),
    investmentPattern: latest.investment_pattern,
    members: latest.members,
  };
};

module.exports = { createReport, updateReport, deleteReport, getReports, getReportById, getPrefill };
