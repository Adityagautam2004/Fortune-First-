const db = require('../models/db');

const getAssignedClients = async (req, res) => {
  try {
    const boardMemberId = req.user.userId;
    const userRole = req.user.role;

    let queryStr = `
      SELECT u.id, u.name, u.email, u.phone, 
             COALESCE(SUM(i.amount), 0) AS total_invested
      FROM users u
      LEFT JOIN investments i ON u.id = i.customer_id AND i.status = 'active'
    `;
    const queryParams = [];

    // Investment Heads only see their assigned clients; Business Heads might see all
    if (userRole === 'investment_head') {
      queryStr += ` WHERE u.assigned_to = $1 AND u.role = 'customer'`;
      queryParams.push(boardMemberId);
    } else {
      queryStr += ` WHERE u.role = 'customer'`;
    }

    queryStr += ` GROUP BY u.id ORDER BY u.name ASC`;

    const clients = await db.query(queryStr, queryParams);
    
    return res.status(200).json({ status: 'success', data: clients.rows });
  } catch (error) {
    console.error('Fetch Clients Error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch clients' });
  }
};

const addInvestment = async (req, res) => {
  try {
    // Only Investment Heads can add investments
    if (req.user.role !== 'investment_head') {
      return res.status(403).json({ status: 'error', message: 'Forbidden' });
    }

    const { customerId, amount, investmentDate, weekOfMonth, notes } = req.body;
    const recordedBy = req.user.userId;

    // Application-level validation before hitting Postgres
    if (amount < 5000 || amount % 5000 !== 0) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Investment amount must be at least ₹5,000 and a multiple of ₹5,000' 
      });
    }

    const newInvestment = await db.query(
      `INSERT INTO investments (customer_id, recorded_by, amount, investment_date, week_of_month, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [customerId, recordedBy, amount, investmentDate, weekOfMonth, notes]
    );

    // Audit Log Entry
    await db.query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, new_value)
       VALUES ($1, $2, $3, $4, $5)`,
      [recordedBy, 'CREATE', 'investment', newInvestment.rows[0].id, JSON.stringify(req.body)]
    );

    // Invalidate the customer's dashboard cache in Redis so they see the update immediately
    const redis = require('../utils/redis');
    await redis.del(`dashboard:${customerId}`);

    return res.status(201).json({ status: 'success', message: 'Investment recorded successfully' });
  } catch (error) {
    console.error('Add Investment Error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to record investment' });
  }
};
const { calculatePayout } = require('../services/payout.service');

const processPayout = async (req, res) => {
  // We must acquire a dedicated client from the pool for a transaction
  const client = await db.pool.connect();
  
  try {
    if (req.user.role !== 'investment_head') {
      return res.status(403).json({ status: 'error', message: 'Forbidden' });
    }

    const { investmentId, month, year, returnPct } = req.body;
    const processedBy = req.user.userId;

    await client.query('BEGIN'); // Start ACID Transaction

    // 1. Fetch investment details
    const investRes = await client.query(
      `SELECT amount, week_of_month, investment_date, customer_id 
       FROM investments WHERE id = $1 AND status = 'active' FOR UPDATE`,
      [investmentId]
    );

    if (investRes.rows.length === 0) throw new Error('Active investment not found');
    const investment = investRes.rows[0];

    // 2. Determine if this is the first month (for proration logic)
    const invDate = new Date(investment.investment_date);
    const isFirstMonth = (invDate.getMonth() + 1 === month && invDate.getFullYear() === year);

    // 3. Calculate exact payout using our pure function
    const payoutAmount = calculatePayout(
      parseFloat(investment.amount), 
      parseFloat(returnPct), 
      investment.week_of_month, 
      null, 
      isFirstMonth
    );

    // 4. Insert the monthly return record
    // The UNIQUE(investment_id, month, year) constraint will safely block duplicates here
    await client.query(
      `INSERT INTO monthly_returns (investment_id, month, year, return_pct, payout_amount, payout_status, payout_date, processed_by)
       VALUES ($1, $2, $3, $4, $5, 'paid', NOW(), $6)`,
      [investmentId, month, year, returnPct, payoutAmount, processedBy]
    );

    // 5. Audit Log
    await client.query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, new_value)
       VALUES ($1, 'PROCESS_PAYOUT', 'monthly_return', $2, $3)`,
      [processedBy, investmentId, JSON.stringify({ month, year, payoutAmount })]
    );

    await client.query('COMMIT'); // Commit the transaction safely
    const mailer = require('../utils/mailer');
    await mailer.sendPayoutEmail(investment.customer_id, investment.name, payoutAmount, month, year);
    
    // Invalidate customer dashboard cache
    const redis = require('../utils/redis');
    await redis.del(`dashboard:${investment.customer_id}`);

    return res.status(200).json({ status: 'success', data: { payoutAmount } });
  } catch (error) {
    await client.query('ROLLBACK'); // Abort all changes if anything fails
    console.error('Payout Error:', error.message);
    
    if (error.code === '23505') { // PostgreSQL Unique Violation Error Code
      return res.status(400).json({ status: 'error', message: 'Payout already processed for this month' });
    }
    return res.status(500).json({ status: 'error', message: 'Failed to process payout' });
  } finally {
    client.release(); // Return client to the pool
  }
};

const getChatHistory = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const history = await db.query(
      `SELECT c.id, c.sender_id, u.name AS sender_name, c.content, c.created_at 
       FROM chat_messages c
       JOIN users u ON c.sender_id = u.id
       WHERE c.conversation_id = $1
       ORDER BY c.created_at DESC
       LIMIT 50`,
      [conversationId]
    );

    // Reverse array so chronological order puts newest messages at the bottom
    return res.status(200).json({ status: 'success', data: history.rows.reverse() });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to load chat history' });
  }
};

const getBoardDashboardStats = async (req, res) => {
  try {
    const boardMemberId = req.user.userId;

    const stats = await db.query(
      `SELECT
         COUNT(DISTINCT u.id) as total_clients,
         COALESCE(SUM(i.amount), 0) as total_aum
       FROM users u
       LEFT JOIN investments i ON u.id = i.customer_id AND i.status = 'active'
       WHERE u.assigned_to = $1 AND u.role = 'customer'`,
      [boardMemberId]
    );

    return res.status(200).json({ status: 'success', data: stats.rows[0] });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to load stats' });
  }
};

module.exports = { getAssignedClients,addInvestment,processPayout,getChatHistory, getBoardDashboardStats };