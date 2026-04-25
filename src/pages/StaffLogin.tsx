import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { setSession } from '@/lib/auth';

const DEMO_EMAIL = 'staff@jyadcapital.sa';

export function StaffLogin() {
  const nav = useNavigate();
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [pwd, setPwd] = useState('');
  const [busy, setBusy] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !pwd) return;
    setBusy(true);
    setTimeout(() => {
      setSession({
        role: 'staff',
        name: email.split('@')[0] || 'موظف جياد',
        email: email.trim(),
      });
      nav('/admin', { replace: true });
    }, 500);
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-8">
        <Link to="/" className="text-xs text-navy-400 hover:text-navy">← العودة</Link>
        <div className="text-[10px] font-bold tracking-[0.25em] text-navy-400 mt-4">
          JYAD STAFF
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-navy mt-1">
          الدخول كموظف
        </h1>
        <p className="text-sm text-navy-400 mt-2">
          استخدم بريدك المؤسسي للوصول إلى لوحة الإدارة.
        </p>
      </div>

      <form onSubmit={submit} className="card p-6 sm:p-7 space-y-4">
        <label className="block">
          <div className="label">البريد المؤسسي</div>
          <input
            type="email"
            dir="ltr"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="block">
          <div className="label">كلمة المرور</div>
          <input
            type="password"
            dir="ltr"
            className="input"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            placeholder="وضع تجريبي — أي كلمة مرور تعمل"
            required
          />
        </label>
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
          وضع تجريبي: استخدم <span className="font-semibold" dir="ltr">{DEMO_EMAIL}</span> + أي كلمة مرور.
        </div>
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? 'جارٍ التحقق…' : 'تسجيل الدخول'}
        </button>
      </form>
    </div>
  );
}
