/**
 * Validation des variables d'environnement critiques (ITIL Configuration Management)
 */

const logger = require('../services/logger.service');

const REQUIRED_ENV = ['TESTMO_URL', 'TESTMO_TOKEN', 'GITLAB_URL', 'GITLAB_TOKEN'];
const RECOMMENDED_ENV = ['GITLAB_WRITE_TOKEN', 'FRONTEND_URL', 'SYNC_TIMEZONE'];

function validate() {
  const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]);
  if (missingEnv.length > 0) {
    logger.error(`CONFIGURATION MANQUANTE: ${missingEnv.join(', ')} requis dans .env`);
    process.exit(1);
  }

  RECOMMENDED_ENV.forEach((k) => {
    if (!process.env[k]) {
      logger.warn(`[Config] Variable optionnelle non définie : ${k} (valeur par défaut utilisée)`);
    }
  });
}

module.exports = { validate };
