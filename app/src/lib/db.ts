import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'bingo.sqlite');
const db = new Database(dbPath);

// Initialize DB schema
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT DEFAULT 'user'
    );
    CREATE TABLE IF NOT EXISTS uploads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        item_index INTEGER,
        photo_url TEXT,
        score_awarded INTEGER,
        options TEXT DEFAULT '[]',
        status TEXT DEFAULT 'approved',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, item_index)
    );
`);

// Insert default users if not exists
const stmt = db.prepare('SELECT count(*) as count FROM users');
const { count } = stmt.get() as { count: number };
if (count === 0) {
    const insert = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)');
    insert.run('admin', 'admin1234', 'admin');
    for (let i = 1; i <= 20; i++) {
        insert.run(`team${i}`, `1234`, 'user');
    }
}

export default db;
