import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { AuditEntry, Borrower, ContractDoc } from '@/lib/types';
import { getBorrower, upsertBorrower } from '@/lib/storage';
import {
  buildDocsForBorrower,
  countSignableSigned,
  isDocSigned,
  nextUnsignedIndex,
} from '@/lib/contracts';
import { ContractDocument } from '@/components/ContractDocument';
import { OtpModal } from '@/components/OtpModal';
import { SignaturePad } from '@/components/SignaturePad';
import { cn } from '@/lib/cn';
import { downloadBlob, pdfFilename, renderContractPdf } from '@/lib/pdf';

type Stage = 'read' | 'otp' | 'sign' | 'rendering' | 'done';

export function SignFlow() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [borrower, setBorrower] = useState<Borrower | undefined>(() =>
    id ? getBorrower(id) : undefined,
  );
  const [index, setIndex] = useState(0);
  const [stage, setStage] = useState<Stage>('read');
  const [toast, setToast] = useState<string | null>(null);
  const [pendingOtp, setPendingOtp] = useState<string>('');
  const contractRef = useRef<HTMLDivElement | null>(null);

  const docs = useMemo<ContractDoc[]>(
    () => (borrower ? buildDocsForBorrower(borrower) : []),
    [borrower],
  );

  useEffect(() => {
    if (!borrower || docs.length === 0) return;
    const first = nextUnsignedIndex(borrower, docs, 0);
    setIndex(first === -1 ? docs.length - 1 : first);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [borrower?.id]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  if (!id) {
    nav('/');
    return null;
  }
  if (!borrower) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-navy mb-2">لم يتم العثور على المقترض</h2>
        <Link to="/" className="btn-primary inline-block mt-4">
          العودة إلى اللوحة
        </Link>
      </div>
    );
  }

  const current = docs[index];
  const progress = countSignableSigned(borrower, docs);
  const allDone = progress.signed === progress.total;

  function goToNext(updated: Borrower) {
    const nextIdx = nextUnsignedIndex(updated, docs, index + 1);
    if (nextIdx === -1) {
      // all signable done — but also scan from start in case user jumped
      const any = nextUnsignedIndex(updated, docs, 0);
      if (any === -1) {
        nav(`/borrowers/${updated.id}/done`);
        return;
      }
      setIndex(any);
    } else {
      setIndex(nextIdx);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function onOtpVerified(otp: string) {
    setPendingOtp(otp);
    setStage('sign');
  }

  async function onSigned(dataUrl: string) {
    if (!borrower || !current) return;
    const audit: AuditEntry = {
      docId: current.id,
      docTitle: current.title,
      signedAt: new Date().toISOString(),
      otpUsed: pendingOtp || '000000',
      signatureDataUrl: dataUrl,
    };
    const updated: Borrower = {
      ...borrower,
      auditLog: [...borrower.auditLog.filter((a) => a.docId !== current.id), audit],
    };

    setStage('rendering');
    try {
      if (contractRef.current) {
        const blob = await renderContractPdf({
          node: contractRef.current,
          borrower: updated,
          doc: current,
          audit,
        });
        downloadBlob(blob, pdfFilename(current, updated));
      }
    } catch (err) {
      console.error('PDF render failed', err);
    }

    upsertBorrower(updated);
    setBorrower(updated);
    setPendingOtp('');
    setToast(`تم توقيع "${current.title}" بنجاح`);
    setStage('read');
    goToNext(updated);
  }

  function skipInfoOnly() {
    if (!borrower) return;
    const next = nextUnsignedIndex(borrower, docs, index + 1);
    if (next === -1) {
      const any = nextUnsignedIndex(borrower, docs, 0);
      if (any === -1) {
        nav(`/borrowers/${borrower.id}/done`);
        return;
      }
      setIndex(any);
    } else {
      setIndex(next);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6">
      <Stepper docs={docs} borrower={borrower} index={index} onJump={setIndex} />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 mt-4">
        <aside className="order-2 lg:order-1 space-y-3">
          <div className="card p-4">
            <div className="text-xs text-navy-400">المقترض</div>
            <div className="font-bold text-navy truncate">{borrower.company.name}</div>
            <div className="text-xs text-navy-400 mt-1">
              س.ت {borrower.company.crNumber}
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-navy-400">التقدم</span>
                <span className="font-semibold text-navy">
                  {progress.signed} / {progress.total}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-navy-50 overflow-hidden">
                <div
                  className={cn('h-full', allDone ? 'bg-emerald-500' : 'bg-gold')}
                  style={{
                    width: `${
                      progress.total > 0 ? (progress.signed / progress.total) * 100 : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="text-xs text-navy-400 mb-1">المستند الحالي</div>
            <div className="font-bold text-navy">{current?.title ?? '—'}</div>
            <div className="text-xs text-navy-400 mt-1">
              {current?.phase === 1 ? 'المرحلة 1 — البرنامج' : 'المرحلة 2 — الإصدار'}
            </div>
            {current?.signable ? (
              isDocSigned(borrower, current.id) ? (
                <button
                  onClick={() => goToNext(borrower)}
                  className="btn-outline w-full mt-4"
                >
                  متابعة
                </button>
              ) : (
                <button onClick={() => setStage('otp')} className="btn-primary w-full mt-4">
                  توقيع
                </button>
              )
            ) : (
              <button onClick={skipInfoOnly} className="btn-accent w-full mt-4">
                متابعة
              </button>
            )}
            <Link
              to={`/borrowers/${borrower.id}/done`}
              className="btn-ghost w-full text-center text-xs mt-2"
            >
              عرض السجل
            </Link>
          </div>
        </aside>

        <div className="order-1 lg:order-2">
          {current && (
            <ContractDocument ref={contractRef} borrower={borrower} doc={current} />
          )}
        </div>
      </div>

      <OtpModal
        open={stage === 'otp'}
        mobile={borrower.signer.mobile}
        onClose={() => setStage('read')}
        onVerified={onOtpVerified}
      />

      <SignaturePad
        open={stage === 'sign'}
        signerName={borrower.signer.fullName}
        onClose={() => setStage('read')}
        onSigned={onSigned}
      />

      {stage === 'rendering' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-pop px-8 py-6 flex items-center gap-4">
            <div className="w-6 h-6 border-[3px] border-navy-100 border-t-navy rounded-full animate-spin" />
            <div className="text-navy font-semibold">
              جارٍ إنشاء ملف PDF الموقّع…
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-navy text-white text-sm rounded-xl shadow-pop px-4 py-2.5">
          {toast}
        </div>
      )}
    </div>
  );
}

function Stepper({
  docs,
  borrower,
  index,
  onJump,
}: {
  docs: ContractDoc[];
  borrower: Borrower;
  index: number;
  onJump: (n: number) => void;
}) {
  return (
    <div className="card p-3 overflow-x-auto">
      <div className="flex items-center gap-2 min-w-max">
        {docs.map((d, i) => {
          const signed = d.signable && isDocSigned(borrower, d.id);
          const active = i === index;
          const info = !d.signable;
          return (
            <button
              key={d.id}
              onClick={() => onJump(i)}
              className={cn(
                'flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg border transition whitespace-nowrap',
                active && 'bg-navy text-white border-navy',
                !active && signed && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                !active && info && 'bg-amber-50 text-amber-700 border-amber-200',
                !active &&
                  !signed &&
                  !info &&
                  'bg-white text-navy-400 border-navy-50 hover:border-navy-100',
              )}
              title={d.title}
            >
              <span
                className={cn(
                  'w-5 h-5 rounded-full text-[10px] flex items-center justify-center',
                  active && 'bg-white text-navy',
                  !active && signed && 'bg-emerald-600 text-white',
                  !active && info && 'bg-amber-500 text-white',
                  !active && !signed && !info && 'bg-navy-50 text-navy-400',
                )}
              >
                {signed ? '✓' : info ? 'i' : i + 1}
              </span>
              <span className="max-w-[140px] truncate">{d.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
