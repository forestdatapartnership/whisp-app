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
    
    try {
      const result = await client.query(sql);  // Execute the SQL file
      console.log(`✅ Successfully executed: ${path.basename(filePath)}`);
      console.log(`📝 Command Output from ${path.basename(filePath)}:`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to execute ${path.basename(filePath)}: ${error.message}`);
      return false;
    }
    
  } catch (err) {
    console.error(`❌ Error reading file ${path.basename(filePath)}: ${err.message}`);
    return false;
  }
};

// Run the migrations
const runMigrations = async () => {
  try {
    await client.connect();
    console.log('🚀 Connected to PostgreSQL');

    // Run schema first and ensure it succeeds before running functions
    const schemaSuccess = await runSqlFile(path.join(__dirname, 'schema.sql'));
    
    if (schemaSuccess) {
      await runSqlFile(path.join(__dirname, 'functions.sql'));
    } else {
      console.error('❌ Schema setup failed. Skipping functions setup.');
    }

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await client.end();
    console.log('🛑 Disconnected from PostgreSQL');
  }
};

runMigrations().catch(err => console.error('❌ Migration process failed:', err.message));

