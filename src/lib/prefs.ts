const KEY = 'jyad.signit.prefs.v1';

export type SignMode = 'draw' | 'type';

interface Prefs {
  lastSignMode?: SignMode;
}

function read(): Prefs {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Prefs) : {};
  } catch {
    return {};
  }
}

function write(p: Prefs): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // ignore
  }
}

export function getLastSignMode(): SignMode | undefined {
  return read().lastSignMode;
}

export function setLastSignMode(m: SignMode): void {
  write({ ...read(), lastSignMode: m });
}
