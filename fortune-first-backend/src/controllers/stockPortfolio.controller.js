const db = require('../models/db');
const stockPriceService = require('../services/stockPriceService');
const stockPortfolioService = require('../services/stockPortfolioService');
const fundsTransactionService = require('../services/fundsTransactionService');

// GET /board/stocks/search?q= — business_head-only autocomplete for the
// "Add Stock" flow's symbol field.
const searchStocks = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 1) {
      return res.status(200).json({ status: 'success', data: [] });
    }
    const results = await stockPriceService.searchSymbols(q);
    return res.status(200).json({ status: 'success', data: results });
  } catch (error) {
    console.error('Stock Search Error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to search stocks' });
  }
};

// GET /board/portfolio — every board/admin role sees the same shared book;
// optional ?addedBy= filters to one business_head's own additions, ?orderType=
// filters to regular or mtf positions.
const getPortfolio = async (req, res) => {
  try {
    const { addedBy, orderType } = req.query;
    const result = await stockPortfolioService.getPositions({ addedBy, orderType });
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    console.error('Get Portfolio Error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch portfolio' });
  }
};

// GET /board/portfolio/business-heads — filter dropdown options, shared by
// the portfolio dashboard and the Funds Transactions log.
const getBusinessHeads = async (req, res) => {
  try {
    const heads = await stockPortfolioService.getBusinessHeadsWithActivity();
    return res.status(200).json({ status: 'success', data: heads });
  } catch (error) {
    console.error('Get Business Heads Error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch business heads' });
  }
};

// POST /board/portfolio — business_head only.
const addStock = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { symbol, companyName, quantity, price, orderType } = req.body;
    const addedBy = req.user.userId;

    await client.query('BEGIN');
    const position = await stockPortfolioService.addPosition({ symbol, companyName, quantity, price, addedBy, orderType }, client);
    await client.query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, new_value, ip)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [addedBy, 'CREATE', 'stock_position', position.id, JSON.stringify(req.body), req.ip]
    );
    await client.query('COMMIT');
    await stockPortfolioService.invalidatePortfolioCache();

    return res.status(201).json({ status: 'success', message: 'Stock added to portfolio', data: position });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Add Stock Error:', error);
    return res.status(error.statusCode || 500).json({ status: 'error', message: error.message || 'Failed to add stock' });
  } finally {
    client.release();
  }
};

// POST /board/portfolio/:id/buy — business_head only, "add more" at a new price.
const buyMoreStock = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { id } = req.params;
    const { quantity, price } = req.body;
    const businessHeadId = req.user.userId;

    await client.query('BEGIN');
    const position = await stockPortfolioService.buyMore(id, { quantity, price, businessHeadId }, client);
    await client.query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, new_value, ip)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [businessHeadId, 'BUY', 'stock_position', position.id, JSON.stringify(req.body), req.ip]
    );
    await client.query('COMMIT');
    await stockPortfolioService.invalidatePortfolioCache();

    return res.status(200).json({ status: 'success', message: 'Position increased', data: position });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Buy More Stock Error:', error);
    return res.status(error.statusCode || 500).json({ status: 'error', message: error.message || 'Failed to add to position' });
  } finally {
    client.release();
  }
};

// POST /board/portfolio/:id/sell — business_head only.
const sellStock = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { id } = req.params;
    const { quantity, price } = req.body;
    const businessHeadId = req.user.userId;

    await client.query('BEGIN');
    const position = await stockPortfolioService.sellPosition(id, { quantity, price, businessHeadId }, client);
    await client.query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, new_value, ip)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [businessHeadId, 'SELL', 'stock_position', position.id, JSON.stringify(req.body), req.ip]
    );
    await client.query('COMMIT');
    await stockPortfolioService.invalidatePortfolioCache();

    return res.status(200).json({ status: 'success', message: 'Position sold', data: position });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Sell Stock Error:', error);
    return res.status(error.statusCode || 500).json({ status: 'error', message: error.message || 'Failed to sell position' });
  } finally {
    client.release();
  }
};

// GET /board/funds-transactions — all three roles; paginated buy/sell log
// with filter-aware summary cards.
const getFundsTransactions = async (req, res) => {
  try {
    const { businessHeadId, type, outcome, orderType, dateFrom, dateTo, page, limit } = req.query;
    const result = await fundsTransactionService.getTransactions({
      businessHeadId,
      type,
      outcome,
      orderType,
      dateFrom,
      dateTo,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    console.error('Get Funds Transactions Error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch funds transactions' });
  }
};

// DELETE /admin/funds-transactions/:id — super_admin only (admin.routes.js's
// router-level gate). Removes a log entry; does not touch the position.
const deleteFundsTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await fundsTransactionService.deleteTransaction(id);
    await db.query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, old_value, ip)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.user.userId, 'DELETE', 'stock_transaction', id, JSON.stringify(deleted), req.ip]
    );
    return res.status(200).json({ status: 'success', message: 'Transaction deleted' });
  } catch (error) {
    console.error('Delete Funds Transaction Error:', error);
    return res.status(error.statusCode || 500).json({ status: 'error', message: error.message || 'Failed to delete transaction' });
  }
};

module.exports = {
  searchStocks,
  getPortfolio,
  getBusinessHeads,
  addStock,
  buyMoreStock,
  sellStock,
  getFundsTransactions,
  deleteFundsTransaction,
};
