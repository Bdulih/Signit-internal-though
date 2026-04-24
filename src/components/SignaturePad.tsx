import { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';

interface Props {
  signerName: string;
  onComplete: (dataUrl: string) => void;
  onCancel: () => void;
}

export function SignaturePad({ signerName, onComplete, onCancel }: Props) {
  const canvasRef = useRef<SignatureCanvas | null>(null);
  const [mode, setMode] = useState<'draw' | 'type'>('draw');
  const [typed, setTyped] = useState(signerName);
  const [empty, setEmpty] = useState(true);

  function clear() {
    canvasRef.current?.clear();
    setEmpty(true);
  }

  function handleEnd() {
    setEmpty(!!canvasRef.current?.isEmpty());
  }

  function finish() {
    if (mode === 'draw') {
      const c = canvasRef.current;
      if (!c || c.isEmpty()) return;
      onComplete(c.toDataURL('image/png'));
    } else {
      if (!typed.trim()) return;
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 200;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#0B2545';
      ctx.font = 'italic 56px "Tajawal", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(typed, canvas.width / 2, canvas.height / 2);
      onComplete(canvas.toDataURL('image/png'));
    }
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-jyad-primary">التوقيع الإلكتروني</h3>
        <div className="flex gap-1 bg-jyad-background rounded-lg p-1">
          <button
            onClick={() => setMode('draw')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              mode === 'draw' ? 'bg-white text-jyad-primary shadow-sm' : 'text-jyad-muted'
            }`}
          >
            رسم التوقيع
          </button>
          <button
            onClick={() => setMode('type')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              mode === 'type' ? 'bg-white text-jyad-primary shadow-sm' : 'text-jyad-muted'
            }`}
          >
            كتابة الاسم
          </button>
        </div>
      </div>

      {mode === 'draw' ? (
        <div className="sig-canvas-wrap">
          <SignatureCanvas
            ref={(r) => {
              canvasRef.current = r;
            }}
            penColor="#0B2545"
            backgroundColor="#ffffff"
            canvasProps={{
              width: 720,
              height: 220,
              className: 'w-full h-[220px] rounded-[10px]',
            }}
            onEnd={handleEnd}
          />
        </div>
      ) : (
        <div>
          <label className="label">اكتب اسمك كتوقيع</label>
          <input
            className="input text-xl"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="الاسم الكامل"
          />
          <div className="mt-3 p-6 border border-dashed border-jyad-accent rounded-lg text-center">
            <span className="italic text-3xl text-jyad-primary">{typed || '—'}</span>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-4 justify-between">
        <div className="flex gap-2">
          {mode === 'draw' && (
            <button onClick={clear} className="btn-outline text-xs">
              مسح
            </button>
          )}
          <button onClick={onCancel} className="btn-ghost text-xs">
            إلغاء
          </button>
        </div>
        <button
          onClick={finish}
          disabled={mode === 'draw' ? empty : !typed.trim()}
          className="btn-accent"
        >
          اعتماد التوقيع
        </button>
      </div>
    </div>
  );
}
