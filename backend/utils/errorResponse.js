/**
 * ================================================
 * ERROR RESPONSE HELPER
 * ================================================
 * Normalise les réponses d'erreur HTTP pour éviter
 * les fuites d'informations sensibles (stack traces,
 * messages d'erreur internes, URLs avec tokens...).
 *
 * En production : message générique uniquement.
 * En dev        : message original pour faciliter le debug.
 */

const logger = require('../services/logger.service');

/**
 * Retourne un objet d'erreur sécurisé pour le client.
 * Loggue le vrai message côté serveur uniquement.
 *
 * @param {Error}  error   - L'erreur originale
 * @param {string} [context] - Contexte (nom de la route) pour les logs
 * @returns {{ success: false, error: string, timestamp: string }}
 */
function safeErrorResponse(error, context = 'unknown') {
  logger.error(`[${context}] Erreur interne:`, {
    message: error.message,
    stack: error.stack,
  });

  const isDev = process.env.NODE_ENV !== 'production';
  return {
    success: false,
    error: isDev ? error.message : 'Erreur interne du serveur',
    timestamp: new Date().toISOString(),
  };
}

module.exports = { safeErrorResponse };
