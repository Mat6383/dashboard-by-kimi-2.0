/**
 * ================================================
 * DASHBOARD 6 - Synchronisation GitLab → Testmo
 * ================================================
 * Interface de pilotage de la synchronisation des tickets GitLab
 * vers les cas de test Testmo.
 *
 * Flow:
 *   idle → analyzing → preview → syncing → done
 *
 * @author Matou - Neo-Logix QA Lead
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Settings,
  RefreshCw,
  Search,
  Play,
  CheckCircle2,
  SkipForward,
  AlertCircle,
  FolderOpen,
  GitBranch,
  Zap,
  ArrowRight,
} from 'lucide-react';
import apiService from '../services/api.service';
import '../styles/Dashboard6.css';
import { LogIcon, logLineClass, LogLineText } from './SyncLogParts';
import SyncHistoryPanel from './SyncHistoryPanel';

// ============================================================
// Composant principal Dashboard6
// ============================================================

export default function Dashboard6({ isDark }) {
  // ---- State ----------------------------------------------------
  const [state, setState] = useState('idle'); // idle | analyzing | preview | syncing | done
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [iterations, setIterations] = useState([]);
  const [iterSearch, setIterSearch] = useState('');
  const [selectedIter, setSelectedIter] = useState('');
  const [loadingIters, setLoadingIters] = useState(false);
  const [preview, setPreview] = useState(null); // { iteration, folder, issues, summary }
  const [logLines, setLogLines] = useState([]); // événements SSE
  const [finalStats, setFinalStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);

  const logEndRef = useRef(null);
  const iterTimerRef = useRef(null);
  const abortCtrlRef = useRef(null);
  const mountedRef = useRef(true);

  // ---- Chargement initial ----------------------------------------
  useEffect(() => {
    mountedRef.current = true;
    loadProjects();
    loadHistory();
    return () => {
      mountedRef.current = false;
      if (iterTimerRef.current) clearTimeout(iterTimerRef.current);
      if (abortCtrlRef.current) abortCtrlRef.current.abort();
    };
  }, []);

  // Auto-scroll du log
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logLines]);

  // ---- Chargement des projets ------------------------------------
  const loadProjects = async () => {
    try {
      const list = await apiService.getSyncProjects();
      if (!mountedRef.current) return;
      setProjects(list);
      // Pré-sélectionner le premier projet configuré
      const firstConfigured = list.find((p) => p.configured);
      if (firstConfigured) setSelectedProject(firstConfigured.id);
    } catch (err) {
      if (!mountedRef.current) return;
      setError('Impossible de charger les projets: ' + err.message);
    }
  };

  const loadHistory = async () => {
    try {
      const rows = await apiService.getSyncHistory();
      if (!mountedRef.current) return;
      setHistory(rows || []);
    } catch (_) {
      // Historique non critique
    }
  };

  // ---- Chargement des itérations (avec debounce) -----------------
  const loadIterations = useCallback(
    async (projectId, search) => {
      if (!projectId) return;
      const project = projects.find((p) => p.id === projectId);
      if (!project?.configured) return;

      setLoadingIters(true);
      setIterations([]);
      setSelectedIter('');
      try {
        const list = await apiService.getSyncIterations(projectId, search);
        if (!mountedRef.current) return;
        setIterations(list || []);
      } catch (err) {
        if (!mountedRef.current) return;
        setError('Impossible de charger les itérations: ' + err.message);
      } finally {
        if (mountedRef.current) setLoadingIters(false);
      }
    },
    [projects]
  );

  // Recharger les itérations quand le projet change
  useEffect(() => {
    if (selectedProject) {
      loadIterations(selectedProject, iterSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProject]);

  // Debounce sur la recherche d'itération
  const handleIterSearchChange = (e) => {
    const val = e.target.value;
    setIterSearch(val);
    if (iterTimerRef.current) clearTimeout(iterTimerRef.current);
    iterTimerRef.current = setTimeout(() => {
      loadIterations(selectedProject, val);
    }, 400);
  };

  // ---- Analyse (preview) -----------------------------------------
  const handleAnalyze = async () => {
    if (!selectedProject || !selectedIter) return;
    setError(null);
    setPreview(null);
    setState('analyzing');

    try {
      const data = await apiService.previewSync(selectedProject, selectedIter);
      setPreview(data);
      setState('preview');
    } catch (err) {
      setError(err.message);
      setState('idle');
    }
  };

  // ---- Exécution avec SSE ----------------------------------------
  const handleExecute = () => {
    if (!selectedProject || !selectedIter) return;
    setError(null);
    setLogLines([]);
    setFinalStats(null);
    setState('syncing');

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

    // SSE via EventSource ne supporte pas POST nativement.
    // On utilise fetch + ReadableStream pour simuler SSE avec POST.
    const ctrl = new AbortController();
    abortCtrlRef.current = ctrl;

    fetch(`${API_BASE}/sync/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: selectedProject, iterationName: selectedIter }),
      signal: ctrl.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          const json = await response.json().catch(() => ({ error: response.statusText }));
          throw new Error(json.error || `HTTP ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        const processChunk = (chunk) => {
          buffer += chunk;
          const lines = buffer.split('\n');
          buffer = lines.pop(); // garder le fragment incomplet

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const event = JSON.parse(line.slice(6));
                setLogLines((prev) => [...prev, event]);

                if (event.type === 'done') {
                  setFinalStats({
                    created: event.created || 0,
                    updated: event.updated || 0,
                    skipped: event.skipped || 0,
                    enriched: event.enriched || 0,
                    errors: event.errors || 0,
                    total: event.total || 0,
                  });
                  setState('done');
                  loadHistory();
                }

                if (event.type === 'error') {
                  setError(event.message || 'Erreur inconnue');
                  setState('preview');
                }
              } catch (_) {
                // Ligne non-JSON (heartbeat :ping), on ignore
              }
            }
          }
        };

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (buffer) processChunk('');
            break;
          }
          processChunk(decoder.decode(value, { stream: true }));
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError('Erreur connexion SSE: ' + err.message);
          setState('preview');
        }
      });
  };

  // ---- Reset -------------------------------------------------------
  const handleReset = () => {
    setState('idle');
    setPreview(null);
    setLogLines([]);
    setFinalStats(null);
    setError(null);
  };

  // ---- Helpers UI --------------------------------------------------
  const currentProject = projects.find((p) => p.id === selectedProject);
  const isConfigured = currentProject?.configured === true;
  const canAnalyze = isConfigured && selectedIter && state === 'idle';
  const canExecute = isConfigured && selectedIter && state === 'preview';
  // Calcul du % de progression pendant le sync
  const processedCount = logLines.filter((e) =>
    ['case_created', 'case_updated', 'case_skipped', 'case_error'].includes(e.type)
  ).length;
  const totalFromPreview = preview?.summary?.total || 0;
  const liveProgress =
    totalFromPreview > 0 ? Math.min(100, Math.round((processedCount / totalFromPreview) * 100)) : null;

  // ---- Rendu -------------------------------------------------------
  return (
    <div className={`d6-container${isDark ? ' dark-theme' : ''}`}>
      {/* Titre */}
      <div className="d6-title">
        <Settings size={22} />
        SYNCHRONISATION GITLAB → TESTMO
      </div>

      {/* Message d'erreur global */}
      {error && (
        <div className="d6-alert d6-alert-error" style={{ marginBottom: '1rem' }}>
          <AlertCircle size={16} />
          {error}
          <button
            className="d6-btn d6-btn-ghost"
            style={{ marginLeft: 'auto', padding: '2px 8px', fontSize: '0.75rem' }}
            onClick={() => setError(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* ---- Section Configuration ---- */}
      <div className="d6-section">
        <div className="d6-section-header">
          <Settings size={14} />
          Configuration
        </div>
        <div className="d6-section-body">
          <div className="d6-config-row">
            {/* Sélecteur de projet */}
            <div className="d6-field">
              <label>Projet</label>
              <select
                className="d6-select"
                value={selectedProject || ''}
                onChange={(e) => setSelectedProject(e.target.value)}
                disabled={state === 'syncing' || state === 'analyzing'}
              >
                <option value="" disabled>
                  Choisir un projet...
                </option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label} {p.configured ? '' : '(non configuré)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Statut projet */}
            {currentProject && (
              <div style={{ paddingTop: '1.2rem' }}>
                <span className={`d6-badge ${isConfigured ? 'd6-badge-configured' : 'd6-badge-unconfigured'}`}>
                  {isConfigured ? 'Configuré' : 'Non configuré'}
                </span>
              </div>
            )}
          </div>

          {/* Message si projet non configuré */}
          {currentProject && !isConfigured && (
            <div className="d6-alert d6-alert-warn" style={{ marginBottom: '1rem' }}>
              <AlertCircle size={15} />
              Ce projet n&apos;est pas encore configuré — accès GitLab manquant.
            </div>
          )}

          {/* Sélecteur d'itération (uniquement si projet configuré) */}
          {isConfigured && (
            <>
              <div className="d6-config-row">
                {/* Recherche itération */}
                <div className="d6-field">
                  <label>Rechercher une itération</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="d6-input"
                      placeholder="Ex: R14"
                      value={iterSearch}
                      onChange={handleIterSearchChange}
                      disabled={state === 'syncing' || state === 'analyzing'}
                      style={{ paddingLeft: '32px' }}
                    />
                    <Search
                      size={14}
                      style={{
                        position: 'absolute',
                        left: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)',
                      }}
                    />
                  </div>
                </div>

                {/* Dropdown itération */}
                <div className="d6-field">
                  <label>
                    Itération
                    {loadingIters && <RefreshCw size={11} className="d6-spinner" style={{ marginLeft: 6 }} />}
                  </label>
                  <select
                    className="d6-select"
                    value={selectedIter}
                    onChange={(e) => setSelectedIter(e.target.value)}
                    disabled={state === 'syncing' || state === 'analyzing' || loadingIters}
                  >
                    <option value="">Choisir une itération...</option>
                    {iterations.map((it) => (
                      <option key={it.id} value={it.title}>
                        {it.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Bouton reload itérations */}
                <div style={{ paddingTop: '1.2rem' }}>
                  <button
                    className="d6-btn d6-btn-ghost"
                    title="Recharger les itérations"
                    onClick={() => loadIterations(selectedProject, iterSearch)}
                    disabled={loadingIters || state === 'syncing' || state === 'analyzing'}
                  >
                    <RefreshCw size={14} className={loadingIters ? 'd6-spinner' : ''} />
                  </button>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="d6-btn-row">
                <button className="d6-btn d6-btn-primary" onClick={handleAnalyze} disabled={!canAnalyze}>
                  {state === 'analyzing' ? (
                    <>
                      <RefreshCw size={14} className="d6-spinner" /> Analyse en cours...
                    </>
                  ) : (
                    <>
                      <Search size={14} /> Analyser
                    </>
                  )}
                </button>

                {(state === 'preview' || state === 'done') && (
                  <button className="d6-btn d6-btn-ghost" onClick={handleReset}>
                    Recommencer
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ---- Section Aperçu ---- */}
      {(state === 'preview' || state === 'syncing' || state === 'done') && preview && (
        <div className="d6-section">
          <div className="d6-section-header">
            <Search size={14} />
            Aperçu — {preview.iteration?.name}
          </div>
          <div className="d6-section-body">
            {/* Chemin du dossier */}
            <div className="d6-preview-path">
              <FolderOpen size={13} />
              <span>{currentProject?.label}</span>
              <span className="d6-preview-path-sep">
                <ArrowRight size={11} />
              </span>
              <span>{preview.folder?.parent}</span>
              <span className="d6-preview-path-sep">
                <ArrowRight size={11} />
              </span>
              <span>{preview.folder?.child}</span>
              {preview.folder?.exists && (
                <span className="d6-badge d6-badge-configured" style={{ marginLeft: 6 }}>
                  existe déjà
                </span>
              )}
            </div>

            {/* Chips résumé */}
            <div className="d6-preview-summary">
              <div className="d6-summary-chip d6-chip-create">
                <CheckCircle2 size={13} />
                {preview.summary?.toCreate} à créer
              </div>
              <div className="d6-summary-chip d6-chip-update">
                <RefreshCw size={13} />
                {preview.summary?.toUpdate} à mettre à jour
              </div>
              <div className="d6-summary-chip d6-chip-skip">
                <SkipForward size={13} />
                {preview.summary?.toSkip} à ignorer
              </div>
              <div className="d6-summary-chip d6-chip-total">
                <GitBranch size={13} />
                {preview.summary?.total} au total
              </div>
            </div>

            {/* Liste des tickets */}
            {preview.issues && preview.issues.length > 0 && (
              <ul className="d6-issue-list">
                {preview.issues.map((issue) => (
                  <li key={issue.iid} className="d6-issue-item">
                    <span className="d6-issue-iid">
                      {issue.url ? (
                        <a href={issue.url} target="_blank" rel="noreferrer" className="d6-log-link">
                          #{issue.iid}
                        </a>
                      ) : (
                        `#${issue.iid}`
                      )}
                    </span>
                    <span className="d6-issue-title" title={issue.title}>
                      {issue.title}
                    </span>
                    <span
                      className={`d6-issue-status ${
                        issue.status === 'create'
                          ? 'd6-status-create'
                          : issue.status === 'update'
                            ? 'd6-status-update'
                            : 'd6-status-skip'
                      }`}
                    >
                      {issue.status === 'create' ? 'CRÉER' : issue.status === 'update' ? 'MAJ' : 'IGNORÉ'}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {preview.issues?.length === 0 && (
              <div className="d6-alert d6-alert-info">
                <AlertCircle size={14} />
                Aucun ticket trouvé pour cette itération.
              </div>
            )}

            {/* Bouton exécuter */}
            {state === 'preview' && (
              <div className="d6-btn-row">
                <button
                  className="d6-btn d6-btn-success"
                  onClick={handleExecute}
                  disabled={!canExecute || preview.summary?.total === 0}
                >
                  <Play size={14} />
                  Confirmer et Synchroniser
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---- Section Progression (SSE) ---- */}
      {(state === 'syncing' || state === 'done') && (
        <div className="d6-section">
          <div className="d6-section-header">
            <Zap size={14} />
            {state === 'syncing' ? 'Progression en cours...' : 'Synchronisation terminée'}
          </div>
          <div className="d6-section-body">
            {/* Barre de progression */}
            {liveProgress !== null && (
              <div className="d6-progress-bar-outer">
                <div className="d6-progress-bar-inner" style={{ width: `${liveProgress}%` }} />
              </div>
            )}

            {/* Log SSE */}
            <div className="d6-log">
              {logLines.map((event, i) => (
                <div key={i} className={`d6-log-line ${logLineClass(event.type)}`}>
                  <span className="d6-log-icon">
                    <LogIcon type={event.type} />
                  </span>
                  <span className="d6-log-text">
                    <LogLineText event={event} />
                  </span>
                </div>
              ))}
              {state === 'syncing' && (
                <div className="d6-log-line d6-log-info">
                  <span className="d6-log-icon">
                    <RefreshCw size={13} className="d6-spinner" />
                  </span>
                  <span className="d6-log-text">Synchronisation en cours...</span>
                </div>
              )}
              <div ref={logEndRef} />
            </div>

            {/* Stats finales */}
            {state === 'done' && finalStats && (
              <div className="d6-stats-row">
                <div className="d6-stat-card">
                  <div className="d6-stat-number d6-stat-created">{finalStats.created}</div>
                  <div className="d6-stat-label">Créés</div>
                </div>
                <div className="d6-stat-card">
                  <div className="d6-stat-number d6-stat-updated">{finalStats.updated}</div>
                  <div className="d6-stat-label">Mis à jour</div>
                </div>
                <div className="d6-stat-card">
                  <div className="d6-stat-number d6-stat-skipped">{finalStats.skipped}</div>
                  <div className="d6-stat-label">Ignorés</div>
                </div>
                <div className="d6-stat-card">
                  <div className="d6-stat-number d6-stat-errors">{finalStats.errors}</div>
                  <div className="d6-stat-label">Erreurs</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---- Section Historique ---- */}
      <SyncHistoryPanel history={history} onRefresh={loadHistory} />
    </div>
  );
}
