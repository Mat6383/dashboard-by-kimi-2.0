/**
 * ================================================
 * TESTMO DASHBOARD - Backend Server
 * ================================================
 * Serveur Express sécurisé pour API Testmo
 *
 * Standards:
 * - ISTQB: Métriques de test standardisées
 * - ITIL: Service management et logging
 * - LEAN: Cache et optimisation des requêtes
 * - DevOps: Sécurité et bonnes pratiques
 *
 * @author Matou - Neo-Logix QA Lead
 * @version 2.0.0
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const logger = require('./services/logger.service');
const sentryService = require('./services/sentry.service');
const requestIdMiddleware = require('./middleware/requestId');
const requireAdminAuth = require('./middleware/adminAuth');

// ==========================================
// Configuration Application
// ==========================================
const app = express();
const PORT = process.env.PORT || 3001;

sentryService.init(app);
app.use(requestIdMiddleware);

// Validation des variables d'environnement critiques (ITIL Configuration Management)
const REQUIRED_ENV = ['TESTMO_URL', 'TESTMO_TOKEN', 'GITLAB_URL', 'GITLAB_TOKEN'];
const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missingEnv.length > 0) {
  logger.error(`CONFIGURATION MANQUANTE: ${missingEnv.join(', ')} requis dans .env`);
  process.exit(1);
}

// Avertissements pour variables recommandées
const RECOMMENDED_ENV = ['GITLAB_WRITE_TOKEN', 'FRONTEND_URL', 'SYNC_TIMEZONE'];
RECOMMENDED_ENV.forEach((k) => {
  if (!process.env[k]) {
    logger.warn(`[Config] Variable optionnelle non définie : ${k} (valeur par défaut utilisée)`);
  }
});

// ==========================================
// Middlewares de sécurité (ITIL Security)
// ==========================================
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'", process.env.TESTMO_URL].filter(Boolean),
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS — support multi-origines via FRONTEND_URL (virgule-séparé)
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      logger.warn(`CORS: origine refusée — ${origin}`);
      callback(new Error(`CORS: origine non autorisée — ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
);

// Rate-limiting global (ITIL Availability Management — protection DoS)
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Trop de requêtes — réessayez dans une minute (rate limit: 200 req/min)',
  },
  skip: (req) => req.path === '/api/health',
});

const heavyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_HEAVY_MAX) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Trop de requêtes sur cet endpoint — réessayez dans une minute',
  },
});

const { requestHandler: sentryRequestHandler } = sentryService.getMiddlewares();
app.use(sentryRequestHandler);

app.use('/api/', apiLimiter);
app.use('/api/reports/generate', heavyLimiter);
app.use('/api/sync/execute', heavyLimiter);
app.use('/api/sync/status-to-gitlab', heavyLimiter);

// Middleware de logging des requêtes (ITIL Event Management)
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    requestId: req.requestId,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// ==========================================
// Initialisation des services persistants
// ==========================================
const syncHistoryService = require('./services/syncHistory.service');
const commentsService = require('./services/comments.service');

syncHistoryService.initDb();
commentsService.init();

// ==========================================
// ROUTES API — Routers modulaires
// ==========================================
const healthRoutes = require('./routes/health.routes');
const projectsRoutes = require('./routes/projects.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const runsRoutes = require('./routes/runs.routes');
const reportsRoutes = require('./routes/reports.routes');
const syncRoutes = require('./routes/sync.routes');
const crosstestRoutes = require('./routes/crosstest.routes');
const cacheRoutes = require('./routes/cache.routes');
const featureFlagsRoutes = require('./routes/featureFlags.routes');

app.use('/api/health', healthRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/runs', runsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/sync', syncRoutes);
// Les routes admin de sync sont protégées dans le router (sync.routes.js)
app.use('/api/crosstest', crosstestRoutes);
app.use('/api/cache', requireAdminAuth, cacheRoutes);
app.use('/api/feature-flags', requireAdminAuth, featureFlagsRoutes);

// ==========================================
// Gestion des erreurs 404
// ==========================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route non trouvée',
    path: req.path,
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// Gestion globale des erreurs (ITIL)
// ==========================================
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

// ==========================================
// AUTO-SYNC CRON — Testmo → GitLab
// ==========================================
const cron = require('node-cron');
const autoSyncConfig = require('./services/auto-sync-config.service');
const statusSyncService = require('./services/status-sync.service');

async function runAutoSync() {
  const { valid, errors } = autoSyncConfig.validate();
  if (!valid) {
    logger.warn(`[AutoSync] Config invalide — sync ignorée: ${errors.join(', ')}`);
    return;
  }

  const { runId, iterationName, gitlabProjectId } = autoSyncConfig.getConfig();
  logger.info(`[AutoSync] Démarrage — run=${runId} iteration="${iterationName}" glProject=${gitlabProjectId}`);

  try {
    const stats = await statusSyncService.syncRunStatusToGitLab(
      runId,
      iterationName,
      gitlabProjectId,
      (type, data) => {
        if (type === 'updated') logger.info(`[AutoSync] ✓ #${data.issueIid} "${data.caseName}" → ${data.label}`);
        else if (type === 'error') logger.error(`[AutoSync] ✗ #${data.issueIid} "${data.caseName}": ${data.error}`);
        else if (type === 'done')
          logger.info(`[AutoSync] Terminé — updated=${data.updated} skipped=${data.skipped} errors=${data.errors}`);
        else if (type === 'warn') logger.warn(`[AutoSync] ${data.message}`);
      },
      false
    );
    logger.info(
      `[AutoSync] Stats: updated=${stats.updated} skipped=${stats.skipped} errors=${stats.errors} total=${stats.total}`
    );
  } catch (err) {
    logger.error(`[AutoSync] Erreur critique: ${err.message}`);
  }
}

const SYNC_TIMEZONE = process.env.SYNC_TIMEZONE || 'Europe/Paris';

function gracefulShutdown(server, signal) {
  logger.info(`${signal} reçu — Arrêt gracieux du serveur`);

  server.close(() => {
    logger.info('HTTP server fermé');
    try {
      syncHistoryService.db?.close();
      commentsService.db?.close();
      logger.info('Connexions SQLite fermées');
    } catch (err) {
      logger.error('Erreur fermeture SQLite:', err.message);
    }
    logger.info('Arrêt complet');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Arrêt forcé après 10s de timeout');
    process.exit(1);
  }, 10000);
}

// Démarrage conditionnel (ne pas démarrer le serveur ni le cron en mode test)
if (process.env.NODE_ENV !== 'test') {
  cron.schedule(
    '*/5 8-17 * * 1-5',
    () => {
      const { enabled } = autoSyncConfig.getConfig();
      if (!enabled) {
        logger.debug('[AutoSync] Cron déclenché mais auto-sync désactivé — ignoré');
        return;
      }
      logger.info('[AutoSync] Cron déclenché');
      runAutoSync();
    },
    { timezone: SYNC_TIMEZONE }
  );

  logger.info(`[AutoSync] Cron enregistré — lun-ven 8h-18h toutes les 5 min (timezone: ${SYNC_TIMEZONE})`);
  logger.info(`[AutoSync] Config initiale: ${JSON.stringify(autoSyncConfig.getConfig())}`);

  // ==========================================
  // Démarrage du serveur
  // ==========================================
  const server = app.listen(PORT, (error) => {
    if (error) {
      logger.error('Erreur au démarrage du serveur:', error.message);
      process.exit(1);
    }

    logger.info(`
╔════════════════════════════════════════════════╗
║   TESTMO DASHBOARD - Backend Server Started   ║
╠════════════════════════════════════════════════╣
║  Port:        ${PORT}                            
║  Environment: ${process.env.NODE_ENV || 'development'}                   
║  Testmo URL:  ${process.env.TESTMO_URL}        
║  Frontend:    ${process.env.FRONTEND_URL || 'http://localhost:3000'}    
╠════════════════════════════════════════════════╣
║  Standards: ISTQB | LEAN | ITIL | DevOps      ║
║  Author: Matou - Neo-Logix QA Lead            ║
╚════════════════════════════════════════════════╝
    `);

    logger.info('Server ready to accept connections');
  });

  process.on('SIGTERM', () => gracefulShutdown(server, 'SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown(server, 'SIGINT'));
}

module.exports = app;
