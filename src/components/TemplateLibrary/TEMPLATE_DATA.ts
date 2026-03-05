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
  { name: 'Purine', smiles: 'c1[nH]cnc2[nH]cnc12', category: 'Heterocycles' },
  { name: 'Pyridine N-oxide', smiles: 'c1cc[n+]([O-])cc1', category: 'Heterocycles' },
  { name: 'Benzimidazole', smiles: 'c1ccc2[nH]c(nc2c1)', category: 'Heterocycles' },
  { name: 'Oxazole', smiles: 'c1ocnc1', category: 'Heterocycles' },
  { name: 'Thiazole', smiles: 'c1cscn1', category: 'Heterocycles' },
  { name: 'Pyrazole', smiles: 'c1cc[nH]n1', category: 'Heterocycles' },
  { name: 'Morpholine', smiles: 'C1COCCN1', category: 'Heterocycles' },
  { name: 'Piperidine', smiles: 'C1CCCCC1N', category: 'Heterocycles' },
  { name: 'Piperazine', smiles: 'C1CNCCN1', category: 'Heterocycles' },
  { name: 'Quinoxaline', smiles: 'c1ccc2nc(cn2c1)', category: 'Heterocycles' },
  { name: 'Benzothiazole', smiles: 'c1ccc2scnc2c1', category: 'Heterocycles' },
  { name: 'Benzoxazole', smiles: 'c1ccc2ocnc2c1', category: 'Heterocycles' },
  { name: '1,2,4-Triazole', smiles: 'c1cnn[nH]1', category: 'Heterocycles' },
  { name: 'Tetrazole', smiles: 'c1nnnn1', category: 'Heterocycles' },
  { name: 'Pyridazine', smiles: 'c1ccnnc1', category: 'Heterocycles' },
  { name: 'Pyrazine', smiles: 'c1cnccn1', category: 'Heterocycles' },
  // Protecting groups (fragments – connect at attachment point)
  { name: 'Boc (t-Boc)', smiles: 'CC(C)(C)OC(=O)', category: 'Protecting Groups' },
  { name: 'Cbz (Benzyloxycarbonyl)', smiles: 'Cc1ccccc1OC(=O)', category: 'Protecting Groups' },
  { name: 'Fmoc', smiles: 'O=C(O)C1c2ccccc2c3ccccc13', category: 'Protecting Groups' },
  { name: 'TBS (TBDMS)', smiles: 'CC(C)(C)[Si](C)(C)O', category: 'Protecting Groups' },
  { name: 'Ac (Acetyl)', smiles: 'CC(=O)', category: 'Protecting Groups' },
  { name: 'Bn (Benzyl)', smiles: 'Cc1ccccc1', category: 'Protecting Groups' },
  { name: 'Tr (Trityl)', smiles: 'C(c1ccccc1)(c2ccccc2)c3ccccc3', category: 'Protecting Groups' },
  { name: 'TBDPS', smiles: 'CC(C)(C)[Si](c1ccccc1)(C)C', category: 'Protecting Groups' },
  { name: 'MOM (Methoxymethyl)', smiles: 'COC', category: 'Protecting Groups' },
  { name: 'THP (Tetrahydropyranyl)', smiles: 'C1CCOCC1O', category: 'Protecting Groups' },
  { name: 'SEM', smiles: 'COCC[Si](C)(C)C', category: 'Protecting Groups' },
  // Reagents (common structures)
  { name: 'DCC', smiles: 'C1CCCN=C=N1', category: 'Reagents' },
  { name: 'EDC (EDCI)', smiles: 'CCN(CC)C(=N)N', category: 'Reagents' },
  { name: 'HOBt', smiles: 'c1ccc2[nH]onc2c1', category: 'Reagents' },
  { name: 'DMAP', smiles: 'c1ccc(N(C)C)nc1', category: 'Reagents' },
  { name: 'PCC', smiles: 'O=[Cr](=O)(O)Cl', category: 'Reagents' },
  { name: 'DIBAL-H', smiles: 'CC(C)Al', category: 'Reagents' },
  { name: 'LAH (LiAlH4)', smiles: '[Li+].[AlH4-]', category: 'Reagents' },
  { name: 'NaBH4', smiles: '[Na+].[BH4-]', category: 'Reagents' },
  { name: 'TFA', smiles: 'FC(F)(C(=O)O)F', category: 'Reagents' },
  { name: 'TsOH', smiles: 'S(=O)(=O)(O)c1ccccc1C', category: 'Reagents' },
  { name: 'Pinacol borane', smiles: 'B1OC(C)(C)C(C)(C)O1', category: 'Reagents' },
  { name: 'Pd(PPh3)4', smiles: 'P(c1ccccc1)(c2ccccc2)(c3ccccc3)', category: 'Reagents' },
  // Steroids (simplified core)
  { name: 'Steroid core', smiles: 'CC12CCC3C(C1CCC2O)CCC4C3CCC4', category: 'Steroids' },
];

export const TEMPLATE_CATEGORIES = ['Amino Acids', 'Sugars', 'Rings', 'Heterocycles', 'Protecting Groups', 'Reagents', 'Steroids'] as const;
