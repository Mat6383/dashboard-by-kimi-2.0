/**
 * ================================================
 * GITLAB OAUTH2 STRATEGY (Passport)
 * ================================================
 */

const GitLabStrategy = require('passport-gitlab2').Strategy;
const usersService = require('../users.service');
const logger = require('../logger.service');

const GITLAB_CLIENT_ID = process.env.GITLAB_CLIENT_ID;
const GITLAB_CLIENT_SECRET = process.env.GITLAB_CLIENT_SECRET;
const GITLAB_URL = process.env.GITLAB_URL || 'https://gitlab.com';

function createStrategy() {
  if (!GITLAB_CLIENT_ID || !GITLAB_CLIENT_SECRET) {
    logger.warn('[GitLabStrategy] GITLAB_CLIENT_ID ou GITLAB_CLIENT_SECRET manquant — OAuth désactivé');
    return null;
  }

  return new GitLabStrategy(
    {
      clientID: GITLAB_CLIENT_ID,
      clientSecret: GITLAB_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/auth/gitlab/callback`,
      baseURL: GITLAB_URL,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const user = usersService.upsertFromGitLab(profile);
        return done(null, user);
      } catch (err) {
        logger.error('[GitLabStrategy] Erreur upsert user:', err.message);
        return done(err, null);
      }
    }
  );
}

module.exports = { createStrategy };
