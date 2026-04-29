import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, BarChart3, Globe, GitCompare, Settings } from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

function getNavItems(isAdmin: boolean): NavItem[] {
  const items: NavItem[] = [
    { path: '/', label: 'Accueil', icon: <LayoutDashboard size={20} /> },
    { path: '/global-view', label: 'Global', icon: <Globe size={20} /> },
    { path: '/quality-rates', label: 'Qualité', icon: <BarChart3 size={20} /> },
    { path: '/compare', label: 'Compare', icon: <GitCompare size={20} /> },
    { path: '/configuration', label: 'Config', icon: <Settings size={20} /> },
  ];
  if (isAdmin) {
    items.push({ path: '/admin/feature-flags', label: 'Flags', icon: <Settings size={20} /> });
  }
  return items;
}

interface MobileBottomNavProps {
  isAdmin: boolean;
}

export default function MobileBottomNav({ isAdmin }: MobileBottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const items = getNavItems(isAdmin);

  return (
    <nav className="mobile-bottom-nav" role="navigation" aria-label="Navigation mobile">
      {items.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            className={`mobile-bottom-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
            aria-current={isActive ? 'page' : undefined}
            type="button"
          >
            <span className="mobile-bottom-nav-icon">{item.icon}</span>
            <span className="mobile-bottom-nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
