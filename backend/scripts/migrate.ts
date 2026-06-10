import { readFileSync } from 'fs';
import { resolve } from 'path';
import pool from '../src/db.ts';

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Running migrations...');
    const sql = readFileSync(resolve('migrations/001_init_schema.sql'), 'utf-8');
    await client.query(sql);
    console.log('✅ Migrations completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

migrate();
