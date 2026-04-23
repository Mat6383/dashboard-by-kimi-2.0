const express = require('express');
const router = express.Router();
const testmoService = require('../services/testmo.service');
const ReportService = require('../services/report.service');
const logger = require('../services/logger.service');
const { validateBody, reportsGenerateBody } = require('../validators');

const reportService = new ReportService(testmoService);

/**
 * Génère un rapport de clôture de tests (HTML et/ou PPTX)
 * ISTQB §5.4.2 Test Closure Report
 *
 * Accepte runIds[] (nouveau format) OU milestoneId (ancien format).
 */
router.post('/generate', validateBody(reportsGenerateBody), async (req, res) => {
  try {
    const { projectId, runIds, milestoneId, formats, recommendations, complement } = req.body;

    // Accepte runIds[] (nouveau format) OU milestoneId (ancien format)
    let resolvedRunIds = runIds;
    if (!resolvedRunIds || !Array.isArray(resolvedRunIds) || resolvedRunIds.length === 0) {
      if (milestoneId) {
        logger.info(`runIds absent, fallback sur milestoneId=${milestoneId}`);
        const allRuns = await testmoService.apiGet(`/projects/${projectId}/runs?limit=50`);
        resolvedRunIds = (allRuns.result || [])
          .filter(r => r.milestone_id === milestoneId)
          .map(r => r.id);
        if (resolvedRunIds.length === 0) {
          return res.status(400).json({ success: false, error: `Aucun run trouvé pour le milestone ${milestoneId}` });
        }
      } else {
        return res.status(400).json({ success: false, error: 'runIds (tableau) ou milestoneId requis' });
      }
    }

    logger.info(`Génération rapport: project=${projectId}, runIds=${JSON.stringify(resolvedRunIds)}, formats=${JSON.stringify(formats)}`);

    // 1. Collect data — fetch each run by ID
    const data = await reportService.collectReportData(projectId, resolvedRunIds);

    const result = { success: true, files: {} };

    // 2. Generate HTML
    if (formats.html) {
      const htmlContent = reportService.generateHTML(data, recommendations, complement);
      result.files.html = Buffer.from(htmlContent, 'utf-8').toString('base64');
      result.files.htmlFilename = `${data.milestoneName}_Cloture_Tests.html`;
    }

    // 3. Generate PPTX
    if (formats.pptx) {
      const pres = await reportService.generatePPTX(data, recommendations, complement);
      const pptxBuffer = await pres.write({ outputType: 'nodebuffer' });
      result.files.pptx = pptxBuffer.toString('base64');
      result.files.pptxFilename = `${data.milestoneName}_Cloture_Tests.pptx`;
    }

    result.summary = {
      milestone: data.milestoneName,
      verdict: data.verdict,
      totalTests: data.stats.totalTests,
      passRate: data.stats.passRate,
      failedTests: data.failedTests.length,
    };

    logger.info(`Rapport généré: ${data.milestoneName} — ${data.verdict}`);
    res.json(result);

  } catch (error) {
    logger.error('Erreur POST /api/reports/generate:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
