/**
 * ================================================
 * SENTRY SERVICE - Observabilité erreurs
 * ================================================
 * Initialisation conditionnelle de Sentry.
 * Nécessite la variable d'environnement SENTRY_DSN.
 */

const Sentry = require('@sentry/node');
const logger = require('./logger.service');

let initialized = false;

function init(app) {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    logger.info('Sentry: DSN non configuré — monitoring désactivé');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.npm_package_version || '2.0.0',
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
    ],
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0.1,
  });

  initialized = true;
  logger.info('Sentry: initialisé');
}

function getMiddlewares() {
  if (!initialized) return { requestHandler: (req, res, next) => next(), errorHandler: (err, req, res, next) => next(err) };
  return {
    requestHandler: Sentry.Handlers.requestHandler(),
    errorHandler: Sentry.Handlers.errorHandler(),
  };
}

module.exports = { init, getMiddlewares };
