const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
const { Client } = require('pg');

class MigrationRunner {
    constructor() {
        const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
        
        for (const envVar of requiredEnvVars) {
            if (!process.env[envVar]) {
                throw new Error(`Required environment variable ${envVar} is not set`);
            }
        }
        
        this.config = {
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT),
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            migrationTable: 'migration_history',
            migrationDir: 'migrations'
        };
        this.client = null;
    }

    async connect() {
        this.client = new Client(this.config);
        await this.client.connect();
        console.log('Connected to database:', this.config.database);
    }

    async disconnect() {
        if (this.client) {
            await this.client.end();
        }
    }

    async ensureMigrationTable() {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS ${this.config.migrationTable} (
                id SERIAL PRIMARY KEY,
                script_name VARCHAR(1000) NOT NULL UNIQUE,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                success BOOLEAN DEFAULT TRUE
            );
        `;
        await this.client.query(createTableQuery);
    }

    async getAllMigrationFiles() {
        const migrations = [];
        const migrationDir = path.join(__dirname, this.config.migrationDir);

        const scanDirectory = (dir, relativePath = '') => {
            const items = fs.readdirSync(dir).sort();
            
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const relativeItemPath = path.join(relativePath, item);
                
                if (fs.statSync(fullPath).isDirectory()) {
                    scanDirectory(fullPath, relativeItemPath);
                } else if (item.endsWith('.sql')) {
                    migrations.push({
                        scriptName: relativeItemPath,
                        fullPath: fullPath,
                        content: fs.readFileSync(fullPath, 'utf8')
                    });
                }
            }
        };

        scanDirectory(migrationDir);
        return migrations.sort((a, b) => a.scriptName.localeCompare(b.scriptName));
    }

    async getExecutedMigrations() {
        const result = await this.client.query(
            `SELECT script_name FROM ${this.config.migrationTable} WHERE success = true`
        );
        return new Set(result.rows.map(row => row.script_name));
    }

    async executeMigration(migration) {
        try {
            await this.client.query('BEGIN');
            await this.client.query(migration.content);
            
            await this.client.query(
                `INSERT INTO ${this.config.migrationTable} (script_name, success) VALUES ($1, $2)
                 ON CONFLICT (script_name) DO UPDATE SET success = EXCLUDED.success, executed_at = CURRENT_TIMESTAMP`,
                [migration.scriptName, true]
            );
            
            await this.client.query('COMMIT');
            console.log(`Executed: ${migration.scriptName}`);
            
        } catch (error) {
            await this.client.query('ROLLBACK');
            
            try {
                await this.client.query(
                    `INSERT INTO ${this.config.migrationTable} (script_name, success) VALUES ($1, $2)
                     ON CONFLICT (script_name) DO UPDATE SET success = EXCLUDED.success, executed_at = CURRENT_TIMESTAMP`,
                    [migration.scriptName, false]
                );
            } catch {}
            
            throw new Error(`Migration ${migration.scriptName} failed: ${error.message}`);
        }
    }

    async run() {
        try {
            await this.connect();
            await this.ensureMigrationTable();
            
            const allMigrations = await this.getAllMigrationFiles();
            const executedMigrations = await this.getExecutedMigrations();
            const pendingMigrations = allMigrations.filter(m => !executedMigrations.has(m.scriptName));
            
            if (pendingMigrations.length === 0) {
                console.log('No pending migrations');
                return;
            }
            
            for (const migration of pendingMigrations) {
                await this.executeMigration(migration);
            }
            
            console.log(`Executed ${pendingMigrations.length} migrations`);
            
        } finally {
            await this.disconnect();
        }
    }

    async status() {
        try {
            await this.connect();
            await this.ensureMigrationTable();
            
            const allMigrations = await this.getAllMigrationFiles();
            const executedMigrations = await this.getExecutedMigrations();
            const pendingMigrations = allMigrations.filter(m => !executedMigrations.has(m.scriptName));
            console.log('Migration status:');
            console.log(`Total: ${allMigrations.length}, Executed: ${executedMigrations.size}, Pending: ${pendingMigrations.length}`);
            
            if (pendingMigrations.length > 0) {
                console.log('Pending:');
                pendingMigrations.forEach(m => console.log(`  ${m.scriptName}`));
            }
            
        } finally {
            await this.disconnect();
        }
    }
}

async function main() {
    const command = process.argv[2] || 'migrate';
    const runner = new MigrationRunner();
    
    try {
        if (command === 'status') {
            await runner.status();
        } else {
            await runner.run();
        }
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = MigrationRunner; 