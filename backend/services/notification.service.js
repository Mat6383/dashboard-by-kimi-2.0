/**
 * ================================================
 * NOTIFICATION SERVICE — Orchestration email + webhook
 * ================================================
 * Étend alert.service.js avec :
 *   - Configuration par projet (DB)
 *   - Emails SLA
 *   - Rate-limiting (pas de spam)
 *   - Templates riches Slack/Teams
 */

const emailService = require('./email.service');
const alertService = require('./alert.service');
const logger = require('./logger.service');
const Database = require('better-sqlite3');
const path = require('path');
const { run: runMigrations } = require('../db/migrate');

const DB_PATH = path.join(__dirname, '../db/sync-history.db');
const RATE_LIMIT_MS = 15 * 60 * 1000; // 15 minutes

class NotificationService {
  constructor() {
    this.db = null;
    this._init();
  }

  _init() {
    this.db = new Database(DB_PATH);
    this.db.pragma('journal_mode = WAL');
    runMigrations(this.db, 'sync-history');
  }

  /**
   * Dispatch une alerte SLA vers tous les canaux configurés
   */
  async dispatch(projectId, alerts) {
    if (!alerts || alerts.length === 0) return;

    const settings = this.getSettings(projectId);
    const defaultSettings = this.getSettings(null); // global fallback
    const merged = this._mergeSettings(settings, defaultSettings);

    if (!merged) {
      // Fallback sur l'alert.service legacy (webhooks env vars)
      return alertService.sendSLAAlert(projectId, alerts);
    }

    // Rate-limiting par projet
    if (this._isRateLimited(projectId)) {
      logger.info(`[NotificationService] Rate-limit actif pour projet ${projectId} — alerte ignorée`);
      return;
    }

    const promises = [];

    if (merged.enabled_sla_email && merged.email) {
      promises.push(
        emailService
          .sendSLAAlert({
            to: merged.email,
            projectId,
            alerts,
            dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/?project=${projectId}`,
          })
          .then((r) => {
            if (r.sent) this._logAlert(projectId, 'email');
          })
      );
    }

    if (merged.enabled_sla_slack && merged.slack_webhook) {
      promises.push(
        alertService
          ._sendSlack(alertService._formatSlackMessage(projectId, alerts), merged.slack_webhook)
          .then(() => this._logAlert(projectId, 'slack'))
      );
    }

    if (merged.enabled_sla_teams && merged.teams_webhook) {
      promises.push(
        alertService
          ._sendTeams(alertService._formatTeamsCard(projectId, alerts), merged.teams_webhook)
          .then(() => this._logAlert(projectId, 'teams'))
      );
    }

    // Si aucun canal configuré en DB, fallback legacy
    if (promises.length === 0) {
      return alertService.sendSLAAlert(projectId, alerts);
    }

    await Promise.all(promises);
  }

  getSettings(projectId) {
    if (projectId === null || projectId === undefined) {
      const stmt = this.db.prepare('SELECT * FROM notification_settings WHERE project_id IS NULL');
      return stmt.get() || null;
    }
    const stmt = this.db.prepare('SELECT * FROM notification_settings WHERE project_id = ?');
    return stmt.get(projectId) || null;
  }

  upsertSettings({ projectId, email, slackWebhook, teamsWebhook, enabledSlaEmail, enabledSlaSlack, enabledSlaTeams }) {
    const existing = this.getSettings(projectId || null);
    if (existing) {
      this.db
        .prepare(
          `
        UPDATE notification_settings SET
          email = ?,
          slack_webhook = ?,
          teams_webhook = ?,
          enabled_sla_email = ?,
          enabled_sla_slack = ?,
          enabled_sla_teams = ?,
          updated_at = datetime('now')
        WHERE project_id = ?
      `
        )
        .run(
          email || null,
          slackWebhook || null,
          teamsWebhook || null,
          enabledSlaEmail ? 1 : 0,
          enabledSlaSlack ? 1 : 0,
          enabledSlaTeams ? 1 : 0,
          projectId || null
        );
    } else {
      this.db
        .prepare(
          `
        INSERT INTO notification_settings (project_id, email, slack_webhook, teams_webhook, enabled_sla_email, enabled_sla_slack, enabled_sla_teams, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `
        )
        .run(
          projectId || null,
          email || null,
          slackWebhook || null,
          teamsWebhook || null,
          enabledSlaEmail ? 1 : 0,
          enabledSlaSlack ? 1 : 0,
          enabledSlaTeams ? 1 : 0
        );
    }
    return this.getSettings(projectId || null);
  }

  async testWebhook(channel, url) {
    if (channel === 'slack') {
      await alertService._sendSlack('✅ Test de connexion — QA Dashboard Slack', url);
      return { ok: true };
    }
    if (channel === 'teams') {
      await alertService._sendTeams(
        {
          '@type': 'MessageCard',
          '@context': 'https://schema.org/extensions',
          themeColor: '10B981',
          summary: 'Test QA Dashboard',
          sections: [{ activityTitle: '✅ Test de connexion — QA Dashboard Teams' }],
        },
        url
      );
      return { ok: true };
    }
    return { ok: false, error: 'Canal inconnu' };
  }

  _mergeSettings(specific, fallback) {
    if (specific) return specific;
    if (fallback) return fallback;
    return null;
  }

  _isRateLimited(projectId) {
    const row = this.db
      .prepare(
        "SELECT COUNT(*) as count FROM alert_log WHERE project_id = ? AND sent_at > datetime('now', '-15 minutes')"
      )
      .get(projectId);
    return (row?.count || 0) > 0;
  }

  _logAlert(projectId, channel) {
    this.db.prepare('INSERT INTO alert_log (project_id, channel) VALUES (?, ?)').run(projectId, channel);
  }
}

module.exports = new NotificationService();
