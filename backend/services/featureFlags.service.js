/**
 * ================================================
 * FEATURE FLAGS SERVICE
 * ================================================
 * Gestion des feature flags via SQLite (table feature_flags).
 * Permet d'activer/désactiver des fonctionnalités sans redémarrage.
 */

const syncHistoryService = require('./syncHistory.service');
const logger = require('./logger.service');

class FeatureFlagsService {
  _db() {
    if (!syncHistoryService._initialized) syncHistoryService.initDb();
    return syncHistoryService.db;
  }

  /**
   * Retourne tous les flags sous forme d'objet { [key]: boolean }.
   */
  getAll() {
    const db = this._db();
    if (!db) return {};
    try {
      const rows = db.prepare('SELECT key, enabled FROM feature_flags').all();
      const result = {};
      for (const row of rows) result[row.key] = Boolean(row.enabled);
      return result;
    } catch (err) {
      logger.error('FeatureFlags: getAll error', err.message);
      return {};
    }
  }

  /**
   * Retourne l'état d'un flag spécifique.
   * @param {string} key
   * @param {boolean} defaultValue
   */
  isEnabled(key, defaultValue = false) {
    const db = this._db();
    if (!db) return defaultValue;
    try {
      const row = db.prepare('SELECT enabled FROM feature_flags WHERE key = ?').get(key);
      return row ? Boolean(row.enabled) : defaultValue;
    } catch (err) {
      logger.error(`FeatureFlags: isEnabled(${key}) error`, err.message);
      return defaultValue;
    }
  }

  /**
   * Active ou désactive un flag.
   * @param {string} key
   * @param {boolean} enabled
   */
  set(key, enabled) {
    const db = this._db();
    if (!db) return false;
    try {
      db.prepare(`
        INSERT INTO feature_flags (key, enabled, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET
          enabled = excluded.enabled,
          updated_at = excluded.updated_at
      `).run(key, enabled ? 1 : 0, new Date().toISOString());
      logger.info(`FeatureFlags: ${key} → ${enabled}`);
      return true;
    } catch (err) {
      logger.error(`FeatureFlags: set(${key}) error`, err.message);
      return false;
    }
  }
}

module.exports = new FeatureFlagsService();
