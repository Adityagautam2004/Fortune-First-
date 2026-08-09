const db = require('../models/db');
const { hashPassword } = require('../utils/auth.utils');

const seedCustomer = async () => {
  try {
    const customerEmail = 'client@example.com';
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [customerEmail]);

    if (existing.rows.length > 0) {
      console.log('ℹ️ Dummy customer already exists.');
      process.exit(0);
    }

    const hashedPassword = await hashPassword('Client@123');

    // 1. Insert Customer
    const userRes = await db.query(
      `INSERT INTO users (name, email, password_hash, role, phone, must_change_password)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      ['John Doe', customerEmail, hashedPassword, 'customer', '9876543210', false]
    );
    const customerId = userRes.rows[0].id;

    // 2. Insert Active Investment (₹50,000)
    const investRes = await db.query(
      `INSERT INTO investments (customer_id, amount, investment_date, week_of_month, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [customerId, 50000.00, '2026-06-01', 1, 'active']
    );
    const investmentId = investRes.rows[0].id;

    // 3. Insert a Paid Monthly Return (₹1,000 for June)
    await db.query(
      `INSERT INTO monthly_returns (investment_id, month, year, return_pct, payout_amount, payout_status, payout_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [investmentId, 6, 2026, 2.00, 1000.00, 'paid', '2026-06-30']
    );

    console.log('✅ Dummy Customer Created: client@example.com / Client@123');
    console.log('✅ Injected ₹50k investment and ₹1k paid return record.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error:', error);
    process.exit(1);
  }
};

seedCustomer();