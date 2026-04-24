# Handoff Session - QA Dashboard by Kimi 2.0

> Dernière mise à jour : 2026-04-24
> Session précédente : **P6 — Évolutions Futures (6 features implémentées)**

---

## 🏗️ Architecture & Setup Local

| Composant                  | Port   | Commande                     |
| -------------------------- | ------ | ---------------------------- |
| Backend (Express + SQLite) | `3001` | `cd backend && npm run dev`  |
| Frontend (Vite)            | `3002` | `cd frontend && npm run dev` |

**⚠️ Important :** Le frontend **doit** utiliser `VITE_API_URL=/api` (relatif) pour passer par le proxy Vite et éviter les erreurs CORS. Le fichier `frontend/.env` contient déjà cette valeur.

---

## ✅ État des Tâches (Roadmap P6)

| Tâche                          | Statut | Notes                                                                  |
| ------------------------------ | ------ | ---------------------------------------------------------------------- |
| P6#1 Export PDF Backend        | ✅     | `puppeteer` + `POST /api/pdf/generate` (A4, header/footer, multi-page) |
| P6#2 Notifications Email SLA   | ✅     | `nodemailer` + templates HTML + UI `/notifications`                    |
| P6#3 Slack/Teams enrichi       | ✅     | Config par projet (DB) + test connexion + rate-limit 15 min            |
| P6#4 Tendances historiques     | ✅     | `metric_snapshots` + cron 2h + `/trends` + `HistoricalTrends`          |
| P6#5 Auth OAuth GitLab         | ✅     | `passport-gitlab2` + JWT + rôles admin/viewer + `/auth/callback`       |
| P6#6 Comparateur multi-projets | ✅     | Radar chart `/compare` + `CompareDashboard` + table comparative        |

---

## 🐛 Bugs Connus / Problèmes Actifs

**Aucun bug critique connu.**

- Les tests backend (379/379) et frontend (129/129) passent tous.
- Le build frontend passe en ~2.6s.
- OAuth GitLab s'active uniquement si `GITLAB_CLIENT_ID` et `GITLAB_CLIENT_SECRET` sont définis.
- SMTP s'active uniquement si `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` sont définis.

---

## 📁 Fichiers Clés Modifiés / Créés

### Backend

- `db/migrations/auth/001_users.sql` — Table utilisateurs OAuth
- `db/migrations/sync-history/003_notifications.sql` — Settings + alert_log
- `db/migrations/sync-history/004_metric_snapshots.sql` — Snapshots quotidiens
- `db/migrations/sync-history/005_project_groups.sql` — Groupes de projets
- `services/users.service.js` — CRUD users
- `services/auth/jwt.service.js` — Sign/verify JWT
- `services/auth/gitlab.strategy.js` — Passport GitLab OAuth2
- `services/email.service.js` — Nodemailer + templates HTML
- `services/notification.service.js` — Orchestration email + webhook + rate-limit
- `services/pdf.service.js` — Puppeteer PDF professionnel
- `services/metricSnapshots.service.js` — Persistence tendances
- `services/alert.service.js` — Webhooks Slack/Teams custom URL
- `middleware/auth.middleware.js` — `requireAuth` + `requireRole`
- `routes/auth.routes.js` — `/auth/gitlab`, `/callback`, `/me`, `/refresh`, `/logout`
- `routes/notifications.routes.js` — CRUD settings + test webhook
- `routes/pdf.routes.js` — `POST /pdf/generate`
- `routes/dashboard.routes.js` — `/trends` + `/compare`
- `jobs/metricsSnapshotJob.js` — Cron quotidien 2h
- `server.js` — Intégration passport, cookie-parser, nouvelles routes
- `.env.example` — Documentation nouvelles variables

### Frontend

- `hooks/useAuth.js` — État auth, login/logout, token
- `components/AuthCallback.jsx` — Consomme token OAuth post-redirect
- `components/NotificationSettings.jsx` — UI config email + webhooks
- `components/HistoricalTrends.jsx` — Chart.js Line avec range + granularité
- `components/CompareDashboard.jsx` — Radar chart + table comparative
- `components/AppLayout.jsx` — User badge, bouton login GitLab, routes admin
- `components/AppRouter.jsx` — Routes `/auth/callback`, `/notifications`, `/historical-trends`, `/compare`
- `App.jsx` — Intégration `useAuth` + `useToast` + export PDF backend
- `services/api.service.js` — Méthodes auth, notifications, PDF backend + header Bearer

---

## 🔐 Points de Sécurité / Auth

- **OAuth GitLab** : Flow standard `passport-gitlab2`. Premier utilisateur connecté = `admin`, les suivants = `viewer`.
- **JWT** : Access token (15 min) + refresh token (7j) en cookies httpOnly. Fallback `JWT_SECRET` sur `ADMIN_API_TOKEN`.
- **RBAC** : `requireAuth` vérifie le JWT. `requireRole('admin')` protège les routes sensibles.
- **Routes protégées admin** : `/api/notifications/*`, `/api/pdf/generate` (via `requireAuth` + `requireRole`).
- **Routes legacy admin** : `/api/cache/*`, `/api/feature-flags/*` conservent `requireAdminAuth` (X-Admin-Token).
- **CORS** : `credentials: true` supporte les cookies cross-origin.

---

## 🧪 Commandes de Test

```bash
# Backend (Jest)
npm test

# Frontend unitaires (Vitest)
cd frontend && npx vitest run

# Build frontend
cd frontend && npm run build

# E2E (Playwright)
npx playwright test
```

---

## 💡 Conventions & Leçons Apprises

1. **SQLite DEFAULT avec fonction** : Toujours utiliser `(datetime('now'))` avec parenthèses pour `DEFAULT`, sinon erreur de syntaxe.
2. **Express 5 + path-to-regexp** : Les routes optionnelles (`:param?`) ne sont plus supportées. Utiliser deux routes distinctes.
3. **Puppeteer headless** : Nécessite `--no-sandbox --disable-setuid-sandbox` en environnement conteneurisé.
4. **Objet littéral async** : Ne pas oublier les virgules entre les méthodes async dans un objet JS (erreur Rolldown cryptique).
5. **Fallback auth** : Si OAuth GitLab n'est pas configuré, le backend continue de fonctionner (les routes retournent 501).

---

## 🚀 Prochaines Étapes Suggérées

1. **P6#5 CSV/Excel** — Complément au PDF/PPTX (roadmap P5 restante)
2. **E2E Playwright** — Parcours login → dashboard → export → notification settings
3. **Performance Puppeteer** — Vérifier la consommation mémoire Chromium en production

---

## 🌿 État Git

- **Branche active** : `main`
- **Commits non pushés** : Modifications P6 en cours (non commitées)
- **Dernier commit sur `main`** : `91d7530` — Merge de `feat/p5-tests-coverage`
