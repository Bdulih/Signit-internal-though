import { Link, NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';
import { DemoBanner } from './DemoBanner';
import { cn } from '@/lib/cn';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-bg text-navy-700">
      <DemoBanner />
      <header className="bg-navy text-white shadow-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-gold/50 flex items-center justify-center text-gold font-bold text-xl group-hover:scale-105 transition">
              ج
            </div>
            <div className="leading-tight">
              <div className="text-gold text-lg font-bold">جياد</div>
              <div className="text-[10px] tracking-[0.22em] text-white/70">JYAD CAPITAL</div>
            </div>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2 text-sm">
            <NavItem to="/" label="لوحة المقترضين" end />
            <NavItem to="/borrowers/new" label="إضافة مقترض" />
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-navy-50 bg-white/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-navy-400">
          <div>© جياد كابيتال — نسخة تجريبية داخلية</div>
          <div className="text-red-600 font-medium">بيانات تجريبية فقط</div>
        </div>
      </footer>
    </div>
  );
}

function NavItem({ to, label, end }: { to: string; label: string; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'px-3 py-1.5 rounded-lg transition',
          isActive ? 'bg-white text-navy font-semibold' : 'text-white/80 hover:bg-white/10',
        )
      }
    >
      {label}
    </NavLink>
  );
}
