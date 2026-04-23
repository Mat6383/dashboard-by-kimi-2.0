/**
 * Middlewares de sécurité (ITIL Security)
 * - Helmet (CSP, headers)
 * - Compression
 * - Body parsers
 * - CORS multi-origines
 * - Rate-limiting (DoS protection)
 * - Sentry request handler
 */

const helmet = require('helmet');
const compression = require('compression');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const logger = require('../services/logger.service');
const sentryService = require('../services/sentry.service');

function setupSecurity(app) {
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
}

module.exports = { setupSecurity };
