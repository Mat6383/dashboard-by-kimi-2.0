/**
 * ================================================
 * TESTMO DASHBOARD - Backend Server
 * ================================================
 * Point d'entrée Express : composition des middlewares,
 * routes, jobs et gestion du cycle de vie.
 *
 * @author Matou - Neo-Logix QA Lead
 * @version 2.0.0
 */

require('dotenv').config();
const express = require('express');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const logger = require('./services/logger.service');
const sentryService = require('./services/sentry.service');
const requestIdMiddleware = require('./middleware/requestId');
const requireAdminAuth = require('./middleware/adminAuth');

const { validate: validateEnv } = require('./bootstrap/envCheck');
const { setupSecurity } = require('./middleware/security');
const { metricsMiddleware } = require('./middleware/metrics');
const requestLogger = require('./middleware/requestLogger');
const autoSyncJob = require('./jobs/autoSyncJob');
const gracefulShutdown = require('./bootstrap/gracefulShutdown');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Sentry & Request ID ────────────────────────────────────────────────────
sentryService.init(app);
app.use(requestIdMiddleware);

// ─── Validation env ─────────────────────────────────────────────────────────
validateEnv();

// ─── Sécurité (Helmet, CORS, Rate-limiting) ─────────────────────────────────
setupSecurity(app);

// ─── Logging ────────────────────────────────────────────────────────────────
app.use(requestLogger);

// ─── Prometheus metrics ─────────────────────────────────────────────────────
app.use(metricsMiddleware);

// ─── Services persistants ───────────────────────────────────────────────────
require('./services/syncHistory.service').initDb();
require('./services/comments.service').init();
require('./services/metricSnapshots.service').init();
require('./services/users.service').init();

// ─── Passport & Cookies ─────────────────────────────────────────────────────
app.use(cookieParser());
app.use(passport.initialize());

// ─── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/health', require('./routes/health.routes'));
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/projects', require('./routes/projects.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/runs', require('./routes/runs.routes'));
app.use('/api/reports', require('./routes/reports.routes'));
app.use('/api/sync', require('./routes/sync.routes'));
app.use('/api/crosstest', require('./routes/crosstest.routes'));
app.use('/api/notifications', require('./routes/notifications.routes'));
app.use('/api/pdf', require('./routes/pdf.routes'));
app.use('/api/export', require('./routes/export.routes'));
app.use('/api/cache', requireAdminAuth, require('./routes/cache.routes'));
app.use('/api/feature-flags', requireAdminAuth, require('./routes/featureFlags.routes'));
app.use('/api/docs', require('./routes/docs.routes'));
app.use('/metrics', require('./routes/metrics.routes'));

// ─── 404 ────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route non trouvée',
    path: req.path,
    timestamp: new Date().toISOString(),
  });
});

// ─── Gestion globale des erreurs ────────────────────────────────────────────
const { errorHandler: sentryErrorHandler } = sentryService.getMiddlewares();
app.use(sentryErrorHandler);

app.use((err, req, res, _next) => {
  logger.error('Erreur non gérée:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Erreur interne du serveur' : err.message,
    timestamp: new Date().toISOString(),
  });
});

// ─── Démarrage (hors mode test) ─────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  autoSyncJob.start();
  require('./jobs/metricsSnapshotJob').start();

  const server = app.listen(PORT, (error) => {
    if (error) {
      logger.error('Erreur au démarrage du serveur:', error.message);
      process.exit(1);
    }
    logger.info(`Server ready on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });

  gracefulShutdown.setup(server);
}

module.exports = app;
