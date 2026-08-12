const db = require('../models/db');
const { hashPassword } = require('../utils/auth.utils');

const getUsers = async (req, res) => {
  try {
    const usersRes = await db.query(
      `SELECT id, name, email, role, phone, is_active, created_at 
       FROM users ORDER BY created_at DESC`
    );
    return res.status(200).json({ status: 'success', data: usersRes.rows });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch users' });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, assignedTo } = req.body;
    
    // Hash the temporary password assigned by the admin
    const hashedPassword = await hashPassword(password);
    
    const newUser = await db.query(
      `INSERT INTO users (name, email, password_hash, role, phone, assigned_to, must_change_password)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE) RETURNING id, name, email`,
      [name, email, hashedPassword, role, phone, assignedTo || null]
    );

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
    
    await db.query(`UPDATE join_requests SET status = $1 WHERE id = $2`, [status, id]);
    
    // Note: If Approved, you would typically trigger the createUser logic here automatically.
    
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

    const aumRes = await db.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM investments WHERE status = 'active'`
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

const removePosition = async (req, res) => {
  try {
    const { id } = req.params;
    // Ensure the user only deletes their own portfolio items
    await db.query(`DELETE FROM portfolio_positions WHERE id = $1 AND owner_id = $2`, [id, req.user.userId]);
    return res.status(200).json({ status: 'success', message: 'Position removed' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to remove position' });
  }
};

module.exports = { getUsers, createUser, getJoinRequests, updateJoinRequestStatus, getDashboardStats, removePosition };
