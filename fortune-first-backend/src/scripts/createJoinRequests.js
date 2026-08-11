const db = require('../models/db');

const createJoinRequestsTable = async () => {
  try {
    console.log('⏳ Creating join_requests table...');
    
    const sql = `
      CREATE TABLE IF NOT EXISTS join_requests (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) NOT NULL,
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(15),
          amount VARCHAR(50),
          message TEXT,
          status VARCHAR(20) DEFAULT 'Pending',
          created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // Fire the SQL query into the database
    await db.query(sql);
    
    console.log('✅ join_requests table created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating table:', error);
    process.exit(1);
  }
};

createJoinRequestsTable();