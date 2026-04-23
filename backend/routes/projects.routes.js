const express = require('express');
const router = express.Router();
const testmoService = require('../services/testmo.service');
const { safeErrorResponse } = require('../utils/errorResponse');
const { validateParams, projectIdParam } = require('../validators');

/**
 * Liste tous les projets Testmo
 * ISTQB: Test Project Scope
 */
router.get('/', async (req, res) => {
  try {
    const projects = await testmoService.getProjects();

    res.json({
      success: true,
      data: projects,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json(safeErrorResponse(error, 'GET /api/projects'));
  }
});

/**
 * Liste des runs actifs d'un projet
 * ISTQB: Test Monitoring
 */
router.get('/:projectId/runs', validateParams(projectIdParam), async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const activeOnly = req.query.active !== 'false'; // Par défaut: actifs seulement

    const runs = await testmoService.getProjectRuns(projectId, activeOnly);

    res.json({
      success: true,
      data: runs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json(safeErrorResponse(error, `GET /api/projects/${req.params.projectId}/runs`));
  }
});

/**
 * Liste des milestones d'un projet
 */
router.get('/:projectId/milestones', validateParams(projectIdParam), async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);

    const milestones = await testmoService.getProjectMilestones(projectId);

    res.json({
      success: true,
      data: milestones,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json(safeErrorResponse(error, `GET /api/projects/${req.params.projectId}/milestones`));
  }
});

/**
 * Runs d'automation d'un projet
 * ISTQB: Automated Testing
 */
router.get('/:projectId/automation', validateParams(projectIdParam), async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);

    const automationRuns = await testmoService.getAutomationRuns(projectId);

    res.json({
      success: true,
      data: automationRuns,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json(safeErrorResponse(error, `GET /api/projects/${req.params.projectId}/automation`));
  }
});

module.exports = router;
