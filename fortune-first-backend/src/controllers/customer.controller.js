const db = require('../models/db');
const redis = require('../utils/redis');

const getDashboardStats = async (req, res) => {
  try {
    const customerId = req.user.userId;
    const cacheKey = `dashboard:${customerId}`; // Write-through invalidation pattern

    // 1. Check Redis Cache First
    const cachedStats = await redis.get(cacheKey);
    if (cachedStats) {
      return res.status(200).json({ status: 'success', source: 'cache', data: JSON.parse(cachedStats) });
    }

    // 2. Cache Miss - Query PostgreSQL
    const activeInvestments = await db.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_invested 
       FROM investments 
       WHERE customer_id = $1 AND status = 'active'`,
      [customerId]
    );

    // Placeholder math for initial structure - exact payout logic will be integrated later
    const statsData = {
      totalInvested: parseFloat(activeInvestments.rows[0].total_invested),
      currentValue: parseFloat(activeInvestments.rows[0].total_invested), 
      cagr: 0.0,
      thisMonthReturn: 0.0
    };

    // 3. Store in Redis with 5-minute TTL
    await redis.set(cacheKey, JSON.stringify(statsData), 'EX', 300);

    return res.status(200).json({ status: 'success', source: 'database', data: statsData });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to load dashboard statistics' });
  }
};

const getInvestmentHistory = async (req, res) => {
  try {
    const customerId = req.user.userId;
    
    // Raw SQL JOIN to combine investments with their monthly returns
    const historyQuery = await db.query(
      `SELECT 
        mr.month, 
        mr.year, 
        i.amount AS invested_amount, 
        mr.return_pct, 
        mr.payout_amount, 
        mr.payout_status, 
        mr.payout_date 
       FROM monthly_returns mr
       JOIN investments i ON mr.investment_id = i.id
       WHERE i.customer_id = $1
       ORDER BY mr.year DESC, mr.month DESC`,
      [customerId]
    );

    return res.status(200).json({ 
      status: 'success', 
      data: historyQuery.rows 
    });
  } catch (error) {
    console.error('History Error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch investment history' });
  }
};

const getProfile = async (req, res) => {
  try {
    const customerId = req.user.userId;
    
    const profileQuery = await db.query(
      `SELECT u.name, u.email, u.phone, u.created_at,
              k.pan_number_enc, k.bank_name, k.account_number_enc, k.ifsc_code, k.verified
       FROM users u
       LEFT JOIN kyc_details k ON u.id = k.user_id
       WHERE u.id = $1`,
      [customerId]
    );

    if (profileQuery.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    const data = profileQuery.rows[0];
    
    // Masking sensitive data before it leaves the server
    if (data.pan_number_enc) {
      data.pan_masked = data.pan_number_enc.substring(0, 5) + '****' + data.pan_number_enc.substring(9);
    }
    
    return res.status(200).json({ status: 'success', data });
  } catch (error) {
    console.error('Profile Error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch profile' });
  }
};

const createSupportTicket = async (req, res) => {
  try {
    const { subject, category, message } = req.body;
    const customerId = req.user.userId;

    await db.query(
      `INSERT INTO support_tickets (customer_id, subject, category, message)
       VALUES ($1, $2, $3, $4)`,
      [customerId, subject, category, message]
    );

    return res.status(201).json({ status: 'success', message: 'Ticket created successfully' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to create ticket' });
  }
};

const getSupportTickets = async (req, res) => {
  try {
    const customerId = req.user.userId;
    const tickets = await db.query(
      `SELECT id, subject, category, status, created_at FROM support_tickets WHERE customer_id = $1 ORDER BY created_at DESC`,
      [customerId]
    );
    return res.status(200).json({ status: 'success', data: tickets.rows });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch tickets' });
  }
};


module.exports = { getDashboardStats, getInvestmentHistory,getProfile,createSupportTicket,getSupportTickets };