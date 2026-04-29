# Handoff Session - QA Dashboard by Kimi 2.0

> Dernière mise à jour : 2026-04-29
> Session précédente : **P18 — Internationalisation (i18n) FR/EN livrée**

---

## 🏗️ Architecture & Setup Local

| Composant                  | Port   | Commande                     |
| -------------------------- | ------ | ---------------------------- |
| Backend (Express + SQLite) | `3001` | `cd backend && npm run dev`  |
| Frontend (Vite)            | `3002` | `cd frontend && npm run dev` |

**⚠️ Important :** Le frontend **doit** utiliser `VITE_API_URL=/api` (relatif) pour passer par le proxy Vite et éviter les erreurs CORS. Le fichier `frontend/.env` contient déjà cette valeur.

---

## ✅ État des Tâches (Roadmap P0 → P22 + P18 — TOUTES LIVRÉES)

| Tâche                          | Statut | Notes |
| ------------------------------ | ------ | ----- |
| P0-P5 | ✅ | CI/CD, split App.jsx/server.js, tests frontend, audit bundle, documentation ops, monitoring |
| P6 | ✅ | Export PDF backend, notifications email, Slack/Teams, tendances historiques, auth OAuth, comparateur multi-projets, export CSV/Excel, tests E2E |
| P7 | ✅ | Audit sécurité, OpenAPI/Swagger, Prometheus |
| P8 | ✅ | Audit logging, health checks améliorés, metrics business |
| P9 | ✅ | SSE dashboard temps réel, détection anomalies, circuit breaker, feature flags UI admin |
| P10 | ✅ | Rollout progressif sticky, webhooks sortants, tests E2E Playwright |
| P11 | ✅ | React Query + cache, hooks queries typés |
| P12-P13 | ✅ | TypeScript progressif frontend + backend |
| P15 | ✅ | TypeScript complet frontend (49 fichiers) |
| P16-P17 | ✅ | TypeScript backend strict mode, 66 fichiers .ts, tests 489/491 |
| P18 | ✅ | **Internationalisation i18n FR/EN** — UI, emails, templates de rapport, exports CSV/Excel, sélecteur langue |
| P19 | ✅ | Pool Puppeteer optimisé |
| P20 | ✅ | WebSocket temps réel |
| P21 | ✅ | Backup automatisé SQLite |
| P22 | ✅ | tRPC couche API typée end-to-end |

---

## 📊 Indicateurs de Santé

| Métrique             | Actuel       |
| -------------------- | ------------ |
| Tests backend        | 565/565 ✅   |
| Tests frontend       | 172/172 ✅   |
| Build frontend       | ~2.8s ✅     |
| Lint                 | 0 erreur ✅  |
| Vulnérabilités npm   | 0 critique ✅ |

---

## 🐛 Bugs Connus / Problèmes Actifs

**Aucun bug critique connu.**

- OAuth GitLab s'active uniquement si `GITLAB_CLIENT_ID` et `GITLAB_CLIENT_SECRET` sont définis.
- SMTP s'active uniquement si `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` sont définis.

---

## 🌐 Internationalisation (i18n) — P18

### Frontend
- **Librairie** : `react-i18next` + `i18next-browser-languagedetector`
- **Langues** : FR (défaut), EN
- **Détection** : `localStorage` puis `navigator`
- **Sélecteur** : Bouton FR/EN dans le header (AppLayout)
- **Composants traduits** : AppLayout, App, NotificationSettings, FeatureFlagsAdmin, ConfigurationScreen, CommentCell, AuditLogViewer, AppRouter, QuickClosureModal, TestClosureModal, ReportGeneratorModal, et tous les dashboards

### Backend
- **Librairie** : `i18next`
- **Services traduits** : Emails (`email.service.ts`), rapports HTML/PPTX (`generateHTML.ts`, `generatePPTX.ts`), exports CSV/Excel (`export.service.ts`)
- **Paramètre lang** : Accepté via `lang` dans le body des requêtes API

### Fichiers clés
- `frontend/src/i18n/index.ts` — Configuration i18n frontend
- `frontend/src/i18n/locales/fr.json` / `en.json` — Traductions UI
- `backend/i18n/index.ts` — Configuration i18n backend
- `backend/i18n/locales/fr.json` / `en.json` — Traductions emails/rapports

---

## 🧪 Commandes de Test

```bash
# Backend (Jest)
npm test

# Frontend unitaires (Vitest)
cd frontend && npm test

# Build frontend
cd frontend && npm run build

# E2E (Playwright)
npx playwright test
```

---

## 🌿 État Git

- **Branche active** : `main`
- **Commits non pushés** : P18 en cours de commit
- **Dernier commit sur `main`** : `af0fe3f` — test: couverture tRPC backend + hooks frontend + corrections tests cassés migration tRPC

---

## 🚀 Prochaines Étapes Suggérées (P23+)

- [ ] **Option B** — Tests de charge & Performance (k6/Artillery)
- [ ] **P23** — Autres améliorations à définir
