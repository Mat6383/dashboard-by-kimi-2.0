/**
 * ================================================
 * PDF SERVICE — Génération de PDF via Puppeteer
 * ================================================
 */

const puppeteer = require('puppeteer');
const logger = require('./logger.service');

class PdfService {
  constructor() {
    this.browser = null;
  }

  async _getBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });
    }
    return this.browser;
  }

  /**
   * Génère un PDF à partir d'une chaîne HTML
   * @param {string} html — Contenu HTML complet
   * @param {object} options — { format: 'A4'|'A4-Landscape', margin }
   * @returns {Buffer} PDF
   */
  async generateFromHTML(html, options = {}) {
    const browser = await this._getBrowser();
    const page = await browser.newPage();

    try {
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: options.format === 'A4-Landscape' ? 'A4' : 'A4',
        landscape: options.format === 'A4-Landscape',
        printBackground: true,
        margin: options.margin || { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
        displayHeaderFooter: true,
        headerTemplate: `
          <div style="font-size:10px;width:100%;padding:10px 20px;display:flex;justify-content:space-between;color:#666;font-family:system-ui,sans-serif;">
            <span>QA Dashboard — Neo-Logix</span>
            <span class="date"></span>
          </div>
        `,
        footerTemplate: `
          <div style="font-size:10px;width:100%;padding:10px 20px;display:flex;justify-content:space-between;color:#666;font-family:system-ui,sans-serif;">
            <span>ISTQB Compliant | LEAN Optimized | ITIL SLA Monitoring</span>
            <span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span>
          </div>
        `,
      });

      logger.info('[PdfService] PDF généré');
      return pdfBuffer;
    } finally {
      await page.close();
    }
  }

  /**
   * Génère un PDF de dashboard à partir des métriques
   */
  async generateDashboardPDF(metrics, options = {}) {
    const html = this._buildDashboardHTML(metrics, options);
    return this.generateFromHTML(html, options);
  }

  _buildDashboardHTML(metrics, options = {}) {
    const isDark = options.darkMode;
    const bg = isDark ? '#0f172a' : '#ffffff';
    const text = isDark ? '#f1f5f9' : '#1f2937';
    const cardBg = isDark ? '#1e293b' : '#f9fafb';
    const border = isDark ? '#334155' : '#e5e7eb';

    const metricsCards = [
      { label: 'Taux de réussite', value: `${metrics?.passRate ?? '-'}%`, color: '#10B981' },
      { label: 'Taux de complétion', value: `${metrics?.completionRate ?? '-'}%`, color: '#3B82F6' },
      { label: 'Taux de blocage', value: `${metrics?.blockedRate ?? '-'}%`, color: '#F59E0B' },
      { label: 'Escape Rate', value: `${metrics?.escapeRate ?? '-'}%`, color: '#EF4444' },
      { label: 'Detection Rate', value: `${metrics?.detectionRate ?? '-'}%`, color: '#8B5CF6' },
    ]
      .map(
        (m) => `
      <div style="background:${cardBg};border:1px solid ${border};border-radius:8px;padding:16px;text-align:center;flex:1;min-width:140px;">
        <div style="font-size:1.75rem;font-weight:700;color:${m.color};">${m.value}</div>
        <div style="font-size:0.875rem;color:${text};margin-top:4px;opacity:0.8;">${m.label}</div>
      </div>`
      )
      .join('');

    const sla = metrics?.slaStatus;
    const slaHtml = sla?.ok
      ? `<div style="background:#10B98115;color:#10B981;padding:12px 16px;border-radius:6px;border:1px solid #10B98140;font-weight:500;">✅ Tous les SLA sont respectés</div>`
      : `<div style="background:#EF444415;color:#EF4444;padding:12px 16px;border-radius:6px;border:1px solid #EF444440;font-weight:500;">
          ⚠️ Alertes SLA : ${(sla?.alerts || []).map((a) => `${a.metric} (${a.value}% / seuil ${a.threshold}%)`).join(', ')}
         </div>`;

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Rapport QA Dashboard</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, -apple-system, sans-serif; background: ${bg}; color: ${text}; padding: 24px; }
    h1 { font-size: 1.5rem; margin: 0 0 8px; }
    .subtitle { opacity: 0.7; font-size: 0.875rem; margin-bottom: 24px; }
    .grid { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; }
  </style>
</head>
<body>
  <h1>📊 Rapport de qualité — ${metrics?.projectName || 'Projet'}</h1>
  <div class="subtitle">Généré le ${new Date().toLocaleString('fr-FR')}</div>
  ${slaHtml}
  <div style="margin-top:24px;">
    <h2 style="font-size:1.125rem;margin-bottom:12px;">Métriques ISTQB</h2>
    <div class="grid">${metricsCards}</div>
  </div>
  ${
    metrics?.runs?.length
      ? `
  <div style="margin-top:24px;">
    <h2 style="font-size:1.125rem;margin-bottom:12px;">Runs actifs (${metrics.runs.length})</h2>
    <table style="width:100%;border-collapse:collapse;font-size:0.875rem;">
      <thead><tr style="background:${cardBg};border-bottom:2px solid ${border};">
        <th style="text-align:left;padding:8px;">Run</th>
        <th style="text-align:left;padding:8px;">Statut</th>
        <th style="text-align:right;padding:8px;">Tests</th>
        <th style="text-align:right;padding:8px;">Passés</th>
        <th style="text-align:right;padding:8px;">Échoués</th>
      </tr></thead>
      <tbody>
        ${metrics.runs
          .map(
            (r) => `
        <tr style="border-bottom:1px solid ${border};">
          <td style="padding:8px;">${r.name}</td>
          <td style="padding:8px;">${r.status}</td>
          <td style="padding:8px;text-align:right;">${r.total}</td>
          <td style="padding:8px;text-align:right;color:#10B981;">${r.passed}</td>
          <td style="padding:8px;text-align:right;color:#EF4444;">${r.failed}</td>
        </tr>`
          )
          .join('')}
      </tbody>
    </table>
  </div>`
      : ''
  }
</body>
</html>`;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

module.exports = new PdfService();
