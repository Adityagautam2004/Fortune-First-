const db = require('../models/db');
const ApiError = require('../utils/apiError');
const { STOCK_TRANSACTION_TYPE } = require('../utils/constants');
const stockPriceService = require('./stockPriceService');

/**
 * Create a brand-new position. The initial buy is itself logged as a
 * stock_transaction, so it shows up in the Funds Transactions log too.
 * order_type ('regular'|'mtf') is fixed at creation and carried through
 * onto every later transaction for this position (buy-more, sell) —
 * it's never re-chosen per trade.
 * @param {{ symbol: string, companyName: string, quantity: number, price: number, addedBy: string, orderType: string }} data
 * @param {import('pg').PoolClient} dbClient
 */
const addPosition = async ({ symbol, companyName, quantity, price, addedBy, orderType }, dbClient = db) => {
  const { rows } = await dbClient.query(
    `INSERT INTO stock_positions (symbol, company_name, quantity, average_price, added_by, order_type)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [symbol.toUpperCase(), companyName, quantity, price, addedBy, orderType]
  );
  const position = rows[0];

  await dbClient.query(
    `INSERT INTO stock_transactions (position_id, symbol, company_name, transaction_type, quantity, price, business_head_id, order_type)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [position.id, position.symbol, position.company_name, STOCK_TRANSACTION_TYPE.BUY, quantity, price, addedBy, position.order_type]
  );

  return position;
};

/**
 * "Add more" — buy additional quantity of an existing, still-open position
 * at a new price, re-averaging the cost basis:
 *   newAvg = (oldQty*oldAvg + addQty*addPrice) / (oldQty+addQty)
 * @param {string} positionId
 * @param {{ quantity: number, price: number, businessHeadId: string }} data
 * @param {import('pg').PoolClient} dbClient
 */
const buyMore = async (positionId, { quantity, price, businessHeadId }, dbClient = db) => {
  const { rows } = await dbClient.query(`SELECT * FROM stock_positions WHERE id = $1 FOR UPDATE`, [positionId]);
  const position = rows[0];
  if (!position) throw ApiError.notFound('Position not found');
  if (!position.is_active) throw ApiError.conflict('This position is closed — add it again as a new position instead');

  const oldQty = parseFloat(position.quantity);
  const oldAvg = parseFloat(position.average_price);
  const newQty = oldQty + quantity;
  const newAvg = (oldQty * oldAvg + quantity * price) / newQty;

  const { rows: updatedRows } = await dbClient.query(
    `UPDATE stock_positions SET quantity = $1, average_price = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
    [newQty, newAvg, positionId]
  );

  await dbClient.query(
    `INSERT INTO stock_transactions (position_id, symbol, company_name, transaction_type, quantity, price, business_head_id, order_type)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [position.id, position.symbol, position.company_name, STOCK_TRANSACTION_TYPE.BUY, quantity, price, businessHeadId, position.order_type]
  );

  return updatedRows[0];
};

/**
 * Sell some or all of a position. The average cost basis is untouched by a
 * partial sell (only buys move it) — profit/loss is realized against
 * whatever the average price was at the moment of the sale.
 * @param {string} positionId
 * @param {{ quantity: number, price: number, businessHeadId: string }} data
 * @param {import('pg').PoolClient} dbClient
 */
const sellPosition = async (positionId, { quantity, price, businessHeadId }, dbClient = db) => {
  const { rows } = await dbClient.query(`SELECT * FROM stock_positions WHERE id = $1 FOR UPDATE`, [positionId]);
  const position = rows[0];
  if (!position) throw ApiError.notFound('Position not found');
  if (!position.is_active) throw ApiError.conflict('This position is already closed');

  const currentQty = parseFloat(position.quantity);
  if (quantity > currentQty) {
    throw ApiError.badRequest(`Cannot sell ${quantity} shares — only ${currentQty} currently held`);
  }

  const averagePrice = parseFloat(position.average_price);
  const profitLoss = (price - averagePrice) * quantity;
  const remainingQty = currentQty - quantity;
  const isNowClosed = remainingQty === 0;

  const { rows: updatedRows } = await dbClient.query(
    `UPDATE stock_positions SET quantity = $1, is_active = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
    [remainingQty, !isNowClosed, positionId]
  );

  await dbClient.query(
    `INSERT INTO stock_transactions (position_id, symbol, company_name, transaction_type, quantity, price, profit_loss, business_head_id, order_type)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [position.id, position.symbol, position.company_name, STOCK_TRANSACTION_TYPE.SELL, quantity, price, profitLoss.toFixed(2), businessHeadId, position.order_type]
  );

  return updatedRows[0];
};

/**
 * All open positions (optionally filtered to one business_head's own
 * additions and/or one order type), enriched with a live quote per symbol
 * and a portfolio-wide summary. Every viewer role
 * (admin/investment_head/business_head) gets the exact same shape — only
 * the frontend's write controls differ by role.
 * @param {{ addedBy?: string, orderType?: 'regular'|'mtf' }} options
 */
const getPositions = async ({ addedBy, orderType } = {}) => {
  const conditions = ['p.is_active = TRUE'];
  const values = [];
  if (addedBy) {
    values.push(addedBy);
    conditions.push(`p.added_by = $${values.length}`);
  }
  if (orderType) {
    values.push(orderType);
    conditions.push(`p.order_type = $${values.length}`);
  }

  const { rows } = await db.query(
    `SELECT p.*, u.name AS added_by_name
     FROM stock_positions p
     JOIN users u ON u.id = p.added_by
     WHERE ${conditions.join(' AND ')}
     ORDER BY p.created_at DESC`,
    values
  );

  const quotes = await stockPriceService.getQuotes(rows.map((r) => r.symbol));

  let totalInvested = 0;
  let currentValue = 0;

  const positions = rows.map((row) => {
    const quantity = parseFloat(row.quantity);
    const averagePrice = parseFloat(row.average_price);
    const invested = quantity * averagePrice;
    const quote = quotes[row.symbol];
    const liveValue = quote ? quantity * quote.price : null;

    totalInvested += invested;
    if (liveValue !== null) currentValue += liveValue;

    return {
      ...row,
      quantity,
      average_price: averagePrice,
      invested_amount: parseFloat(invested.toFixed(2)),
      current_price: quote?.price ?? null,
      current_value: liveValue !== null ? parseFloat(liveValue.toFixed(2)) : null,
      unrealized_pnl: liveValue !== null ? parseFloat((liveValue - invested).toFixed(2)) : null,
    };
  });

  return {
    positions,
    summary: {
      total_invested: parseFloat(totalInvested.toFixed(2)),
      current_value: parseFloat(currentValue.toFixed(2)),
      unrealized_pnl: parseFloat((currentValue - totalInvested).toFixed(2)),
      position_count: positions.length,
    },
  };
};

/**
 * Every business_head who has ever added a position or recorded a trade —
 * powers the "Business Head" filter on both the portfolio dashboard and the
 * Funds Transactions log (so a business head with only closed positions
 * left is still a selectable filter option for their historical trades).
 */
const getBusinessHeadsWithActivity = async () => {
  const { rows } = await db.query(
    `SELECT DISTINCT u.id, u.name FROM users u
     WHERE u.id IN (SELECT added_by FROM stock_positions UNION SELECT business_head_id FROM stock_transactions)
     ORDER BY u.name ASC`
  );
  return rows;
};

module.exports = { addPosition, buyMore, sellPosition, getPositions, getBusinessHeadsWithActivity };
