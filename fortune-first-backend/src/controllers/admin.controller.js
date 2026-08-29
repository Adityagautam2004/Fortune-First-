const db = require('../models/db');
const redis = require('../utils/redis');
const { hashPassword } = require('../utils/auth.utils');
const {
  sendJoinRequestApprovedEmail,
  sendJoinRequestRejectedEmail,
  sendOnboardingEmail,
} = require('../utils/mailer');
const { decrypt, maskPan, maskAccountNumber } = require('../utils/crypto');
const userService = require('../services/userService');
const investmentService = require('../services/investmentService');
const withdrawalService = require('../services/withdrawalService');
const transactionService = require('../services/transactionService');
const payoutService = require('../services/payout.service');

const getUsers = async (req, res) => {
  try {
    // FR-ADMIN-05: search/filter by investment head (assignedTo) and status (isActive).
    // Response stays a flat array (data: [...]) for backward compatibility with the
    // existing admin users table, which doesn't paginate — just filters if asked.
    const { role, assignedTo, isActive } = req.query;
    const result = await userService.getAllUsers({
      role,
      assigned_to: assignedTo,
      is_active: isActive !== undefined ? isActive === 'true' : undefined,
      page: 1,
      limit: 1000,
    });
    return res.status(200).json({ status: 'success', data: result.users });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch users' });
  }
};

// GET /admin/users/:id — FR-ADMIN-05/06 single-user lookup
const getUserByIdAdmin = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    return res.status(200).json({ status: 'success', data: user });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ status: 'error', message: error.message || 'Failed to fetch user' });
  }
};

// PATCH /admin/users/:id — FR-ADMIN-06: edit investor/board profile, assigned head, etc.
const updateUserAdmin = async (req, res) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    return res.status(200).json({ status: 'success', message: 'User updated successfully', data: user });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ status: 'error', message: error.message || 'Failed to update user' });
  }
};

// PATCH /admin/users/:id/toggle-active — FR-ADMIN-07: suspend/activate
const toggleUserActiveAdmin = async (req, res) => {
  try {
    const user = await userService.toggleUserActive(req.params.id);
    return res.status(200).json({
      status: 'success',
      message: `User ${user.is_active ? 'activated' : 'deactivated'} successfully`,
      data: user,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ status: 'error', message: error.message || 'Failed to update user status' });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, assignedTo } = req.body;

    // Hash the temporary password assigned by the admin
    const hashedPassword = await hashPassword(password);

    // Optional at creation for every role — a client uploads their own later
    // via the self-service endpoint; for a staff account (investment_head/
    // business_head) the admin can set one now, or the head can self-upload
    // later through that same endpoint if this is skipped.
    let profilePictureUrl = null;
    if (req.file) {
      const { uploadBuffer } = require('../utils/cloudinary');
      const uploaded = await uploadBuffer(req.file.buffer, 'profile_pictures');
      profilePictureUrl = uploaded.secure_url;
    }

    const newUser = await db.query(
      `INSERT INTO users (name, email, password_hash, role, phone, assigned_to, must_change_password, profile_picture_url)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7) RETURNING id, name, email, profile_picture_url`,
      [name, email, hashedPassword, role, phone, assignedTo || null, profilePictureUrl]
    );

    // FR-ADMIN-11: final onboarding step — the account now exists, so the
    // temp password (still in plaintext here, pre-hash) and the assigned
    // investment head's contact details (if any) go out immediately.
    let investmentHead = null;
    if (assignedTo) {
      const headRes = await db.query(`SELECT name, phone FROM users WHERE id = $1`, [assignedTo]);
      investmentHead = headRes.rows[0] || null;
    }
    await sendOnboardingEmail(email, name, password, investmentHead);

    return res.status(201).json({ status: 'success', message: 'User created', data: newUser.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ status: 'error', message: 'Email already exists' });
    }
    return res.status(500).json({ status: 'error', message: 'Failed to create user' });
  }
};

const getJoinRequests = async (req, res) => {
  try {
    const requests = await db.query(`SELECT * FROM join_requests ORDER BY created_at DESC`);
    return res.status(200).json({ status: 'success', data: requests.rows });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch join requests' });
  }
};

const updateJoinRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'Approved' or 'Rejected'

    const existing = await db.query(`SELECT name, email, status FROM join_requests WHERE id = $1`, [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Join request not found' });
    }
    const request = existing.rows[0];
    if (request.status !== 'Pending') {
      return res.status(409).json({ status: 'error', message: `Request has already been ${request.status.toLowerCase()}` });
    }

    await db.query(`UPDATE join_requests SET status = $1 WHERE id = $2`, [status, id]);

    // FR-ADMIN-11: the decision email — actual account creation (and its own
    // onboarding email) happens separately, later, from User Management.
    if (status === 'Approved') {
      await sendJoinRequestApprovedEmail(request.email, request.name);
    } else if (status === 'Rejected') {
      await sendJoinRequestRejectedEmail(request.email, request.name);
    }

    return res.status(200).json({ status: 'success', message: `Request marked as ${status}` });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to update request' });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const clientsRes = await db.query(
      `SELECT COUNT(*) AS total FROM users WHERE role = 'customer'`
    );

    // Firm-wide AUM — active investments minus whatever's already gone out
    // as a completed withdrawal.
    const aumRes = await db.query(
      `SELECT
         COALESCE((SELECT SUM(amount) FROM investments WHERE status = 'active'), 0)
           - COALESCE((SELECT SUM(amount) FROM withdrawals WHERE status = 'completed'), 0)
           AS total`
    );

    const payoutsRes = await db.query(
      `SELECT COALESCE(SUM(payout_amount), 0) AS total
       FROM monthly_returns
       WHERE month = EXTRACT(MONTH FROM CURRENT_DATE) AND year = EXTRACT(YEAR FROM CURRENT_DATE)`
    );

    return res.status(200).json({
      status: 'success',
      data: {
        totalClients: parseInt(clientsRes.rows[0].total, 10),
        totalAum: parseFloat(aumRes.rows[0].total),
        monthlyPayouts: parseFloat(payoutsRes.rows[0].total),
      },
    });
  } catch (error) {
    console.error('Admin Dashboard Stats Error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to load dashboard statistics' });
  }
};

const getAllSupportTickets = async (req, res) => {
  try {
    const tickets = await db.query(
      `SELECT t.id, t.subject, t.category, t.message, t.status, t.created_at, u.name as customer_name, u.email
       FROM support_tickets t
       JOIN users u ON t.customer_id = u.id
       ORDER BY t.created_at DESC`
    );
    return res.status(200).json({ status: 'success', data: tickets.rows });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch tickets' });
  }
};

const resolveSupportTicket = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(
      `UPDATE support_tickets SET status = 'Resolved', resolved_at = NOW() WHERE id = $1`,
      [id]
    );
    return res.status(200).json({ status: 'success', message: 'Ticket marked as resolved' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to resolve ticket' });
  }
};

// ── Investments (FR-ADMIN-14) ────────────────────────────────────

// GET /admin/investments — paginated, filterable by customer_id/status
const getAllInvestmentsAdmin = async (req, res) => {
  try {
    const { customer_id, status, page, limit } = req.query;
    const result = await investmentService.getAllInvestments({
      customer_id,
      status,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
    });
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch investments' });
  }
};

const getInvestmentByIdAdmin = async (req, res) => {
  try {
    const investment = await investmentService.getInvestmentById(req.params.id);
    return res.status(200).json({ status: 'success', data: investment });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ status: 'error', message: error.message || 'Failed to fetch investment' });
  }
};

// PATCH /admin/investments/:id/status — approve/reject a pending investment,
// or (unchanged, pre-existing) exit/suspend an already-active one. The legal
// transition graph itself lives in investmentService; this just forwards the
// deciding admin's id so it lands in reviewed_by/reviewed_at.
const updateInvestmentStatusAdmin = async (req, res) => {
  try {
    const investment = await investmentService.updateInvestmentStatus(req.params.id, {
      ...req.body,
      reviewed_by: req.user.userId,
    });
    return res.status(200).json({ status: 'success', message: 'Investment status updated successfully', data: investment });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ status: 'error', message: error.message || 'Failed to update investment status' });
  }
};

// GET /admin/withdrawals — flat, unscoped (super_admin sees every client's)
const getAdminWithdrawals = async (req, res) => {
  try {
    const { customer_id, status, page, limit } = req.query;
    const result = await withdrawalService.getAllWithdrawals({
      customer_id,
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch withdrawals' });
  }
};

// PATCH /admin/withdrawals/:id/status — settle a pending request: 'completed'
// (optionally with a payment screenshot as proof) or 'rejected'.
const updateWithdrawalStatusAdmin = async (req, res) => {
  try {
    let paymentScreenshotUrl = null;
    if (req.file) {
      const { uploadBuffer } = require('../utils/cloudinary');
      const uploaded = await uploadBuffer(req.file.buffer, 'payment_screenshots');
      paymentScreenshotUrl = uploaded.secure_url;
    }

    const withdrawal = await withdrawalService.updateWithdrawalStatus(req.params.id, {
      status: req.body.status,
      payment_screenshot_url: paymentScreenshotUrl,
      reviewed_by: req.user.userId,
    });
    return res.status(200).json({ status: 'success', message: 'Withdrawal status updated successfully', data: withdrawal });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ status: 'error', message: error.message || 'Failed to update withdrawal status' });
  }
};

// GET /admin/payouts — flat, unscoped payout list (replaces the removed
// per-investment-only /admin/investments/:id/payouts, which nothing in the
// frontend called)
const getAdminPayouts = async (req, res) => {
  try {
    const { investment_id, customer_id, status, page, limit } = req.query;
    const result = await payoutService.getAllPayouts({
      investment_id,
      customer_id,
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch payouts' });
  }
};

// GET /admin/transactions — combined investment+withdrawal+payout list, unscoped
const getAdminTransactions = async (req, res) => {
  try {
    const { customer_id, type, page, limit } = req.query;
    const result = await transactionService.getTransactions({
      customerId: customer_id,
      type,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch transactions' });
  }
};

// PATCH /admin/payouts/:id/status — correct a payout's status (pending/paid/skipped)
const updatePayoutStatusAdmin = async (req, res) => {
  try {
    const data = { ...req.body, processed_by: req.user.userId };
    const payout = await payoutService.updatePayoutStatus(req.params.id, data);
    return res.status(200).json({ status: 'success', message: 'Payout status updated successfully', data: payout });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ status: 'error', message: error.message || 'Failed to update payout status' });
  }
};

// GET /admin/financials — FR-ADMIN-14/15/16: global summary + optional CSV export
const getFinancialsSummary = async (req, res) => {
  try {
    const investmentsRes = await db.query(
      `SELECT i.id, i.amount, i.status, i.investment_date, u.name AS customer_name, u.email AS customer_email
       FROM investments i JOIN users u ON u.id = i.customer_id
       ORDER BY i.investment_date DESC`
    );

    if (req.query.format === 'csv') {
      const header = 'id,customer_name,customer_email,amount,status,investment_date';
      const rows = investmentsRes.rows.map((r) =>
        [r.id, `"${r.customer_name}"`, r.customer_email, r.amount, r.status, r.investment_date.toISOString().slice(0, 10)].join(',')
      );
      const csv = [header, ...rows].join('\n');
      res.set({ 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="fortune_first_investments.csv"' });
      return res.status(200).send(csv);
    }

    const summary = await payoutService.getPayoutSummary();
    const totalsRes = await db.query(
      `SELECT
         (SELECT COALESCE(SUM(amount), 0) FROM investments WHERE status = 'active')
           - (SELECT COALESCE(SUM(amount), 0) FROM withdrawals WHERE status = 'completed')
           AS total_aum,
         (SELECT COUNT(*) FROM investments WHERE status = 'active') AS total_investments`
    );

    return res.status(200).json({
      status: 'success',
      data: {
        totalAum: parseFloat(totalsRes.rows[0].total_aum),
        totalInvestments: parseInt(totalsRes.rows[0].total_investments, 10),
        payoutSummary: summary,
        investments: investmentsRes.rows,
      },
    });
  } catch (error) {
    console.error('Financials Error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to load financial summary' });
  }
};

// ── Audit Logs (FR-ADMIN-22) — read-only, immutable per FR-ADMIN-23 ──

const getAuditLogs = async (req, res) => {
  try {
    const { actorId, entityType, startDate, endDate, page, limit } = req.query;
    const conditions = [];
    const values = [];
    let i = 1;

    if (actorId) { conditions.push(`actor_id = $${i++}`); values.push(actorId); }
    if (entityType) { conditions.push(`entity_type = $${i++}`); values.push(entityType); }
    if (startDate) { conditions.push(`created_at >= $${i++}`); values.push(startDate); }
    if (endDate) { conditions.push(`created_at <= $${i++}`); values.push(endDate); }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const offset = (pageNum - 1) * limitNum;

    const countRes = await db.query(`SELECT COUNT(*) FROM audit_logs ${whereClause}`, values);
    const logsRes = await db.query(
      `SELECT al.id, al.actor_id, u.name AS actor_name, al.action, al.entity_type, al.entity_id,
              al.old_value, al.new_value, al.ip, al.created_at
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.actor_id
       ${whereClause}
       ORDER BY al.created_at DESC
       LIMIT $${i++} OFFSET $${i}`,
      [...values, limitNum, offset]
    );

    return res.status(200).json({
      status: 'success',
      data: {
        logs: logsRes.rows,
        pagination: {
          total: parseInt(countRes.rows[0].count, 10),
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(parseInt(countRes.rows[0].count, 10) / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Audit Log Error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch audit logs' });
  }
};

// ── Global return rate (FR-ADMIN-13) ─────────────────────────────

const getReturnRate = async (req, res) => {
  try {
    const result = await db.query(`SELECT global_return_pct, updated_at FROM platform_settings WHERE id = 1`);
    return res.status(200).json({ status: 'success', data: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch return rate' });
  }
};

const setReturnRate = async (req, res) => {
  try {
    const { returnPct } = req.body;
    if (typeof returnPct !== 'number' || returnPct < 0 || returnPct > 100) {
      return res.status(400).json({ status: 'error', message: 'returnPct must be a number between 0 and 100' });
    }
    const result = await db.query(
      `UPDATE platform_settings SET global_return_pct = $1, updated_at = NOW() WHERE id = 1 RETURNING global_return_pct, updated_at`,
      [returnPct]
    );
    return res.status(200).json({ status: 'success', message: 'Global return rate updated', data: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to update return rate' });
  }
};

// ── Support ticket assignment (FR-ADMIN-25) ──────────────────────

const assignSupportTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { boardMemberId } = req.body;
    const result = await db.query(
      `UPDATE support_tickets SET assigned_to = $1 WHERE id = $2 RETURNING id, assigned_to`,
      [boardMemberId, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Ticket not found' });
    }
    return res.status(200).json({ status: 'success', message: 'Ticket assigned', data: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to assign ticket' });
  }
};

// ── Blog CMS (FR-ADMIN-17, FR-PUBLIC-23..26) ─────────────────────

const slugify = (title) =>
  title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const getAllBlogPostsAdmin = async (req, res) => {
  try {
    const posts = await db.query(`SELECT * FROM blog_posts ORDER BY created_at DESC`);
    return res.status(200).json({ status: 'success', data: posts.rows });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch blog posts' });
  }
};

const createBlogPost = async (req, res) => {
  try {
    const { title, content, isPublished } = req.body;
    const slug = slugify(title);
    const published = !!isPublished;
    const result = await db.query(
      `INSERT INTO blog_posts (title, slug, content, author_id, is_published, published_at)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, slug, content, req.user.userId, published, published ? new Date() : null]
    );
    await redis.del('public:blog:list');
    return res.status(201).json({ status: 'success', message: 'Blog post created', data: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ status: 'error', message: 'A post with a matching slug already exists' });
    }
    return res.status(500).json({ status: 'error', message: 'Failed to create blog post' });
  }
};

const updateBlogPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, isPublished } = req.body;
    const result = await db.query(
      `UPDATE blog_posts
       SET title = COALESCE($1, title),
           content = COALESCE($2, content),
           is_published = COALESCE($3, is_published),
           published_at = CASE WHEN $3 = TRUE AND published_at IS NULL THEN NOW() ELSE published_at END,
           updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [title || null, content || null, isPublished === undefined ? null : isPublished, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Blog post not found' });
    }
    await redis.del('public:blog:list', `public:blog:post:${result.rows[0].slug}`);
    return res.status(200).json({ status: 'success', message: 'Blog post updated', data: result.rows[0] });
  } catch (error) {
    console.error('Update Blog Error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to update blog post' });
  }
};

const deleteBlogPost = async (req, res) => {
  try {
    const result = await db.query(`DELETE FROM blog_posts WHERE id = $1 RETURNING slug`, [req.params.id]);
    if (result.rows.length > 0) {
      await redis.del('public:blog:list', `public:blog:post:${result.rows[0].slug}`);
    }
    return res.status(200).json({ status: 'success', message: 'Blog post deleted' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to delete blog post' });
  }
};

// ── Testimonials CMS (FR-ADMIN-18) ───────────────────────────────

// GET /admin/testimonials — paginated, newest first
const getAllTestimonialsAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;

    const [testimonials, countRes] = await Promise.all([
      db.query(`SELECT * FROM testimonials ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]),
      db.query(`SELECT COUNT(*) FROM testimonials`),
    ]);
    const total = parseInt(countRes.rows[0].count, 10);

    return res.status(200).json({
      status: 'success',
      data: {
        testimonials: testimonials.rows,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch testimonials' });
  }
};

const createTestimonial = async (req, res) => {
  try {
    const { clientName, city, content, rating, isVisible } = req.body;
    const result = await db.query(
      `INSERT INTO testimonials (client_name, city, content, rating, is_visible)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [clientName, city || null, content, rating || 5, isVisible !== false]
    );
    await redis.del('public:testimonials', 'public:dashboard');
    return res.status(201).json({ status: 'success', message: 'Testimonial created', data: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to create testimonial' });
  }
};

const updateTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const { clientName, city, content, rating, isVisible } = req.body;
    const result = await db.query(
      `UPDATE testimonials
       SET client_name = COALESCE($1, client_name), city = COALESCE($2, city),
           content = COALESCE($3, content), rating = COALESCE($4, rating),
           is_visible = COALESCE($5, is_visible)
       WHERE id = $6 RETURNING *`,
      [clientName || null, city || null, content || null, rating || null, isVisible === undefined ? null : isVisible, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Testimonial not found' });
    }
    await redis.del('public:testimonials', 'public:dashboard');
    return res.status(200).json({ status: 'success', message: 'Testimonial updated', data: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to update testimonial' });
  }
};

const deleteTestimonial = async (req, res) => {
  try {
    const result = await db.query(`DELETE FROM testimonials WHERE id = $1 RETURNING id`, [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Testimonial not found' });
    }
    await redis.del('public:testimonials', 'public:dashboard');
    return res.status(200).json({ status: 'success', message: 'Testimonial deleted' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to delete testimonial' });
  }
};

// ── Public returns chart data (FR-ADMIN-19) — full CRUD ──────────
// One row per calendar month (past months included, for backfilling
// history), enforced by the (month, year) UNIQUE constraint on the table.

// GET /admin/public-returns — paginated, most recent month first;
// optional ?year= filter for jumping to a specific year's entries.
const getAllPublicReturnsAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;
    const { year } = req.query;

    const whereClause = year ? 'WHERE year = $1' : '';
    const listParams = year ? [year, limit, offset] : [limit, offset];
    const countParams = year ? [year] : [];

    const [returns, countRes] = await Promise.all([
      db.query(
        `SELECT * FROM public_returns ${whereClause}
         ORDER BY year DESC, month DESC
         LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
        listParams
      ),
      db.query(`SELECT COUNT(*) FROM public_returns ${whereClause}`, countParams),
    ]);
    const total = parseInt(countRes.rows[0].count, 10);

    return res.status(200).json({
      status: 'success',
      data: {
        returns: returns.rows,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch public returns' });
  }
};

// GET /admin/public-returns/years — distinct years that have either a
// public_returns entry or a real monthly_returns payout, most recent first.
// Used by the admin Past Returns page to bound its year prev/next navigation
// to years that actually have something to show.
const getPublicReturnYears = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT year FROM public_returns
       UNION
       SELECT year FROM monthly_returns
       ORDER BY year DESC`
    );
    return res.status(200).json({ status: 'success', data: result.rows.map((r) => r.year) });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch available years' });
  }
};

// GET /admin/payouts/yearly-summary?year=YYYY — the real total ₹ actually
// paid out to customers that calendar year (monthly_returns is the ground
// truth for real payouts; public_returns is just the % shown publicly), for
// the Past Returns admin page's yearly summary card.
const getYearlyPayoutSummary = async (req, res) => {
  try {
    const year = parseInt(req.query.year, 10);
    if (!year || year < 2000 || year > 2100) {
      return res.status(400).json({ status: 'error', message: 'A valid year query param is required' });
    }

    const result = await db.query(
      `SELECT
         COALESCE(SUM(payout_amount) FILTER (WHERE payout_status = 'paid'), 0) AS total_paid,
         COUNT(*) FILTER (WHERE payout_status = 'paid') AS paid_count,
         COUNT(*) FILTER (WHERE payout_status = 'pending') AS pending_count
       FROM monthly_returns WHERE year = $1`,
      [year]
    );

    return res.status(200).json({
      status: 'success',
      data: {
        year,
        totalPaid: parseFloat(result.rows[0].total_paid),
        paidCount: parseInt(result.rows[0].paid_count, 10),
        pendingCount: parseInt(result.rows[0].pending_count, 10),
      },
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch yearly payout summary' });
  }
};

// POST /admin/public-returns — create one month's entry (rejects a duplicate
// month/year rather than silently overwriting it — use PATCH to correct one).
const createPublicReturn = async (req, res) => {
  try {
    const { month, year, returnPct, notes } = req.body;
    const result = await db.query(
      `INSERT INTO public_returns (month, year, return_pct, notes) VALUES ($1, $2, $3, $4) RETURNING *`,
      [month, year, returnPct, notes || null]
    );
    await redis.del('public:returns', 'public:dashboard');
    return res.status(201).json({ status: 'success', message: 'Public return created', data: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ status: 'error', message: 'An entry for that month already exists — use PATCH to update it' });
    }
    return res.status(500).json({ status: 'error', message: 'Failed to create public return' });
  }
};

// PATCH /admin/public-returns/:id — correct returnPct/notes for an existing
// month. month/year are intentionally immutable here — delete and recreate
// if an entry needs to move to a different month.
const updatePublicReturn = async (req, res) => {
  try {
    const { returnPct, notes } = req.body;
    const result = await db.query(
      `UPDATE public_returns
       SET return_pct = COALESCE($1, return_pct), notes = COALESCE($2, notes)
       WHERE id = $3 RETURNING *`,
      [returnPct === undefined ? null : returnPct, notes === undefined ? null : notes, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Public return entry not found' });
    }
    await redis.del('public:returns', 'public:dashboard');
    return res.status(200).json({ status: 'success', message: 'Public return updated', data: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to update public return' });
  }
};

// DELETE /admin/public-returns/:id
const deletePublicReturn = async (req, res) => {
  try {
    const result = await db.query(`DELETE FROM public_returns WHERE id = $1 RETURNING id`, [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Public return entry not found' });
    }
    await redis.del('public:returns', 'public:dashboard');
    return res.status(200).json({ status: 'success', message: 'Public return deleted' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to delete public return' });
  }
};

// GET /admin/users/:id/kyc — view a customer's KYC submission for review
// (PAN/account numbers stay masked here exactly as they do on the customer's
// own profile view — admins verify against the uploaded document, not the raw number).
const getUserKYC = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT pan_number_enc, bank_name, account_number_enc, ifsc_code, upi_id, date_of_birth, document_url, verified
       FROM kyc_details WHERE user_id = $1`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(200).json({ status: 'success', data: null });
    }

    const data = rows[0];
    data.pan_masked = data.pan_number_enc ? maskPan(decrypt(data.pan_number_enc)) : null;
    data.account_masked = data.account_number_enc ? maskAccountNumber(decrypt(data.account_number_enc)) : null;
    delete data.pan_number_enc;
    delete data.account_number_enc;

    return res.status(200).json({ status: 'success', data });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch KYC details' });
  }
};

// PATCH /admin/users/:id/kyc/verify — mark a customer's KYC as verified/rejected
const verifyUserKYC = async (req, res) => {
  try {
    const { verified } = req.body;
    const { rows } = await db.query(
      `UPDATE kyc_details SET verified = $1 WHERE user_id = $2 RETURNING user_id, verified`,
      [verified, req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'This user has not submitted KYC details yet' });
    }

    return res.status(200).json({
      status: 'success',
      message: `KYC marked as ${verified ? 'verified' : 'unverified'}`,
      data: rows[0],
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to update KYC status' });
  }
};

module.exports = {
  getUsers,
  createUser,
  getUserByIdAdmin,
  updateUserAdmin,
  toggleUserActiveAdmin,
  getUserKYC,
  verifyUserKYC,
  getJoinRequests,
  updateJoinRequestStatus,
  getDashboardStats,
  getAllSupportTickets,
  resolveSupportTicket,
  assignSupportTicket,
  getAllInvestmentsAdmin,
  getInvestmentByIdAdmin,
  updateInvestmentStatusAdmin,
  getAdminWithdrawals,
  updateWithdrawalStatusAdmin,
  getAdminPayouts,
  getAdminTransactions,
  updatePayoutStatusAdmin,
  getFinancialsSummary,
  getAuditLogs,
  getReturnRate,
  setReturnRate,
  getAllBlogPostsAdmin,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  getAllTestimonialsAdmin,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  getAllPublicReturnsAdmin,
  getPublicReturnYears,
  getYearlyPayoutSummary,
  createPublicReturn,
  updatePublicReturn,
  deletePublicReturn,
};
