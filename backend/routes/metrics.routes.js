/**
 * ================================================
 * METRICS ROUTE — Prometheus exposition
 * ================================================
 */

const express = require('express');
const router = express.Router();
const { register } = require('../middleware/metrics');

router.get('/', async (_req, res) => {
  res.setHeader('Content-Type', register.contentType);
  res.send(await register.metrics());
});

module.exports = router;
