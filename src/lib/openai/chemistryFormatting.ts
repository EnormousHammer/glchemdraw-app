/**
 * Shared chemistry formatting instructions for all AI chemistry features.
 * Ensures consistent, clean, chemistry-friendly output across the app.
 */

/** Instruction appended to system prompts for long-form AI chemistry output */
export const CHEMISTRY_FORMATTING_INSTRUCTION = `Use chemistry-friendly plain text only. No markdown (no **, ##, *, bullets, tables). No LaTeX (no \\[, \\], \\text{}, \\xrightarrow). Write equations as: C6H14 + Cl2 → C6H13Cl + HCl. Use → for arrows, Δ for delta, ° for degrees. Use simple lists or prose, not markdown table syntax. Chemical formulas: C6H14, H2O, CO2 (plain text).`;
