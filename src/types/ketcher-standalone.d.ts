// Type declarations for ketcher-standalone
declare module 'ketcher-standalone' {
  export interface KetcherEditor {
    getSmiles: () => Promise<string>;
    getMolfile: () => Promise<string>;
    setMolecule: (molecule: string) => Promise<void>;
    editor: any;
  }

  export class StandaloneStructServiceProvider {
    constructor();
    mode: 'standalone';
    apiPath: string;
    createStructService(): any;
  }

  export default function StandaloneKetcher(
    options: {
      element: HTMLElement | null;
      structServiceProvider?: any;
    }
  ): Promise<KetcherEditor>;
}

