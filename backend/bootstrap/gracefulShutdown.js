/**
 * Gestion de l'arrêt gracieux du serveur (SIGTERM / SIGINT)
 * Ferme le HTTP server puis les connexions SQLite.
 */

const logger = require('../services/logger.service');
const syncHistoryService = require('../services/syncHistory.service');
const commentsService = require('../services/comments.service');

function setup(server) {
  function gracefulShutdown(signal) {
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

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

module.exports = { setup };
