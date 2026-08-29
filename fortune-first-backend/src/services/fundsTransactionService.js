const db = require('../models/db');

/**
 * Paginated stock buy/sell log ("Funds Transactions"), plus summary
 * aggregates computed over the SAME filtered set (so the summary cards move
 * together with whatever the caller has filtered down to).
 * @param {{ businessHeadId?: string, type?: 'buy'|'sell', outcome?: 'profit'|'loss', dateFrom?: string, dateTo?: string, page?: number, limit?: number }} options
 */
const getTransactions = async ({ businessHeadId, type, outcome, dateFrom, dateTo, page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit;
  const conditions = [];
  const values = [];

  if (businessHeadId) {
    values.push(businessHeadId);
    conditions.push(`t.business_head_id = $${values.length}`);
  }
  if (type) {
    values.push(type);
    conditions.push(`t.transaction_type = $${values.length}`);
  }
  if (outcome === 'profit') {
    conditions.push(`t.profit_loss > 0`);
  } else if (outcome === 'loss') {
    conditions.push(`t.profit_loss < 0`);
  }
  if (dateFrom) {
    values.push(dateFrom);
    conditions.push(`t.transaction_date >= $${values.length}`);
  }
  if (dateTo) {
    values.push(dateTo);
    conditions.push(`t.transaction_date <= $${values.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const summaryResult = await db.query(
    `SELECT
       COUNT(*) FILTER (WHERE transaction_type = 'buy') AS buy_count,
       COUNT(*) FILTER (WHERE transaction_type = 'sell') AS sell_count,
       COALESCE(SUM(quantity * price) FILTER (WHERE transaction_type = 'buy'), 0) AS total_buy_value,
       COALESCE(SUM(quantity * price) FILTER (WHERE transaction_type = 'sell'), 0) AS total_sell_value,
       COALESCE(SUM(profit_loss) FILTER (WHERE profit_loss > 0), 0) AS total_profit,
       COALESCE(SUM(profit_loss) FILTER (WHERE profit_loss < 0), 0) AS total_loss,
       COALESCE(SUM(profit_loss), 0) AS net_realized_pnl
     FROM stock_transactions t
     ${whereClause}`,
    values
  );

  const countResult = await db.query(`SELECT COUNT(*) FROM stock_transactions t ${whereClause}`, values);

  const { rows } = await db.query(
    `SELECT t.*, u.name AS business_head_name
     FROM stock_transactions t
     JOIN users u ON u.id = t.business_head_id
     ${whereClause}
     ORDER BY t.transaction_date DESC
     LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, limit, offset]
  );

  const total = parseInt(countResult.rows[0].count, 10);
  const summary = summaryResult.rows[0];

  return {
    transactions: rows,
    pagination: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
    summary: {
      buy_count: parseInt(summary.buy_count, 10),
      sell_count: parseInt(summary.sell_count, 10),
      total_buy_value: parseFloat(summary.total_buy_value),
      total_sell_value: parseFloat(summary.total_sell_value),
      total_profit: parseFloat(summary.total_profit),
      total_loss: parseFloat(summary.total_loss),
      net_realized_pnl: parseFloat(summary.net_realized_pnl),
    },
  };
};

module.exports = { getTransactions };
