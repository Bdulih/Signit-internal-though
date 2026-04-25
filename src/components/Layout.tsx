import { Link, NavLink, useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { DemoBanner } from './DemoBanner';
import { cn } from '@/lib/cn';
import { getSession, logout } from '@/lib/auth';

interface Props {
  children: ReactNode;
  publicView?: boolean;
}

export function Layout({ children, publicView = false }: Props) {
  const session = getSession();
  const nav = useNavigate();

  function onLogout() {
    logout();
    nav('/', { replace: true });
  }

  const homeHref =
    session?.role === 'staff' ? '/admin' : session?.role === 'client' ? '/sign' : '/';

  return (
    <div className="min-h-screen flex flex-col bg-bg text-navy-700">
      <DemoBanner />
      <header className="bg-navy text-white shadow-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <Link to={homeHref} className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-gold/50 flex items-center justify-center text-gold font-bold text-xl group-hover:scale-105 transition">
              ج
            </div>
            <div className="leading-tight">
              <div className="text-gold text-lg font-bold">جياد</div>
              <div className="text-[10px] tracking-[0.22em] text-white/70">JYAD CAPITAL</div>
            </div>
          </Link>

          {!publicView && (
            <>
              <nav className="hidden sm:flex items-center gap-1 text-sm">
                {session?.role === 'staff' && (
                  <>
                    <NavItem to="/admin" label="لوحة المقترضين" end />
                    <NavItem to="/admin/borrowers/new" label="إضافة مقترض" />
                  </>
                )}
                {session?.role === 'client' && (
                  <NavItem to="/sign" label="حزمة التوقيع" end />
                )}
              </nav>

              {session && (
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex flex-col items-end leading-tight">
                    <span className="text-xs text-white/80 truncate max-w-[160px]">
                      {session.name}
                    </span>
                    <span
                      className={cn(
                        'text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded',
                        session.role === 'staff'
                          ? 'bg-white/10 text-white/80'
                          : 'bg-gold/20 text-gold',
                      )}
                    >
                      {session.role === 'staff' ? 'موظف · STAFF' : 'عميل · CLIENT'}
                    </span>
                  </div>
                  <button
                    onClick={onLogout}
                    className="text-xs text-white/70 hover:text-white border border-white/20 hover:border-white/40 px-2.5 py-1.5 rounded-lg transition"
                    title="تسجيل الخروج"
                  >
                    خروج
                  </button>
                </div>
              )}
            </>
          )}

          {publicView && (
            <div className="text-[10px] tracking-[0.22em] text-white/60">
              منصة التوقيع الإلكتروني
            </div>
          )}
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
