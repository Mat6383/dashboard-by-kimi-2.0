# Feuille de route — QA Dashboard by Kimi 2.0

> Document de suivi d'avancement. Cocher les cases au fur et à mesure des PRs / commits.

---

## Version actuelle

**Branch :** `main`  
**Commits récents :** 5 commits de hardening (avril 2026)  
**Tests :** 291/291 backend ✅ | Build frontend ✅

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

- [ ] Extraire `AppLayout.jsx` — Header, nav, toggles dark mode / TV mode, breadcrumb
- [ ] Extraire `AppRouter.jsx` — `<Routes>` + lazy loading dashboards
- [ ] Extraire `useAutoRefresh.js` — Logique du cron 1 minute + `visibilitychange`
- [ ] Extraire `useExportHandler.js` — Gestion du PDF export via `html2canvas` + `jsPDF`
- [ ] `App.jsx` cible final : < 100 lignes (imports + composition uniquement)

---

### 🟠 P1 — Important (maintenabilité & DX)

#### 3. Split de `server.js`

- [ ] Extraire `middleware/security.js` — Helmet, CORS, rate-limiting, compression
- [ ] Extraire `middleware/logging.js` — Request ID + logger Winston
- [ ] Extraire `jobs/autoSyncJob.js` — Cron node-cron + logique d'appel
- [ ] Extraire `bootstrap/gracefulShutdown.js` — Gestion SIGTERM/SIGINT
- [ ] `server.js` cible final : < 80 lignes (config + montage)

#### 4. Couverture tests frontend

- [ ] Ajouter `@vitest/coverage-v8` (déjà dans `package.json`)
- [ ] Cibles de couverture (Vitest) :
  - [ ] `Dashboard4.jsx` — Rendering, toggles, export PDF trigger
  - [ ] `GitLabToTestmoSync.jsx` — Formulaire, états SSE, erreurs
  - [ ] `useFeatureFlags.js` — Fetch, toggle, error state
  - [ ] `api.service.js` — Interceptors, retry, timeout
- [ ] Seuil minimal : 60 % lines / 50 % branches sur `src/components` et `src/hooks`

#### 5. Audit bundle frontend

- [ ] Vérifier si `recharts` est importé quelque part (`grep -r "recharts" frontend/src/`)
- [ ] Si mort : `npm uninstall recharts` + commit
- [ ] Si utilisé : migrer vers `chart.js` (déjà en place) pour unifier
- [ ] Activer `build.chunkSizeWarningLimit` ou splitter `vendor-export` (> 500 kB)

---

### 🟡 P2 — Amélioration (nice to have)

#### 6. Documentation ops

- [ ] `docs/DEPLOYMENT.md` — Procédure de mise en prod (env vars, PM2, Nginx)
- [ ] `docs/ARCHITECTURE.md` — Diagramme des flux (Testmo ↔ GitLab ↔ Dashboard)
- [ ] `docs/TROUBLESHOOTING.md` — FAQ erreurs courantes (CORS, rate-limit, tokens)

#### 7. Monitoring & observability

- [ ] Vérifier que Sentry capture bien les 500 backend (test avec `SENTRY_DSN` activé)
- [ ] Ajouter un endpoint `GET /api/health/detailed` — DB, Testmo API, GitLab API (smoke test)
- [ ] Logger les temps de réponse moyens des APIs externes (Testmo, GitLab)

#### 8. Refactoring composants legacy

- [ ] `Dashboard6.jsx` (~740 lignes) — Splitter en sous-composants (ConfigPanel, SyncPanel, StatusPanel)
- [ ] `Dashboard7.jsx` (~530 lignes) — Extraire `IssueTable.jsx`, `CommentThread.jsx`

---

## 📊 Indicateurs de santé du projet

| Métrique            | Actuel       | Cible |
| ------------------- | ------------ | ----- |
| Tests backend       | 291 / 291 ✅ | 350+  |
| Tests frontend      | 29 ✅        | 80+   |
| Couverture backend  | ~? %         | 70 %  |
| Couverture frontend | ~? %         | 60 %  |
| Vulnérabilités npm  | 0 ✅         | 0     |
| Build frontend      | ✅           | < 3s  |
| Lignes `App.jsx`    | ~420         | < 100 |
| Lignes `server.js`  | ~170         | < 80  |

---

## 📝 Notes

> **Règle d'or :** Une PR = un item de cette checklist. Pas de mega-PR.

> **Ordre recommandé :** CI/CD d'abord (ça sécurise tout le reste), puis le split App.jsx, puis les tests frontend.
