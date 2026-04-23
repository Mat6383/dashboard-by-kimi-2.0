# Architecture — QA Dashboard by Kimi 2.0

> Vue d'ensemble technique du système, des flux de données et des décisions d'architecture.

---

## Overview

Le QA Dashboard est une application **full-stack** qui orchestre la synchronisation bidirectionnelle entre **Testmo** (gestion des tests) et **GitLab** (gestion des issues/work items).

```
┌─────────────────────────────────────────────────────────────┐
│                        UTILISATEUR                           │
│                   (Navigateur Web)                           │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      NGINX (Reverse Proxy)                   │
│  • Sert les assets statiques (frontend/dist)                 │
│  • Route /api/* vers le backend Express                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
         ┌─────────────┴─────────────┐
         ▼                           ▼
┌─────────────────┐       ┌─────────────────┐
│  REACT + VITE   │       │  EXPRESS 5      │
│  (Frontend)     │       │  (Backend)      │
│                 │       │                 │
│  Dashboard 1-8  │◄─────►│  Routes API     │
│  Vue TV, PDF    │       │  Services       │
│  Rapports       │       │  Middlewares    │
└─────────────────┘       └────────┬────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
              ┌─────────┐   ┌──────────┐   ┌──────────┐
              │ TESTMO  │   │  GITLAB  │   │ SQLITE   │
              │   API   │   │ REST+GQL │   │ (local)  │
              └─────────┘   └──────────┘   └──────────┘
```

---

## Stack technique

| Couche         | Technologie                   | Version         |
| -------------- | ----------------------------- | --------------- |
| **Frontend**   | React + Vite                  | 18.2 / 8.0      |
| **Charts**     | Chart.js + react-chartjs-2    | 4.4 / 5.2       |
| **Export**     | html2canvas + jsPDF + docx    | 1.4 / 4.2 / 9.6 |
| **Backend**    | Express + Helmet + CORS       | 5.1 / 8.1       |
| **Validation** | Zod                           | 4.3             |
| **Cache**      | In-memory Map (TestmoService) | —               |
| **DB locale**  | better-sqlite3                | —               |
| **Tests BE**   | Jest + Supertest              | 30.3 / 7.2      |
| **Tests FE**   | Vitest + Testing Library      | 4.1 / 14.2      |
| **CI/CD**      | GitHub Actions                | —               |
| **Process**    | PM2 (production)              | —               |

---

## Flux de données principaux

### 1. Dashboard Standard (lecture Testmo)

```
User ──► /api/dashboard/:projectId ──► testmoService.getDashboardMetrics()
                                          │
                                          ▼
                                    Testmo API v1
                                          │
                                          ▼
                                    { metrics, runs, qualityRates }
```

**Points clés :**

- Cache en mémoire 30s (anti-stampede avec `_withCache` + `_inFlight`)
- Paramètres `preprodMilestones` et `prodMilestones` validés par regex Zod
- `AbortController` côté frontend pour annuler les requêtes en cours

### 2. Sync GitLab → Testmo (écriture)

```
User ──► POST /api/sync/execute ──► syncService.syncIteration()
                                        │
                                        ├──► gitlabService.getIssuesForIteration()
                                        │         └── GitLab REST API
                                        ├──► testmoService.createOrUpdateCase()
                                        │         └── Testmo API v1
                                        └──► SSE events ──► Frontend
```

**Points clés :**

- Verrouillage par itération (`_locks` Map) — pas de sync concurrente
- Extraction des steps depuis les notes GitLab (`[TEST]`, `[PRÉREQUIS]`...)
- Toutes les sections `[TEST]` collectées chronologiquement

### 3. Sync Testmo → GitLab Status (écriture)

```
Cron ──► autoSyncJob.runAutoSync() ──► statusSyncService.syncRunStatusToGitLab()
                                            │
                                            ├──► Testmo API : run results
                                            ├──► GitLab GraphQL : updateWorkItemStatus
                                            └──► Logs
```

**Points clés :**

- Cron : lun-ven 8h-18h toutes les 5 min
- 3 modes : itération seule, itération+version, version seule
- Mapping statuts : Passed→Test OK, Failed→Test KO, etc.

### 4. CrossTest Dashboard 7 (lecture/écriture GitLab)

```
User ──► /api/crosstest/* ──► commentsService (SQLite)
                                   │
                                   ├──► gitlabService (itérations + issues)
                                   └──► better-sqlite3 (comments locaux)
```

---

## Architecture backend

```
backend/
├── server.js                 # Point d'entrée (< 100 lignes)
├── bootstrap/
│   ├── envCheck.js           # Validation variables d'environnement
│   └── gracefulShutdown.js   # Gestion SIGTERM/SIGINT
├── middleware/
│   ├── security.js           # Helmet + CORS + Rate-limiting
│   ├── requestId.js          # Correlation ID (x-request-id)
│   ├── requestLogger.js      # Logging Winston par requête
│   └── adminAuth.js          # Protection endpoints admin (X-Admin-Token)
├── routes/
│   ├── health.routes.js
│   ├── dashboard.routes.js
│   ├── sync.routes.js
│   └── ... (9 routers)
├── services/
│   ├── testmo.service.js     # Client Testmo API + cache
│   ├── gitlab.service.js     # Client GitLab REST + GraphQL
│   ├── sync.service.js       # Logique sync GitLab → Testmo
│   ├── status-sync.service.js# Logique sync Testmo → GitLab
│   ├── logger.service.js     # Winston (JSON en prod)
│   └── ... (12 services)
├── validators/
│   └── index.js              # Schémas Zod 4
└── tests/
    └── *.test.js             # 291 tests Jest
```

### Sécurité

| Couche           | Implémentation                                    |
| ---------------- | ------------------------------------------------- |
| Headers          | Helmet (CSP, HSTS, X-Frame-Options)               |
| CORS             | Multi-origines via `FRONTEND_URL`                 |
| Rate-limiting    | 200 req/min global, 20 req/min routes lourdes     |
| Auth admin       | `X-Admin-Token` header + `ADMIN_API_TOKEN` env    |
| Erreurs 500      | `safeErrorResponse()` — message générique en prod |
| Input validation | Zod 4 sur params, query, body                     |

---

## Architecture frontend

```
frontend/src/
├── App.jsx                   # Orchestration (< 130 lignes)
├── components/
│   ├── AppLayout.jsx         # Header + Footer + contrôles globaux
│   ├── AppRouter.jsx         # Routes + lazy loading
│   ├── Dashboard4.jsx        # Vue globale + export PDF
│   └── ... (15+ composants)
├── hooks/
│   ├── useAutoRefresh.js     # Cycle de vie des données
│   ├── useDashboard.js       # État global + fetch
│   ├── useFeatureFlags.js    # Feature toggles
│   └── ... (8 hooks)
├── contexts/
│   ├── DashboardContext.jsx
│   ├── ThemeContext.jsx
│   └── ... (4 contexts)
└── services/
    └── api.service.js        # Client Axios + interceptors
```

### Optimisations frontend

| Technique       | Fichier                                                                |
| --------------- | ---------------------------------------------------------------------- |
| Lazy loading    | `AppRouter.jsx` (9 dashboards)                                         |
| Code splitting  | `manualChunks` : vendor-react, vendor-charts, vendor-export, vendor-ui |
| Memoization     | `useMemo` sur contexts + `React.memo` sur `AlertItem`                  |
| AbortController | `useFeatureFlags`, `useSyncProgress`, `Dashboard5/6`                   |
| A11y            | Toggles `role="switch"`, `aria-checked`, `aria-label`                  |

---

## Base de données locale

**SQLite** via `better-sqlite3` (synchrone, rapide, zero-config).

| Table                | Usage                                          |
| -------------------- | ---------------------------------------------- |
| `sync_history`       | Log des synchronisations (50 dernières)        |
| `crosstest_comments` | Commentaires CrossTest indexés par `issue_iid` |

Aucune migration complexe — le schema est créé au démarrage si absent.

---

## Décisions d'architecture clés

### Pourquoi SQLite et non PostgreSQL/MySQL ?

- **Zero-config** : pas de serveur DB à administrer
- **Suffisant** : données locales légères (historique + comments)
- **Portabilité** : un fichier `.db` facile à backuper
- **Performant** : better-sqlite3 est synchrone et très rapide pour ce volume

### Pourquoi cache en mémoire et non Redis ?

- **Durée de vie courte** : 30 secondes
- **Volume faible** : quelques dizaines d'appels Testmo
- **Simplicité** : pas d'infra supplémentaire
- **Anti-stampede** : `_withCache` + `_inFlight` gère la déduplication

### Pourquoi SSE et non WebSocket ?

- **Unidirectionnel** : seul le serveur envoie des logs au client
- **Simple** : pas de handshake complexe, passe à travers les proxies
- **HTTP/1.1 compatible** : fonctionne partout sans config spéciale

### Pourquoi pas TypeScript ?

- **Legacy** : projet démarré en JS pur, migration TS serait un gros effort
- **Zod 4** : valide les entrées/sorties API (runtime type safety)
- **JSDoc** : documentation inline des types

---

## Monitoring & observability

| Outil                 | Rôle                                   |
| --------------------- | -------------------------------------- |
| **Winston**           | Logs structurés (JSON en prod)         |
| **Sentry**            | Capture des erreurs 500 + stack traces |
| **PM2**               | Métriques mémoire/CPU, auto-restart    |
| **Nginx access logs** | Temps de réponse, codes HTTP           |
| **GitHub Actions**    | CI/CD + audit npm                      |
