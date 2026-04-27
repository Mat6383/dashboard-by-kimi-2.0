/**
 * ================================================
 * EXPORT ROUTES — Génération CSV / Excel
 * ================================================
 */

const express = require('express');
const router = express.Router();
const exportService = require('../services/export.service');
const testmoService = require('../services/testmo.service');
const { requireAuth } = require('../middleware/auth.middleware');
const { safeErrorResponse } = require('../utils/errorResponse');

async function _getMetricsAndName(projectId, milestones) {
  const metrics = await testmoService.getProjectMetrics(
    parseInt(projectId),
    milestones?.preprod || null,
    milestones?.prod || null
  );

  // Essayer de récupérer le nom du projet
  let projectName = null;
  try {
    const projects = await testmoService.getProjects();
    const list = Array.isArray(projects) ? projects : projects?.result || [];
    const found = list.find((p) => p.id === parseInt(projectId));
    if (found) projectName = found.name;
  } catch {
    // silencieux
  }

  return { metrics, projectName };
}

router.post('/csv', requireAuth, async (req, res) => {
  try {
    const { projectId, milestones } = req.body;
    if (!projectId) {
      return res.status(400).json({ success: false, error: 'projectId requis' });
    }

    const { metrics, projectName } = await _getMetricsAndName(projectId, milestones);
    const csvBuffer = exportService.generateCSV(metrics, projectName);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="qa-dashboard-${projectId}-${Date.now()}.csv"`);
    res.send(csvBuffer);
  } catch (error) {
    res.status(500).json(safeErrorResponse(error, 'POST /api/export/csv'));
  }
});

router.post('/excel', requireAuth, async (req, res) => {
  try {
    const { projectId, milestones } = req.body;
    if (!projectId) {
      return res.status(400).json({ success: false, error: 'projectId requis' });
    }

    const { metrics, projectName } = await _getMetricsAndName(projectId, milestones);
    const xlsxBuffer = exportService.generateExcel(metrics, projectName);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="qa-dashboard-${projectId}-${Date.now()}.xlsx"`);
    res.send(xlsxBuffer);
  } catch (error) {
    res.status(500).json(safeErrorResponse(error, 'POST /api/export/excel'));
  }
});

module.exports = router;
