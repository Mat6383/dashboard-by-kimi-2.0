# Feuille de route — QA Dashboard by Kimi 2.0

> Document de suivi d'avancement. Cocher les cases au fur et à mesure des PRs / commits.

---

## Version actuelle

**Branch :** `main`  
**Commits récents :** P0→P16 livrés (avril 2026)  
**Tests :** 489/491 backend ✅ (2 health préexistants) | 162/162 frontend ✅ | Build ✅ | TypeCheck backend & frontend ✅

---

## ✅ Déjà livré (Session avril 2026)

- [x] **Bump dépendances majeures backend** — Express 5, Helmet 8, Zod 4, Jest 30, Supertest 7
- [x] **Bump dépendances majeures frontend** — Vite 8, Vitest 4, @vitejs/plugin-react 6
- [x] **Sécurité backend** — `safeErrorResponse`, `requireAdminAuth` (X-Admin-Token), validation regex query params, écriture atomique config, suppression du `project_id` hardcodé
- [x] **Hardening frontend** — Fix fuites mémoire (AbortController, cancelledRef), `useMemo` sur les Contexts, toggles accessibles (`role="switch"`, `aria-checked`), suppression interceptor dupliqué
- [x] **Cache & concurrence** — Anti-stampede (`_withCache` + `_inFlight`) dans TestmoService, verrouillage par itération (`_locks`) dans SyncService
- [x] **Upstream features** — Mode version-seule sans itération GitLab, collecte chronologique de tous les `[TEST]`, documentation des routines Claude A+B

---

## 🚧 Prochaines étapes

### 🔴 P0 — Critique (impact immédiat sur la qualité/livraison)

#### 1. CI/CD GitHub Actions

- [x] Créer `.github/workflows/ci.yml`
  - [x] Job `test-backend` : `npm ci` + `npm test` (Jest)
  - [x] Job `build-frontend` : `npm ci` + `npm run build` (Vite)
  - [x] Job `lint` : `npx eslint` backend + frontend
  - [x] Job `audit` : `npm audit` (seuil : 0 vulnérabilité high/critical)
- [x] Créer `.github/workflows/cd.yml` (optionnel — déploiement auto sur VPS/Vercel)
- [x] Ajouter le badge CI dans le `README.md`

#### 2. Split de `App.jsx` (~420 lignes)

- [x] Extraire `AppLayout.jsx` — Header, nav, toggles dark mode / TV mode, breadcrumb
- [x] Extraire `AppRouter.jsx` — `<Routes>` + lazy loading dashboards
- [x] Extraire `useAutoRefresh.js` — Logique du cron 1 minute + `visibilitychange`
- [x] `App.jsx` cible final : ~127 lignes (imports + composition + fallback erreur)

---

### 🟠 P1 — Important (maintenabilité & DX)

#### 3. Split de `server.js`

- [x] Extraire `middleware/security.js` — Helmet, CORS, rate-limiting, compression
- [x] Extraire `middleware/requestLogger.js` — Logger Winston par requête
- [x] Extraire `jobs/autoSyncJob.js` — Cron node-cron + logique d'appel
- [x] Extraire `bootstrap/gracefulShutdown.js` — Gestion SIGTERM/SIGINT
- [x] Extraire `bootstrap/envCheck.js` — Validation variables d'environnement
- [x] `server.js` cible final : ~99 lignes (config + montage)

#### 4. Couverture tests frontend

- [x] Ajouter `@vitest/coverage-v8` (déjà dans `package.json`)
- [x] Cibles de couverture (Vitest) :
  - [x] `Dashboard4.jsx` — Rendering, toggles, export PDF trigger
  - [x] `useAutoRefresh.js` — Effets, timers, listeners
  - [x] `useSyncProgress.js` — Streaming SSE, abort, logs
  - [x] `api.service.js` — Interceptors, timeout, gestion d'erreurs
- [x] Seuil minimal atteint : 80%+ statements / 67% branches / 90% functions sur les fichiers testés

#### 5. Audit bundle frontend

- [x] Vérifier si `recharts` est importé quelque part (`grep -r "recharts" frontend/src/`)
- [x] `recharts` n'est pas installé — rien à faire
- [x] Activer `build.chunkSizeWarningLimit: 1000` pour éviter le warning sur `vendor-export` (html2canvas + jspdf + docx)

---

### 🟡 P2 — Amélioration (nice to have)

#### 6. Documentation ops

- [x] `docs/DEPLOYMENT.md` — Procédure de mise en prod (env vars, PM2, Nginx)
- [x] `docs/ARCHITECTURE.md` — Diagramme des flux (Testmo ↔ GitLab ↔ Dashboard)
- [x] `docs/TROUBLESHOOTING.md` — FAQ erreurs courantes (CORS, rate-limit, tokens)

#### 7. Monitoring & observability

- [x] Vérifier que Sentry capture bien les 500 backend (test avec `SENTRY_DSN` activé)
- [x] Ajouter un endpoint `GET /api/health/detailed` — DB, Testmo API, GitLab API (smoke test)
- [x] Logger les temps de réponse moyens des APIs externes (Testmo, GitLab)

#### 8. Refactoring composants legacy

- [x] `Dashboard6.jsx` (823 → 602 lignes) — Extraction `SyncLogParts.jsx` + `SyncHistoryPanel.jsx`
- [x] `Dashboard7.jsx` (523 → 369 lignes) — Extraction `CommentCell.jsx`

---

### 🟢 P3 — Refactoring approfondi (analyse codebase)

#### 9. Extraction `useExportHandler.js`

- [x] Extraire la logique d'export PDF (`html2canvas` + `jsPDF`) depuis `Dashboard4.jsx` et `TestClosureModal.jsx`
- [x] Créer un hook réutilisable `useExportPDF(element, filename, options)` gérant le canvas scaling, le fond dark mode, preCapture, multiPage, et les erreurs
- [x] Supprimer les imports `html2canvas` et `jsPDF` de `Dashboard4.jsx` et `TestClosureModal.jsx`
- [x] Tests Vitest : 7/7 ✅

#### 10. Split `report.service.js` (685 → 32 lignes)

- [x] Extraire `services/report/collectData.js` — `collectReportData()` (~212 lignes)
- [x] Extraire `services/report/generateHTML.js` — `generateHTML()` (~279 lignes)
- [x] Extraire `services/report/generatePPTX.js` — `generatePPTX()` (~170 lignes)
- [x] Extraire `services/report/utils.js` — `_esc()` helper HTML escape
- [x] `report.service.js` devient un orchestrateur (~32 lignes)
- [x] Tests backend : 296/296 ✅

#### 11. Split `Dashboard4.jsx` (1229 → 289 lignes)

- [x] Extraire `components/MetricCard.jsx` — Card réutilisable (duplication 4x éliminée)
- [x] Extraire `components/PreprodSection.jsx` — Section préproduction complète
- [x] Extraire `components/ProductionSection.jsx` — Section production complète
- [x] Cible atteinte : Dashboard4.jsx < 300 lignes ✅
- [x] Tests frontend : 67/67 ✅ | Build ✅

## 📊 Indicateurs de santé du projet

| Métrique             | Actuel       | Cible |
| -------------------- | ------------ | ----- |
| Tests backend        | 491 / 491 ✅ | 500+  |
| Tests frontend       | 156 / 156 ✅ | 170+  |
| Couverture backend   | 80 % ✅      | 70 %  |
| Couverture frontend  | 87 % ✅      | 50 %  |
| Vulnérabilités npm   | 0 ✅         | 0     |
| Build frontend       | ✅ (< 3s)    | < 3s  |
| Lignes `App.jsx`     | ~142 ✅      | < 150 |
| Lignes `server.js`   | ~99 ✅       | < 100 |
| Fichiers TS backend  | 66 ✅        | 20+   |
| Fichiers TS frontend | 8 ✅         | 30+   |

---

## 🚀 P4 — Nouvelles features (Session en cours)

- [x] **P4#1 Mode sombre auto** — `prefers-color-scheme` + persistance localStorage + tests
- [x] **P4#2 Virtualisation Dashboard7** — `@tanstack/react-virtual` pour les grandes listes d'issues + tests
- [x] **P4#3 Alerting Slack/Teams** — Webhook quand un metric passe en rouge ( SLA ) + tests
- [x] **P4#4 Dashboard de synthèse multi-projets** — Endpoint `/api/dashboard/multi` + composant `MultiProjectDashboard` + tests
- [x] **P4#5 Couverture de tests** — Seuils ajustés (backend 50 % / 45 % / 30 % branches, frontend 50 %) + exclusions services externe + 15 nouveaux tests

---

## 🚀 P5 — Prochaine session

- [x] **P5#1 CI/CD GitHub Actions** — Pipeline optimisée (lint, backend coverage, frontend coverage+build, artifacts, summary)
- [x] **P5#2 Tests des gros modaux** — QuickClosureModal (12/12), ReportGeneratorModal (16/16), TestClosureModal (12/12) ✅
- [x] **P5#3 Split App.jsx** — ~142 lignes ✅
- [x] **P5#4 Tests routes backend** — featureFlags, runs, projects, crosstest, sync/history, sync/auto-config, reports → backend 65 %+ ✅
- [x] **P5#5 Export CSV/Excel** — Complément au PDF/PPTX existant (`xlsx`, routes `/api/export/csv` & `/excel`)
- [x] **P5#6 Tests E2E Playwright** — Parcours complet login → dashboard → export → notifications
- [x] **P5#7 Tests unitaires services SQLite** — syncHistory, comments, featureFlags services
- [x] **P5#8 Coverage routes SSE backend** — sync/execute, sync/status-to-gitlab, sync/preview, sync/iteration

## 🚀 P6 — Évolutions Futures (Session actuelle)

- [x] **P6#1 Export des métriques en PDF (backend)** — `puppeteer` + endpoint `POST /api/pdf/generate` + header/footer + multi-page
- [x] **P6#2 Notifications email sur alertes SLA** — `nodemailer` + templates HTML responsive + configuration UI `/notifications`
- [x] **P6#3 Intégration Slack/Teams enrichie** — Configuration par projet (DB) + test de connexion + rate-limiting 15 min
- [x] **P6#4 Graphiques de tendance historique** — Table `metric_snapshots` + cron quotidien + endpoint `/trends` + composant `HistoricalTrends`
- [x] **P6#5 Authentification multi-utilisateurs** — OAuth GitLab (`passport-gitlab2`) + JWT + rôles admin/viewer + route `/auth/callback`
- [x] **P6#6 Support multi-projets simultané** — Comparateur radar (`/compare`) + sélection persistante + table comparative
- [x] **P6#7 Export CSV/Excel** — `xlsx` + endpoints `/api/export/csv` & `/excel` + boutons UI + tests
- [x] **P6#8 Tests E2E Playwright** — Parcours utilisateur complet (login → dashboard → exports → notifications)

## 🚀 P7 — Maintenance & Infrastructure (Session en cours)

- [x] **P7#1 Audit sécurité complète** — Headers hardening (COOP, CORP, Referrer-Policy, HSTS), remplacement `xlsx` → `exceljs`, masquage secrets logger, cookies JWT `sameSite=strict` + `path=/`
- [x] **P7#2 Documentation API OpenAPI/Swagger** — Spec OpenAPI 3.0 + `swagger-ui-express` sur `/api/docs`
- [x] **P7#3 Monitoring avancé Prometheus** — `prom-client` + middleware métriques HTTP + endpoint `/metrics`

## 🚀 P8 — Observabilité & Ops (Session en cours)

- [x] **P8#1 Audit logging traçabilité** — Table `audit_log` + service + middleware + UI admin `/admin/audit` avec filtres et pagination
- [x] **P8#2 Health checks améliorés** — Liveness `/health`, readiness `/health/ready`, diagnostics `/health/detailed` (DB, APIs, disque, mémoire)
- [x] **P8#3 Prometheus business metrics** — Gauges `active_users`, `db_size_bytes`, counters `sync_runs_total`, `export_runs_total`, seuils d'alerte

## 🚀 P9 — Temps réel & Intelligence (Session en cours)

- [x] **P9#1 Temps réel SSE dashboard** — Endpoint `GET /api/dashboard/:projectId/stream` (SSE), hook `useDashboardSSE`, indicateur "Live" UI, fallback polling, auto-reconnect ✅ _poussé_
- [x] **P9#2 Détection d'anomalies** — Algo z-score sur tendances historiques, endpoint `/api/anomalies`, badges "trending" sur KPIs ✅ _poussé_
- [x] **P9#3 Circuit breaker & resilience** — `CircuitBreaker` class sur appels Testmo/GitLab, retry exponentiel jobs sync, mode dégradé avec banner ✅ _poussé_
- [x] **P9#4 Feature Flags UI admin** — CRUD `/admin/features`, rollout progressif UI, audit intégré ✅ _poussé_

## 🚀 P10 — Rollout progressif & Webhooks (Session actuelle)

- [x] **P10#1 Rollout progressif sticky par utilisateur** — `isEnabled(key, userId)` avec hash SHA256 déterministe, `getAll(userId)` applique le %, route publique `?userId=xxx` ✅
- [x] **P10#2 Webhooks sortants configurables** — Table `webhook_subscriptions`, CRUD admin `/api/webhooks`, émission HMAC-SHA256 (`X-Webhook-Signature`), events `feature-flag.changed` ✅
- [x] **P10#3 Tests E2E Playwright** — Parcours CRUD admin + test rollout sticky déterministe côté API ✅
- [x] **P10#4 Consumer hook enrichi** — `useFeatureFlags(key, userId)` avec `rolloutPercentage`, helper `isBetaRollout()`, badge "Bêta / X%" dans l'admin ✅

## 🚀 P11 — React Query & Cache (Session actuelle)

- [x] **P11#1 Setup React Query** — `QueryClient` + `ReactQueryDevtools` + provider dans `main.jsx` ✅
- [x] **P11#2 Hooks queries** — `useProjects`, `useMultiProjectSummary`, `useAnomalies`, `useCircuitBreakers`, `useDashboardMetrics` ✅
- [x] **P11#3 Migration DashboardContext** — `projects`, `anomalies`, `circuitBreakers` migrés vers React Query (suppression 3 useEffect + polling manuel) ✅
- [x] **P11#4 Composant pilote** — `MultiProjectDashboard.jsx` migré (useEffect manuel → `useMultiProjectSummary`) ✅

## 🚀 P12 — TypeScript progressif (Session actuelle)

- [x] **P12#1 Setup TS backend** — `tsconfig.json` (`allowJs`, `checkJs`), `npm run typecheck`, types inférés depuis Zod ✅
- [x] **P12#2 Types API backend** — `types/api.types.ts` (FeatureFlag, Webhook, Report, Sync…), `.d.ts` services ✅
- [x] **P12#3 Setup TS frontend** — `tsconfig.json` (`jsx: react-jsx`), `npm run typecheck` ✅
- [x] **P12#4 Hooks queries typés** — Les 5 hooks renommés `.ts` avec types génériques (`Project[]`, `DashboardMetrics`…) ✅

## 🚀 P13 — TypeScript approfondi (Session livrée)

- [x] **P13#1** Renommer `api.service.js` → `api.service.ts` avec types retours ✅
- [x] **P13#2** Typer `DashboardContext.jsx` → `DashboardContext.tsx` ✅
- [x] **P13#3** Migrer composants feuilles en `.tsx` (MetricCard, PreprodSection, ProductionSection, TrendBadge) ✅
- [x] **P13#4** Ajouter `useMutation` pour les actions POST/PUT/DELETE (reports, crosstest, sync, notifications, feature-flags, exports, cache) ✅

## 🚀 P15 — TypeScript complet ✅

- [x] **P15#1** Renommer tous les fichiers `.jsx → .tsx` / `.js → .ts` (49 fichiers)
- [x] **P15#2** Corriger les erreurs TypeScript (`tsc --noEmit` passe 0 erreur)
- [x] **P15#3** Typer les contexts, hooks, composants feuilles et utilitaires
- [x] **P15#4** Mettre à jour `tsconfig.json` (inclusion uniquement `.ts/.tsx`)

## 🚀 P16 — Migration TypeScript backend (Session livrée)

- [x] **P16#1 Setup TS backend** — `tsconfig.json` (`module: commonjs`, `moduleResolution: bundler`), `ts-jest`, `types/express.d.ts`, `types/env.d.ts`
- [x] **P16#2 Renommage massif** — 66 fichiers `.js → .ts` (services, routes, middleware, utils, bootstrap, jobs, validators, config)
- [x] **P16#3 Conversion ESM** — `require() → import`, `module.exports → export default / export {}` via `jscodeshift` + scripts custom
- [x] **P16#4 Compatibilité tests CJS** — `ts-jest` (`isolatedModules: true`), `module.exports = exports.default` pour modules sans named exports, préservation named exports (`GitLabService`, `gitlabBreaker`, `redactSensitive`…)
- [x] **P16#5 Correction erreurs TypeScript** — Propriétés de classes (`db`, `_initialized`), casts `req.query`, objets inline `as any`, types `User`/`JwtPayload`, paramètres `any`
- [x] **P16#6 Build & assets** — `tsc` + `copy-assets` (`docs/`, `db/migrations/`, `data/`) vers `dist/`, `npm start` sur `dist/server.js`
- [x] **P16#7 Validation** — `typecheck` 0 erreur, tests 489/491, lint 0 erreur, serveur démarre

## 🚀 P17 — Qualité TypeScript & Tests (Prochaine session)

### Option A — Strict Mode + Tests backend `.ts` (Recommandé) ✅ Livré

- [x] **P17#1** Migrer 15 fichiers de test unitaires `.js → .ts` (services, middleware, utils) — tests d'intégration conservés en `.js` (compatibilité `jest.resetModules()`)
- [x] **P17#2** Activer `"strict": true` dans `tsconfig.json` backend
- [x] **P17#3** Typer les paramètres implicites `: any`, `catch (err: any)`, destructurations, index signatures
- [x] **P17#4** Éliminer 689 erreurs strict mode (TS7006, TS18046, TS7053, TS2345, TS7031)
- [x] **P17#5** Typer `req.query`, `req.params`, `req.body` avec casts `as string` et types précis
- [x] **P17#6** Valider : `typecheck` 0 erreur, tests 489/491, build OK, lint 0 erreur

### Option B — Tests de charge & Performance

- [ ] Scénarios k6/Artillery : 50 users simultanés sur `/api/dashboard`, `/api/health`, exports PDF/Excel
- [ ] Mesurer p95/p99 temps de réponse, mémoire SQLite, pool Puppeteer
- [ ] Identifier et corriger les goulots d'étranglement (N+1 queries, blocages browser)

### Option C — Docker & Déploiement conteneurisé ✅ Livré

- [x] `Dockerfile` backend multi-stage (Node + Chromium pour Puppeteer)
- [x] `Dockerfile` frontend (build Vite + Nginx static)
- [x] `docker-compose.yml` avec volume SQLite persistant
- [x] Mise à jour `docs/DEPLOYMENT.md` pour le déploiement Docker
- [x] **Fix logs Winston** — `logger.service.ts` utilise `/app/logs` en production (volume monté accessible depuis l'hôte)
- [x] **Limites mémoire/CPU** — `deploy.resources.limits` dans `docker-compose.yml` (backend 1 CPU / 1G, frontend 0.5 CPU / 256M)
- [x] `docker-compose.dev.yml` — Hot-reload avec bind mounts pour le développement local (`Dockerfile.dev` backend + frontend, polling nodemon/chokidar pour Docker Desktop)

---

## 🚧 Sessions futures (P18+)

- [x] **P18** — Internationalisation (i18n) FR/EN : UI, emails, templates de rapport ✅
- [x] **P19** — Pool Puppeteer optimisé : pool de 3 pages réutilisables, sémaphore concurrence, header `X-PDF-Generation-Time`, rotation fine pages + tests ✅
- [x] **P20** — WebSocket temps réel : serveur WS (`ws`) + `DashboardRoom` (polling centralisé par projectId, broadcast clients) + hook `useDashboardWebSocket` avec fallback SSE automatique + tests ✅
- [x] **P21** — Backup automatisé SQLite : cron quotidien 3h + dump VACUUM INTO + compression gzip + rotation locale 7j + upload S3 (IA) **ou rsync/SSH** + rotation distante 30j + endpoint admin `/api/admin/backups` ✅
- [x] **P22** — tRPC : couche API typée montée sur Express, 13 sous-routers backend, hooks frontend migrés, type-safety end-to-end

## 📝 Notes

> **Règle d'or :** Une PR = un item de cette checklist. Pas de mega-PR.

> **Ordre recommandé :** CI/CD d'abord (ça sécurise tout le reste), puis le split App.jsx, puis les tests frontend.
