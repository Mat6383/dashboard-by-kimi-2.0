import ExcelJS from 'exceljs';
import logger from './logger.service';

/**
 * Convertit un Array-of-Arrays en string CSV (RFC 4180).
 * @param {Array<Array>} aoa
 * @returns {string}
 */
function aoaToCsv(aoa: any) {
  return aoa
    .map((row: any) =>
      row
        .map((cell: any) => {
          const str = String(cell ?? '');
          if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    )
    .join('\n');
}

class ExportService {
  /**
   * Génère un buffer CSV à partir des métriques
   * @param {object} metrics — Résultat de testmoService.getProjectMetrics
   * @param {string} projectName — Nom du projet
   * @returns {Buffer}
   */
  generateCSV(metrics: any, projectName: any) {
    const lines = [];
    const m = metrics || {};
    const raw = m.raw || {};
    const itil = m.itil || {};
    const lean = m.lean || {};
    const istqb = m.istqb || {};

    // ── Section Métriques ──
    lines.push([
      'Projet',
      'ID Projet',
      'Taux de réussite (%)',
      'Taux de complétion (%)',
      'Taux de blocage (%)',
      'Escape Rate (%)',
      'Detection Rate (%)',
      "Taux d'échec (%)",
      'Efficacité des tests (%)',
      'Total tests',
      'Passés',
      'Échoués',
      'Bloqués',
      'Skipped',
      'WIP',
      'Non testés',
      'MTTR (h)',
      'Lead Time (h)',
      'Change Fail Rate (%)',
      'WIP Total',
      'Runs actifs',
      'Runs fermés',
      'Jalons complétés',
      'Jalons total',
      'Date génération',
    ]);

    lines.push([
      projectName || m.projectName || 'Projet',
      m.projectId ?? '',
      m.passRate ?? '',
      m.completionRate ?? '',
      m.blockedRate ?? '',
      m.escapeRate ?? '',
      m.detectionRate ?? '',
      m.failureRate ?? '',
      m.testEfficiency ?? '',
      raw.total ?? '',
      raw.passed ?? '',
      raw.failed ?? '',
      raw.blocked ?? '',
      raw.skipped ?? '',
      raw.wip ?? '',
      raw.untested ?? '',
      itil.mttr ?? '',
      itil.leadTime ?? '',
      itil.changeFailRate ?? '',
      lean.wipTotal ?? '',
      lean.activeRuns ?? '',
      lean.closedRuns ?? '',
      istqb.milestonesCompleted ?? '',
      istqb.milestonesTotal ?? '',
      new Date().toISOString(),
    ]);

    lines.push([]); // Ligne vide

    // ── Section Runs ──
    lines.push([
      'ID',
      'Nom',
      'Total',
      'Complétés',
      'Passés',
      'Échoués',
      'Bloqués',
      'WIP',
      'Non testés',
      'Taux complétion (%)',
      'Taux réussite (%)',
      'Exploratoire',
      'Fermé',
      'Date création',
    ]);

    const runs = Array.isArray(m.runs) ? m.runs : [];
    for (const r of runs) {
      lines.push([
        r.id ?? '',
        r.name ?? '',
        r.total ?? '',
        r.completed ?? '',
        r.passed ?? '',
        r.failed ?? '',
        r.blocked ?? '',
        r.wip ?? '',
        r.untested ?? '',
        r.completionRate ?? '',
        r.passRate ?? '',
        r.isExploratory ? 'Oui' : 'Non',
        r.isClosed ? 'Oui' : 'Non',
        r.created_at ?? '',
      ]);
    }

    // ── Section SLA ──
    lines.push([]);
    lines.push(['Statut SLA', m.slaStatus?.ok ? 'OK' : 'ALERTE']);
    if (m.slaStatus?.alerts?.length) {
      lines.push(['Métrique', 'Valeur (%)', 'Seuil (%)', 'Sévérité']);
      for (const a of m.slaStatus.alerts) {
        lines.push([a.metric ?? '', a.value ?? '', a.threshold ?? '', a.severity ?? '']);
      }
    }

    const csv = aoaToCsv(lines);
    logger.info('[ExportService] CSV généré');
    return Buffer.from(csv, 'utf-8');
  }

  /**
   * Génère un buffer Excel (.xlsx) à partir des métriques
   * @param {object} metrics — Résultat de testmoService.getProjectMetrics
   * @param {string} projectName — Nom du projet
   * @returns {Buffer}
   */
  async generateExcel(metrics: any, projectName: any) {
    const m = metrics || {};
    const raw = m.raw || {};
    const itil = m.itil || {};
    const lean = m.lean || {};
    const istqb = m.istqb || {};

    const workbook = new ExcelJS.Workbook();

    // ── Sheet Métriques ──
    const wsMetrics = workbook.addWorksheet('Métriques');
    wsMetrics.addRows([
      ['Propriété', 'Valeur'],
      ['Projet', projectName || m.projectName || 'Projet'],
      ['ID Projet', m.projectId ?? ''],
      ['Taux de réussite (%)', m.passRate ?? ''],
      ['Taux de complétion (%)', m.completionRate ?? ''],
      ['Taux de blocage (%)', m.blockedRate ?? ''],
      ['Escape Rate (%)', m.escapeRate ?? ''],
      ['Detection Rate (%)', m.detectionRate ?? ''],
      ["Taux d'échec (%)", m.failureRate ?? ''],
      ['Efficacité des tests (%)', m.testEfficiency ?? ''],
      ['Total tests', raw.total ?? ''],
      ['Passés', raw.passed ?? ''],
      ['Échoués', raw.failed ?? ''],
      ['Bloqués', raw.blocked ?? ''],
      ['Skipped', raw.skipped ?? ''],
      ['WIP', raw.wip ?? ''],
      ['Non testés', raw.untested ?? ''],
      ['MTTR (h)', itil.mttr ?? ''],
      ['Lead Time (h)', itil.leadTime ?? ''],
      ['Change Fail Rate (%)', itil.changeFailRate ?? ''],
      ['WIP Total', lean.wipTotal ?? ''],
      ['Runs actifs', lean.activeRuns ?? ''],
      ['Runs fermés', lean.closedRuns ?? ''],
      ['Jalons complétés', istqb.milestonesCompleted ?? ''],
      ['Jalons total', istqb.milestonesTotal ?? ''],
      ['Date génération', new Date().toISOString()],
    ]);

    if (m.slaStatus?.alerts?.length) {
      wsMetrics.addRow([]);
      wsMetrics.addRow(['Alertes SLA']);
      wsMetrics.addRow(['Métrique', 'Valeur (%)', 'Seuil (%)', 'Sévérité']);
      for (const a of m.slaStatus.alerts) {
        wsMetrics.addRow([a.metric ?? '', a.value ?? '', a.threshold ?? '', a.severity ?? '']);
      }
    }

    // ── Sheet Runs ──
    const wsRuns = workbook.addWorksheet('Runs');
    wsRuns.addRow([
      'ID',
      'Nom',
      'Total',
      'Complétés',
      'Passés',
      'Échoués',
      'Bloqués',
      'WIP',
      'Non testés',
      'Taux complétion (%)',
      'Taux réussite (%)',
      'Exploratoire',
      'Fermé',
      'Date création',
    ]);
    const runs = Array.isArray(m.runs) ? m.runs : [];
    for (const r of runs) {
      wsRuns.addRow([
        r.id ?? '',
        r.name ?? '',
        r.total ?? '',
        r.completed ?? '',
        r.passed ?? '',
        r.failed ?? '',
        r.blocked ?? '',
        r.wip ?? '',
        r.untested ?? '',
        r.completionRate ?? '',
        r.passRate ?? '',
        r.isExploratory ? 'Oui' : 'Non',
        r.isClosed ? 'Oui' : 'Non',
        r.created_at ?? '',
      ]);
    }

    const buf = await workbook.xlsx.writeBuffer();
    logger.info('[ExportService] Excel généré');
    return buf;
  }
}

export default new ExportService();
module.exports = exports.default;
