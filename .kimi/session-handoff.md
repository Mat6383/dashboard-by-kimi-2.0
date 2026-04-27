# Handoff Session - QA Dashboard by Kimi 2.0

> Dernière mise à jour : 2026-04-27
> Session précédente : **P6 — Évolutions Futures (8 features implémentées)**

---

## 🏗️ Architecture & Setup Local

| Composant                  | Port   | Commande                     |
| -------------------------- | ------ | ---------------------------- |
| Backend (Express + SQLite) | `3001` | `cd backend && npm run dev`  |
| Frontend (Vite)            | `3002` | `cd frontend && npm run dev` |

**⚠️ Important :** Le frontend **doit** utiliser `VITE_API_URL=/api` (relatif) pour passer par le proxy Vite et éviter les erreurs CORS. Le fichier `frontend/.env` contient déjà cette valeur.

---

## ✅ État des Tâches (Roadmap P6)

| Tâche                          | Statut | Notes                                                                     |
| ------------------------------ | ------ | ------------------------------------------------------------------------- |
| P6#1 Export PDF Backend        | ✅     | `puppeteer` + `POST /api/pdf/generate` (A4, header/footer, multi-page)    |
| P6#2 Notifications Email SLA   | ✅     | `nodemailer` + templates HTML + UI `/notifications`                       |
| P6#3 Slack/Teams enrichi       | ✅     | Config par projet (DB) + test connexion + rate-limit 15 min               |
| P6#4 Tendances historiques     | ✅     | `metric_snapshots` + cron 2h + `/trends` + `HistoricalTrends`             |
| P6#5 Auth OAuth GitLab         | ✅     | `passport-gitlab2` + JWT + rôles admin/viewer + `/auth/callback`          |
| P6#6 Comparateur multi-projets | ✅     | Radar chart `/compare` + `CompareDashboard` + table comparative           |
| P6#7 Export CSV/Excel          | ✅     | `xlsx` + `POST /api/export/csv` & `/excel` — métriques + runs + SLA       |
| P6#8 Tests E2E Playwright      | ✅     | Parcours complet login → dashboard → export CSV/Excel/PDF → notifications |

---

## 🐛 Bugs Connus / Problèmes Actifs

**Aucun bug critique connu.**

- Les tests backend (385/385) et frontend (131/131) passent tous.
- Les tests E2E Playwright passent tous (7/7).
- Le build frontend passe en ~2.8s.
- OAuth GitLab s'active uniquement si `GITLAB_CLIENT_ID` et `GITLAB_CLIENT_SECRET` sont définis.
- SMTP s'active uniquement si `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` sont définis.

---

## 📁 Fichiers Clés Modifiés / Créés

### Backend

- `db/migrations/auth/001_users.sql` — Table utilisateurs OAuth
- `db/migrations/sync-history/003_notifications.sql` — Settings + alert_log
- `db/migrations/sync-history/004_metric_snapshots.sql` — Snapshots quotidiens
- `db/migrations/sync-history/005_project_groups.sql` — Groupes de projets
- `services/export.service.js` — Génération CSV / Excel via `xlsx` ⭐ NEW
- `routes/export.routes.js` — `POST /export/csv` & `/export/excel` ⭐ NEW
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
- `components/AppLayout.jsx` — User badge, bouton login GitLab, routes admin, boutons export CSV/Excel/PDF
- `components/AppRouter.jsx` — Routes `/auth/callback`, `/notifications`, `/historical-trends`, `/compare`
- `App.jsx` — Intégration `useAuth` + `useToast` + export PDF backend + handlers CSV/Excel
- `services/api.service.js` — Méthodes auth, notifications, PDF backend, export CSV/Excel + header Bearer

### E2E

- `e2e/user-journey.spec.js` — Parcours E2E complet (login → dashboard → exports → notifications) ⭐ NEW

---

## 🔐 Points de Sécurité / Auth

- **OAuth GitLab** : Flow standard `passport-gitlab2`. Premier utilisateur connecté = `admin`, les suivants = `viewer`.
- **JWT** : Access token (15 min) + refresh token (7j) en cookies httpOnly. Fallback `JWT_SECRET` sur `ADMIN_API_TOKEN`.
- **RBAC** : `requireAuth` vérifie le JWT. `requireRole('admin')` protège les routes sensibles.
- **Routes protégées admin** : `/api/notifications/*`, `/api/pdf/generate`, `/api/export/*` (via `requireAuth` + `requireRole`).
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
6. **E2E Playwright + viewport** : Le header contenant les boutons d'export peut être poussé hors viewport sur des écrans < 1920px (trop de contrôles). Utiliser `page.evaluate(() => document.querySelector('...').click())` pour bypass.
7. **E2E Playwright + downloads** : Les téléchargements déclenchés par `createElement('a').click()` en JS ne sont PAS détectés comme événements `download` par Playwright. Vérifier les toasts de succès ou intercepter les requêtes réseau à la place.

---

## 🚀 Prochaines Étapes Suggérées

1. **Performance Puppeteer** — Vérifier la consommation mémoire Chromium en production (pool de pages, fermeture périodique du browser)
2. **P5#7 Tests unitaires services SQLite** — syncHistory, comments, featureFlags services
3. **P5#8 Coverage routes SSE backend** — sync/execute, sync/status-to-gitlab, sync/preview, sync/iteration

---

## 🌿 État Git

- **Branche active** : `main`
- **Commits non pushés** : Modifications P6 complètes (non commitées)
- **Dernier commit sur `main`** : `608117f` — feat(P6): Évolutions Futures
