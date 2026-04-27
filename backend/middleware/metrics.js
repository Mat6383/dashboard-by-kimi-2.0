/**
 * ================================================
 * PROMETHEUS METRICS MIDDLEWARE
 * ================================================
 * Collecte les métriques HTTP (latence, compteur, erreurs)
 * pour monitoring avec Prometheus / Grafana.
 */

const client = require('prom-client');

// Collecte des métriques par défaut (mémoire, CPU, event loop...)
client.collectDefaultMetrics({ prefix: 'qa_dashboard_' });

// Métriques HTTP custom
const httpRequestDuration = new client.Histogram({
  name: 'qa_dashboard_http_request_duration_seconds',
  help: 'Durée des requêtes HTTP en secondes',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

const httpRequestsTotal = new client.Counter({
  name: 'qa_dashboard_http_requests_total',
  help: 'Nombre total de requêtes HTTP',
  labelNames: ['method', 'route', 'status_code'],
});

const httpErrorsTotal = new client.Counter({
  name: 'qa_dashboard_http_errors_total',
  help: 'Nombre total de réponses HTTP en erreur (4xx/5xx)',
  labelNames: ['method', 'route', 'status_code'],
});

/**
 * Middleware Express qui instrumente les requêtes HTTP.
 */
function metricsMiddleware(req, res, next) {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    const durationSeconds = durationMs / 1000;
    const route = req.route?.path || req.path || 'unknown';
    const statusCode = res.statusCode.toString();

    httpRequestDuration.observe({ method: req.method, route, status_code: statusCode }, durationSeconds);
    httpRequestsTotal.inc({ method: req.method, route, status_code: statusCode });

    if (res.statusCode >= 400) {
      httpErrorsTotal.inc({ method: req.method, route, status_code: statusCode });
    }
  });

  next();
}

module.exports = {
  metricsMiddleware,
  register: client.register,
};
