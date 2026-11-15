import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';
import { createInitialSeedData } from './seedData.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const LOCAL_DB_FILE = path.join(DATA_DIR, 'inventory.local.json');

let pool = null;
let storageMode = 'local-json';

export async function initDb() {
  if (process.env.DATABASE_URL) {
    try {
      pool = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL.includes('localhost')
          ? false
          : { rejectUnauthorized: false }
      });

      await pool.query(`
        CREATE TABLE IF NOT EXISTS shop3_store (
          id TEXT PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      const res = await pool.query(`SELECT data FROM shop3_store WHERE id = 'main'`);
      if (res.rowCount === 0) {
        const seed = createInitialSeedData();
        await pool.query(
          `INSERT INTO shop3_store (id, data, updated_at) VALUES ('main', $1, NOW())`,
          [JSON.stringify(seed)]
        );
      }
      storageMode = 'postgresql';
      console.log('✅ Connected to PostgreSQL database (Railway / Cloud mode)');
      return;
    } catch (err) {
      console.warn('⚠️ PostgreSQL connection failed, falling back to local file storage:', err.message);
      pool = null;
    }
  }

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(LOCAL_DB_FILE)) {
    const seed = createInitialSeedData();
    fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(seed, null, 2), 'utf8');
  }
  storageMode = 'local-json';
  console.log(`✅ Using local persistent storage at ${LOCAL_DB_FILE}`);
}

export function getStorageMode() {
  return storageMode;
}

export async function readStore() {
  if (pool && storageMode === 'postgresql') {
    const res = await pool.query(`SELECT data FROM shop3_store WHERE id = 'main'`);
    if (res.rowCount > 0) {
      return res.rows[0].data;
    }
    const seed = createInitialSeedData();
    await writeStore(seed);
    return seed;
  }

  if (!fs.existsSync(LOCAL_DB_FILE)) {
    const seed = createInitialSeedData();
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(seed, null, 2), 'utf8');
    return seed;
  }

  const raw = fs.readFileSync(LOCAL_DB_FILE, 'utf8');
  return JSON.parse(raw);
}

export async function writeStore(data) {
  if (pool && storageMode === 'postgresql') {
    await pool.query(
      `INSERT INTO shop3_store (id, data, updated_at)
       VALUES ('main', $1, NOW())
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [JSON.stringify(data)]
    );
    return data;
  }

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  return data;
}

