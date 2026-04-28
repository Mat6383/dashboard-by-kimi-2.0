/**
 * ================================================
 * COMMENT CELL — CrossTest Commentaire inline
 * ================================================
 * Cellule de tableau pour afficher / éditer / supprimer
 * un commentaire CrossTest lié à une issue GitLab.
 *
 * @author Matou - Neo-Logix QA Lead
 * @version 1.0.0
 */

import React, { useState, useRef } from 'react';
import apiService from '../services/api.service';
import { useToast } from '../hooks/useToast';
import { RefreshCw, Pencil, Trash2, Plus } from 'lucide-react';

export default function CommentCell({ issue, comment, milestoneTitle, onSaved, onDeleted }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const textareaRef = useRef(null);
  const { showToast } = useToast();

  const openEdit = () => {
    setDraft(comment ? comment.comment : '');
    setEditing(true);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const cancelEdit = () => {
    setEditing(false);
    setDraft('');
  };

  const handleSave = async () => {
    const text = draft.trim();
    if (!text) return;
    setSaving(true);
    try {
      const saved = await apiService.saveCrosstestComment(issue.iid, text, milestoneTitle);
      onSaved(issue.iid, saved);
      setEditing(false);
      setDraft('');
    } catch (err) {
      console.error('Erreur sauvegarde commentaire:', err);
      showToast(`Erreur: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    setShowConfirm(false);
    setSaving(true);
    try {
      await apiService.deleteCrosstestComment(issue.iid);
      onDeleted(issue.iid);
    } catch (err) {
      console.error('Erreur suppression commentaire:', err);
      showToast(`Erreur: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="d7-comment-form">
        <textarea
          ref={textareaRef}
          className="d7-comment-textarea"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Saisir un commentaire..."
          rows={3}
          disabled={saving}
          onKeyDown={(e) => {
            if (e.key === 'Escape') cancelEdit();
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSave();
          }}
        />
        <div className="d7-comment-form-actions">
          <button className="d7-comment-save-btn" onClick={handleSave} disabled={saving || !draft.trim()}>
            {saving ? <RefreshCw size={12} className="d7-spinner" /> : null}
            {saving ? 'Sauvegarde...' : 'Enregistrer'}
          </button>
          <button className="d7-comment-cancel-btn" onClick={cancelEdit} disabled={saving}>
            Annuler
          </button>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Ctrl+Entrée pour sauvegarder</span>
        </div>
      </div>
    );
  }

  if (comment) {
    return (
      <div className="d7-comment-view" style={{ position: 'relative' }}>
        <span className="d7-comment-text">{comment.comment}</span>
        <div className="d7-comment-actions">
          <button className="d7-icon-btn edit" title="Modifier le commentaire" onClick={openEdit} disabled={saving}>
            <Pencil size={13} />
          </button>
          <button className="d7-icon-btn del" title="Supprimer le commentaire" onClick={handleDelete} disabled={saving}>
            {saving ? <RefreshCw size={13} className="d7-spinner" /> : <Trash2 size={13} />}
          </button>
        </div>
        {showConfirm && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
            }}
          >
            <div
              style={{
                backgroundColor: 'var(--card-bg)',
                padding: '1.5rem',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                maxWidth: '320px',
                width: '90%',
              }}
            >
              <p style={{ margin: '0 0 1rem', fontSize: '0.95rem', color: 'var(--text-color)' }}>
                Supprimer le commentaire pour <strong>#{issue.iid}</strong> ?
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowConfirm(false)} className="d7-comment-cancel-btn">
                  Annuler
                </button>
                <button onClick={confirmDelete} className="d7-comment-save-btn" style={{ backgroundColor: '#EF4444' }}>
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <button className="d7-comment-add-btn" onClick={openEdit} disabled={saving}>
      <Plus size={12} />
      Ajouter un commentaire...
    </button>
  );
}
