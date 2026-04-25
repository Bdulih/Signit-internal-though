import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { findBorrowerByContact, setSession } from '@/lib/auth';
import { getAllBorrowers } from '@/lib/storage';
import { maybeSeedDemos } from '@/lib/seed';

type Step = 'contact' | 'otp';

export function ClientLogin() {
  const nav = useNavigate();
  const [step, setStep] = useState<Step>('contact');
  const [contact, setContact] = useState('');
  const [match, setMatch] = useState<{ id: string; name: string; email: string } | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const [suggestions, setSuggestions] = useState<{ email: string; name: string }[]>([]);

  useEffect(() => {
    maybeSeedDemos();
    const list = getAllBorrowers().slice(0, 4).map((b) => ({
      email: b.signer.email,
      name: b.signer.fullName,
    }));
    setSuggestions(list);
  }, []);

  function submitContact(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!contact.trim()) return;
    const m = findBorrowerByContact(contact);
    if (!m) {
      setError('لم نعثر على ملف بهذا البريد أو الجوّال. جرّب أحد الحسابات التجريبية أدناه.');
      return;
    }
    setBusy(true);
    setTimeout(() => {
      setMatch(m);
      setStep('otp');
      setBusy(false);
      setTimeout(() => inputs.current[0]?.focus(), 60);
    }, 500);
  }

  function setAt(idx: number, v: string) {
    const clean = v.replace(/\D/g, '').slice(0, 1);
    const next = [...digits];
    next[idx] = clean;
    setDigits(next);
    if (clean && idx < 5) inputs.current[idx + 1]?.focus();
  }

  function onPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(6).fill('');
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    inputs.current[Math.min(pasted.length, 5)]?.focus();
  }

  function submitOtp(e: React.FormEvent) {
    e.preventDefault();
    if (digits.some((d) => d.length !== 1) || !match) return;
    setBusy(true);
    setTimeout(() => {
      setSession({
        role: 'client',
        name: match.name,
        email: match.email,
        borrowerId: match.id,
      });
      nav('/sign', { replace: true });
    }, 500);
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-8">
        <Link to="/" className="text-xs text-navy-400 hover:text-navy">← العودة</Link>
        <div className="text-[10px] font-bold tracking-[0.25em] text-gold-700 mt-4">
          BORROWER · CLIENT
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-navy mt-1">
          الدخول كعميل
        </h1>
        <p className="text-sm text-navy-400 mt-2">
          {step === 'contact'
            ? 'أدخل البريد الإلكتروني أو رقم الجوّال لاستلام رمز التحقق.'
            : `تم إرسال رمز تحقق إلى البريد الإلكتروني الخاص بـ ${match?.name}.`}
        </p>
      </div>

      {step === 'contact' && (
        <>
          <form onSubmit={submitContact} className="card p-6 sm:p-7 space-y-4">
            <label className="block">
              <div className="label">البريد الإلكتروني أو رقم الجوّال</div>
              <input
                dir="ltr"
                className="input"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="example@company.sa"
                required
              />
            </label>
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-xs">
                {error}
              </div>
            )}
            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? 'جارٍ الإرسال…' : 'إرسال رمز التحقق'}
            </button>
          </form>

          {suggestions.length > 0 && (
            <div className="card p-4 mt-4 bg-gradient-to-br from-gold-50 to-white border-gold-200">
              <div className="text-[10px] font-bold tracking-wider text-gold-700 mb-2">
                حسابات تجريبية للاستخدام السريع
              </div>
              <div className="space-y-1.5">
                {suggestions.map((s) => (
                  <button
                    key={s.email}
                    type="button"
                    onClick={() => setContact(s.email)}
                    className="w-full text-right px-3 py-2 rounded-lg hover:bg-white border border-transparent hover:border-gold-200 transition flex items-center justify-between gap-2"
                  >
                    <span className="text-xs text-navy-400 truncate" dir="ltr">{s.email}</span>
                    <span className="text-xs font-semibold text-navy truncate">{s.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {step === 'otp' && match && (
        <form onSubmit={submitOtp} className="card p-6 sm:p-7 space-y-4">
          <div>
            <div className="label">رمز التحقق المكوّن من 6 أرقام</div>
            <div className="flex justify-between gap-2" dir="ltr">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputs.current[i] = el;
                  }}
                  value={d}
                  onChange={(e) => setAt(i, e.target.value)}
                  onPaste={onPaste}
                  inputMode="numeric"
                  maxLength={1}
                  className="input text-center text-2xl font-bold w-12 h-14 sm:w-14 sm:h-16 tracking-widest border-navy-100 focus:border-gold"
                />
              ))}
            </div>
          </div>
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
            وضع تجريبي — أدخل أي 6 أرقام لإكمال تسجيل الدخول.
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setStep('contact');
                setDigits(Array(6).fill(''));
              }}
              className="btn-outline flex-1"
            >
              تغيير
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={busy}>
              {busy ? 'جارٍ التحقق…' : 'تأكيد'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
