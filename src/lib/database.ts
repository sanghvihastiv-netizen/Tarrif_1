import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

function createDatabase() {
  const dbDir = path.join(process.cwd(), 'data');
  fs.mkdirSync(dbDir, { recursive: true });

  const dbPath = path.join(dbDir, 'tariff-wars.db');
  const db = new Database(dbPath);

  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      key TEXT NOT NULL,
      value TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, key)
    );

    CREATE TABLE IF NOT EXISTS tax_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      country TEXT NOT NULL,
      hs_code TEXT NOT NULL,
      tax_type TEXT NOT NULL,
      rate REAL NOT NULL,
      rule_name TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'manual',
      version TEXT NOT NULL DEFAULT 'v1',
      effective_from DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(country, hs_code, tax_type, source, version)
    );

    CREATE TABLE IF NOT EXISTS saved_calculations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      input_json TEXT NOT NULL,
      tax_breakdown_json TEXT NOT NULL,
      subtotal REAL NOT NULL,
      total_amount REAL NOT NULL,
      tax_rule_version TEXT NOT NULL,
      tax_source TEXT NOT NULL,
      dedupe_key TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_preferences_user_id ON preferences(user_id);
    CREATE INDEX IF NOT EXISTS idx_tax_rules_country_hscode ON tax_rules(country, hs_code);
    CREATE INDEX IF NOT EXISTS idx_saved_calculations_user_id ON saved_calculations(user_id);
  `);

  return db;
}

export const db = createDatabase();