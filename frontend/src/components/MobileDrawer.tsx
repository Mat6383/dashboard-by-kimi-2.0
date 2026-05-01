import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function MobileDrawer({ isOpen, onClose, title, children }: MobileDrawerProps) {
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
      previouslyFocused.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="mobile-drawer-overlay" onClick={onClose} role="presentation">
      <div
        className="mobile-drawer"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="mobile-drawer-header">
          <h2>{title}</h2>
          <button
            className="btn-icon"
            onClick={onClose}
            aria-label="Fermer"
            type="button"
            style={{ minWidth: '44px', minHeight: '44px' }}
          >
            <X size={20} />
          </button>
        </div>
        <div className="mobile-drawer-content">{children}</div>
      </div>
    </div>
  );
}
