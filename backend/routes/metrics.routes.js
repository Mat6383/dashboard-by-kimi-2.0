/**
 * ================================================
 * METRICS ROUTE — Prometheus exposition
 * ================================================
 */

const express = require('express');
const router = express.Router();
const { register, updateDbSizeMetrics } = require('../middleware/metrics');

router.get('/', async (_req, res) => {
  updateDbSizeMetrics();
  res.setHeader('Content-Type', register.contentType);
  res.send(await register.metrics());
});

module.exports = router;
