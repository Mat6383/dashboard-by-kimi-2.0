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

| Métrique            | Actuel       | Cible |
| ------------------- | ------------ | ----- |
| Tests backend       | 296 / 296 ✅ | 350+  |
| Tests frontend      | 60 / 60 ✅   | 80+   |
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
