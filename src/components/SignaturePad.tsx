import { useEffect, useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { cn } from '@/lib/cn';
import { getLastSignMode, setLastSignMode, type SignMode } from '@/lib/prefs';

interface Props {
  open: boolean;
  signerName: string;
  lastSignature?: string;
  onClose: () => void;
  onSigned: (dataUrl: string) => void;
}

type Mode = 'previous' | SignMode;

export function SignaturePad({ open, signerName, lastSignature, onClose, onSigned }: Props) {
  const initialMode: Mode = lastSignature ? 'previous' : getLastSignMode() ?? 'draw';
  const [mode, setMode] = useState<Mode>(initialMode);
  const [typed, setTyped] = useState(signerName);
  const [empty, setEmpty] = useState(true);
  const padRef = useRef<SignatureCanvas | null>(null);
  const typedRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (open) {
      setTyped(signerName);
      setEmpty(true);
      const m: Mode = lastSignature ? 'previous' : getLastSignMode() ?? 'draw';
      setMode(m);
      setTimeout(() => padRef.current?.clear(), 50);
    }
  }, [open, signerName, lastSignature]);

  useEffect(() => {
    if (!open || mode !== 'type') return;
    const canvas = typedRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = 520 * ratio;
    canvas.height = 140 * ratio;
    canvas.style.width = '100%';
    canvas.style.height = '140px';
    ctx.scale(ratio, ratio);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 520, 140);
    ctx.fillStyle = '#0B2545';
    ctx.font = 'italic 600 42px "Tajawal", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.direction = 'rtl';
    ctx.fillText(typed || signerName || '—', 260, 74);
  }, [typed, mode, open, signerName]);

  if (!open) return null;

  function handleStroke() {
    if (padRef.current && !padRef.current.isEmpty()) setEmpty(false);
  }

  function clearPad() {
    padRef.current?.clear();
    setEmpty(true);
  }

  function confirm() {
    let dataUrl = '';
    if (mode === 'previous' && lastSignature) {
      dataUrl = lastSignature;
    } else if (mode === 'draw') {
      const pad = padRef.current;
      if (!pad || pad.isEmpty()) return;
      dataUrl = pad.toDataURL('image/png');
      setLastSignMode('draw');
    } else if (mode === 'type') {
      const canvas = typedRef.current;
      if (!canvas) return;
      dataUrl = canvas.toDataURL('image/png');
      setLastSignMode('type');
    }
    if (dataUrl) onSigned(dataUrl);
  }

  const canConfirm =
    (mode === 'previous' && !!lastSignature) ||
    (mode === 'draw' && !empty) ||
    (mode === 'type' && !!typed.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-pop w-full max-w-2xl p-6 sm:p-8 animate-pop">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-navy">توقيع المستند</h2>
            <p className="text-sm text-navy-400 mt-1">
              {lastSignature
                ? 'استخدم توقيعك السابق أو ارسم/اكتب توقيعًا جديدًا.'
                : 'ارسم توقيعك أو اكتب اسمك — لن تُنسَب هذه النسخة لأي توقيع حقيقي.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-navy-300 hover:text-navy transition text-xl leading-none"
            aria-label="إغلاق"
          >
            ×
          </button>
        </div>

        <div className="flex gap-2 mb-4 border-b border-navy-50 overflow-x-auto">
          {lastSignature && (
            <TabBtn active={mode === 'previous'} onClick={() => setMode('previous')}>
              توقيعي السابق
            </TabBtn>
          )}
          <TabBtn active={mode === 'draw'} onClick={() => setMode('draw')}>
            رسم التوقيع
          </TabBtn>
          <TabBtn active={mode === 'type'} onClick={() => setMode('type')}>
            كتابة الاسم
          </TabBtn>
        </div>

        {mode === 'previous' && lastSignature && (
          <div>
            <div
              className="rounded-xl border border-navy-100 bg-white overflow-hidden flex items-center justify-center"
              style={{ height: 180 }}
            >
              <img
                src={lastSignature}
                alt="التوقيع السابق"
                style={{ maxHeight: 160, maxWidth: '100%', objectFit: 'contain' }}
              />
            </div>
            <p className="text-xs text-navy-400 mt-2 text-center">
              سيتم استخدام هذا التوقيع لاعتماد المستند الحالي.
            </p>
          </div>
        )}

        {mode === 'draw' && (
          <div>
            <div
              className="rounded-xl border border-navy-100 bg-white overflow-hidden"
              style={{ height: 180 }}
            >
              <SignatureCanvas
                ref={(r) => {
                  padRef.current = r;
                }}
                penColor="#0B2545"
                backgroundColor="#ffffff"
                onEnd={handleStroke}
                canvasProps={{
                  style: { width: '100%', height: '100%', background: '#fff' },
                }}
              />
            </div>
            <button
              type="button"
              onClick={clearPad}
              className="mt-2 text-xs text-navy-400 hover:text-navy underline"
            >
              مسح
            </button>
          </div>
        )}

        {mode === 'type' && (
          <div>
            <label className="label">الاسم الكامل</label>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              className="input mb-3"
              dir="rtl"
            />
            <div className="rounded-xl border border-navy-100 bg-white overflow-hidden">
              <canvas ref={typedRef} className="block" />
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="btn-outline flex-1">
            إلغاء
          </button>
          <button onClick={confirm} className="btn-primary flex-1" disabled={!canConfirm}>
            تأكيد التوقيع
          </button>
        </div>
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-4 py-2 text-sm font-semibold transition -mb-px border-b-2 whitespace-nowrap',
        active ? 'text-navy border-gold' : 'text-navy-300 border-transparent hover:text-navy',
      )}
    >
      {children}
    </button>
  );
}
