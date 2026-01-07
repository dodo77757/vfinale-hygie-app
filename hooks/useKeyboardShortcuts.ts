import { useEffect } from 'react';

interface KeyboardShortcuts {
  onSearch?: () => void;
  onNewClient?: () => void;
  onExport?: () => void;
  onClose?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcuts) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K ou Cmd+K pour recherche
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        shortcuts.onSearch?.();
        return;
      }

      // Ctrl+N ou Cmd+N pour nouveau client
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        shortcuts.onNewClient?.();
        return;
      }

      // Ctrl+E ou Cmd+E pour export
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        shortcuts.onExport?.();
        return;
      }

      // Escape pour fermer
      if (e.key === 'Escape') {
        shortcuts.onClose?.();
        return;
      }

      // Flèches pour navigation (si pas dans un input)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'ArrowRight') {
        shortcuts.onNext?.();
      } else if (e.key === 'ArrowLeft') {
        shortcuts.onPrevious?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);
};

