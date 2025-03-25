
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

// PostgreSQL connection configuration
const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Read and execute SQL files
const runSqlFile = async (filePath) => {
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    await client.query('BEGIN');  // Start a transaction

    try {
      const result = await client.query(sql);  // Execute the SQL file
      console.log(`✅ Successfully executed: ${path.basename(filePath)}`);

      // Log result information
      console.log(`📝 Command Output from ${path.basename(filePath)}:`);

      await client.query('COMMIT');  // Commit transaction
    } catch (error) {
      await client.query('ROLLBACK');  // Rollback transaction on error
      console.error(`❌ Failed to execute ${path.basename(filePath)}: ${error.message}`);
    }
    
  } catch (err) {
    console.error(`❌ Error reading file ${path.basename(filePath)}: ${err.message}`);
  }
};

// Run the migrations
const runMigrations = async () => {
  try {
    await client.connect();
    console.log('🚀 Connected to PostgreSQL');

    // Run schema and functions SQL files
    await runSqlFile(path.join(__dirname, 'schema.sql'));
    await runSqlFile(path.join(__dirname, 'functions.sql'));

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await client.end();
    console.log('🛑 Disconnected from PostgreSQL');
  }
};

runMigrations().catch(err => console.error('❌ Migration process failed:', err.message));

