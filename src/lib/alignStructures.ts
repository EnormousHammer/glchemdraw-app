/**
 * ChemDraw-style structure alignment
 * Aligns multiple selected structures by their bounding boxes (left, right, top, bottom)
 */

import {
  fromMultipleMove,
  formatSelection,
  Vec2,
  Action,
} from 'ketcher-core';

export type AlignMode = 'left' | 'right' | 'top' | 'bottom';

function getConnectedComponents(
  restruct: any,
  atomIds: number[]
): number[][] {
  const atomSet = new Set(atomIds);
  const visited = new Set<number>();
  const components: number[][] = [];

  for (const aid of atomIds) {
    if (visited.has(aid)) continue;

    const component: number[] = [];
    const queue = [aid];

    while (queue.length > 0) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      if (atomSet.has(id)) component.push(id);

      const neighbors = restruct.molecule?.atomGetNeighbors?.(id);
      if (!neighbors) continue;

      for (const nb of neighbors) {
        const neiId = typeof nb === 'object' ? (nb as { aid: number }).aid : nb;
        if (!visited.has(neiId) && atomSet.has(neiId)) {
          queue.push(neiId);
        }
      }
    }

    if (component.length > 0) components.push(component);
  }

  return components;
}

function getBoundingBox(restruct: any, atomIds: number[]): { minX: number; minY: number; maxX: number; maxY: number } | null {
  if (atomIds.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const mol = restruct.molecule;
  if (!mol) return null;

  for (const aid of atomIds) {
    const atom = mol.atoms.get(aid);
    if (!atom?.pp) continue;
    const pp = atom.pp;
    const x = typeof pp.x === 'number' ? pp.x : (pp as Vec2).x;
    const y = typeof pp.y === 'number' ? pp.y : (pp as Vec2).y;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  if (minX === Infinity) return null;
  return { minX, minY, maxX, maxY };
}

function buildListsForAtoms(atomIds: number[]): { atoms: number[] } {
  return { atoms: [...atomIds] };
}

export function alignStructures(
  editor: any,
  mode: AlignMode
): { success: boolean; message: string } {
  if (!editor?.render?.ctab || !editor?.selection || !editor?.update) {
    return { success: false, message: 'Editor not ready' };
  }

  const restruct = editor.render.ctab;
  const sel = editor.selection();

  if (!sel?.atoms || sel.atoms.length === 0) {
    return { success: false, message: 'Select one or more structures to align' };
  }

  const formatted = formatSelection(sel);
  const components = getConnectedComponents(restruct, formatted.atoms);

  if (components.length < 2) {
    return { success: false, message: 'Select 2+ structures to align' };
  }

  const bboxes = components.map((atoms) => getBoundingBox(restruct, atoms));
  const valid = bboxes.every((bb) => bb !== null);
  if (!valid) {
    return { success: false, message: 'Could not compute structure bounds' };
  }

  let targetX: number;
  let targetY: number;
  const deltas: Vec2[] = [];

  if (mode === 'left') {
    targetX = Math.min(...bboxes.map((bb) => bb!.minX));
    for (const bb of bboxes) {
      deltas.push(new Vec2(targetX - bb!.minX, 0));
    }
  } else if (mode === 'right') {
    targetX = Math.max(...bboxes.map((bb) => bb!.maxX));
    for (const bb of bboxes) {
      deltas.push(new Vec2(targetX - bb!.maxX, 0));
    }
  } else if (mode === 'top') {
    targetY = Math.min(...bboxes.map((bb) => bb!.minY));
    for (const bb of bboxes) {
      deltas.push(new Vec2(0, targetY - bb!.minY));
    }
  } else {
    targetY = Math.max(...bboxes.map((bb) => bb!.maxY));
    for (const bb of bboxes) {
      deltas.push(new Vec2(0, targetY - bb!.maxY));
    }
  }

  let mergedAction: Action | null = null;

  for (let i = 0; i < components.length; i++) {
    const lists = buildListsForAtoms(components[i]);
    const action = fromMultipleMove(restruct, lists, deltas[i]);
    mergedAction = mergedAction ? mergedAction.mergeWith(action) : action;
  }

  if (mergedAction) {
    try {
      editor.update(mergedAction, false, { resizeCanvas: true });
      return { success: true, message: `Aligned ${mode}` };
    } catch (err) {
      console.error('[alignStructures] Update failed:', err);
      return { success: false, message: 'Align failed' };
    }
  }

  return { success: false, message: 'Could not create align action' };
}
