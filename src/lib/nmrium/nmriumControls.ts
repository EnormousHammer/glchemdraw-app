/**
 * NMRium Controls Utility
 * 
 * Provides functions to interact with NMRium's internal buttons and controls
 * by finding them in the DOM and triggering their click events.
 * 
 * This allows us to keep our simplified UI while using NMRium's built-in functionality.
 */

/**
 * Log all available buttons for debugging
 */
export function logAvailableButtons(): void {
  console.log('=== NMRIUM BUTTON INSPECTOR ===');
  const allButtons = document.querySelectorAll('button');
  console.log(`Total buttons found: ${allButtons.length}`);
  
  const buttonInfo: any[] = [];
  
  allButtons.forEach((button, index) => {
    const text = button.textContent?.trim() || '';
    const title = button.getAttribute('title') || '';
    const ariaLabel = button.getAttribute('aria-label') || '';
    const classes = button.className || '';
    const id = button.id || '';
    
    const info = {
      index,
      text,
      title,
      ariaLabel,
      id,
      classes: classes.substring(0, 80),
      hasClickHandler: !!button.onclick,
      parentClasses: button.parentElement?.className.substring(0, 50) || '',
    };
    
    buttonInfo.push(info);
    console.log(`[${index}]`, info);
  });
  
  console.log('=== SEARCHING FOR INTEGRATION BUTTONS (excluding our toolbar) ===');
  const integrationButtons = buttonInfo.filter(btn => {
    // Exclude our own toolbar buttons
    if (btn.text.includes('🎯') || btn.text.includes('📐') || 
        btn.text.includes('AUTO INTEGRATE') || btn.text.includes('Show Tools')) {
      return false;
    }
    
    // Look for NMRium's integration/ranges buttons
    return btn.title.toLowerCase().includes('range') ||
           btn.title.toLowerCase().includes('integral') ||
           btn.ariaLabel.toLowerCase().includes('range') ||
           btn.ariaLabel.toLowerCase().includes('integral') ||
           (btn.text.toLowerCase().includes('range') && btn.text.length < 20) ||
           (btn.text.toLowerCase().includes('integral') && btn.text.length < 20);
  });
  console.log('NMRium Integration-related buttons:', integrationButtons);
  
  console.log('=== END INSPECTOR ===');
}

/**
 * Close any NMRium popups (like "About NMRium")
 */
export function closeNMRiumPopups(): void {
  console.log('[NMRium Controls] Closing any open popups...');
  
  // Try pressing Escape key
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27 }));
  
  // Also try clicking any X or close buttons
  const allButtons = document.querySelectorAll('button');
  allButtons.forEach((btn) => {
    const text = btn.textContent?.trim() || '';
    if (text === '×' || text === 'X' || text === '✕') {
      console.log('[NMRium Controls] Clicking close button');
      btn.click();
    }
  });
}

/**
 * FORCE the left toolbar to open by clicking the toggle button
 * Look for the small orange arrow button on the left edge
 */
export function forceToolbarOpen(): boolean {
  console.log('[NMRium Controls] Looking for toolbar toggle button...');
  
  // First, close any popups
  closeNMRiumPopups();
  
  // Wait a tiny bit for popup to close
  setTimeout(() => {
    // Find the small button on the far left (around x: 85-105)
    const allButtons = document.querySelectorAll('button');
    let clicked = false;
    
    allButtons.forEach((btn) => {
      if (clicked) return; // Already found it
      
      const rect = btn.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(btn);
      const bgColor = computedStyle.backgroundColor;
      const text = btn.textContent?.trim() || '';
      
      // Look for small button on left edge (x: 80-110) with orange/colored background
      // AND with arrow-like text or no text
      if (rect.left > 80 && rect.left < 110 && 
          rect.width < 50 && rect.height < 50 &&
          !text.includes('About') && 
          !text.includes('NMR')) {
        
        console.log('[NMRium Controls] Found potential toggle:', {
          x: rect.left,
          width: rect.width,
          height: rect.height,
          bgColor,
          text: text.substring(0, 20)
        });
        
        // Click it
        btn.click();
        clicked = true;
      }
    });
    
    if (!clicked) {
      console.warn('[NMRium Controls] Could not find toolbar toggle button');
    }
  }, 200);
  
  return true; // Return optimistically
}

/**
 * Find and click NMRium's Ranges/Integration button
 */
export function findAndClickIntegrationButton(): boolean {
  console.log('[NMRium Controls] Searching for Ranges/Integration button...');
  
  // ONLY search inside NMRium's container, not our toolbar!
  const nmriumContainer = document.querySelector('[class*="nmrium"]') || document.body;
  const allButtons = nmriumContainer.querySelectorAll('button');
  let found = false;
  
  allButtons.forEach((btn, index) => {
    // Skip our own toolbar buttons
    const isOurButton = btn.closest('[class*="MuiToolbar"]') || 
                       btn.textContent?.includes('🎯') ||
                       btn.textContent?.includes('📐');
    if (isOurButton) return;
    
    const title = (btn.getAttribute('title') || '').toLowerCase();
    const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
    const text = (btn.textContent || '').toLowerCase();
    
    // Look for "ranges" or "integration" buttons
    if (title.includes('range') || title.includes('integral') ||
        ariaLabel.includes('range') || ariaLabel.includes('integral') ||
        text.includes('range') || text.includes('integral')) {
      console.log(`[NMRium Controls] FOUND at index ${index}:`, { title, ariaLabel, text });
      btn.click();
      found = true;
    }
  });
  
  if (!found) {
    console.warn('[NMRium Controls] Could not find integration button');
    logAvailableButtons();
  }
  
  return found;
}

/**
 * Find and click "Auto ranges" button
 */
export function findAndClickAutoRanges(): boolean {
  console.log('[NMRium Controls] Searching for Auto Ranges button...');
  
  // ONLY search inside NMRium's container, not our toolbar!
  const nmriumContainer = document.querySelector('[class*="nmrium"]') || document.body;
  const allButtons = nmriumContainer.querySelectorAll('button');
  let found = false;
  
  allButtons.forEach((btn, index) => {
    // Skip our own toolbar buttons
    const isOurButton = btn.closest('[class*="MuiToolbar"]') || 
                       btn.textContent?.includes('🎯') ||
                       btn.textContent?.includes('📐');
    if (isOurButton) return;
    
    const title = (btn.getAttribute('title') || '').toLowerCase();
    const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
    const text = (btn.textContent || '').toLowerCase();
    
    // Look for "auto ranges" or "auto integration"
    if (text.includes('auto') && (text.includes('range') || text.includes('integral')) ||
        title.includes('auto') && (title.includes('range') || title.includes('integral'))) {
      console.log(`[NMRium Controls] FOUND Auto Ranges at index ${index}:`, { title, ariaLabel, text });
      btn.click();
      found = true;
    }
  });
  
  if (!found) {
    console.warn('[NMRium Controls] ❌ Could not find Auto Ranges button inside NMRium');
    console.warn('[NMRium Controls] The toolbar may not have opened, or the button has a different name');
  }
  
  return found;
}

/**
 * Send a keyboard shortcut to NMRium
 */
export function sendKeyToNMRium(key: string, code: string): boolean {
  console.log(`[NMRium Controls] Sending key "${key}" to NMRium...`);
  
  // Try multiple targets to ensure the key reaches NMRium
  const targets = [
    document.querySelector('[class*="nmrium"]'),
    document.querySelector('canvas'),
    document.body
  ];
  
  let sent = false;
  targets.forEach(target => {
    if (target) {
      // Send keydown
      target.dispatchEvent(new KeyboardEvent('keydown', { 
        key, 
        code,
        bubbles: true,
        cancelable: true
      }));
      
      // Send keyup
      target.dispatchEvent(new KeyboardEvent('keyup', { 
        key, 
        code,
        bubbles: true,
        cancelable: true
      }));
      
      sent = true;
    }
  });
  
  console.log(`[NMRium Controls] Key "${key}" sent: ${sent}`);
  return sent;
}

/**
 * Test if keyboard shortcut 'r' activates range tool
 */
export function testRangeShortcut(): void {
  console.log('[NMRium Controls] ⚡ Testing "r" keyboard shortcut...');
  sendKeyToNMRium('r', 'KeyR');
  console.log('[NMRium Controls] If range tool activated, shortcut works!');
}

/**
 * Wait for NMRium to be fully loaded
 */
export function waitForNMRium(maxAttempts = 50): Promise<boolean> {
  return new Promise((resolve) => {
    let attempts = 0;
    const checkInterval = setInterval(() => {
      const nmriumContainer = document.querySelector('[class*="nmrium"]');
      if (nmriumContainer || attempts >= maxAttempts) {
        clearInterval(checkInterval);
        resolve(!!nmriumContainer);
      }
      attempts++;
    }, 100);
  });
}

/**
 * Find and click NMRium's Open/Import button
 */
export function triggerNMRiumOpenFile(): boolean {
  console.log('[NMRium Controls] Triggering file open...');
  
  // Try multiple selectors to find the open button
  const selectors = [
    'button[title*="Open"]',
    'button[aria-label*="Open"]',
    'button[title*="Import"]',
    'button[aria-label*="Import"]',
    '[class*="toolbar"] button[title*="open" i]',
    '[class*="Toolbar"] button[title*="open" i]',
    'button:has(svg[data-icon*="folder"])',
    'input[type="file"]',
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      console.log('[NMRium Controls] Found open button:', selector);
      element.click();
      return true;
    }
  }

  console.warn('[NMRium Controls] Could not find NMRium open button');
  return false;
}

/**
 * Trigger file input for loading data
 */
export function createFileInput(onFilesSelected?: (files: FileList) => void): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = true;
  input.accept = '.dx,.jdx,.jcamp,.zip,.nmr,.fid,pdata,acqus';
  input.style.display = 'none';
  
  input.onchange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      console.log('[NMRium Controls] Files selected:', target.files.length);
      if (onFilesSelected) {
        onFilesSelected(target.files);
      }
    }
    // Clean up
    document.body.removeChild(input);
  };
  
  document.body.appendChild(input);
  return input;
}

/**
 * Find and click NMRium's Zoom In button
 */
export function triggerNMRiumZoomIn(): boolean {
  console.log('[NMRium Controls] Triggering zoom in...');
  
  const selectors = [
    'button[title*="Zoom in"]',
    'button[aria-label*="Zoom in"]',
    'button[title*="zoom in" i]',
    '[class*="zoom"] button:first-child',
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      console.log('[NMRium Controls] Found zoom in button');
      element.click();
      return true;
    }
  }

  console.warn('[NMRium Controls] Could not find zoom in button');
  return false;
}

/**
 * Find and click NMRium's Zoom Out button
 */
export function triggerNMRiumZoomOut(): boolean {
  console.log('[NMRium Controls] Triggering zoom out...');
  
  const selectors = [
    'button[title*="Zoom out"]',
    'button[aria-label*="Zoom out"]',
    'button[title*="zoom out" i]',
    '[class*="zoom"] button:last-child',
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      console.log('[NMRium Controls] Found zoom out button');
      element.click();
      return true;
    }
  }

  console.warn('[NMRium Controls] Could not find zoom out button');
  return false;
}

/**
 * Find and click NMRium's Reset Zoom button
 */
export function triggerNMRiumZoomReset(): boolean {
  console.log('[NMRium Controls] Triggering zoom reset...');
  
  const selectors = [
    'button[title*="Reset"]',
    'button[title*="Fit"]',
    'button[aria-label*="Reset"]',
    'button[title*="reset" i]',
    'button[title*="fit" i]',
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      console.log('[NMRium Controls] Found zoom reset button');
      element.click();
      return true;
    }
  }

  console.warn('[NMRium Controls] Could not find zoom reset button');
  return false;
}

/**
 * Find and click NMRium's Auto Peak Picking button
 */
export function triggerNMRiumAutoPeakPick(): boolean {
  console.log('[NMRium Controls] Triggering auto peak pick...');
  
  // Try searching all buttons
  const allButtons = document.querySelectorAll('button');
  console.log('[NMRium Controls] Searching through', allButtons.length, 'buttons for peak picking...');
  
  for (const button of allButtons) {
    const text = button.textContent?.toLowerCase() || '';
    const title = button.getAttribute('title')?.toLowerCase() || '';
    const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
    
    if (text.includes('peak') || title.includes('peak') || ariaLabel.includes('peak')) {
      console.log('[NMRium Controls] Found peak pick button:', text || title || ariaLabel);
      button.click();
      return true;
    }
  }

  console.warn('[NMRium Controls] Could not find auto peak pick button');
  return false;
}

/**
 * Find and click NMRium's Integration tool button
 */
export function triggerNMRiumIntegration(): boolean {
  console.log('[NMRium Controls] Triggering integration tool...');
  
  // First, let's log what buttons are actually available
  setTimeout(() => logAvailableButtons(), 500);
  
  const selectors = [
    'button[title*="Integration"]',
    'button[title*="integration" i]',
    'button[aria-label*="Integration"]',
    'button[title*="Integral"]',
    'button[title*="integral" i]',
    'button[title*="Range"]', // NMRium might call it "Ranges" or "Integration ranges"
    'button[title*="range" i]',
  ];

  for (const selector of selectors) {
    try {
      const element = document.querySelector(selector) as HTMLElement;
      if (element) {
        console.log('[NMRium Controls] Found integration button:', selector);
        element.click();
        return true;
      }
    } catch (e) {
      console.warn('[NMRium Controls] Selector error:', selector);
    }
  }

  // Try searching all buttons by text content
  const allButtons = document.querySelectorAll('button');
  console.log('[NMRium Controls] Searching through', allButtons.length, 'buttons...');
  
  for (const button of allButtons) {
    const text = button.textContent?.toLowerCase() || '';
    const title = button.getAttribute('title')?.toLowerCase() || '';
    const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
    
    if (text.includes('integral') || title.includes('integral') || ariaLabel.includes('integral') ||
        text.includes('range') || title.includes('range') || ariaLabel.includes('range')) {
      console.log('[NMRium Controls] Found integration button by text:', text || title);
      button.click();
      return true;
    }
  }

  console.warn('[NMRium Controls] Could not find integration button');
  return false;
}

/**
 * Find and click NMRium's Auto Integration button
 */
export function triggerNMRiumAutoIntegration(): boolean {
  console.log('[NMRium Controls] Triggering auto integration...');
  
  const selectors = [
    'button[title*="Auto integral"]',
    'button[title*="auto integral" i]',
    'button[title*="Auto integration"]',
    'button[aria-label*="Auto integral"]',
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      console.log('[NMRium Controls] Found auto integration button');
      element.click();
      return true;
    }
  }

  // If no auto integration found, try to open integration panel first
  console.log('[NMRium Controls] Trying to open integration panel first...');
  triggerNMRiumIntegration();
  
  return false;
}

/**
 * Show NMRium's Integrals panel
 */
export function showNMRiumIntegralsPanel(): boolean {
  console.log('[NMRium Controls] Opening integrals panel...');
  
  // Try to find and click the integrals panel tab/button
  const selectors = [
    'button[title*="Integrals"]',
    'button[title*="integrals" i]',
    '[role="tab"][title*="Integrals"]',
    '[class*="Panel"] button',
  ];

  for (const selector of selectors) {
    try {
      const element = document.querySelector(selector) as HTMLElement;
      if (element && element.textContent?.toLowerCase().includes('integral')) {
        console.log('[NMRium Controls] Found integrals panel');
        element.click();
        return true;
      }
    } catch (e) {
      console.warn('[NMRium Controls] Selector error:', selector, e);
    }
  }

  // Try finding by text content
  const allButtons = document.querySelectorAll('button');
  for (const button of allButtons) {
    if (button.textContent?.toLowerCase().includes('integral')) {
      console.log('[NMRium Controls] Found integrals button by text');
      button.click();
      return true;
    }
  }

  console.warn('[NMRium Controls] Could not find integrals panel');
  return false;
}

/**
 * Find and click NMRium's Export/Save button
 */
export function triggerNMRiumExport(type: 'image' | 'data' = 'image'): boolean {
  console.log('[NMRium Controls] Triggering export:', type);
  
  const imageSelectors = [
    'button[title*="Export"]',
    'button[title*="Save"]',
    'button[title*="export" i]',
    'button[aria-label*="Export"]',
  ];

  const dataSelectors = [
    'button[title*="Data"]',
    'button[title*="CSV"]',
    'button[title*="Export data"]',
  ];

  const selectors = type === 'image' ? imageSelectors : dataSelectors;

  for (const selector of selectors) {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      console.log('[NMRium Controls] Found export button');
      element.click();
      return true;
    }
  }

  console.warn('[NMRium Controls] Could not find export button');
  return false;
}

/**
 * Find and click NMRium's Save Project button
 */
export function triggerNMRiumSaveProject(): boolean {
  console.log('[NMRium Controls] Triggering save project...');
  
  const selectors = [
    'button[title*="Save"]',
    'button[title*="save" i]',
    'button[aria-label*="Save"]',
    '[class*="toolbar"] button[title*="save"]',
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      console.log('[NMRium Controls] Found save button');
      element.click();
      return true;
    }
  }

  console.warn('[NMRium Controls] Could not find save button');
  return false;
}

/**
 * Generic function to find and click any NMRium button by text or title
 */
export function findAndClickNMRiumButton(searchText: string): boolean {
  console.log('[NMRium Controls] Looking for button with text:', searchText);
  
  // Try by title attribute
  let element = document.querySelector(`button[title*="${searchText}" i]`) as HTMLElement;
  if (element) {
    console.log('[NMRium Controls] Found by title');
    element.click();
    return true;
  }

  // Try by aria-label
  element = document.querySelector(`button[aria-label*="${searchText}" i]`) as HTMLElement;
  if (element) {
    console.log('[NMRium Controls] Found by aria-label');
    element.click();
    return true;
  }

  // Try by text content
  const buttons = document.querySelectorAll('button');
  for (const button of buttons) {
    if (button.textContent?.toLowerCase().includes(searchText.toLowerCase())) {
      console.log('[NMRium Controls] Found by text content');
      button.click();
      return true;
    }
  }

  console.warn('[NMRium Controls] Could not find button:', searchText);
  return false;
}

/**
 * Get NMRium's file input element
 */
export function getNMRiumFileInput(): HTMLInputElement | null {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  return input || null;
}

/**
 * Trigger NMRium's file input programmatically
 */
export function triggerNMRiumFileInput(): boolean {
  const input = getNMRiumFileInput();
  if (input) {
    console.log('[NMRium Controls] Triggering file input');
    input.click();
    return true;
  }
  
  // If no file input found, try to find and click the open button
  return triggerNMRiumOpenFile();
}

