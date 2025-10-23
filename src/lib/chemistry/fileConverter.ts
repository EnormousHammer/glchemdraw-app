/**
 * File Converter for NMRium Compatibility
 * 
 * Converts Bruker folders to ZIP files for NMRium upload
 * Also validates file formats before processing
 */

import JSZip from 'jszip';

export interface FileConversionResult {
  success: boolean;
  convertedFile?: File;
  originalFile?: File;
  error?: string;
  message?: string;
}

/**
 * Check if a file is a Bruker folder by examining its contents
 */
export function isBrukerFolder(file: File): boolean {
  // Bruker folders typically have specific file names
  // This is a basic check - in practice, you'd need to examine the folder structure
  return file.type === '' && file.name.includes('Bruker');
}

/**
 * Check if a file is already in a supported NMRium format
 */
export function isSupportedNMRiumFormat(file: File): boolean {
  const supportedExtensions = ['.dx', '.jdx', '.jcamp', '.jdf', '.nmrium', '.zip'];
  const fileName = file.name.toLowerCase();
  
  return supportedExtensions.some(ext => fileName.endsWith(ext));
}

/**
 * Convert a Bruker folder to ZIP format for NMRium
 */
export async function convertBrukerFolderToZip(folder: File): Promise<FileConversionResult> {
  try {
    console.log('[FileConverter] Converting Bruker folder to ZIP:', folder.name);
    
    // Create a new ZIP file
    const zip = new JSZip();
    
    // For now, we'll add the folder as a single file
    // In a real implementation, you'd need to read the folder contents
    // and add each file individually to the ZIP
    
    // This is a placeholder - you'd need to implement proper folder reading
    zip.file(folder.name, folder);
    
    // Generate the ZIP file
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    
    // Create a new File object with .zip extension
    const zipFile = new File([zipBlob], `${folder.name}.zip`, {
      type: 'application/zip'
    });
    
    console.log('[FileConverter] Successfully converted to ZIP:', zipFile.name);
    
    return {
      success: true,
      convertedFile: zipFile,
      originalFile: folder,
      message: `Bruker folder converted to ZIP: ${zipFile.name}`
    };
    
  } catch (error) {
    console.error('[FileConverter] Error converting Bruker folder:', error);
    return {
      success: false,
      originalFile: folder,
      error: `Failed to convert Bruker folder: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Process a file for NMRium compatibility
 */
export async function processFileForNMRium(file: File): Promise<FileConversionResult> {
  console.log('[FileConverter] Processing file for NMRium:', file.name, file.type);
  
  // Check if already supported
  if (isSupportedNMRiumFormat(file)) {
    console.log('[FileConverter] File already in supported format');
    return {
      success: true,
      originalFile: file,
      message: 'File is already in a supported NMRium format'
    };
  }
  
  // Check if it's a Bruker folder that needs conversion
  if (isBrukerFolder(file)) {
    console.log('[FileConverter] Bruker folder detected, converting to ZIP');
    return await convertBrukerFolderToZip(file);
  }
  
  // File is not supported and cannot be converted
  return {
    success: false,
    originalFile: file,
    error: `Unsupported file format: ${file.name}. Supported formats: JCAMP-DX (.dx, .jdx, .jcamp), Bruker folders, Jeol (.jdf), NMRium (.nmrium), or ZIP files containing these formats.`
  };
}

/**
 * Process multiple files for NMRium compatibility
 */
export async function processFilesForNMRium(files: File[]): Promise<FileConversionResult[]> {
  console.log('[FileConverter] Processing multiple files:', files.length);
  
  const results: FileConversionResult[] = [];
  
  for (const file of files) {
    const result = await processFileForNMRium(file);
    results.push(result);
  }
  
  return results;
}

/**
 * Get supported file formats for display to users
 */
export function getSupportedFormats(): string[] {
  return [
    'JCAMP-DX files (.dx, .jdx, .jcamp)',
    'Bruker folders (will be converted to ZIP)',
    'Jeol files (.jdf)',
    'NMRium files (.nmrium)',
    'ZIP files containing any of the above'
  ];
}
