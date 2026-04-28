/**
 * ================================================
 * SQLITE MIGRATION RUNNER
 * ================================================
 * Moteur de migrations minimaliste pour better-sqlite3.
 * Chaque namespace (sync-history, comments...) a son dossier de .sql.
 *
 * @example
 *   const migrate = require('./db/migrate');
 *   migrate.run(db, 'sync-history');
 */

const fs = require('fs');
const path = require('path');
const logger = require('../services/logger.service');

/**
 * Exécute les migrations manquantes pour un namespace donné.
 * @param {Database} db - Instance better-sqlite3
 * @param {string} namespace - Nom du dossier sous db/migrations/
 */
function run(db, namespace) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS __migrations (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      namespace     TEXT NOT NULL,
      filename      TEXT NOT NULL,
      executed_at   TEXT NOT NULL,
      UNIQUE(namespace, filename)
    )
  `);

  const migrationsDir = path.join(__dirname, 'migrations', namespace);
  if (!fs.existsSync(migrationsDir)) {
    logger.warn(`Migrations: dossier introuvable → ${migrationsDir}`);
    return;
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const checkStmt = db.prepare('SELECT 1 FROM __migrations WHERE namespace = ? AND filename = ?');
  const insertStmt = db.prepare('INSERT INTO __migrations (namespace, filename, executed_at) VALUES (?, ?, ?)');

  for (const file of files) {
    if (checkStmt.get(namespace, file)) continue;

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    db.exec(sql);
    insertStmt.run(namespace, file, new Date().toISOString());
    logger.info(`Migration appliquée [${namespace}] → ${file}`);
  }
}

module.exports = { run };
