/**
 * Template Library - Amino acids, sugars, common rings
 * ChemDraw-style templates for quick structure insertion
 */

export interface TemplateItem {
  name: string;
  smiles: string;
  category: string;
}

export const TEMPLATE_LIBRARY: TemplateItem[] = [
  // Amino acids (simplified SMILES - side chains)
  { name: 'Glycine', smiles: 'NCC(=O)O', category: 'Amino Acids' },
  { name: 'Alanine', smiles: 'CC(N)C(=O)O', category: 'Amino Acids' },
  { name: 'Valine', smiles: 'CC(C)C(N)C(=O)O', category: 'Amino Acids' },
  { name: 'Leucine', smiles: 'CC(C)CC(N)C(=O)O', category: 'Amino Acids' },
  { name: 'Serine', smiles: 'COCC(N)C(=O)O', category: 'Amino Acids' },
  { name: 'Threonine', smiles: 'CC(O)C(N)C(=O)O', category: 'Amino Acids' },
  { name: 'Cysteine', smiles: 'CSCC(N)C(=O)O', category: 'Amino Acids' },
  { name: 'Methionine', smiles: 'CSCCC(N)C(=O)O', category: 'Amino Acids' },
  { name: 'Aspartic acid', smiles: 'C(C(C(=O)O)N)C(=O)O', category: 'Amino Acids' },
  { name: 'Glutamic acid', smiles: 'C(CC(=O)O)C(C(=O)O)N', category: 'Amino Acids' },
  { name: 'Lysine', smiles: 'C(CCN)CC(C(=O)O)N', category: 'Amino Acids' },
  { name: 'Arginine', smiles: 'C(CC(C(=O)O)N)CNC(=N)N', category: 'Amino Acids' },
  { name: 'Histidine', smiles: 'c1c[nH]cn1CC(C(=O)O)N', category: 'Amino Acids' },
  { name: 'Phenylalanine', smiles: 'c1ccc(cc1)CC(C(=O)O)N', category: 'Amino Acids' },
  { name: 'Tyrosine', smiles: 'c1cc(ccc1CC(C(=O)O)N)O', category: 'Amino Acids' },
  { name: 'Tryptophan', smiles: 'c1ccc2c(c1)c(c[nH]2)CC(C(=O)O)N', category: 'Amino Acids' },
  { name: 'Proline', smiles: 'C1CC(NC1)C(=O)O', category: 'Amino Acids' },
  // Sugars (simplified)
  { name: 'Glucose', smiles: 'C([C@H]1[C@H]([C@@H](C(O[C@H]1O)O)O)O)O', category: 'Sugars' },
  { name: 'Fructose', smiles: 'C([C@H]1[C@H](C(=O)CO1)O)O', category: 'Sugars' },
  { name: 'Ribose', smiles: 'C([C@H]1[C@H](C(O[C@H]1O)O)O)O', category: 'Sugars' },
  { name: 'Deoxyribose', smiles: 'CC1OC(O)C(O)C1O', category: 'Sugars' },
  { name: 'Galactose', smiles: 'C([C@@H]1[C@@H]([C@H](C(O[C@H]1O)O)O)O)O', category: 'Sugars' },
  { name: 'Mannose', smiles: 'C([C@@H]1[C@H]([C@@H](C(O[C@H]1O)O)O)O)O', category: 'Sugars' },
  // Common rings (beyond Ketcher defaults)
  { name: 'Benzene', smiles: 'c1ccccc1', category: 'Rings' },
  { name: 'Pyridine', smiles: 'c1ccncc1', category: 'Rings' },
  { name: 'Pyrimidine', smiles: 'c1cncnc1', category: 'Rings' },
  { name: 'Naphthalene', smiles: 'c1ccc2ccccc2c1', category: 'Rings' },
  { name: 'Anthracene', smiles: 'c1ccc2cc3ccccc3cc2c1', category: 'Rings' },
  { name: 'Phenanthrene', smiles: 'c1ccc2c(c1)c3ccccc3cc2', category: 'Rings' },
  { name: 'Cyclopropane', smiles: 'C1CC1', category: 'Rings' },
  { name: 'Cyclobutane', smiles: 'C1CCC1', category: 'Rings' },
  { name: 'Cyclopentane', smiles: 'C1CCCC1', category: 'Rings' },
  { name: 'Cyclohexane', smiles: 'C1CCCCC1', category: 'Rings' },
  { name: 'Cycloheptane', smiles: 'C1CCCCCC1', category: 'Rings' },
  { name: 'Pyrrole', smiles: 'c1cc[nH]c1', category: 'Rings' },
  { name: 'Furan', smiles: 'c1ccoc1', category: 'Rings' },
  { name: 'Thiophene', smiles: 'c1ccsc1', category: 'Rings' },
  { name: 'Imidazole', smiles: 'c1cn[nH]c1', category: 'Rings' },
  { name: 'Indole', smiles: 'c1ccc2[nH]ccc2c1', category: 'Rings' },
  { name: 'Quinoline', smiles: 'c1ccc2ncccc2c1', category: 'Rings' },
  { name: 'Isoquinoline', smiles: 'c1ccc2ccnc2c1', category: 'Rings' },
  // Steroids (simplified core)
  { name: 'Steroid core', smiles: 'CC12CCC3C(C1CCC2O)CCC4C3CCC4', category: 'Steroids' },
];

export const TEMPLATE_CATEGORIES = ['Amino Acids', 'Sugars', 'Rings', 'Steroids'] as const;
