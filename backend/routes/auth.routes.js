/**
 * ================================================
 * AUTH ROUTES — GitLab OAuth2 + JWT
 * ================================================
 */

const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwtService = require('../services/auth/jwt.service');
const { requireAuth } = require('../middleware/auth.middleware');
const { activeUsersGauge } = require('../middleware/metrics');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ─── Init OAuth ─────────────────────────────────────────────────────────────
const { createStrategy } = require('../services/auth/gitlab.strategy');
const strategy = createStrategy();
if (strategy) {
  passport.use('gitlab', strategy);
}

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  const usersService = require('../services/users.service');
  const user = usersService.findById(id);
  done(null, user || null);
});

// ─── Routes ─────────────────────────────────────────────────────────────────

router.get('/gitlab', (req, res, next) => {
  if (!strategy) {
    return res.status(501).json({
      success: false,
      error: 'OAuth GitLab non configuré (GITLAB_CLIENT_ID manquant)',
      timestamp: new Date().toISOString(),
    });
  }
  passport.authenticate('gitlab', { scope: ['read_user'] })(req, res, next);
});

router.get(
  '/gitlab/callback',
  (req, res, next) => {
    if (!strategy) {
      return res.status(501).json({
        success: false,
        error: 'OAuth GitLab non configuré',
        timestamp: new Date().toISOString(),
      });
    }
    passport.authenticate('gitlab', { session: false, failureRedirect: `${FRONTEND_URL}/login?error=oauth_failed` })(
      req,
      res,
      next
    );
  },
  (req, res) => {
    const user = req.user;
    const accessToken = jwtService.signPayload({ sub: user.id, email: user.email, role: user.role });
    const refreshToken = jwtService.signRefresh({ sub: user.id });

    // Cookies httpOnly + JS-accessible flag
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 15 * 60 * 1000, // 15 min
    });
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 j
    });

    // Increment active users metric
    activeUsersGauge.inc();

    // Redirect vers le frontend avec un token temporaire dans l'URL hash
    // (le frontend le consomme, le stocke en mémoire, puis efface l'URL)
    res.redirect(`${FRONTEND_URL}/auth/callback?token=${encodeURIComponent(accessToken)}`);
  }
);

router.post('/refresh', (req, res) => {
  const refreshToken = req.cookies?.refresh_token;
  if (!refreshToken) {
    return res.status(401).json({ success: false, error: 'Refresh token manquant' });
  }

  const payload = jwtService.verify(refreshToken);
  if (!payload || payload.type !== 'refresh') {
    return res.status(401).json({ success: false, error: 'Refresh token invalide' });
  }

  const usersService = require('../services/users.service');
  const user = usersService.findById(payload.sub);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Utilisateur introuvable' });
  }

  const newAccess = jwtService.signPayload({ sub: user.id, email: user.email, role: user.role });
  res.cookie('access_token', newAccess, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 15 * 60 * 1000,
  });

  res.json({ success: true, accessToken: newAccess });
});

router.post('/logout', (req, res) => {
  activeUsersGauge.dec();
  res.clearCookie('access_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/' });
  res.json({ success: true, message: 'Déconnexion réussie' });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      avatar: req.user.avatar,
      role: req.user.role,
    },
  });
});

module.exports = router;
