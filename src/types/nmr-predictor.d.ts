declare module 'nmr-predictor' {
  export function fetchProton(url?: string, dbName?: string): Promise<unknown>;
  export function fetchCarbon(url?: string, dbName?: string): Promise<unknown>;
  export function proton(
    molecule: string | object,
    options?: { use?: 'median' | 'mean'; levels?: number[]; ignoreLabile?: boolean }
  ): Promise<Array<{
    delta: number | null;
    atomIDs: number[];
    atomLabel: string;
    std?: number;
    min?: number;
    max?: number;
    ncs?: number;
    nbAtoms: number;
  }>>;
  export function carbon(
    molecule: string | object,
    options?: { use?: 'median' | 'mean'; levels?: number[] }
  ): Promise<Array<{
    delta: number | null;
    atomIDs: number[];
    atomLabel: string;
    std?: number;
    min?: number;
    max?: number;
    ncs?: number;
    nbAtoms: number;
  }>>;
}
