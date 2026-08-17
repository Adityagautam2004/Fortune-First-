const db = require('../models/db');
const redis = require('../utils/redis');
const { encrypt, decrypt, maskPan, maskAccountNumber } = require('../utils/crypto');
const { uploadBuffer } = require('../utils/cloudinary');

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
              k.pan_number_enc, k.bank_name, k.account_number_enc, k.ifsc_code,
              k.document_url, k.verified
       FROM users u
       LEFT JOIN kyc_details k ON u.id = k.user_id
       WHERE u.id = $1`,
      [customerId]
    );

    if (profileQuery.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    const data = profileQuery.rows[0];

    // Decrypt server-side only long enough to mask, then discard the plaintext —
    // the raw encrypted columns and full decrypted values never leave this function.
    data.pan_masked = data.pan_number_enc ? maskPan(decrypt(data.pan_number_enc)) : null;
    data.account_masked = data.account_number_enc ? maskAccountNumber(decrypt(data.account_number_enc)) : null;
    delete data.pan_number_enc;
    delete data.account_number_enc;

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
const { generateReportPDF } = require('../utils/pdf');

const downloadFullReport = async (req, res) => {
  try {
    const customerId = req.user.userId;
    
    // Fetch profile and history
    const profileRes = await db.query(`SELECT name FROM users WHERE id = $1`, [customerId]);
    const historyRes = await db.query(
      `SELECT mr.month, mr.year, i.amount AS invested_amount, mr.return_pct, mr.payout_amount 
       FROM monthly_returns mr
       JOIN investments i ON mr.investment_id = i.id
       WHERE i.customer_id = $1 ORDER BY mr.year DESC, mr.month DESC`,
      [customerId]
    );

    const pdfBuffer = await generateReportPDF(profileRes.rows[0].name, historyRes.rows);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="Fortune_First_Report.pdf"',
      'Content-Length': pdfBuffer.length
    });
    
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF Generation Error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to generate report' });
  }
};


// GET /customer/report/monthly?month=&year= — FR-CUST-09: single-month PDF report
const downloadMonthlyReport = async (req, res) => {
  try {
    const customerId = req.user.userId;
    const month = parseInt(req.query.month, 10);
    const year = parseInt(req.query.year, 10);

    if (!month || !year || month < 1 || month > 12) {
      return res.status(400).json({ status: 'error', message: 'Valid month (1-12) and year are required' });
    }

    const profileRes = await db.query(`SELECT name FROM users WHERE id = $1`, [customerId]);
    const historyRes = await db.query(
      `SELECT mr.month, mr.year, i.amount AS invested_amount, mr.return_pct, mr.payout_amount
       FROM monthly_returns mr
       JOIN investments i ON mr.investment_id = i.id
       WHERE i.customer_id = $1 AND mr.month = $2 AND mr.year = $3
       ORDER BY mr.year DESC, mr.month DESC`,
      [customerId, month, year]
    );

    if (historyRes.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'No records found for that month' });
    }

    const pdfBuffer = await generateReportPDF(profileRes.rows[0].name, historyRes.rows);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Fortune_First_Report_${month}_${year}.pdf"`,
      'Content-Length': pdfBuffer.length
    });

    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Monthly PDF Generation Error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to generate report' });
  }
};

const submitKYC = async (req, res) => {
  try {
    const { panNumber, bankName, accountNumber, ifscCode } = req.body;
    const userId = req.user.userId;

    await db.query(
      `INSERT INTO kyc_details (user_id, pan_number_enc, bank_name, account_number_enc, ifsc_code)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) DO UPDATE
       SET pan_number_enc = EXCLUDED.pan_number_enc, bank_name = EXCLUDED.bank_name,
           account_number_enc = EXCLUDED.account_number_enc, ifsc_code = EXCLUDED.ifsc_code`,
      [userId, encrypt(panNumber), bankName, encrypt(accountNumber), ifscCode]
    );

    return res.status(200).json({ status: 'success', message: 'KYC submitted for verification' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'KYC submission failed' });
  }
};

// POST /customer/kyc/document — FR-CUST KYC: upload the ID/address proof document
// (PAN card, Aadhaar, bank statement, etc.) referenced by kyc_details.document_url.
const uploadKYCDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No file uploaded' });
    }
    const userId = req.user.userId;
    const result = await uploadBuffer(req.file.buffer, 'kyc_documents');

    await db.query(
      `INSERT INTO kyc_details (user_id, document_url)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET document_url = EXCLUDED.document_url`,
      [userId, result.secure_url]
    );

    return res.status(200).json({
      status: 'success',
      message: 'Document uploaded successfully',
      data: { documentUrl: result.secure_url },
    });
  } catch (error) {
    console.error('KYC Document Upload Error:', error);
    return res.status(500).json({ status: 'error', message: 'Document upload failed' });
  }
};

module.exports = { getDashboardStats, getInvestmentHistory,getProfile,createSupportTicket,getSupportTickets,downloadFullReport, downloadMonthlyReport, submitKYC, uploadKYCDocument };