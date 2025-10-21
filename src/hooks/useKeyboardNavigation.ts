/**
 * Keyboard Navigation Hook
 * Provides comprehensive keyboard shortcuts for accessibility
 */

import { useEffect, useCallback } from 'react';

export interface KeyboardHandlers {
  onNew?: () => void;
  onOpen?: () => void;
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onClear?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onSelectAll?: () => void;
  onToggleDarkMode?: () => void;
  onFocusSearch?: () => void;
  onFocusCanvas?: () => void;
}

export const useKeyboardNavigation = (handlers: KeyboardHandlers) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const { key, ctrlKey, metaKey, shiftKey, altKey } = event;
    const modifier = ctrlKey || metaKey; // Support both Ctrl (Windows) and Cmd (Mac)

    // Ignore if user is typing in input/textarea
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return;
    }

    // File operations
    if (modifier && key === 'n' && handlers.onNew) {
      event.preventDefault();
      handlers.onNew();
      return;
    }

    if (modifier && key === 'o' && handlers.onOpen) {
      event.preventDefault();
      handlers.onOpen();
      return;
    }

    if (modifier && key === 's' && handlers.onSave) {
      event.preventDefault();
      handlers.onSave();
      return;
    }

    // Edit operations
    if (modifier && key === 'z' && !shiftKey && handlers.onUndo) {
      event.preventDefault();
      handlers.onUndo();
      return;
    }

    if (modifier && (key === 'y' || (key === 'z' && shiftKey)) && handlers.onRedo) {
      event.preventDefault();
      handlers.onRedo();
      return;
    }

    if (modifier && key === 'l' && handlers.onClear) {
      event.preventDefault();
      handlers.onClear();
      return;
    }

    // Clipboard
    if (modifier && key === 'c' && handlers.onCopy) {
      event.preventDefault();
      handlers.onCopy();
      return;
    }

    if (modifier && key === 'v' && handlers.onPaste) {
      event.preventDefault();
      handlers.onPaste();
      return;
    }

    if (modifier && key === 'a' && handlers.onSelectAll) {
      event.preventDefault();
      handlers.onSelectAll();
      return;
    }

    // UI toggles
    if (modifier && key === 'd' && handlers.onToggleDarkMode) {
      event.preventDefault();
      handlers.onToggleDarkMode();
      return;
    }

    // Focus navigation
    if (modifier && key === 'f' && handlers.onFocusSearch) {
      event.preventDefault();
      handlers.onFocusSearch();
      return;
    }

    if (key === 'Escape' && handlers.onFocusCanvas) {
      event.preventDefault();
      handlers.onFocusCanvas();
      return;
    }

    // F1 for help (don't prevent default - browser help is ok)
    if (key === 'F1') {
      console.log('Help: Press Ctrl+? for keyboard shortcuts');
    }
  }, [handlers]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    // Return keyboard shortcuts info for display
    shortcuts: {
      file: [
        { keys: ['Ctrl', 'N'], action: 'New structure' },
        { keys: ['Ctrl', 'O'], action: 'Open file' },
        { keys: ['Ctrl', 'S'], action: 'Save file' },
      ],
      edit: [
        { keys: ['Ctrl', 'Z'], action: 'Undo' },
        { keys: ['Ctrl', 'Y'], action: 'Redo' },
        { keys: ['Ctrl', 'L'], action: 'Clear canvas' },
        { keys: ['Ctrl', 'C'], action: 'Copy' },
        { keys: ['Ctrl', 'V'], action: 'Paste' },
        { keys: ['Ctrl', 'A'], action: 'Select all' },
      ],
      view: [
        { keys: ['Ctrl', 'D'], action: 'Toggle dark mode' },
        { keys: ['Ctrl', 'F'], action: 'Focus search' },
        { keys: ['Esc'], action: 'Focus canvas' },
      ],
    },
  };
};

