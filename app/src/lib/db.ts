import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'bingo.sqlite');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}
const db = new Database(dbPath);

const defaultTeamCredentials = [
    ['team1', '483271'],
    ['team2', '915604'],
    ['team3', '260843'],
    ['team4', '774129'],
    ['team5', '538916'],
    ['team6', '142785'],
    ['team7', '689352'],
    ['team8', '327418'],
    ['team9', '851960'],
    ['team10', '406237'],
] as const;

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
    CREATE TABLE IF NOT EXISTS deletion_notices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        item_index INTEGER NOT NULL,
        option_id TEXT,
        reason TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        read_at DATETIME
    );
`);

// Insert default users if not exists
const stmt = db.prepare('SELECT count(*) as count FROM users');
const { count } = stmt.get() as { count: number };
if (count === 0) {
    const insert = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)');
    insert.run('admin', 'admin1234', 'admin');
    for (const [username, password] of defaultTeamCredentials) {
        insert.run(username, password, 'user');
    }
}

export default db;
