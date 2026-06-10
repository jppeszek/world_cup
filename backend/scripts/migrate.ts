import { readFileSync } from 'fs';
import { resolve } from 'path';
import { getClient } from '../src/db.ts';

async function migrate() {
  const client = await getClient();
  try {
    console.log('Running migrations...');
    const sql = readFileSync(resolve('migrations/001_init_schema.sql'), 'utf-8');
    await client.query(sql);
    console.log('✅ Migrations completed');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

migrate().then(() => process.exit(0)).catch(() => process.exit(1));
