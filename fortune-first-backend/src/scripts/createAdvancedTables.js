const db = require('../models/db');

const createAdvancedTables = async () => {
  try {
    console.log('⏳ Creating chat and portfolio tables...');
    
    const sql = `
      -- Create enum for chat messages if it doesn't exist
      DO $$ BEGIN
          CREATE TYPE message_type AS ENUM ('text', 'system');
      EXCEPTION
          WHEN duplicate_object THEN null;
      END $$;

      CREATE TABLE IF NOT EXISTS chat_messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          sender_id UUID NOT NULL REFERENCES users(id),
          conversation_id VARCHAR(100) NOT NULL,
          content TEXT NOT NULL,
          message_type message_type DEFAULT 'text',
          read_by UUID[] DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS portfolio_positions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          owner_id UUID NOT NULL REFERENCES users(id),
          symbol VARCHAR(20) NOT NULL,
          quantity INTEGER NOT NULL CHECK(quantity > 0),
          buy_price NUMERIC(10,2) NOT NULL,
          buy_date DATE NOT NULL DEFAULT CURRENT_DATE,
          notes TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    await db.query(sql);
    
    console.log('✅ Advanced feature tables created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating advanced tables:', error);
    process.exit(1);
  }
};

createAdvancedTables();