/**
 * ================================================
 * DOCS ROUTES — Swagger UI (OpenAPI 3.0)
 * ================================================
 */

const express = require('express');
const router = express.Router();
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const swaggerDocument = YAML.load(path.join(__dirname, '../docs/openapi.yaml'));

router.use(
  '/',
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'QA Dashboard API Docs',
  })
);

module.exports = router;
