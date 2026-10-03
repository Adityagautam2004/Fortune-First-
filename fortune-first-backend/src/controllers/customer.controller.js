const db = require('../models/db');
const cache = require('../utils/cache');
const reportPdfService = require('../services/reportPdfService');
const { encrypt, decrypt, maskPan, maskAccountNumber } = require('../utils/crypto');
const { uploadBuffer } = require('../utils/cloudinary');
const transactionService = require('../services/transactionService');

const getDashboardStats = async (req, res) => {
  try {
    const customerId = req.user.userId;
    // Invalidated by cache.invalidateCustomerCaches() on every investment,
    // withdrawal and payout change for this customer.
    const cacheKey = cache.customerDashboardKey(customerId);

    // 1. Check Redis Cache First (fails open to the database)
    const cachedStats = await cache.getJSON(cacheKey);
    if (cachedStats) {
      return res.status(200).json({ status: 'success', source: 'cache', data: cachedStats });
    }

    // 2. Cache Miss - Query PostgreSQL
    // totalInvested is the client's current position — active investments
    // minus completed withdrawals, not a running total of every deposit.
    // Returns only count payouts actually paid (voided/skipped never reached
    // the client).
    const totalsRes = await db.query(
      `SELECT
         COALESCE((SELECT SUM(amount) FROM investments WHERE customer_id = $1 AND status = 'active'), 0) AS active_invested,
         COALESCE((SELECT SUM(amount) FROM withdrawals WHERE customer_id = $1 AND status = 'completed'), 0) AS total_withdrawn,
         COALESCE((SELECT SUM(payout_amount) FROM monthly_returns WHERE customer_id = $1 AND payout_status = 'paid'), 0) AS total_returns,
         (SELECT COUNT(*) FROM monthly_returns WHERE customer_id = $1 AND payout_status = 'paid') AS payout_count`,
      [customerId]
    );
    const lastPayoutRes = await db.query(
      `SELECT payout_amount, month, year, payout_date
       FROM monthly_returns
       WHERE customer_id = $1 AND payout_status = 'paid'
       ORDER BY year DESC, month DESC
       LIMIT 1`,
      [customerId]
    );

    const totals = totalsRes.rows[0];
    const lastPayout = lastPayoutRes.rows[0];
    const statsData = {
      totalInvested: parseFloat(totals.active_invested) - parseFloat(totals.total_withdrawn),
      totalWithdrawn: parseFloat(totals.total_withdrawn),
      totalReturns: parseFloat(totals.total_returns),
      payoutCount: parseInt(totals.payout_count, 10),
      lastPayout: lastPayout
        ? {
            amount: parseFloat(lastPayout.payout_amount),
            month: lastPayout.month,
            year: lastPayout.year,
            payoutDate: lastPayout.payout_date,
          }
        : null,
    };

    // 3. Store in Redis with 5-minute TTL
    await cache.setJSON(cacheKey, statsData, 300);

    return res.status(200).json({ status: 'success', source: 'database', data: statsData });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to load dashboard statistics' });
  }
};

const getInvestmentHistory = async (req, res) => {
  try {
    const customerId = req.user.userId;
    
    // One row per calendar month now — invested_amount is the client's
    // aggregate active-investment total at payout time, snapshotted
    // directly on the row (no join to investments needed).
    const historyQuery = await db.query(
      `SELECT
        mr.month,
        mr.year,
        mr.invested_amount,
        mr.return_pct,
        mr.payout_amount,
        mr.payout_status,
        mr.payout_date
       FROM monthly_returns mr
       WHERE mr.customer_id = $1
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

// GET /customer/transactions — this client's own combined investment +
// withdrawal + payout list (FR-TXN-01). Hard-scoped to req.user.userId —
// no filter here can ever be pointed at another customer's data.
const getCustomerTransactions = async (req, res) => {
  try {
    const { type, page, limit } = req.query;
    const result = await transactionService.getTransactions({
      customerId: req.user.userId,
      type,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    console.error('Get Customer Transactions Error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch transactions' });
  }
};

const getProfile = async (req, res) => {
  try {
    const customerId = req.user.userId;

    const profileQuery = await db.query(
      `SELECT u.name, u.email, u.phone, u.created_at, u.profile_picture_url, u.client_code,
              k.pan_number_enc, k.bank_name, k.account_number_enc, k.ifsc_code,
              k.upi_id, k.date_of_birth, k.document_url, k.verified
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

const downloadFullReport = async (req, res) => {
  try {
    // Cached per customer — rendering a PDF launches a headless browser.
    const report = await reportPdfService.getFullReport(req.user.userId);
    if (!report) {
      return res.status(404).json({ status: 'error', message: 'Customer not found' });
    }
    const pdfBuffer = report.pdf;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Fortune_First_Report_${report.profile.name.replace(/\s+/g, '_')}.pdf"`,
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

    const report = await reportPdfService.getMonthlyReport(customerId, month, year);
    if (!report) {
      return res.status(404).json({ status: 'error', message: 'No records found for that month' });
    }
    const pdfBuffer = report.pdf;

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
    const { panNumber, bankName, accountNumber, ifscCode, upiId, dateOfBirth } = req.body;
    const userId = req.user.userId;

    await db.query(
      `INSERT INTO kyc_details (user_id, pan_number_enc, bank_name, account_number_enc, ifsc_code, upi_id, date_of_birth)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id) DO UPDATE
       SET pan_number_enc = EXCLUDED.pan_number_enc, bank_name = EXCLUDED.bank_name,
           account_number_enc = EXCLUDED.account_number_enc, ifsc_code = EXCLUDED.ifsc_code,
           upi_id = EXCLUDED.upi_id, date_of_birth = EXCLUDED.date_of_birth`,
      [userId, encrypt(panNumber), bankName, encrypt(accountNumber), ifscCode, upiId, dateOfBirth]
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

module.exports = {
  getDashboardStats, getInvestmentHistory, getCustomerTransactions, getProfile,
  createSupportTicket, getSupportTickets, downloadFullReport, downloadMonthlyReport,
  submitKYC, uploadKYCDocument,
};