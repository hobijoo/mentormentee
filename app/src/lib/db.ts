import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'bingo.sqlite');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}
const db = new Database(dbPath);

const adminCredential = ['admin', '82376491'] as const;
const defaultTeamCredentials = [
    ['team1', '584271'],
    ['team2', '190643'],
    ['team3', '726518'],
    ['team4', '438295'],
    ['team5', '861402'],
    ['team6', '247936'],
    ['team7', '915824'],
    ['team8', '370561'],
    ['team9', '648173'],
    ['team10', '502794'],
] as const;
const credentialSeedVersion = '2026-03-17-randomized';
const seededUsers = [
    { username: adminCredential[0], password: adminCredential[1], role: 'admin' },
    ...defaultTeamCredentials.map(([username, password]) => ({ username, password, role: 'user' as const }))
];

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
    CREATE TABLE IF NOT EXISTS app_meta (
        key TEXT PRIMARY KEY,
        value TEXT
    );
`);

const getMeta = db.prepare('SELECT value FROM app_meta WHERE key = ?');
const setMeta = db.prepare(`
    INSERT INTO app_meta (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
`);
const upsertUser = db.prepare(`
    INSERT INTO users (username, password, role) VALUES (@username, @password, @role)
    ON CONFLICT(username) DO UPDATE SET
        password = excluded.password,
        role = excluded.role
`);

// Apply seeded credentials once so existing HAOS data is migrated with the new random passwords.
const currentCredentialSeed = getMeta.get('credential_seed_version') as { value: string } | undefined;
if (currentCredentialSeed?.value !== credentialSeedVersion) {
    const seedUsers = db.transaction(() => {
        for (const user of seededUsers) {
            upsertUser.run(user);
        }
        setMeta.run('credential_seed_version', credentialSeedVersion);
    });
    seedUsers();
}

export default db;
