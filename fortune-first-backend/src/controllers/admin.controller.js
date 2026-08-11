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

module.exports = { getUsers, createUser, getJoinRequests, updateJoinRequestStatus };
