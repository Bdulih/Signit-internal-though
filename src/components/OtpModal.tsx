import { useEffect, useRef, useState } from 'react';

interface Props {
  open: boolean;
  mobile: string;
  onClose: () => void;
  onVerified: (otp: string) => void;
}

export function OtpModal({ open, mobile, onClose, onVerified }: Props) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState<string | null>(null);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (open) {
      setDigits(Array(6).fill(''));
      setError(null);
      setTimeout(() => inputs.current[0]?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  const maskedMobile = mobile
    ? mobile.replace(/^(\+?\d{2,3})?(\d+)(\d{3})$/, (_m, a, b, c) => `${a || ''}${'*'.repeat(b.length)}${c}`)
    : '';

  function handleChange(i: number, val: string) {
    const clean = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = clean;
    setDigits(next);
    if (clean && i < 5) inputs.current[i + 1]?.focus();
  }

  function handleKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(6).fill('');
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    inputs.current[Math.min(pasted.length, 5)]?.focus();
  }

  function submit() {
    const code = digits.join('');
    if (code.length !== 6) {
      setError('يجب إدخال 6 أرقام');
      return;
    }
    onVerified(code);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="card w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 left-3 text-jyad-muted hover:text-jyad-primary text-xl leading-none"
          aria-label="إغلاق"
        >
          ×
        </button>
        <h2 className="text-lg font-bold text-jyad-primary mb-1">التحقق عبر رمز لمرة واحدة</h2>
        <p className="text-sm text-jyad-muted mb-4">
          تم إرسال رمز مكوّن من 6 أرقام إلى رقم الجوال {maskedMobile || '—'}
        </p>
        <div className="flex gap-2 justify-center mb-3" dir="ltr">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputs.current[i] = el;
              }}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKey(i, e)}
              onPaste={handlePaste}
              className="w-11 h-12 text-center text-lg font-bold rounded-lg border border-jyad-border focus:outline-none focus:ring-2 focus:ring-jyad-accent"
            />
          ))}
        </div>
        {error && <p className="text-red-600 text-sm text-center mb-2">{error}</p>}
        <p className="text-xs text-center text-jyad-muted mb-4">
          وضع تجريبي — أدخل أي 6 أرقام
        </p>
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-outline flex-1">
            إلغاء
          </button>
          <button onClick={submit} className="btn-primary flex-1">
            تأكيد
          </button>
        </div>
      </div>
    </div>
  );
}
