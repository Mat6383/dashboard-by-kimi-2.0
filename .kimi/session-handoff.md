# Handoff Session - QA Dashboard by Kimi 2.0

> Dernière mise à jour : 2026-04-28
> Session précédente : **P8 — Observabilité & Ops (terminée)**

---

## 🏗️ Architecture & Setup Local

| Composant                  | Port   | Commande                     |
| -------------------------- | ------ | ---------------------------- |
| Backend (Express + SQLite) | `3001` | `cd backend && npm run dev`  |
| Frontend (Vite)            | `3002` | `cd frontend && npm run dev` |

**⚠️ Important :** Le frontend **doit** utiliser `VITE_API_URL=/api` (relatif) pour passer par le proxy Vite et éviter les erreurs CORS. Le fichier `frontend/.env` contient déjà cette valeur.

---

## ✅ État des Tâches (Roadmap P0 → P8 — TOUTES LIVRÉES)

| Tâche                          | Statut | Notes                                                                                                                                        |
| ------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| P6#1 Export PDF Backend        | ✅     | `puppeteer` + `POST /api/pdf/generate` (A4, header/footer, multi-page)                                                                       |
| P6#2 Notifications Email SLA   | ✅     | `nodemailer` + templates HTML + UI `/notifications`                                                                                          |
| P6#3 Slack/Teams enrichi       | ✅     | Config par projet (DB) + test connexion + rate-limit 15 min                                                                                  |
| P6#4 Tendances historiques     | ✅     | `metric_snapshots` + cron 2h + `/trends` + `HistoricalTrends`                                                                                |
| P6#5 Auth OAuth GitLab         | ✅     | `passport-gitlab2` + JWT + rôles admin/viewer + `/auth/callback`                                                                             |
| P6#6 Comparateur multi-projets | ✅     | Radar chart `/compare` + `CompareDashboard` + table comparative                                                                              |
| P6#7 Export CSV/Excel          | ✅     | `xlsx` + `POST /api/export/csv` & `/excel` — métriques + runs + SLA                                                                          |
| P6#8 Tests E2E Playwright      | ✅     | Parcours complet login → dashboard → export CSV/Excel/PDF → notifications                                                                    |
| P5#7 Tests SQLite services     | ✅     | 19 tests — syncHistory, comments, featureFlags services (couverture 92-100%)                                                                 |
| P5#8 Coverage routes SSE       | ✅     | 50 tests routes — sync/execute, status-to-gitlab, preview, iteration (sync.routes.js 96%+)                                                   |
| P7#1 Audit sécurité complète   | ✅     | Headers hardening (COOP, CORP, Referrer-Policy, HSTS), `xlsx` → `exceljs`, masquage secrets logger, cookies JWT `sameSite=strict` + `path=/` |
| P7#2 OpenAPI/Swagger           | ✅     | Spec OpenAPI 3.0 complète + `swagger-ui-express` sur `/api/docs`                                                                             |
| P7#3 Monitoring Prometheus     | ✅     | `prom-client` + middleware HTTP metrics + endpoint `/metrics`                                                                                |
| P8#1 Audit logging             | ✅     | Table `audit_log` + service + middleware + UI `/admin/audit`                                                                                 |
| P8#2 Health checks améliorés   | ✅     | Liveness `/health`, readiness `/health/ready`, diagnostics détaillés                                                                         |
| P8#3 Prometheus business       | ✅     | Gauges `active_users`, `db_size`, counters `sync_runs`, `export_runs`                                                                        |

---

## 🐛 Bugs Connus / Problèmes Actifs

**Aucun bug critique connu.**

- Les tests backend (444/444) et frontend (137/137) passent tous.
- Les tests E2E Playwright passent tous (7/7).
- Le build frontend passe en ~2.8s.
- OAuth GitLab s'active uniquement si `GITLAB_CLIENT_ID` et `GITLAB_CLIENT_SECRET` sont définis.
- SMTP s'active uniquement si `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` sont définis.

---

## 📁 Fichiers Clés Modifiés / Créés

### Backend — P8

- `db/migrations/audit/001_init.sql` — Table `audit_log` avec indexes
- `services/audit.service.js` — CRUD audit + prune + redaction
- `middleware/audit.middleware.js` — `auditAction()` factory non-bloquante
- `routes/audit.routes.js` — `GET /api/audit` (admin only, paginé, filtré)
- `jobs/auditPruneJob.js` — Nettoyage périodique des logs (rétention configurable)
- `routes/health.routes.js` — `/health` (liveness), `/health/ready` (readiness), `/health/detailed` (diagnostics complets)
- `middleware/metrics.js` — Nouvelles métriques business : `active_users`, `db_size_bytes`, `sync_runs_total`, `export_runs_total`, `alert_threshold`
- `middleware/auth.middleware.js` — Log RBAC denials dans audit

### Backend — P7

- `middleware/security.js` — Headers hardening : COOP, CORP, Referrer-Policy, HSTS
- `middleware/prometheus.js` — `prom-client` : histogram HTTP, gauge actif, middleware collecte métriques
- `routes/metrics.routes.js` — `GET /metrics` exposition Prometheus
- `docs/openapi.yaml` — Spec OpenAPI 3.0 complète (paths, schemas, securitySchemes)
- `routes/docs.routes.js` — Montage `swagger-ui-express` sur `/api/docs`
- `services/export.service.js` — Migration `xlsx` → `exceljs` (stream + sécurité)
- `utils/logger.js` — Redaction automatique des secrets (`password`, `token`, `secret`, `cookie`) en mode prod
- `services/auth/jwt.service.js` — Cookies JWT : `sameSite=strict` + `path=/`
- `routes/*.routes.js` — Ajout `router.get('/openapi', ...)` ou référence spec YAML

### Frontend — inchangé depuis P6

- `hooks/useAuth.js` — État auth, login/logout, token
- `components/AuthCallback.jsx` — Consomme token OAuth post-redirect
- `components/NotificationSettings.jsx` — UI config email + webhooks
- `components/HistoricalTrends.jsx` — Chart.js Line avec range + granularité
- `components/CompareDashboard.jsx` — Radar chart + table comparative
- `components/AppLayout.jsx` — User badge, bouton login GitLab, routes admin (+ lien Audit Logs), boutons export CSV/Excel/PDF
- `components/AppRouter.jsx` — Routes `/auth/callback`, `/notifications`, `/historical-trends`, `/compare`, `/admin/audit`
- `components/AuditLogViewer.jsx` — Table paginée des logs d'audit avec filtres (action, date) et dark mode
- `App.jsx` — Intégration `useAuth` + `useToast` + export PDF backend + handlers CSV/Excel
- `services/api.service.js` — Méthodes auth, notifications, PDF backend, export CSV/Excel, audit logs + header Bearer

### E2E — inchangé depuis P6

- `e2e/user-journey.spec.js` — Parcours E2E complet (login → dashboard → exports → notifications)

---

## 🔐 Points de Sécurité / Auth (mis à jour P7)

- **Headers HTTP** : Helmet configuré + COOP (`same-origin`), CORP (`cross-origin`), Referrer-Policy (`strict-origin-when-cross-origin`), HSTS (max-age 31536000 inclSubDomains).
- **Cookies JWT** : `httpOnly`, `secure` (en prod), `sameSite=strict`, `path=/`.
- **Logger** : Redaction automatique des champs sensibles en JSON. En dev, les objets restent visibles pour le debug.
- **Export Excel** : `exceljs` remplace `xlsx` (stream + pas de formules interprétées = risque XSS réduit).
- **OAuth GitLab** : Flow standard `passport-gitlab2`. Premier utilisateur connecté = `admin`, les suivants = `viewer`.
- **JWT** : Access token (15 min) + refresh token (7j) en cookies httpOnly. Fallback `JWT_SECRET` sur `ADMIN_API_TOKEN`.
- **RBAC** : `requireAuth` vérifie le JWT. `requireRole('admin')` protège les routes sensibles.
- **Routes protégées admin** : `/api/notifications/*`, `/api/pdf/generate`, `/api/export/*` (via `requireAuth` + `requireRole`).
- **Routes legacy admin** : `/api/cache/*`, `/api/feature-flags/*` conservent `requireAdminAuth` (X-Admin-Token).
- **CORS** : `credentials: true` supporte les cookies cross-origin.

---

## 📊 Monitoring & Observabilité (mis à jour P8)

- **Prometheus** : Endpoint `GET /metrics` exposé par `prom-client`.
- **Métriques HTTP** (P7) :
  - `http_request_duration_seconds` (histogram) — par méthode, route, status
  - `http_requests_total` (counter) — par méthode, route, status
  - `nodejs_*` — métriques runtime Node.js par défaut
- **Métriques business** (P8) :
  - `qa_dashboard_active_users` (gauge) — incrémenté au login, décrémenté au logout
  - `qa_dashboard_db_size_bytes` (gauge) — taille SQLite mesurée à chaque scrape
  - `qa_dashboard_sync_runs_total` (counter) — par statut `success`/`failure`
  - `qa_dashboard_export_runs_total` (counter) — par format `pdf`/`csv`/`excel`/`pptx`
  - `qa_dashboard_alert_threshold` (gauge) — seuils configurables via env vars
- **Health checks** (P8) :
  - `GET /api/health` — Liveness probe (léger)
  - `GET /api/health/ready` — Readiness probe (DB + APIs externes, retourne 503 si dégradé)
  - `GET /api/health/detailed` — Diagnostics complets (mémoire, disque, temps de réponse, stats APIs)
- **Intégration** : Le middleware `prometheus.js` est monté avant les routes dans `server.js`. Le job `auditPruneJob.js` s'exécute toutes les 24h.

---

## 📖 Documentation API (nouveau P7)

- **OpenAPI 3.0** : Spec complète dans `backend/docs/openapi.yaml` (~1200 lignes).
- **Swagger UI** : Disponible sur `http://localhost:3001/api/docs` (ou `/api/docs` via le proxy Vite).
- **Authentification** : Le bouton "Authorize" supporte `BearerAuth` (JWT) et `AdminToken` (X-Admin-Token).

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
8. **Headers hardening** : `helmet()` par défaut ne suffit pas. Toujours vérifier avec `curl -I` ou un outil comme securityheaders.com les headers COOP/CORP/Referrer-Policy/HSTS.
9. **Prometheus + Express** : Le middleware de collecte doit être monté **avant** les routes pour capturer tout. Le endpoint `/metrics` doit être monté **après** pour ne pas s'auto-mesurer en boucle.

---

## 🛡️ Audit Logging (nouveau P8)

- **Table** : `audit_log` dans SQLite (`sync-history.db`) avec indexes sur `timestamp`, `actor_id`, `action`.
- **Middleware** : `auditAction(action, options)` — écriture non-bloquante sur `res.on('finish')`, redaction automatique des secrets via `logger.redactSensitive`.
- **Routes auditées** : cache/clear, feature-flags, sync/execute, sync/auto-config, reports/generate, export/_, pdf/generate, notifications/_.
- **RBAC denials** : Logués automatiquement dans `auth.middleware.js`.
- **Rétention** : `AUDIT_RETENTION_DAYS` (défaut 90) + job `auditPruneJob.js` (cron 24h).
- **UI** : `/admin/audit` — table paginée 50 lignes, filtres action/date, admin uniquement.

---

## 🚀 Prochaines Étapes Suggérées (P9 — à définir)

La feuille de route P0→P8 est entièrement complète. Quelques pistes pour une future session P9 :

1. **Performance Puppeteer** — Pool de pages, fermeture périodique du browser, mesure mémoire
2. **Feature flags avancés** — UI de gestion des flags, rolling percentage, ciblage par utilisateur
3. **Internationalisation (i18n)** — Traduction FR/EN des UI et emails
4. **Audit logging** — Table `audit_logs` traçant toutes les actions admin (exports, sync, config)
5. **Backup automatisé SQLite** — Cron de dump + upload S3 / rsync
6. **Tests de charge (k6/Artillery)** — Valider les seuils de performance sous charge

---

## 🌿 État Git

- **Branche active** : `main`
- **Commits non pushés** : Aucun (tout pushé sur `origin/main`)
- **Dernier commit sur `main`** : `c115c73` — feat(P8): Observabilité & Ops — audit logging, health checks, Prometheus business metrics
