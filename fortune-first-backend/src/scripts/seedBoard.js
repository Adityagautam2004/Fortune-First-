const db = require('../models/db');
const { hashPassword } = require('../utils/auth.utils');

const seedBoard = async () => {
  try {
    const investmentHeadEmail = 'amit.singh@fortunefirst.com';
    const businessHeadEmail = 'board@fortunefirst.com';

    const existing = await db.query('SELECT id FROM users WHERE email IN ($1, $2)', [
      investmentHeadEmail,
      businessHeadEmail,
    ]);

    if (existing.rows.length > 0) {
      console.log('ℹ️ Dummy board users already exist.');
      process.exit(0);
    }

    const hashedPassword = await hashPassword('Board@123');

    const ihRes = await db.query(
      `INSERT INTO users (name, email, password_hash, role, phone, must_change_password)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      ['Amit Singh', investmentHeadEmail, hashedPassword, 'investment_head', '9876500001', false]
    );
    const investmentHeadId = ihRes.rows[0].id;

    await db.query(
      `INSERT INTO users (name, email, password_hash, role, phone, must_change_password)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      ['Rohan Mehta', businessHeadEmail, hashedPassword, 'business_head', '9876500002', false]
    );

    // Assign the existing dummy customer (client@example.com) to this Investment Head,
    // so the board dashboard has a real assigned client to display.
    await db.query(`UPDATE users SET assigned_to = $1 WHERE email = 'client@example.com'`, [
      investmentHeadId,
    ]);

    console.log('✅ Dummy Investment Head created: amit.singh@fortunefirst.com / Board@123');
    console.log('✅ Dummy Business Head created: board@fortunefirst.com / Board@123');
    console.log('✅ Assigned client@example.com to Amit Singh.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error:', error);
    process.exit(1);
  }
};

seedBoard();
