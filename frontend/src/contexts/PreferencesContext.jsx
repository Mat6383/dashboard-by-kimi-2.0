import React, { createContext, useState, useEffect } from 'react';

export const PreferencesContext = createContext(null);

export function PreferencesProvider({ children }) {
  const [useBusinessTerms, setUseBusinessTerms] = useState(() => localStorage.getItem('testmo_useBusinessTerms') !== 'false');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedPreprodMilestones, setSelectedPreprodMilestones] = useState(() => {
    const saved = localStorage.getItem('testmo_selectedPreprodMilestones');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedProdMilestones, setSelectedProdMilestones] = useState(() => {
    const saved = localStorage.getItem('testmo_selectedProdMilestones');
    return saved ? JSON.parse(saved) : [];
  });
  const [showProductionSection, setShowProductionSection] = useState(() => {
    const saved = localStorage.getItem('testmo_showProductionSection');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    localStorage.setItem('testmo_useBusinessTerms', useBusinessTerms);
    localStorage.setItem('testmo_selectedPreprodMilestones', JSON.stringify(selectedPreprodMilestones));
    localStorage.setItem('testmo_selectedProdMilestones', JSON.stringify(selectedProdMilestones));
    localStorage.setItem('testmo_showProductionSection', showProductionSection);
  }, [useBusinessTerms, selectedPreprodMilestones, selectedProdMilestones, showProductionSection]);

  // Sync cross-onglets via événement storage
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'testmo_useBusinessTerms') {
        setUseBusinessTerms(e.newValue !== 'false');
      }
      if (e.key === 'testmo_selectedPreprodMilestones') {
        try { setSelectedPreprodMilestones(JSON.parse(e.newValue || '[]')); } catch {}
      }
      if (e.key === 'testmo_selectedProdMilestones') {
        try { setSelectedProdMilestones(JSON.parse(e.newValue || '[]')); } catch {}
      }
      if (e.key === 'testmo_showProductionSection') {
        setShowProductionSection(e.newValue !== 'false');
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <PreferencesContext.Provider value={{
      useBusinessTerms, setUseBusinessTerms,
      autoRefresh, setAutoRefresh,
      selectedPreprodMilestones, setSelectedPreprodMilestones,
      selectedProdMilestones, setSelectedProdMilestones,
      showProductionSection, setShowProductionSection
    }}>
      {children}
    </PreferencesContext.Provider>
  );
}
