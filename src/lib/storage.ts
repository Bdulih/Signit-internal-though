import type { Borrower } from './types';

const KEY = 'jyad.signit.borrowers.v1';

function safeRead(): Borrower[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Borrower[];
  } catch {
    return [];
  }
}

function safeWrite(list: Borrower[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // Quota or unavailable — ignore in demo
  }
}

export function getAllBorrowers(): Borrower[] {
  return safeRead();
}

export function getBorrower(id: string): Borrower | undefined {
  return safeRead().find((b) => b.id === id);
}

export function upsertBorrower(b: Borrower): void {
  const list = safeRead();
  const idx = list.findIndex((x) => x.id === b.id);
  if (idx >= 0) list[idx] = b;
  else list.unshift(b);
  safeWrite(list);
}

export function deleteBorrower(id: string): void {
  safeWrite(safeRead().filter((b) => b.id !== id));
}

export function clearAll(): void {
  safeWrite([]);
}
