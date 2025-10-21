// Chemistry-related type definitions

export interface Molecule {
  smiles?: string;
  molfile?: string;
  inchi?: string;
  inchiKey?: string;
}

export interface MolecularProperties {
  molecularFormula?: string;
  molecularWeight?: number;
  exactMass?: number;
  canonicalSmiles?: string;
  isomericSmiles?: string;
  iupacName?: string;
}

export interface PubChemCompound {
  cid: number;
  properties: PubChemProperties;
  summary?: PubChemSummary;
}

export interface PubChemProperties {
  CID?: number;
  MolecularFormula: string;
  MolecularWeight: number;
  ExactMass?: number;
  MonoisotopicMass?: number;
  IUPACName?: string;
  Title?: string;
  InChI?: string;
  InChIKey?: string;
  CanonicalSMILES?: string;
  IsomericSMILES?: string;
  XLogP?: number;
  TPSA?: number;
  Complexity?: number;
  Charge?: number;
  HBondDonorCount?: number;
  HBondAcceptorCount?: number;
  RotatableBondCount?: number;
  HeavyAtomCount?: number;
  IsotopeAtomCount?: number;
  AtomStereoCount?: number;
  DefinedAtomStereoCount?: number;
  UndefinedAtomStereoCount?: number;
  BondStereoCount?: number;
  DefinedBondStereoCount?: number;
  UndefinedBondStereoCount?: number;
  CovalentUnitCount?: number;
  Volume3D?: number;
  XStericQuadrupole3D?: number;
  YStericQuadrupole3D?: number;
  ZStericQuadrupole3D?: number;
  FeatureCount3D?: number;
  FeatureAcceptorCount3D?: number;
  FeatureDonorCount3D?: number;
  FeatureAnionCount3D?: number;
  FeatureCationCount3D?: number;
  FeatureRingCount3D?: number;
  FeatureHydrophobeCount3D?: number;
  ConformerModelRMSD3D?: number;
  EffectiveRotorCount3D?: number;
  ConformerCount3D?: number;
  Fingerprint2D?: string;
  [key: string]: any; // Allow additional dynamic properties
}

export interface PubChemSummary {
  cid: number;
  title?: string;
  description?: string;
  synonyms?: string[];
}

export interface ChemicalDescriptors {
  molecularWeight: number;
  logP?: number;
  hBondDonors?: number;
  hBondAcceptors?: number;
  tpsa?: number;
  rotatableBonds?: number;
  rings?: number;
  aromaticRings?: number;
}

export interface StructureValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ChemFileFormat {
  type: 'mol' | 'sdf' | 'smiles' | 'inchi';
  content: string;
  metadata?: Record<string, unknown>;
}

