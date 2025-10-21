/**
 * Tauri File Operations
 * Frontend wrapper for Tauri file commands with validation
 */

import { invoke } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';
import { validateChemicalFile, validateFileSize } from '../validation/input';

export interface FileInfo {
  name: string;
  extension: string;
  size: number;
  is_readonly: boolean;
  modified?: number;
}

/**
 * Open MOL/SDF file picker and read content
 */
export async function openMolFile(): Promise<{ path: string; content: string } | null> {
  try {
    const filePath = await open({
      filters: [
        {
          name: 'MOL/SDF Files',
          extensions: ['mol', 'sdf', 'sd'],
        },
      ],
      multiple: false,
    });

    if (!filePath || typeof filePath !== 'string') {
      return null;
    }

    const content = await invoke<string>('read_mol_file', { path: filePath });
    return { path: filePath, content };
  } catch (error) {
    console.error('[FileOperations] Error opening file:', error);
    throw new Error(`Failed to open file: ${(error as Error).message}`);
  }
}

/**
 * Save MOL/SDF file
 */
export async function saveMolFile(content: string, defaultName: string = 'structure.mol'): Promise<string | null> {
  try {
    const filePath = await save({
      filters: [
        {
          name: 'MOL File',
          extensions: ['mol'],
        },
        {
          name: 'SDF File',
          extensions: ['sdf'],
        },
      ],
      defaultPath: defaultName,
    });

    if (!filePath) {
      return null;
    }

    await invoke('write_mol_file', { path: filePath, content });
    return filePath;
  } catch (error) {
    console.error('[FileOperations] Error saving file:', error);
    throw new Error(`Failed to save file: ${(error as Error).message}`);
  }
}

/**
 * Read text file (generic) with size validation
 */
export async function readTextFile(path: string, maxSizeMB: number = 10): Promise<string> {
  try {
    // Check file info first
    const fileInfo = await getFileInfo(path);
    if (fileInfo) {
      const sizeValidation = validateFileSize(fileInfo.size, maxSizeMB);
      if (!sizeValidation.isValid) {
        throw new Error(sizeValidation.errors.join(', '));
      }
      if (sizeValidation.warnings.length > 0) {
        console.warn('[FileOperations] Warnings:', sizeValidation.warnings);
      }
    }
    
    const content = await invoke<string>('read_text_file', { path });
    
    // Validate content for chemical files
    const filename = path.split(/[/\\]/).pop() || '';
    if (filename.match(/\.(mol|sdf|sd|smiles|smi)$/i)) {
      const validation = validateChemicalFile(filename, content, maxSizeMB);
      if (!validation.isValid) {
        throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
      }
      if (validation.warnings.length > 0) {
        console.warn('[FileOperations] Content warnings:', validation.warnings);
      }
    }
    
    return content;
  } catch (error) {
    console.error('[FileOperations] Error reading text file:', error);
    throw new Error(`Failed to read file: ${(error as Error).message}`);
  }
}

/**
 * Write text file (generic)
 */
export async function writeTextFile(path: string, content: string): Promise<void> {
  try {
    await invoke('write_text_file', { path, content });
  } catch (error) {
    console.error('[FileOperations] Error writing text file:', error);
    throw new Error(`Failed to write file: ${(error as Error).message}`);
  }
}

// Convenience aliases for compatibility
export const readFileContents = readTextFile;
export const writeFileContents = writeTextFile;

export async function openFile(title: string, filters: Array<{ name: string; extensions: string[] }>): Promise<string | null> {
  try {
    const result = await open({
      title,
      filters,
      multiple: false,
    });
    return typeof result === 'string' ? result : null;
  } catch (error) {
    console.error('[FileOperations] Error opening file:', error);
    throw error;
  }
}

export async function saveFile(title: string, defaultPath: string, filters: Array<{ name: string; extensions: string[] }>): Promise<string | null> {
  try {
    const result = await save({
      title,
      defaultPath,
      filters,
    });
    return result;
  } catch (error) {
    console.error('[FileOperations] Error in save dialog:', error);
    throw error;
  }
}

/**
 * Check if file exists
 */
export async function fileExists(path: string): Promise<boolean> {
  try {
    return await invoke<boolean>('file_exists', { path });
  } catch (error) {
    console.error('[FileOperations] Error checking file:', error);
    return false;
  }
}

/**
 * Get file information
 */
export async function getFileInfo(path: string): Promise<FileInfo | null> {
  try {
    return await invoke<FileInfo>('get_file_info', { path });
  } catch (error) {
    console.error('[FileOperations] Error getting file info:', error);
    return null;
  }
}

/**
 * Validate MOL file format
 */
export async function validateMolFormat(content: string): Promise<boolean> {
  try {
    return await invoke<boolean>('validate_mol_format', { content });
  } catch (error) {
    console.error('[FileOperations] Error validating MOL format:', error);
    return false;
  }
}

/**
 * Recent files manager (stored in localStorage)
 */
const RECENT_FILES_KEY = 'glchemdraw_recent_files';
const MAX_RECENT_FILES = 10;

export interface RecentFile {
  path: string;
  name: string;
  lastAccessed: number;
}

export function getRecentFiles(): RecentFile[] {
  try {
    const stored = localStorage.getItem(RECENT_FILES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('[FileOperations] Error reading recent files:', error);
    return [];
  }
}

export function addRecentFile(path: string, name: string): void {
  try {
    const recent = getRecentFiles();
    
    // Remove if already exists
    const filtered = recent.filter(f => f.path !== path);
    
    // Add to beginning
    filtered.unshift({
      path,
      name,
      lastAccessed: Date.now(),
    });
    
    // Keep only MAX_RECENT_FILES
    const trimmed = filtered.slice(0, MAX_RECENT_FILES);
    
    localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('[FileOperations] Error saving recent file:', error);
  }
}

export function clearRecentFiles(): void {
  localStorage.removeItem(RECENT_FILES_KEY);
}

