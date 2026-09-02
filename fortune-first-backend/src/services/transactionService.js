const db = require('../models/db');

// Investments, withdrawals, and payouts are three separate tables (kept
// separate so each keeps its own specific columns/constraints) — this is
// the single place that normalizes them into one shape for every "combined
// transactions" endpoint (customer/board/admin). No physical transactions
// table; this UNION is the source of truth.
const COMBINED_QUERY = `
  SELECT 'investment' AS type, i.id, i.customer_id, u.name AS customer_name,
         i.amount, i.status::text AS status, i.investment_date AS date,
         i.payment_screenshot_url AS screenshot_url, i.notes, i.created_at
  FROM investments i
  JOIN users u ON u.id = i.customer_id

  UNION ALL

  SELECT 'withdrawal' AS type, w.id, w.customer_id, u.name AS customer_name,
         w.amount, w.status::text AS status, w.withdrawal_date AS date,
         w.payment_screenshot_url AS screenshot_url, w.notes, w.created_at
  FROM withdrawals w
  JOIN users u ON u.id = w.customer_id

  UNION ALL

  SELECT 'payout' AS type, mr.id, mr.customer_id, u.name AS customer_name,
         mr.payout_amount AS amount, mr.payout_status::text AS status,
         COALESCE(mr.payout_date, make_date(mr.year, mr.month, 1)) AS date,
         mr.payment_screenshot_url AS screenshot_url, NULL AS notes,
         COALESCE(mr.payout_date, make_date(mr.year, mr.month, 1))::timestamptz AS created_at
  FROM monthly_returns mr
  JOIN users u ON u.id = mr.customer_id
`;

/**
 * @param {Object} filters
 * @param {string} [filters.customerId] - restrict to one customer (customer's own view)
 * @param {string} [filters.assignedToId] - restrict to clients assigned to this investment_head
 * @param {string} [filters.type] - 'investment' | 'withdrawal' | 'payout'
 * @param {number} [filters.page=1]
 * @param {number} [filters.limit=20]
 */
const getTransactions = async ({ customerId, assignedToId, type, page = 1, limit = 20 } = {}) => {
  const conditions = [];
  const params = [];

  if (customerId) {
    params.push(customerId);
    conditions.push(`customer_id = $${params.length}`);
  }
  if (assignedToId) {
    params.push(assignedToId);
    conditions.push(`customer_id IN (SELECT id FROM users WHERE assigned_to = $${params.length})`);
  }
  if (type) {
    params.push(type);
    conditions.push(`type = $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const [dataResult, countResult] = await Promise.all([
    db.query(
      `SELECT * FROM (${COMBINED_QUERY}) combined ${whereClause}
       ORDER BY date DESC, created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    ),
    db.query(`SELECT COUNT(*) FROM (${COMBINED_QUERY}) combined ${whereClause}`, params),
  ]);

  const total = parseInt(countResult.rows[0].count, 10);
  return {
    transactions: dataResult.rows,
    pagination: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
};

module.exports = { getTransactions };
