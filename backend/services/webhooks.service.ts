import crypto from 'crypto';
import axios from 'axios';
import syncHistoryService from './syncHistory.service';
import logger from './logger.service';

class WebhooksService {
  _db() {
    if (!syncHistoryService._initialized) syncHistoryService.initDb();
    return syncHistoryService.db;
  }

  /**
   * Crée une subscription webhook.
   * @param {string} url
   * @param {string[]} events
   * @param {string} secret
   */
  create(url: any, events: any, secret: any) {
    const db = this._db();
    if (!db) return null;
    try {
      const now = new Date().toISOString();
      const result = db
        .prepare(
          `INSERT INTO webhook_subscriptions (url, events, secret, enabled, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
        .run(url, JSON.stringify(events), secret, 1, now, now);
      logger.info(`Webhooks: subscription créée #${result.lastInsertRowid} → ${url}`);
      return this.getById(result.lastInsertRowid);
    } catch (err: any) {
      logger.error('Webhooks: create error', err.message);
      return null;
    }
  }

  /**
   * Liste toutes les subscriptions.
   */
  getAll() {
    const db = this._db();
    if (!db) return [];
    try {
      const rows = db
        .prepare('SELECT id, url, events, enabled, created_at, updated_at FROM webhook_subscriptions ORDER BY id DESC')
        .all();
      return rows.map((r: any) => ({
        id: r.id,
        url: r.url,
        events: JSON.parse(r.events),
        enabled: Boolean(r.enabled),
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));
    } catch (err: any) {
      logger.error('Webhooks: getAll error', err.message);
      return [];
    }
  }

  /**
   * Retourne une subscription par ID.
   * @param {number} id
   */
  getById(id: any) {
    const db = this._db();
    if (!db) return null;
    try {
      const row = db
        .prepare('SELECT id, url, events, enabled, created_at, updated_at FROM webhook_subscriptions WHERE id = ?')
        .get(id);
      if (!row) return null;
      return {
        id: row.id,
        url: row.url,
        events: JSON.parse(row.events),
        enabled: Boolean(row.enabled),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch (err: any) {
      logger.error(`Webhooks: getById(${id}) error`, err.message);
      return null;
    }
  }

  /**
   * Met à jour une subscription.
   * @param {number} id
   * @param {Object} patch
   */
  update(id: any, { url, events, secret, enabled }: any) {
    const db = this._db();
    if (!db) return false;
    try {
      const sets = ['updated_at = ?'];
      const values: any[] = [new Date().toISOString()];

      if (typeof url === 'string') {
        sets.push('url = ?');
        values.push(url);
      }
      if (Array.isArray(events)) {
        sets.push('events = ?');
        values.push(JSON.stringify(events));
      }
      if (typeof secret === 'string') {
        sets.push('secret = ?');
        values.push(secret);
      }
      if (typeof enabled === 'boolean') {
        sets.push('enabled = ?');
        values.push(enabled ? 1 : 0);
      }

      values.push(id);
      const result = db.prepare(`UPDATE webhook_subscriptions SET ${sets.join(', ')} WHERE id = ?`).run(...values);
      return result.changes > 0;
    } catch (err: any) {
      logger.error(`Webhooks: update(${id}) error`, err.message);
      return false;
    }
  }

  /**
   * Supprime une subscription.
   * @param {number} id
   */
  delete(id: any) {
    const db = this._db();
    if (!db) return false;
    try {
      const result = db.prepare('DELETE FROM webhook_subscriptions WHERE id = ?').run(id);
      return result.changes > 0;
    } catch (err: any) {
      logger.error(`Webhooks: delete(${id}) error`, err.message);
      return false;
    }
  }

  /**
   * Déclenche un event vers toutes les subscriptions actives qui l'écoutent.
   * Fire-and-forget : n'attend pas les réponses et ne bloque pas le caller.
   * @param {string} event - ex: "feature-flag.changed"
   * @param {Object} payload
   */
  trigger(event: any, payload: any) {
    const subs = this.getAll().filter((s: any) => s.enabled && s.events.includes(event));
    if (subs.length === 0) return;

    for (const sub of subs) {
      this._send(sub, event, payload).catch(() => {
        // erreur déjà loggée dans _send
      });
    }
  }

  async _send(sub: any, event: any, payload: any) {
    const body = {
      event,
      timestamp: new Date().toISOString(),
      payload,
    };

    const signature = crypto.createHmac('sha256', sub.secret).update(JSON.stringify(body)).digest('hex');

    try {
      await axios.post(sub.url, body, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': `sha256=${signature}`,
          'X-Webhook-Event': event,
        },
        timeout: 10000,
        validateStatus: () => true, // on logue même les 4xx/5xx sans throw
      });
      logger.info(`Webhooks: event "${event}" envoyé à ${sub.url}`);
    } catch (err: any) {
      logger.error(`Webhooks: échec envoi à ${sub.url}`, err.message);
    }
  }
}

export default new WebhooksService();
module.exports = exports.default;
