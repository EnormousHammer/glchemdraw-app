/**
 * NMR Preferences Storage
 * 
 * Manages user preferences for the NMR viewer including:
 * - View mode (simple/advanced)
 * - Recent files
 * - Display settings
 * - User preferences
 */

export interface NMRPreferences {
  viewMode: 'simple' | 'advanced';
  hasSeenWelcome: boolean;
  recentFiles: string[];
  fontSize: number;
  autoSave: boolean;
  lastOpened?: string;
}

const STORAGE_KEY = 'nmr_preferences';
const MAX_RECENT_FILES = 10;

const DEFAULT_PREFERENCES: NMRPreferences = {
  viewMode: 'simple',
  hasSeenWelcome: false,
  recentFiles: [],
  fontSize: 16,
  autoSave: true,
};

/**
 * Load preferences from localStorage
 */
export function loadNMRPreferences(): NMRPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_PREFERENCES, ...parsed };
    }
  } catch (error) {
    console.error('[NMR Preferences] Error loading preferences:', error);
  }
  return DEFAULT_PREFERENCES;
}

/**
 * Save preferences to localStorage
 */
export function saveNMRPreferences(preferences: Partial<NMRPreferences>): void {
  try {
    const current = loadNMRPreferences();
    const updated = { ...current, ...preferences };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('[NMR Preferences] Error saving preferences:', error);
  }
}

/**
 * Add a file to recent files list
 */
export function addRecentFile(filePath: string): void {
  const prefs = loadNMRPreferences();
  const recentFiles = [
    filePath,
    ...prefs.recentFiles.filter(f => f !== filePath)
  ].slice(0, MAX_RECENT_FILES);
  
  saveNMRPreferences({ 
    recentFiles,
    lastOpened: new Date().toISOString()
  });
}

/**
 * Get recent files list
 */
export function getRecentFiles(): string[] {
  return loadNMRPreferences().recentFiles;
}

/**
 * Clear recent files list
 */
export function clearRecentFiles(): void {
  saveNMRPreferences({ recentFiles: [] });
}

/**
 * Set view mode preference
 */
export function setViewMode(mode: 'simple' | 'advanced'): void {
  saveNMRPreferences({ viewMode: mode });
}

/**
 * Get view mode preference
 */
export function getViewMode(): 'simple' | 'advanced' {
  return loadNMRPreferences().viewMode;
}

/**
 * Mark welcome panel as seen
 */
export function markWelcomeSeen(): void {
  saveNMRPreferences({ hasSeenWelcome: true });
}

/**
 * Check if welcome panel has been seen
 */
export function hasSeenWelcome(): boolean {
  return loadNMRPreferences().hasSeenWelcome;
}

/**
 * Reset all preferences to defaults
 */
export function resetNMRPreferences(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('[NMR Preferences] Error resetting preferences:', error);
  }
}

/**
 * Export preferences as JSON
 */
export function exportPreferences(): string {
  const prefs = loadNMRPreferences();
  return JSON.stringify(prefs, null, 2);
}

/**
 * Import preferences from JSON string
 */
export function importPreferences(jsonString: string): boolean {
  try {
    const prefs = JSON.parse(jsonString);
    saveNMRPreferences(prefs);
    return true;
  } catch (error) {
    console.error('[NMR Preferences] Error importing preferences:', error);
    return false;
  }
}


