import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

function getBreadcrumbItems(pathname: string): BreadcrumbItem[] {
  if (!pathname.startsWith('/admin/')) return [];

  const segments = pathname.split('/').filter(Boolean);
  const items: BreadcrumbItem[] = [{ label: 'Admin', path: '/admin/audit' }];

  if (segments.length >= 2) {
    const pageMap: Record<string, string> = {
      audit: 'Audit Logs',
      'feature-flags': 'Feature Flags',
      analytics: 'Analytics',
      retention: 'Data Retention',
      integrations: 'Integrations',
    };
    const page = segments[1];
    items.push({ label: pageMap[page] || page });
  }

  return items;
}

export default function Breadcrumb() {
  const { pathname } = useLocation();
  const items = getBreadcrumbItems(pathname);

  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="breadcrumb-nav">
      <ol className="breadcrumb-list">
        <li className="breadcrumb-item">
          <Link to="/" className="breadcrumb-link">
            <Home size={14} />
            <span className="sr-only">Home</span>
          </Link>
          <ChevronRight size={14} className="breadcrumb-separator" aria-hidden="true" />
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.label} className="breadcrumb-item">
              {item.path && !isLast ? (
                <Link to={item.path} className="breadcrumb-link">
                  {item.label}
                </Link>
              ) : (
                <span className="breadcrumb-current" aria-current="page">
                  {item.label}
                </span>
              )}
              {!isLast && <ChevronRight size={14} className="breadcrumb-separator" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
