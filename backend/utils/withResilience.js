/**
 * ================================================
 * WITH RESILIENCE — Circuit breaker + retry exponentiel
 * ================================================
 * Wrapper combiné pour protéger les appels externes.
 *
 * @param {Function} fn — fonction async à protéger
 * @param {CircuitBreaker} breaker — instance CircuitBreaker
 * @param {Object} retryOptions
 * @param {number} retryOptions.maxRetries — nb max de retries (défaut: 3)
 * @param {number} retryOptions.baseDelayMs — délai de base (défaut: 500)
 * @param {string} retryOptions.label — label pour les logs
 */

const logger = require('../services/logger.service');

const RETRYABLE_ERRORS = new Set([
  'ECONNRESET',
  'ETIMEDOUT',
  'ENOTFOUND',
  'ECONNREFUSED',
  'EAI_AGAIN',
  'NETWORK_ERROR',
]);

function isRetryable(error) {
  if (!error) return false;
  const status = error.response?.status;
  if (status === 429) return true;
  if (status >= 500 && status < 600) return true;
  const code = error.code || error.message;
  if (RETRYABLE_ERRORS.has(code)) return true;
  if (typeof code === 'string' && code.includes('timeout')) return true;
  return false;
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withResilience(fn, breaker, retryOptions = {}) {
  const { maxRetries = 3, baseDelayMs = 500, label = 'operation' } = retryOptions;

  return breaker.execute(async () => {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;

        const isLastAttempt = attempt === maxRetries;
        if (isLastAttempt || !isRetryable(err)) {
          throw err;
        }

        const delay = baseDelayMs * Math.pow(2, attempt);
        logger.warn(`[${label}] Retry ${attempt + 1}/${maxRetries} after ${delay}ms — ${err.message || err.code}`);
        await sleep(delay);
      }
    }

    throw lastError;
  });
}

module.exports = { withResilience, isRetryable };
