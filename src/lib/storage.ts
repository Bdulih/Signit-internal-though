import type { Borrower } from './types';

const KEY = 'jyad.signit.borrowers.v1';

export function loadBorrowers(): Borrower[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Borrower[];
  } catch {
    return [];
  }
}

export function saveBorrowers(list: Borrower[]): void {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function upsertBorrower(b: Borrower): void {
  const list = loadBorrowers();
  const idx = list.findIndex((x) => x.id === b.id);
  if (idx >= 0) list[idx] = b;
  else list.unshift(b);
  saveBorrowers(list);
}

export function getBorrower(id: string): Borrower | undefined {
  return loadBorrowers().find((b) => b.id === id);
}

export function deleteBorrower(id: string): void {
  saveBorrowers(loadBorrowers().filter((b) => b.id !== id));
}

export function newId(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
