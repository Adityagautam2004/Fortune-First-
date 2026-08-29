const db = require('../models/db');
const investmentService = require('../services/investmentService');
const withdrawalService = require('../services/withdrawalService');
const transactionService = require('../services/transactionService');
const payoutService = require('../services/payout.service');
const { uploadBuffer } = require('../utils/cloudinary');

// investment_head is scoped to their own assigned clients; business_head/super_admin see everyone.
// Shared by every list endpoint below (investments/withdrawals/payouts/transactions).
const scopeToCaller = (req) => (req.user.role === 'investment_head' ? req.user.userId : undefined);

const getAssignedClients = async (req, res) => {
  try {
    const boardMemberId = req.user.userId;
    const userRole = req.user.role;

    let queryStr = `
      SELECT u.id, u.name, u.email, u.phone, u.is_active, u.created_at, u.profile_picture_url, u.client_code,
             am.name AS relationship_manager,
             COALESCE(SUM(i.amount) FILTER (WHERE i.status = 'active'), 0)
               - COALESCE((SELECT SUM(w.amount) FROM withdrawals w WHERE w.customer_id = u.id AND w.status = 'completed'), 0)
               AS total_invested,
             COUNT(i.id) FILTER (WHERE i.status = 'active') AS active_mandates
      FROM users u
      LEFT JOIN investments i ON u.id = i.customer_id
      LEFT JOIN users am ON am.id = u.assigned_to
    `;
    const queryParams = [];

    // Investment Heads only see their assigned clients; Business Heads see all
    if (userRole === 'investment_head') {
      queryStr += ` WHERE u.assigned_to = $1 AND u.role = 'customer'`;
      queryParams.push(boardMemberId);
    } else {
      queryStr += ` WHERE u.role = 'customer'`;
    }

    queryStr += ` GROUP BY u.id, am.name ORDER BY u.name ASC`;

    const clients = await db.query(queryStr, queryParams);

    return res.status(200).json({ status: 'success', data: clients.rows });
  } catch (error) {
    console.error('Fetch Clients Error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch clients' });
  }
};

// POST /board/investments — investment_head only (enforced by route-level
// requireRole now, not an inline check). Starts 'pending': an admin has to
// approve it before it counts as active (FR-INV-APPROVAL). The payment
// screenshot is optional — req.file is only present if one was attached.
const addInvestment = async (req, res) => {
  // Investment insert + audit log entry must succeed or fail together (NFR-REL-04) —
  // acquire a dedicated client for the transaction, same pattern as processPayout/voidPayout.
  const client = await db.pool.connect();
  try {
    const { customerId, amount, investmentDate, weekOfMonth, notes } = req.body;
    const recordedBy = req.user.userId;

    // Application-level validation before hitting Postgres
    if (amount < 5000 || amount % 5000 !== 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Investment amount must be at least ₹5,000 and a multiple of ₹5,000'
      });
    }

    let paymentScreenshotUrl = null;
    if (req.file) {
      const uploaded = await uploadBuffer(req.file.buffer, 'payment_screenshots');
      paymentScreenshotUrl = uploaded.secure_url;
    }

    await client.query('BEGIN');

    const newInvestment = await investmentService.createInvestment(
      {
        customer_id: customerId,
        recorded_by: recordedBy,
        amount,
        investment_date: investmentDate,
        week_of_month: weekOfMonth,
        notes,
        payment_screenshot_url: paymentScreenshotUrl,
      },
      client
    );

    // Audit Log Entry
    await client.query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, new_value, ip)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [recordedBy, 'CREATE', 'investment', newInvestment.id, JSON.stringify(req.body), req.ip]
    );

    await client.query('COMMIT');

    // Invalidate the customer's dashboard cache in Redis so they see the update immediately
    const redis = require('../utils/redis');
    await redis.del(`dashboard:${customerId}`);

    return res.status(201).json({ status: 'success', message: 'Investment submitted for admin approval', data: newInvestment });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Add Investment Error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to record investment' });
  } finally {
    client.release();
  }
};

// GET /board/investments — scoped list (investment_head: own clients only)
const getBoardInvestments = async (req, res) => {
  try {
    const { status, customerId, page, limit } = req.query;
    const result = await investmentService.getAllInvestments({
      customer_id: customerId,
      status,
      assigned_to_id: scopeToCaller(req),
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    console.error('Get Board Investments Error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch investments' });
  }
};

// POST /board/withdrawals — investment_head only. No screenshot at creation
// (that's added by the admin only if/when they mark it completed).
const addWithdrawal = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { customerId, amount, withdrawalDate, weekOfMonth, notes } = req.body;
    const recordedBy = req.user.userId;

    if (amount < 5000 || amount % 5000 !== 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Withdrawal amount must be at least ₹5,000 and a multiple of ₹5,000'
      });
    }

    await client.query('BEGIN');

    const newWithdrawal = await withdrawalService.createWithdrawal(
      {
        customer_id: customerId,
        recorded_by: recordedBy,
        amount,
        withdrawal_date: withdrawalDate,
        week_of_month: weekOfMonth,
        notes,
      },
      client
    );

    await client.query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, new_value, ip)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [recordedBy, 'CREATE', 'withdrawal', newWithdrawal.id, JSON.stringify(req.body), req.ip]
    );

    await client.query('COMMIT');

    const redis = require('../utils/redis');
    await redis.del(`dashboard:${customerId}`);

    return res.status(201).json({ status: 'success', message: 'Withdrawal submitted for admin review', data: newWithdrawal });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Add Withdrawal Error:', error);
    return res.status(error.statusCode || 500).json({ status: 'error', message: error.message || 'Failed to record withdrawal' });
  } finally {
    client.release();
  }
};

// GET /board/withdrawals — scoped list, same shape as investments
const getBoardWithdrawals = async (req, res) => {
  try {
    const { status, customerId, page, limit } = req.query;
    const result = await withdrawalService.getAllWithdrawals({
      customer_id: customerId,
      status,
      assigned_to_id: scopeToCaller(req),
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    console.error('Get Board Withdrawals Error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch withdrawals' });
  }
};

// GET /board/payouts — flat, scoped payout list (board had no list before, only process/void)
const getBoardPayouts = async (req, res) => {
  try {
    const { status, customerId, page, limit } = req.query;
    const result = await payoutService.getAllPayouts({
      customer_id: customerId,
      status,
      assigned_to_id: scopeToCaller(req),
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    console.error('Get Board Payouts Error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch payouts' });
  }
};

// GET /board/transactions — combined investment+withdrawal+payout list, scoped
const getBoardTransactions = async (req, res) => {
  try {
    const { type, page, limit } = req.query;
    const result = await transactionService.getTransactions({
      type,
      assignedToId: scopeToCaller(req),
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    console.error('Get Board Transactions Error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch transactions' });
  }
};

const processPayout = async (req, res) => {
  // We must acquire a dedicated client from the pool for a transaction
  const client = await db.pool.connect();
  
  try {
    if (!['investment_head', 'super_admin'].includes(req.user.role)) {
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
    const payoutAmount = payoutService.calculatePayout(
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
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, new_value, ip)
       VALUES ($1, 'PROCESS_PAYOUT', 'monthly_return', $2, $3, $4)`,
      [processedBy, investmentId, JSON.stringify({ month, year, payoutAmount }), req.ip]
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
      `SELECT c.id, c.sender_id, u.name AS sender_name, c.content, c.read_by, c.created_at
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

// GET /board/chat/contacts, /admin/chat/contacts — staff directory for the
// team chat sidebar (group channel + one entry per DM-able colleague).
const getChatContacts = async (req, res) => {
  try {
    const contacts = await db.query(
      `SELECT id, name, role, profile_picture_url FROM users WHERE role != 'customer' AND id != $1 ORDER BY name ASC`,
      [req.user.userId]
    );
    return res.status(200).json({ status: 'success', data: contacts.rows });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to load chat contacts' });
  }
};

const getBoardDashboardStats = async (req, res) => {
  try {
    const boardMemberId = req.user.userId;
    const userRole = req.user.role;

    // Default the reporting window to the current calendar month when not specified.
    // Built from local Y/M/D components, not toISOString() (which converts to UTC and
    // can roll the date back a day depending on server timezone).
    const toLocalIso = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };
    const now = new Date();
    const defaultStart = toLocalIso(new Date(now.getFullYear(), now.getMonth(), 1));
    const defaultEnd = toLocalIso(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    const startDate = req.query.startDate || defaultStart;
    const endDate = req.query.endDate || defaultEnd;

    // $1/$2 (the date range) are always referenced in the query text; the board-member
    // id is only appended (as $3) when the investment_head branch actually uses it —
    // Postgres can't infer a placeholder's type if it's passed but never referenced.
    // The withdrawal subquery is a fully independent scalar (its own WHERE, matching
    // the same client scope) rather than a join, so it isn't affected by however many
    // investment/payout rows the outer join produces per customer.
    const withdrawalScope = userRole === 'investment_head'
      ? `cu.role = 'customer' AND cu.assigned_to = $3`
      : `cu.role = 'customer'`;
    let queryStr = `
      SELECT
        COUNT(DISTINCT u.id) AS total_clients,
        COALESCE(SUM(i.amount) FILTER (WHERE i.status = 'active'), 0)
          - COALESCE((
              SELECT SUM(w.amount) FROM withdrawals w JOIN users cu ON cu.id = w.customer_id
              WHERE w.status = 'completed' AND ${withdrawalScope}
            ), 0)
          AS total_aum,
        COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'active') AS active_mandates,
        COUNT(DISTINCT u.id) FILTER (WHERE u.created_at BETWEEN $1 AND $2::date + 1) AS new_clients,
        COUNT(mr.id) FILTER (WHERE mr.payout_date BETWEEN $1 AND $2) AS transactions
      FROM users u
      LEFT JOIN investments i ON u.id = i.customer_id
      LEFT JOIN monthly_returns mr ON mr.investment_id = i.id
    `;
    const queryParams = [startDate, endDate];

    // Investment Heads only see their assigned clients; Business Heads see all
    if (userRole === 'investment_head') {
      queryParams.push(boardMemberId);
      queryStr += ` WHERE u.assigned_to = $3 AND u.role = 'customer'`;
    } else {
      queryStr += ` WHERE u.role = 'customer'`;
    }

    const stats = await db.query(queryStr, queryParams);

    return res.status(200).json({
      status: 'success',
      data: { ...stats.rows[0], startDate, endDate },
    });
  } catch (error) {
    console.error('Board Dashboard Stats Error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to load stats' });
  }
};

const voidPayout = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { returnId } = req.params;
    await client.query('BEGIN');

    const previous = await client.query(`SELECT payout_status FROM monthly_returns WHERE id = $1 FOR UPDATE`, [returnId]);

    // Mark as voided instead of deleting to maintain historical integrity
    await client.query(`UPDATE monthly_returns SET payout_status = 'voided' WHERE id = $1`, [returnId]);

    // Log the reversal, including the prior status so the change is traceable
    await client.query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, old_value, new_value, ip)
       VALUES ($1, 'VOID_PAYOUT', 'monthly_return', $2, $3, $4, $5)`,
      [
        req.user.userId,
        returnId,
        JSON.stringify({ payout_status: previous.rows[0]?.payout_status ?? null }),
        JSON.stringify({ payout_status: 'voided' }),
        req.ip,
      ]
    );

    await client.query('COMMIT');
    return res.status(200).json({ status: 'success', message: 'Payout voided successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    return res.status(500).json({ status: 'error', message: 'Failed to void payout' });
  } finally {
    client.release();
  }
};

const getClientDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const profileRes = await db.query(
      `SELECT u.id, u.name, u.email, u.phone, u.is_active, u.created_at, u.profile_picture_url, u.client_code,
              am.name AS relationship_manager
       FROM users u
       LEFT JOIN users am ON am.id = u.assigned_to
       WHERE u.id = $1 AND u.role = 'customer'`,
      [id]
    );

    if (profileRes.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Client not found' });
    }

    const investmentsRes = await db.query(
      `SELECT id, amount, investment_date, week_of_month, tenure_months, status, exit_date, payment_screenshot_url
       FROM investments
       WHERE customer_id = $1
       ORDER BY investment_date DESC`,
      [id]
    );

    const withdrawalsRes = await db.query(
      `SELECT id, amount, withdrawal_date, status, payment_screenshot_url
       FROM withdrawals
       WHERE customer_id = $1
       ORDER BY withdrawal_date DESC`,
      [id]
    );

    const currentYear = new Date().getFullYear();
    const summaryRes = await db.query(
      `SELECT
         COALESCE(SUM(i.amount) FILTER (WHERE i.status = 'active'), 0)
           - COALESCE((SELECT SUM(amount) FROM withdrawals WHERE customer_id = $1 AND status = 'completed'), 0)
           AS total_aum,
         COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'active') AS active_mandates,
         COUNT(DISTINCT i.id) AS total_investment_count,
         COALESCE(SUM(mr.payout_amount) FILTER (WHERE mr.year = $2), 0) AS total_returns_ytd
       FROM investments i
       LEFT JOIN monthly_returns mr ON mr.investment_id = i.id
       WHERE i.customer_id = $1`,
      [id, currentYear]
    );

    return res.status(200).json({
      status: 'success',
      data: {
        profile: profileRes.rows[0],
        investments: investmentsRes.rows,
        withdrawals: withdrawalsRes.rows,
        summary: summaryRes.rows[0],
      },
    });
  } catch (error) {
    console.error('Client Detail Error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch client detail' });
  }
};

const getClientActiveInvestments = async (req, res) => {
  try {
    const { id } = req.params; // Customer ID

    const investments = await db.query(
      `SELECT id, amount, investment_date, week_of_month
       FROM investments
       WHERE customer_id = $1 AND status = 'active'
       ORDER BY investment_date DESC`,
      [id]
    );

    return res.status(200).json({ status: 'success', data: investments.rows });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch active investments' });
  }
};

const getPendingPayouts = async (req, res) => {
  try {
    const boardMemberId = req.user.userId;
    const userRole = req.user.role;

    const now = new Date();
    const month = parseInt(req.query.month, 10) || now.getMonth() + 1;
    const year = parseInt(req.query.year, 10) || now.getFullYear();

    let queryStr = `
      SELECT i.id AS investment_id, i.amount, i.week_of_month, i.investment_date,
             u.id AS customer_id, u.name AS client_name
      FROM investments i
      JOIN users u ON u.id = i.customer_id
      WHERE i.status = 'active'
        AND NOT EXISTS (
          SELECT 1 FROM monthly_returns mr
          WHERE mr.investment_id = i.id AND mr.month = $1 AND mr.year = $2
        )
    `;
    const queryParams = [month, year];

    // Investment Heads only see their assigned clients; Business Heads / Super Admins see all
    if (userRole === 'investment_head') {
      queryParams.push(boardMemberId);
      queryStr += ` AND u.assigned_to = $3`;
    }

    queryStr += ` ORDER BY u.name ASC`;

    const pending = await db.query(queryStr, queryParams);

    return res.status(200).json({ status: 'success', data: { investments: pending.rows, month, year } });
  } catch (error) {
    console.error('Pending Payouts Error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch pending payouts' });
  }
};

// POST /board/clients/:id/send-report — FR-IH-06: generate + email the client's PDF report
const sendClientReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { generateReportPDF } = require('../utils/pdf');
    const mailer = require('../utils/mailer');

    const clientRes = await db.query(`SELECT name, email FROM users WHERE id = $1 AND role = 'customer'`, [id]);
    if (clientRes.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Client not found' });
    }
    const client = clientRes.rows[0];

    const historyRes = await db.query(
      `SELECT mr.month, mr.year, i.amount AS invested_amount, mr.return_pct, mr.payout_amount
       FROM monthly_returns mr
       JOIN investments i ON mr.investment_id = i.id
       WHERE i.customer_id = $1 ORDER BY mr.year DESC, mr.month DESC`,
      [id]
    );

    const pdfBuffer = await generateReportPDF(client.name, historyRes.rows);
    await mailer.sendReportEmail(client.email, client.name, pdfBuffer);

    return res.status(200).json({ status: 'success', message: 'Report sent successfully' });
  } catch (error) {
    console.error('Send Report Error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to send report' });
  }
};

// POST /board/clients/:id/send-email — FR-IH-07: compose + send a custom email to the client
const sendClientEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, message } = req.body;

    const clientRes = await db.query(`SELECT email FROM users WHERE id = $1 AND role = 'customer'`, [id]);
    if (clientRes.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Client not found' });
    }

    const mailer = require('../utils/mailer');
    await mailer.sendCustomEmail(clientRes.rows[0].email, subject, message);

    return res.status(200).json({ status: 'success', message: 'Email sent successfully' });
  } catch (error) {
    console.error('Send Email Error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to send email' });
  }
};

// GET /board/return-rate — read-only access to the global default (FR-IH-12)
const getBoardReturnRate = async (req, res) => {
  try {
    const result = await db.query(`SELECT global_return_pct FROM platform_settings WHERE id = 1`);
    return res.status(200).json({ status: 'success', data: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch return rate' });
  }
};

module.exports = {
  getAssignedClients, addInvestment, getBoardInvestments,
  addWithdrawal, getBoardWithdrawals, getBoardPayouts, getBoardTransactions,
  processPayout, getChatHistory, getChatContacts, getBoardDashboardStats, voidPayout,
  getClientActiveInvestments, getClientDetail, getPendingPayouts,
  sendClientReport, sendClientEmail, getBoardReturnRate,
};