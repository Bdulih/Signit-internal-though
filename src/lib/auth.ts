import { getAllBorrowers } from './storage';

export type Role = 'staff' | 'client';

export interface Session {
  role: Role;
  name: string;
  email?: string;
  borrowerId?: string;
}

const KEY = 'jyad.signit.session.v1';

export function getSession(): Session | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function setSession(s: Session): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, JSON.stringify(s));
}

export function logout(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(KEY);
}

export function findBorrowerByContact(contact: string): { id: string; name: string; email: string } | null {
  const trimmed = contact.trim().toLowerCase();
  if (!trimmed) return null;
  for (const b of getAllBorrowers()) {
    const email = b.signer.email.toLowerCase();
    const mobile = b.signer.mobile.replace(/\s+/g, '');
    if (email === trimmed || mobile === contact.replace(/\s+/g, '')) {
      return { id: b.id, name: b.signer.fullName, email: b.signer.email };
    }
  }
  return null;
}

export function isStaff(s: Session | null): boolean {
  return !!s && s.role === 'staff';
}

export function isClient(s: Session | null): boolean {
  return !!s && s.role === 'client';
}
