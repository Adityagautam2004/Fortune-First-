const fs = require('fs');
const path = require('path');
const db = require('./db');

const runMigrations = async () => {
  try {
    console.log('⏳ Starting data migration process...');
    // Absolute path layout to find your sql query file
    const schemaPath = path.join(__dirname, '../../migrations/001_init_schema.sql');
    const sqlSchema = fs.readFileSync(schemaPath, 'utf8');
    
    // Fire the entire raw script directly into the Postgres instance
    await db.query(sqlSchema);
    console.log('✅ All relational core database tables created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Critical Error executing database migrations:', error);
    process.exit(1);
  }
};

runMigrations();