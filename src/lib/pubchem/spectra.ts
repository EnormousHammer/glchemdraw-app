/**
 * PubChem Spectral Data Integration
 * Fetches and processes spectral data from PubChem
 */

import axios from 'axios';
import { pubchemThrottler } from './throttle';

const PUG_REST_BASE = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug';
const REQUEST_TIMEOUT = 30000;

export interface SpectralData {
  cid: number;
  type: 'nmr' | 'ir' | 'uv' | 'mass' | 'raman';
  title: string;
  description?: string;
  url: string;
  imageUrl?: string;
  metadata?: Record<string, any>;
}

export interface NMRData extends SpectralData {
  type: 'nmr';
  nucleus: '1H' | '13C' | '15N' | '31P';
  solvent: string;
  frequency: number;
  temperature?: number;
}

export interface IRData extends SpectralData {
  type: 'ir';
  technique: 'FTIR' | 'ATR' | 'KBr';
  resolution?: number;
}

export interface MassData extends SpectralData {
  type: 'mass';
  ionization: 'EI' | 'CI' | 'ESI' | 'MALDI';
  polarity: 'positive' | 'negative';
}

/**
 * Get available spectral data for a compound
 */
export async function getSpectralData(cid: number): Promise<SpectralData[]> {
  if (!cid || cid <= 0) {
    throw new Error('Invalid CID');
  }

  try {
    const result = await pubchemThrottler.throttle(async () => {
      const response = await axios.get(
        `${PUG_REST_BASE}/compound/cid/${cid}/spectra/JSON`,
        {
          timeout: REQUEST_TIMEOUT,
          headers: { 'Accept': 'application/json' },
        }
      );
      return response.data;
    });

    const spectra = result?.PC_Compounds?.[0]?.spectra || [];
    
    return spectra.map((spectrum: any) => ({
      cid,
      type: mapSpectrumType(spectrum.type),
      title: spectrum.title || 'Unknown Spectrum',
      description: spectrum.description,
      url: spectrum.url,
      imageUrl: spectrum.imageUrl,
      metadata: spectrum.metadata,
    }));
  } catch (error) {
    console.error('[PubChem Spectra] Error fetching spectral data:', error);
    throw new Error(`Failed to fetch spectral data: ${(error as Error).message}`);
  }
}

/**
 * Get specific NMR spectrum
 */
export async function getNMRSpectrum(cid: number, nucleus: '1H' | '13C' = '1H'): Promise<NMRData | null> {
  const spectra = await getSpectralData(cid);
  const nmrSpectra = spectra.filter(s => s.type === 'nmr') as NMRData[];
  
  return nmrSpectra.find(s => s.nucleus === nucleus) || nmrSpectra[0] || null;
}

/**
 * Get IR spectrum
 */
export async function getIRSpectrum(cid: number): Promise<IRData | null> {
  const spectra = await getSpectralData(cid);
  return spectra.find(s => s.type === 'ir') as IRData || null;
}

/**
 * Get Mass spectrum
 */
export async function getMassSpectrum(cid: number): Promise<MassData | null> {
  const spectra = await getSpectralData(cid);
  return spectra.find(s => s.type === 'mass') as MassData || null;
}

/**
 * Map PubChem spectrum type to our internal type
 */
function mapSpectrumType(pubchemType: string): SpectralData['type'] {
  const typeMap: Record<string, SpectralData['type']> = {
    'NMR': 'nmr',
    'IR': 'ir',
    'UV-Vis': 'uv',
    'Mass': 'mass',
    'Raman': 'raman',
  };
  
  return typeMap[pubchemType] || 'nmr';
}

/**
 * Get spectrum image URL
 */
export function getSpectrumImageUrl(cid: number, spectrumId: string): string {
  return `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/spectra/${spectrumId}/image`;
}

/**
 * Download spectrum data
 */
export async function downloadSpectrumData(spectrum: SpectralData): Promise<Blob> {
  try {
    const response = await axios.get(spectrum.url, {
      timeout: REQUEST_TIMEOUT,
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to download spectrum: ${(error as Error).message}`);
  }
}
