# NMRium UI/UX Optimization Plan

## 🎯 Goal
Make NMRium's interface modern, readable, and easy to use for desktop application users.

---

## 📋 Phase 1: Audit Current UI

### NMRium Tools & Features (from screenshot analysis):
1. **Top Toolbar**
   - File operations (Open, Save, etc.)
   - Workspace selector ("Simple NMR analysis")
   - Tool icons (zoom, pan, peak picking, etc.)

2. **Left Sidebar - Spectra Panel**
   - Spectrum list (shows loaded files)
   - Spectrum properties (nucleus, solvent, pulse, experiment)
   - Visibility toggles

3. **Center Area - Spectrum View**
   - Main spectrum display
   - X-axis (ppm scale)
   - Interactive peaks
   - Hover tooltips

4. **Right Panels** (collapsible)
   - Information panel
   - Peaks panel
   - Processing panel
   - Integrals panel
   - Ranges/Multiplet analysis
   - Chemical structures

5. **Bottom Status Bar**
   - Cursor position
   - Zoom level
   - Other metadata

---

## 🔧 Phase 2: CSS Improvements (COMPLETED)

### ✅ Already Implemented:
- [x] Modern system fonts (Segoe UI, San Francisco, etc.)
- [x] Larger base font size (14px)
- [x] Better tooltips (darker, larger, rounded)
- [x] Improved table spacing
- [x] Modern scrollbars
- [x] Better button sizes (36px minimum)
- [x] Improved input field styling
- [x] Better hover states

---

## 🎨 Phase 3: Advanced UI Customizations

### A. Typography Enhancements
```css
Priorities:
1. Increase panel header fonts → 15-16px, bold
2. Make axis labels larger → 12-13px
3. Improve peak label readability → 11-12px
4. Better contrast for disabled items
```

### B. Color Scheme Improvements
```css
Current Issues:
- Low contrast text in some areas
- Hard to see hover states
- Selected items not obvious enough

Solutions:
1. Higher contrast for text (use #000 or #222 instead of gray)
2. Brighter hover backgrounds (#e3f2fd for primary, #f5f5f5 for secondary)
3. Clear selection indicators (border + background)
4. Consistent color for interactive elements
```

### C. Spacing & Layout
```css
Improvements Needed:
1. More padding in panels (currently tight)
2. Better spacing between tools
3. Larger click targets for small icons
4. Improved panel resizing handles
```

### D. Accessibility
```css
1. Keyboard navigation visibility (focus rings)
2. High contrast mode support
3. Larger touch targets for buttons (44x44px minimum)
4. Better screen reader support
```

---

## ⚙️ Phase 4: NMRium Preferences Configuration

### Available Preferences (from API):
```typescript
interface NMRiumPreferences {
  general?: {
    fontSize?: number;          // Base font size
    // ... other general settings
  };
  panels?: {
    spectra?: {...};           // Spectra panel settings
    peaks?: {...};             // Peaks panel settings
    integrals?: {...};         // Integrals settings
    // ... other panels
  };
  // ... workspace settings
}
```

### Recommended Settings:
```typescript
const optimizedPreferences = {
  general: {
    fontSize: 14,              // Larger base font
  },
  // More to discover and configure
};
```

---

## 🔬 Phase 5: Workspace Optimization

### Available Workspaces:
1. `'default'` - Full featured
2. `'process1D'` - 1D processing focus
3. `'exercise'` - Teaching mode
4. `'prediction'` - Prediction tools
5. `'embedded'` - Minimal UI
6. `'assignment'` - Assignment mode
7. `'simulation'` - Simulation mode

### Strategy:
- Start with `'default'` workspace
- Create custom workspace if needed for specific use cases
- Optimize panel visibility for common workflows

---

## 🎯 Phase 6: Specific Tool Enhancements

### 1. Spectrum View (Main Canvas)
**Issues:**
- Hover tooltips might be too small
- Peak labels overlap when zoomed out
- Axis labels hard to read

**Solutions:**
```css
/* Larger peak labels */
& [class*="peak-label"] {
  fontSize: '12px !important';
  fontWeight: '600 !important';
}

/* Better axis labels */
& [class*="axis"] text {
  fontSize: '12px !important';
}

/* Improve hover info */
& [class*="crosshair-info"] {
  fontSize: '13px !important';
  padding: '10px !important';
}
```

### 2. Spectra Panel (Left Sidebar)
**Issues:**
- Spectrum names truncated
- Table cells too cramped
- Hard to see selected spectrum

**Solutions:**
```css
/* Better table spacing */
& .spectra-panel table td {
  padding: '10px 14px !important';
}

/* Highlight selected row */
& tr[class*="selected"] {
  backgroundColor: '#e3f2fd !important';
  borderLeft: '4px solid #1976d2 !important';
}
```

### 3. Peaks Panel
**Issues:**
- Small text in peak list
- Hard to click small checkboxes
- Peak values hard to read

**Solutions:**
```css
/* Larger peak values */
& .peaks-panel {
  fontSize: '13px !important';
}

/* Bigger checkboxes */
& input[type="checkbox"] {
  width: '18px !important';
  height: '18px !important';
}
```

### 4. Processing Panel
**Issues:**
- Complex controls
- Small input fields
- Unclear parameter names

**Solutions:**
```css
/* Better input fields */
& .processing-panel input {
  fontSize: '13px !important';
  padding: '8px 12px !important';
  minWidth: '80px !important';
}

/* Clearer labels */
& .processing-panel label {
  fontSize: '13px !important';
  fontWeight: '500 !important';
  marginBottom: '4px !important';
}
```

### 5. Toolbar Buttons
**Issues:**
- Icons too small
- No labels (confusing for new users)
- Hover tooltips appear slowly

**Solutions:**
```css
/* Larger toolbar icons */
& [class*="toolbar"] svg,
& [class*="toolbar"] [class*="icon"] {
  fontSize: '20px !important';
  width: '20px !important';
  height: '20px !important';
}

/* Better button spacing */
& [class*="toolbar"] button {
  margin: '2px 4px !important';
  padding: '8px !important';
}

/* Faster tooltips */
& button:hover [role="tooltip"] {
  transitionDelay: '0.2s !important';
}
```

---

## 📱 Phase 7: Responsive Improvements

### Minimum Recommended Size:
- Width: 1280px (currently works at 1024px+)
- Height: 800px (currently works at 768px+)

### Panel Behavior:
1. Left sidebar: collapsible, 250px minimum
2. Right panels: collapsible, 300px minimum
3. Main view: flexible, takes remaining space

---

## 🧪 Phase 8: Testing Plan

### Test Scenarios:
1. **Basic Usage**
   - [ ] Load Bruker folder
   - [ ] Navigate spectrum with mouse
   - [ ] Zoom in/out
   - [ ] Read peak values on hover
   - [ ] Read axis labels clearly

2. **Peak Picking**
   - [ ] Pick peaks manually
   - [ ] Auto-pick peaks
   - [ ] Edit peak labels
   - [ ] Delete peaks
   - [ ] Export peak list

3. **Integration**
   - [ ] Set integration regions
   - [ ] Adjust baselines
   - [ ] Read integration values
   - [ ] Export results

4. **Processing**
   - [ ] Apply FT
   - [ ] Phase correction
   - [ ] Baseline correction
   - [ ] Apply filters

5. **Multi-Spectrum**
   - [ ] Load multiple spectra
   - [ ] Compare spectra
   - [ ] Stack view
   - [ ] Overlay view

### Success Criteria:
- ✅ All text readable without squinting
- ✅ Hover tooltips appear quickly and clearly
- ✅ Click targets are easy to hit (no mis-clicks)
- ✅ Panel resizing is smooth
- ✅ No UI elements cut off or hidden
- ✅ Keyboard shortcuts work
- ✅ Can complete common tasks in <5 minutes

---

## 🚀 Phase 9: Implementation Priority

### Priority 1 (IMMEDIATE - Next)
1. [ ] Increase all font sizes by 1-2px
2. [ ] Improve tooltip visibility and speed
3. [ ] Better hover states for all interactive elements
4. [ ] Larger click targets for buttons/icons
5. [ ] Fix overlapping text issues

### Priority 2 (SHORT TERM)
1. [ ] Custom color scheme (if possible)
2. [ ] Panel spacing improvements
3. [ ] Better selected state indicators
4. [ ] Improved scrollbars visibility
5. [ ] Keyboard navigation enhancements

### Priority 3 (MEDIUM TERM)
1. [ ] Custom workspace configuration
2. [ ] Save/restore user preferences
3. [ ] Custom keyboard shortcuts
4. [ ] Export/import settings
5. [ ] User documentation

### Priority 4 (LONG TERM - Nice to Have)
1. [ ] Custom themes (dark mode?)
2. [ ] Plugin system integration
3. [ ] Custom tool panels
4. [ ] Advanced automation
5. [ ] Template workflows

---

## 📝 Implementation Notes

### Files to Modify:
- `src/components/NMRViewer/NMRViewer.tsx` - Main component (CURRENT)
- Additional CSS files if needed

### Current Status:
✅ Phase 1: COMPLETE - Audited UI
✅ Phase 2: COMPLETE - Basic CSS improvements implemented
⏳ Phase 3: IN PROGRESS - Need to refine specific areas
⏸️ Phase 4-9: PENDING

### Next Steps:
1. Test current improvements (restart dev server)
2. Identify specific pain points from user testing
3. Implement Phase 3 enhancements
4. Iterate based on feedback

---

## 🔍 Discovery Needed

### Questions to Answer:
1. What is the full `NMRiumPreferences` TypeScript interface?
2. Can we customize colors/theme beyond CSS?
3. Are there hidden workspace options?
4. Can we add custom panels or tools?
5. What keyboard shortcuts are available?

### Research Tasks:
- [ ] Explore `@zakodium/nmrium-core` preferences API
- [ ] Check if theme/color customization is possible
- [ ] Look for workspace customization options
- [ ] Find keyboard shortcut documentation
- [ ] Check for plugin/extension system

---

## 📚 Resources

### Official Resources:
- Website: https://www.nmrium.org
- GitHub: https://github.com/cheminfo/nmrium
- NPM: https://npmjs.org/package/nmrium
- Docs: https://docs.nmrium.org (if exists)

### Community:
- GitHub Issues for feature requests
- cheminfo community forums

---

**Last Updated:** 2025-10-18
**Status:** Phase 2 Complete, Phase 3 in Progress

