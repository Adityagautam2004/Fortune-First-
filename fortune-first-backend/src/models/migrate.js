const fs = require('fs');
const path = require('path');
const db = require('./db');

const runMigrations = async () => {
  try {
    console.log('⏳ Starting data migration process...');
    // Run every migrations/*.sql file in order, so new files don't need
    // to be wired in here by hand.
    const migrationsDir = path.join(__dirname, '../../migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      console.log(`  → Applying ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await db.query(sql);
    }
    console.log('✅ All relational core database tables created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Critical Error executing database migrations:', error);
    process.exit(1);
  }
};

runMigrations();