import { Link, useLocation } from 'react-router-dom';
import { DemoBanner } from './DemoBanner';

export function Layout({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  return (
    <div className="min-h-screen flex flex-col">
      <DemoBanner />
      <header className="bg-jyad-primary text-white border-b border-black/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <span className="font-black text-2xl tracking-tight text-jyad-accent">جياد</span>
            <span className="hidden sm:inline text-white/70 text-sm border-r border-white/20 pr-3">
              نظام التوقيع الداخلي
            </span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-md transition-colors ${
                loc.pathname === '/' ? 'bg-white/10' : 'hover:bg-white/5'
              }`}
            >
              لوحة المقترضين
            </Link>
            <Link
              to="/borrowers/new"
              className={`px-3 py-1.5 rounded-md transition-colors ${
                loc.pathname === '/borrowers/new' ? 'bg-white/10' : 'hover:bg-white/5'
              }`}
            >
              إضافة مقترض
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-jyad-border bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 text-xs text-jyad-muted flex flex-wrap items-center justify-between gap-2">
          <span>© جياد كابيتال — نسخة تجريبية داخلية</span>
          <span className="text-red-600">بيانات تجريبية فقط — لا تُخزّن على خادم</span>
        </div>
      </footer>
    </div>
  );
}
