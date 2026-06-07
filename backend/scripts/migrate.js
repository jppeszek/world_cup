import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectionString = process.env.DATABASE_URL || 'postgresql://localhost/world_cup';

console.log('Connecting to:', connectionString);

const pool = new pg.Pool({
  connectionString: connectionString,
});

async function runMigrations() {
  const client = await pool.connect();
  try {
    const migrationFile = path.join(process.cwd(), 'migrations', '001_init_schema.sql');
    const sql = fs.readFileSync(migrationFile, 'utf-8');

    console.log('Running migrations...');
    await client.query(sql);
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    await client.release();
    await pool.end();
  }
}

runMigrations();
