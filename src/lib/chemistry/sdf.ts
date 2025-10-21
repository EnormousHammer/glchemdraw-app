/**
 * SDF (Structure Data File) Parser and Generator
 * Handles multi-structure MOL/SDF files for batch processing
 */

export interface SDFStructure {
  molfile: string;
  properties: Record<string, string>;
  name?: string;
  id?: string;
}

export interface SDFParseResult {
  structures: SDFStructure[];
  totalCount: number;
  errors: Array<{ index: number; error: string }>;
}

/**
 * Parse SDF file content into individual structures
 * @param sdfContent - Raw SDF file content
 * @returns Parsed structures with properties
 */
export function parseSDFFile(sdfContent: string): SDFParseResult {
  const structures: SDFStructure[] = [];
  const errors: Array<{ index: number; error: string }> = [];
  
  // Split by SDF delimiter ($$$$)
  const blocks = sdfContent.split(/\n\$\$\$\$\s*\n?/);
  
  blocks.forEach((block, index) => {
    if (!block.trim()) {
      return;
    }

    try {
      const structure = parseSDFBlock(block, index);
      structures.push(structure);
    } catch (error) {
      errors.push({
        index,
        error: (error as Error).message,
      });
    }
  });

  return {
    structures,
    totalCount: blocks.length,
    errors,
  };
}

/**
 * Parse a single SDF block
 * @param block - Single SDF record
 * @param index - Record index
 */
function parseSDFBlock(block: string, index: number): SDFStructure {
  const lines = block.split('\n');
  
  // Find the end of MOL block (M  END)
  const molEndIndex = lines.findIndex(line => line.trim().startsWith('M  END'));
  
  if (molEndIndex === -1) {
    throw new Error(`No M  END found in structure ${index}`);
  }

  // Extract MOL block
  const molfile = lines.slice(0, molEndIndex + 1).join('\n');
  
  // Extract name from first line of MOL block
  const name = lines[0]?.trim() || `Structure_${index + 1}`;
  
  // Parse properties (lines after M  END)
  const properties: Record<string, string> = {};
  let currentPropName: string | null = null;
  
  for (let i = molEndIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Property name line starts with >
    if (line.startsWith('>')) {
      // Extract property name between < and >
      const match = line.match(/<([^>]+)>/);
      if (match) {
        currentPropName = match[1];
      }
    } else if (currentPropName && line) {
      // Property value line
      properties[currentPropName] = line;
      currentPropName = null;
    }
  }

  return {
    molfile,
    properties,
    name,
    id: `struct_${index}`,
  };
}

/**
 * Generate SDF content from multiple structures
 * @param structures - Array of structures to export
 * @returns SDF formatted string
 */
export function generateSDFFile(structures: SDFStructure[]): string {
  const sdfBlocks: string[] = [];

  structures.forEach((structure) => {
    let block = structure.molfile;
    
    // Ensure MOL block ends with M  END
    if (!block.trim().endsWith('M  END')) {
      block += '\nM  END';
    }

    // Add properties
    if (structure.properties && Object.keys(structure.properties).length > 0) {
      Object.entries(structure.properties).forEach(([key, value]) => {
        block += `\n> <${key}>\n${value}\n`;
      });
    }

    sdfBlocks.push(block);
  });

  // Join with SDF delimiter
  return sdfBlocks.join('\n$$$$\n') + '\n$$$$\n';
}

/**
 * Convert individual MOL files to SDF structure objects
 * @param molfiles - Array of MOL file contents
 * @param names - Optional names for each structure
 * @returns Array of SDF structures
 */
export function molfilesToSDFStructures(
  molfiles: string[],
  names?: string[]
): SDFStructure[] {
  return molfiles.map((molfile, index) => ({
    molfile,
    properties: {},
    name: names?.[index] || `Structure_${index + 1}`,
    id: `struct_${index}`,
  }));
}

/**
 * Validate SDF file format
 * @param content - File content to validate
 * @returns Validation result
 */
export function validateSDFFormat(content: string): {
  isValid: boolean;
  error?: string;
  structureCount?: number;
} {
  if (!content || content.trim().length === 0) {
    return { isValid: false, error: 'Empty file' };
  }

  // Check for SDF delimiter
  if (!content.includes('$$$$')) {
    // Could be a single MOL file
    if (content.includes('M  END')) {
      return { isValid: true, structureCount: 1 };
    }
    return { isValid: false, error: 'Not a valid SDF or MOL file' };
  }

  // Count structures
  const structureCount = (content.match(/\$\$\$\$/g) || []).length;
  
  if (structureCount === 0) {
    return { isValid: false, error: 'No structures found' };
  }

  return { isValid: true, structureCount };
}

/**
 * Extract SMILES from SDF structures using RDKit
 * @param structures - SDF structures
 * @returns Array of SMILES strings
 */
export async function extractSmilesFromStructures(
  structures: SDFStructure[]
): Promise<Array<string | null>> {
  const { molfileToSmiles } = await import('./rdkit');
  
  const smilesPromises = structures.map(async (structure) => {
    try {
      return await molfileToSmiles(structure.molfile);
    } catch (error) {
      console.error(`Failed to convert structure ${structure.id} to SMILES:`, error);
      return null;
    }
  });

  return Promise.all(smilesPromises);
}

