/**
 * Platform Detection Utilities
 * 
 * Detect if running in Tauri (desktop) vs web browser
 * and apply appropriate layout adjustments
 */

/**
 * Check if running in Tauri (desktop) environment
 */
export function isTauriDesktop(): boolean {
  return '__TAURI__' in window;
}

/**
 * Check if running in web browser
 */
export function isWebBrowser(): boolean {
  return !isTauriDesktop();
}

/**
 * Get current platform name
 */
export function getPlatform(): 'desktop' | 'web' {
  return isTauriDesktop() ? 'desktop' : 'web';
}

/**
 * Apply platform-specific CSS class to body
 */
export function applyPlatformClass(): void {
  const platform = getPlatform();
  document.body.classList.add(`platform-${platform}`);
  
  console.log(`[Platform] Running in ${platform} mode`);
}

/**
 * Get recommended layout dimensions based on platform
 */
export function getLayoutDimensions() {
  const isDesktop = isTauriDesktop();
  
  return {
    // Desktop gets more generous spacing
    panelPadding: isDesktop ? 24 : 16,
    headerHeight: isDesktop ? 72 : 64,
    sidebarWidth: isDesktop ? 320 : 280,
    fontSize: isDesktop ? 16 : 14,
    buttonSize: isDesktop ? 40 : 36,
    toolbarPadding: isDesktop ? 16 : 12,
  };
}


