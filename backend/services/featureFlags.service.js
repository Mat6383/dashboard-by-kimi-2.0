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
   * Format rétrocompatible pour les consumers.
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
   * Retourne tous les flags avec leurs métadonnées complètes.
   * @returns {Array<{key, enabled, description, rolloutPercentage, updatedAt, createdAt}>}
   */
  getAllDetails() {
    const db = this._db();
    if (!db) return [];
    try {
      const rows = db
        .prepare(
          'SELECT key, enabled, description, rollout_percentage, updated_at, created_at FROM feature_flags ORDER BY key'
        )
        .all();
      return rows.map((row) => ({
        key: row.key,
        enabled: Boolean(row.enabled),
        description: row.description || '',
        rolloutPercentage: row.rollout_percentage,
        updatedAt: row.updated_at,
        createdAt: row.created_at,
      }));
    } catch (err) {
      logger.error('FeatureFlags: getAllDetails error', err.message);
      return [];
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
   * Retourne le détail complet d'un flag.
   * @param {string} key
   * @returns {Object|null}
   */
  getByKey(key) {
    const db = this._db();
    if (!db) return null;
    try {
      const row = db
        .prepare(
          'SELECT key, enabled, description, rollout_percentage, updated_at, created_at FROM feature_flags WHERE key = ?'
        )
        .get(key);
      if (!row) return null;
      return {
        key: row.key,
        enabled: Boolean(row.enabled),
        description: row.description || '',
        rolloutPercentage: row.rollout_percentage,
        updatedAt: row.updated_at,
        createdAt: row.created_at,
      };
    } catch (err) {
      logger.error(`FeatureFlags: getByKey(${key}) error`, err.message);
      return null;
    }
  }

  /**
   * Crée un nouveau flag.
   * @param {string} key
   * @param {Object} options
   * @param {boolean} options.enabled
   * @param {string} [options.description]
   * @param {number} [options.rolloutPercentage]
   */
  create(key, { enabled = false, description = '', rolloutPercentage = 100 } = {}) {
    const db = this._db();
    if (!db) return false;
    try {
      const now = new Date().toISOString();
      db.prepare(
        `INSERT INTO feature_flags (key, enabled, description, rollout_percentage, updated_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(key, enabled ? 1 : 0, description, rolloutPercentage, now, now);
      logger.info(`FeatureFlags: created ${key} → enabled=${enabled}, rollout=${rolloutPercentage}%`);
      return true;
    } catch (err) {
      logger.error(`FeatureFlags: create(${key}) error`, err.message);
      return false;
    }
  }

  /**
   * Met à jour un flag existant.
   * @param {string} key
   * @param {Object} options
   * @param {boolean} [options.enabled]
   * @param {string} [options.description]
   * @param {number} [options.rolloutPercentage]
   */
  update(key, { enabled, description, rolloutPercentage } = {}) {
    const db = this._db();
    if (!db) return false;
    try {
      const existing = db.prepare('SELECT 1 FROM feature_flags WHERE key = ?').get(key);
      if (!existing) return false;

      const sets = ['updated_at = ?'];
      const values = [new Date().toISOString()];

      if (typeof enabled === 'boolean') {
        sets.push('enabled = ?');
        values.push(enabled ? 1 : 0);
      }
      if (typeof description === 'string') {
        sets.push('description = ?');
        values.push(description);
      }
      if (typeof rolloutPercentage === 'number') {
        sets.push('rollout_percentage = ?');
        values.push(rolloutPercentage);
      }

      values.push(key);
      db.prepare(`UPDATE feature_flags SET ${sets.join(', ')} WHERE key = ?`).run(...values);
      logger.info(`FeatureFlags: updated ${key}`);
      return true;
    } catch (err) {
      logger.error(`FeatureFlags: update(${key}) error`, err.message);
      return false;
    }
  }

  /**
   * Supprime un flag.
   * @param {string} key
   */
  delete(key) {
    const db = this._db();
    if (!db) return false;
    try {
      const result = db.prepare('DELETE FROM feature_flags WHERE key = ?').run(key);
      const success = result.changes > 0;
      if (success) logger.info(`FeatureFlags: deleted ${key}`);
      return success;
    } catch (err) {
      logger.error(`FeatureFlags: delete(${key}) error`, err.message);
      return false;
    }
  }

  /**
   * Active ou désactive un flag (shortcut rétrocompatible).
   * Fait un UPSERT pour garantir la rétrocompatibilité.
   * @param {string} key
   * @param {boolean} enabled
   */
  set(key, enabled) {
    const db = this._db();
    if (!db) return false;
    try {
      db.prepare(
        `
        INSERT INTO feature_flags (key, enabled, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET
          enabled = excluded.enabled,
          updated_at = excluded.updated_at
      `
      ).run(key, enabled ? 1 : 0, new Date().toISOString());
      logger.info(`FeatureFlags: ${key} → ${enabled}`);
      return true;
    } catch (err) {
      logger.error(`FeatureFlags: set(${key}) error`, err.message);
      return false;
    }
  }
}

module.exports = new FeatureFlagsService();
