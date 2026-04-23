const express = require('express');
const router = express.Router();
const testmoService = require('../services/testmo.service');
const logger = require('../services/logger.service');
const { safeErrorResponse } = require('../utils/errorResponse');
const { validateParams, validateQuery, runIdParam, runResultsQuery } = require('../validators');

/**
 * Détails d'un run spécifique
 * ISTQB: Test Reporting
 */
router.get('/:runId', validateParams(runIdParam), async (req, res) => {
  try {
    const runId = parseInt(req.params.runId);

    const runDetails = await testmoService.getRunDetails(runId);

    res.json({
      success: true,
      data: runDetails,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json(safeErrorResponse(error, `GET /api/runs/${req.params.runId}`));
  }
});

/**
 * Résultats détaillés d'un run
 * API Testmo 2025: Nouveau endpoint
 */
router.get('/:runId/results', validateParams(runIdParam), validateQuery(runResultsQuery), async (req, res) => {
  try {
    const runId = parseInt(req.params.runId);
    const statusFilter = req.query.status; // Ex: '3,5' pour Failed+Blocked

    const results = await testmoService.getRunResults(runId, statusFilter);

    res.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json(safeErrorResponse(error, `GET /api/runs/${req.params.runId}/results`));
  }
});

module.exports = router;
