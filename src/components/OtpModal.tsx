import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

interface Props {
  open: boolean;
  mobile: string;
  onClose: () => void;
  onVerified: (otp: string) => void;
}

export function OtpModal({ open, mobile, onClose, onVerified }: Props) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [busy, setBusy] = useState(false);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (open) {
      setDigits(Array(6).fill(''));
      setBusy(false);
      setTimeout(() => inputs.current[0]?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  function setAt(idx: number, v: string) {
    const clean = v.replace(/\D/g, '').slice(0, 1);
    const next = [...digits];
    next[idx] = clean;
    setDigits(next);
    if (clean && idx < 5) inputs.current[idx + 1]?.focus();
  }

  function onKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && idx < 5) {
      inputs.current[idx + 1]?.focus();
    } else if (e.key === 'ArrowRight' && idx > 0) {
      inputs.current[idx - 1]?.focus();
    } else if (e.key === 'Enter') {
      submit();
    }
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

  function submit() {
    const otp = digits.join('');
    if (otp.length !== 6) return;
    setBusy(true);
    setTimeout(() => onVerified(otp), 400);
  }

  const full = digits.every((d) => d.length === 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-pop w-full max-w-md p-6 sm:p-8">
        <div className="flex items-start justify-between mb-1">
          <h2 className="text-xl font-bold text-navy">تحقق من الهوية</h2>
          <button
            onClick={onClose}
            className="text-navy-300 hover:text-navy transition text-xl leading-none"
            aria-label="إغلاق"
          >
            ×
          </button>
        </div>
        <p className="text-sm text-navy-400 mb-1">
          تم إرسال رمز التحقق إلى رقم الجوّال
        </p>
        <p dir="ltr" className="text-sm text-navy-600 font-semibold text-left mb-4">
          {mobile || '—'}
        </p>

        <div className="flex justify-between gap-2 mb-3" dir="ltr">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputs.current[i] = el;
              }}
              value={d}
              onChange={(e) => setAt(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              onPaste={onPaste}
              inputMode="numeric"
              maxLength={1}
              className={cn(
                'input text-center text-2xl font-bold w-12 h-14 sm:w-14 sm:h-16 tracking-widest',
                'border-navy-100 focus:border-gold',
              )}
            />
          ))}
        </div>

        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-5">
          وضع تجريبي — أدخل أي 6 أرقام للمتابعة
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="btn-outline flex-1" disabled={busy}>
            إلغاء
          </button>
          <button
            onClick={submit}
            className="btn-primary flex-1"
            disabled={!full || busy}
          >
            {busy ? 'جارٍ التحقق…' : 'تأكيد الرمز'}
          </button>
        </div>
      </div>
    </div>
  );
}
