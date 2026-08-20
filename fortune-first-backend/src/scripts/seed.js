const db = require('../models/db');
const { hashPassword } = require('../utils/auth.utils');

const seedAdmin = async () => {
  try {
    const adminEmail = 'aditya@fortunefirst.com';
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [adminEmail]);

    if (existing.rows.length > 0) {
      console.log('ℹ️ Admin user already exists.');
      process.exit(0);
    }

    const hashedPassword = await hashPassword('Aditya@#*$&');

    await db.query(
      `INSERT INTO users (name, email, password_hash, role, must_change_password)
       VALUES ($1, $2, $3, $4, $5)`,
      ['Aditya Gautam', adminEmail, hashedPassword, 'super_admin', false]
    );

    console.log('✅ Super Admin created: aditya@fortunefirst.com / Aditya@#*$&');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error:', error);
    process.exit(1);
  }
};

seedAdmin();