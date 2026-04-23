import React, { useState, useEffect, useMemo } from 'react';
import { Settings, Save, Info, Filter, Search, CheckSquare, Square } from 'lucide-react';
import apiService from '../services/api.service';
import Toast from './Toast';

const ConfigurationScreen = ({ projectId, isDark, onSaveSelection, initialPreprodMilestones, initialProdMilestones }) => {
    const [milestones, setMilestones] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedPreprod, setSelectedPreprod] = useState(initialPreprodMilestones || []);
    const [selectedProd, setSelectedProd] = useState(initialProdMilestones || []);
    const [searchPreprod, setSearchPreprod] = useState('');
    const [searchProd, setSearchProd] = useState('');

    const [toastMessage, setToastMessage] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const milestonesData = await apiService.getProjectMilestones(projectId);
                setMilestones(milestonesData.result || []);
            } catch (e) {
                console.error("Error fetching data for configuration:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [projectId]);

    const filteredPreprod = useMemo(() => {
        const q = searchPreprod.toLowerCase();
        return milestones.filter(m => m.name.toLowerCase().includes(q));
    }, [milestones, searchPreprod]);

    const filteredProd = useMemo(() => {
        const q = searchProd.toLowerCase();
        return milestones.filter(m => m.name.toLowerCase().includes(q));
    }, [milestones, searchProd]);

    const togglePreprod = (id) => {
        setSelectedPreprod(prev => {
            if (prev.includes(id)) return prev.filter(x => x !== id);
            if (prev.length >= 2) {
                setToastMessage('Vous ne pouvez sélectionner que 2 jalons maximum pour la préproduction.');
                return prev;
            }
            return [...prev, id];
        });
    };

    const toggleProd = (id) => {
        setSelectedProd(prev => {
            if (prev.includes(id)) return prev.filter(x => x !== id);
            if (prev.length >= 2) {
                setToastMessage('Vous ne pouvez sélectionner que 2 jalons maximum pour la production.');
                return prev;
            }
            return [...prev, id];
        });
    };

    const handleSave = () => {
        onSaveSelection(selectedPreprod, selectedProd);
        setToastMessage('Configuration sauvegardée avec succès !');
    };

    const clearSelection = () => {
        setSelectedPreprod([]);
        setSelectedProd([]);
        onSaveSelection([], []);
        setToastMessage('Configuration réinitialisée au fonctionnement par défaut.');
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Chargement des données...</div>;

    const sectionStyle = {
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '1.5rem'
    };

    const searchStyle = {
        width: '100%',
        padding: '0.6rem 0.8rem 0.6rem 2.2rem',
        backgroundColor: 'var(--bg-color)',
        color: 'var(--text-color)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        fontSize: '0.9rem',
        marginBottom: '1rem',
        boxSizing: 'border-box'
    };

    const checkboxItemStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        padding: '0.5rem 0.6rem',
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'background 0.15s',
        fontSize: '0.9rem'
    };

    const listStyle = {
        maxHeight: '280px',
        overflowY: 'auto',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '0.4rem'
    };

    return (
        <div className={`tv-dashboard ${isDark ? 'dark' : ''}`} style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
            <Toast message={toastMessage} onClose={() => setToastMessage('')} type={toastMessage.includes('succès') || toastMessage.includes('réinitialisée') ? 'success' : 'error'} />

            <header className="tv-header" style={{ marginBottom: '2rem' }}>
                <div className="tv-title" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Settings size={40} color="var(--primary-color)" />
                    <div>
                        <h1 style={{ margin: 0 }}>Configuration des Cycles de Test</h1>
                        <h2 style={{ margin: 0, opacity: 0.8, fontSize: '1.2rem', fontWeight: 400 }}>Personnalisation Préproduction / Production</h2>
                    </div>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Section Préproduction */}
                <div style={sectionStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <Filter size={20} color="#F59E0B" />
                        <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Préproduction</h3>
                        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {selectedPreprod.length}/2 sélectionnés
                        </span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1rem' }}>
                        Sélectionnez les jalons de préproduction à analyser (max 2).
                    </p>

                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '0.6rem', top: '0.7rem', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Rechercher un jalon..."
                            value={searchPreprod}
                            onChange={e => setSearchPreprod(e.target.value)}
                            style={searchStyle}
                            aria-label="Rechercher un jalon de préproduction"
                        />
                    </div>

                    <div style={listStyle} role="group" aria-label="Jalons de préproduction">
                        {filteredPreprod.length === 0 && (
                            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                Aucun jalon trouvé.
                            </div>
                        )}
                        {filteredPreprod.map(m => {
                            const checked = selectedPreprod.includes(m.id);
                            return (
                                <label
                                    key={m.id}
                                    style={{
                                        ...checkboxItemStyle,
                                        backgroundColor: checked ? 'rgba(59,130,246,0.1)' : 'transparent',
                                        color: checked ? 'var(--color-primary)' : 'var(--text-color)'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = checked ? 'rgba(59,130,246,0.15)' : 'var(--color-gray-100)'}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = checked ? 'rgba(59,130,246,0.1)' : 'transparent'}
                                >
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => togglePreprod(m.id)}
                                        style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                                        aria-checked={checked}
                                    />
                                    {checked ? <CheckSquare size={18} color="#3B82F6" /> : <Square size={18} color="var(--text-muted)" />}
                                    <span>{m.name}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>

                {/* Section Production */}
                <div style={sectionStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <Filter size={20} color="#EF4444" />
                        <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Production</h3>
                        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {selectedProd.length}/2 sélectionnés
                        </span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1rem' }}>
                        Sélectionnez les jalons de production à analyser (max 2).
                    </p>

                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '0.6rem', top: '0.7rem', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Rechercher un jalon..."
                            value={searchProd}
                            onChange={e => setSearchProd(e.target.value)}
                            style={searchStyle}
                            aria-label="Rechercher un jalon de production"
                        />
                    </div>

                    <div style={listStyle} role="group" aria-label="Jalons de production">
                        {filteredProd.length === 0 && (
                            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                Aucun jalon trouvé.
                            </div>
                        )}
                        {filteredProd.map(m => {
                            const checked = selectedProd.includes(m.id);
                            return (
                                <label
                                    key={m.id}
                                    style={{
                                        ...checkboxItemStyle,
                                        backgroundColor: checked ? 'rgba(239,68,68,0.1)' : 'transparent',
                                        color: checked ? '#EF4444' : 'var(--text-color)'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = checked ? 'rgba(239,68,68,0.15)' : 'var(--color-gray-100)'}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = checked ? 'rgba(239,68,68,0.1)' : 'transparent'}
                                >
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => toggleProd(m.id)}
                                        style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                                        aria-checked={checked}
                                    />
                                    {checked ? <CheckSquare size={18} color="#EF4444" /> : <Square size={18} color="var(--text-muted)" />}
                                    <span>{m.name}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
                <button
                    onClick={handleSave}
                    style={{
                        padding: '0.8rem 2rem',
                        backgroundColor: '#3B82F6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <Save size={20} />
                    Sauvegarder la Configuration
                </button>

                <button
                    onClick={clearSelection}
                    style={{
                        padding: '0.8rem 2rem',
                        backgroundColor: 'transparent',
                        color: 'var(--text-color)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <Info size={20} />
                    Réinitialiser
                </button>
            </div>
        </div>
    );
};

export default ConfigurationScreen;
