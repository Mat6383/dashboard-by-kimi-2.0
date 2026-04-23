const express = require('express');
const router = express.Router();
const testmoService = require('../services/testmo.service');
const alertService = require('../services/alert.service');
const logger = require('../services/logger.service');
const { safeErrorResponse } = require('../utils/errorResponse');
const { validateParams, validateQuery, projectIdParam, milestonesQuery } = require('../validators');

/**
 * Synthèse multi-projets
 * Agrège les métriques clés de tous les projets Testmo
 */
router.get('/multi', async (req, res) => {
  try {
    const projectsRaw = await testmoService.getProjects();
    const projects = Array.isArray(projectsRaw) ? projectsRaw : projectsRaw?.result || [];
    const summaries = await Promise.all(
      projects.map(async (project) => {
        try {
          const metrics = await testmoService.getProjectMetrics(project.id);
          return {
            projectId: project.id,
            projectName: project.name,
            passRate: metrics.passRate,
            completionRate: metrics.completionRate,
            blockedRate: metrics.blockedRate,
            escapeRate: metrics.escapeRate || 0,
            detectionRate: metrics.detectionRate || 0,
            slaStatus: metrics.slaStatus,
            timestamp: metrics.timestamp,
          };
        } catch (err) {
          logger.warn(`[MultiProject] Échec metrics projet ${project.id}:`, err.message);
          return {
            projectId: project.id,
            projectName: project.name,
            passRate: null,
            completionRate: null,
            blockedRate: null,
            escapeRate: null,
            detectionRate: null,
            slaStatus: { ok: false, alerts: [{ severity: 'error', message: 'Données indisponibles' }] },
            timestamp: new Date().toISOString(),
          };
        }
      })
    );

    res.json({
      success: true,
      data: summaries,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json(safeErrorResponse(error, 'GET /api/dashboard/multi'));
  }
});

/**
 * Métriques ISTQB complètes d'un projet
 * ISTQB Section 5.4.2: Test Summary Report
 * Endpoint principal du dashboard
 */
router.get('/:projectId', validateParams(projectIdParam), validateQuery(milestonesQuery), async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const preprodMilestones = req.query.preprodMilestones ? req.query.preprodMilestones.split(',').map(Number) : null;
    const prodMilestones = req.query.prodMilestones ? req.query.prodMilestones.split(',').map(Number) : null;

    logger.info(`Récupération métriques pour projet ${projectId}`);
    const metrics = await testmoService.getProjectMetrics(projectId, preprodMilestones, prodMilestones);

    // Log + alerte webhook des alertes SLA (ITIL)
    if (!metrics.slaStatus.ok) {
      logger.warn('Alertes SLA détectées:', {
        projectId,
        alerts: metrics.slaStatus.alerts,
      });
      alertService.sendSLAAlert(projectId, metrics.slaStatus.alerts).catch(() => {
        /* silencieux — ne pas impacter le client */
      });
    }

    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json(safeErrorResponse(error, `GET /api/dashboard/${req.params.projectId}`));
  }
});

/**
 * Taux d'échappement et de détection
 * Endpoint pour le Dashboard 3
 */
router.get(
  '/:projectId/quality-rates',
  validateParams(projectIdParam),
  validateQuery(milestonesQuery),
  async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const preprodMilestones = req.query.preprodMilestones ? req.query.preprodMilestones.split(',').map(Number) : null;
      const prodMilestones = req.query.prodMilestones ? req.query.prodMilestones.split(',').map(Number) : null;

      logger.info(`Récupération Quality Rates pour projet ${projectId}`);
      const rates = await testmoService.getEscapeAndDetectionRates(projectId, preprodMilestones, prodMilestones);

      res.json({
        success: true,
        data: rates,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json(safeErrorResponse(error, `GET /api/dashboard/${req.params.projectId}/quality-rates`));
    }
  }
);

/**
 * Tendances annuelles de qualité (Dashboard 5)
 * ISTQB: Test Process Improvement
 */
router.get('/:projectId/annual-trends', validateParams(projectIdParam), async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);

    logger.info(`Récupération Annual Trends pour projet ${projectId}`);
    const trends = await testmoService.getAnnualQualityTrends(projectId);

    res.json({
      success: true,
      data: trends,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json(safeErrorResponse(error, `GET /api/dashboard/${req.params.projectId}/annual-trends`));
  }
});

module.exports = router;
