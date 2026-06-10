import { readFileSync } from 'fs';
import { resolve } from 'path';
import { query } from '../src/db.ts';

async function migrate() {
  try {
    console.log('Running migrations...');
    const sql = readFileSync(resolve('migrations/001_init_schema.sql'), 'utf-8');
    await query(sql);
    console.log('✅ Migrations completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
