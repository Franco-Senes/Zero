const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'zero.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`
           CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                username TEXT,
                password_hash TEXT NOT NULL,
                avatar_url TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
           )
     `);

    db.run(`
        CREATE TABLE IF NOT EXISTS oauth_apps (
            client_id TEXT PRIMARY KEY,
            client_secret TEXT NOT NULL,
            name TEXT NOT NULL,
            redirect_uri TEXT NOT NULL,
            owner_id INTEGER NOT NULL,
            FOREIGN KEY (owner_id) REFERENCES users(id)
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS oauth_codes (
            code TEXT PRIMARY KEY,
            client_id TEXT NOT NULL,
            user_id INTEGER NOT NULL,
            expires_at INTEGER NOT NULL,
            FOREIGN KEY (client_id) REFERENCES oauth_apps(client_id)
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS user_authorizations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            client_id TEXT NOT NULL,
            authorized_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, client_id),
            FOREIGN KEY (user_id) REFERENCES users(id)
            FOREIGN KEY (client_id) REFERENCES oauth_apps(client_id) ON DELETE CASCADE
        )
    `)

    db.run("ALTER TABLE users ADD COLUMN two_factor_enabled INTEGER DEFAULT 0", (err) => {
        console.log("ignored colum exists")
    });
    db.run("ALTER TABLE users ADD COLUMN two_factor_secret TEXT", (err) => {
        console.log("ignored colum exists")
    });
    db.run("ALTER TABLE users ADD COLUMN two_factor_login_required INTEGER DEFAULT 1", (err) => {
        console.log("ignored colum exists")
    });
});

const run = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, changes: this.changes });
        });
    });
};

const get = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

const all = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

module.exports = {
    db,
    run,
    get,
    all
}