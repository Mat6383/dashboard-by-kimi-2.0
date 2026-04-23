/**
 * ================================================
 * REPORT SERVICE — Orchestrateur de rapports de clôture
 * ================================================
 * ISTQB §5.4.2 Test Closure Report
 * LEAN + ITIL v4 CSI
 *
 * Délègue aux modules spécialisés :
 *   - report/collectData.js   : récupération des données Testmo
 *   - report/generateHTML.js  : génération du rapport HTML
 *   - report/generatePPTX.js  : génération du deck PPTX
 *
 * @author Matou - Neo-Logix QA Lead
 * @version 1.1.0
 */

const collectReportData = require('./report/collectData');
const generateHTML = require('./report/generateHTML');
const generatePPTX = require('./report/generatePPTX');

class ReportService {
  constructor(testmoService) {
    this.testmoService = testmoService;
  }

  async collectReportData(projectId, runIds) {
    return collectReportData(this.testmoService, projectId, runIds);
  }

  generateHTML(data, recommendations, complement) {
    return generateHTML(data, recommendations, complement);
  }

  async generatePPTX(data, recommendations, complement) {
    return generatePPTX(data, recommendations, complement);
  }
}

module.exports = ReportService;
