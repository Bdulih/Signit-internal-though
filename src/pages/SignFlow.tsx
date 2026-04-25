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

type Stage = 'read' | 'otp' | 'sign' | 'processing' | 'success';

export function SignFlow() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [borrower, setBorrower] = useState<Borrower | undefined>(() =>
    id ? getBorrower(id) : undefined,
  );
  const [index, setIndex] = useState(0);
  const [stage, setStage] = useState<Stage>('read');
  const [pendingOtp, setPendingOtp] = useState<string>('');
  const [processingStep, setProcessingStep] = useState(0);
  const [lastSignedTitle, setLastSignedTitle] = useState<string>('');
  const [allComplete, setAllComplete] = useState(false);
  const [pendingAudit, setPendingAudit] = useState<AuditEntry | null>(null);
  const contractRef = useRef<HTMLDivElement | null>(null);
  const signedDocRef = useRef<HTMLDivElement | null>(null);

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

  function advanceTo(updated: Borrower) {
    const nextIdx = nextUnsignedIndex(updated, docs, index + 1);
    if (nextIdx === -1) {
      const any = nextUnsignedIndex(updated, docs, 0);
      if (any === -1) {
        setAllComplete(true);
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

    setLastSignedTitle(current.title);
    setStage('processing');
    setProcessingStep(0);
    setPendingAudit(audit);

    // Step 1 — generating PDF
    await new Promise((r) => setTimeout(r, 350));
    setProcessingStep(1);
    // Wait one frame so hidden ContractDocument with signature mounts
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    await new Promise((r) => setTimeout(r, 30));
    try {
      const captureNode = signedDocRef.current ?? contractRef.current;
      if (captureNode) {
        const blob = await renderContractPdf({
          node: captureNode,
          borrower: updated,
          doc: current,
        });
        downloadBlob(blob, pdfFilename(current, updated));
      }
    } catch (err) {
      console.error('PDF render failed', err);
    }
    setPendingAudit(null);

    // Step 2 — saving + emailing
    setProcessingStep(2);
    await new Promise((r) => setTimeout(r, 500));
    upsertBorrower(updated);
    setBorrower(updated);
    setPendingOtp('');

    // Step 3 — done
    setProcessingStep(3);
    await new Promise((r) => setTimeout(r, 300));
    setStage('success');

    // Auto-advance after success state shows
    setTimeout(() => {
      const nextIdx = nextUnsignedIndex(updated, docs, index + 1);
      const remaining = nextIdx === -1 ? nextUnsignedIndex(updated, docs, 0) : nextIdx;
      if (remaining === -1) {
        setAllComplete(true);
        setStage('success');
        return;
      }
      setStage('read');
      advanceTo(updated);
    }, 1700);
  }

  function skipInfoOnly() {
    if (!borrower) return;
    advanceTo(borrower);
  }

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6">
      <Stepper docs={docs} borrower={borrower} index={index} onJump={setIndex} />

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 mt-4">
        <aside className="order-2 lg:order-1 space-y-3">
          <div className="card p-4">
            <div className="text-[10px] font-semibold tracking-wider uppercase text-navy-400">
              المقترض
            </div>
            <div className="font-bold text-navy text-base mt-1 truncate">
              {borrower.company.name}
            </div>
            <div className="text-xs text-navy-400 mt-1">
              س.ت {borrower.company.crNumber}
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-navy-400">التقدم</span>
                <span className="font-bold text-navy">
                  {progress.signed} / {progress.total}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-navy-50 overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all duration-700',
                    progress.signed === progress.total ? 'bg-emerald-500' : 'bg-gold',
                  )}
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
            <div className="text-[10px] font-semibold tracking-wider uppercase text-navy-400">
              المستند الحالي
            </div>
            <div className="font-bold text-navy text-base mt-1">{current?.title ?? '—'}</div>
            <div className="text-xs text-navy-400 mt-1">
              {current?.phase === 1 ? 'المرحلة 1 — البرنامج' : 'المرحلة 2 — الإصدار'}
            </div>
            {current?.signable ? (
              isDocSigned(borrower, current.id) ? (
                <button
                  onClick={() => advanceTo(borrower)}
                  className="btn-outline w-full mt-4"
                >
                  المستند التالي ←
                </button>
              ) : (
                <button onClick={() => setStage('otp')} className="btn-primary w-full mt-4">
                  توقيع المستند
                </button>
              )
            ) : (
              <button onClick={skipInfoOnly} className="btn-accent w-full mt-4">
                للعلم فقط — متابعة
              </button>
            )}
            <Link
              to={`/borrowers/${borrower.id}/done`}
              className="btn-ghost w-full text-center text-xs mt-2"
            >
              عرض السجل والمستندات
            </Link>
          </div>

          <div className="card p-4 bg-gradient-to-br from-navy to-navy-600 text-white">
            <div className="text-[10px] font-semibold tracking-wider uppercase text-gold/80">
              توقيع آمن
            </div>
            <div className="text-xs text-white/80 mt-1.5 leading-relaxed">
              يتم توثيق كل توقيع برمز OTP، حفظ نسخة PDF، وإرسالها إلى البريد
              الإلكتروني للموقّع.
            </div>
          </div>
        </aside>

        <div className="order-1 lg:order-2">
          {current && (
            <ContractDocument ref={contractRef} borrower={borrower} doc={current} />
          )}
        </div>
      </div>

      {/* Hidden offscreen — used for capturing the SIGNED PDF with signature image */}
      <div
        aria-hidden
        style={{ position: 'fixed', left: -10000, top: 0, opacity: 1, pointerEvents: 'none' }}
      >
        {current && pendingAudit && (
          <ContractDocument
            ref={signedDocRef}
            borrower={borrower}
            doc={current}
            audit={pendingAudit}
            withSignature
          />
        )}
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

      {stage === 'processing' && (
        <ProcessingModal step={processingStep} email={borrower.signer.email} />
      )}

      {stage === 'success' && (
        <SuccessModal
          docTitle={lastSignedTitle}
          email={borrower.signer.email}
          allComplete={allComplete}
          onContinue={() => {
            if (allComplete) nav(`/borrowers/${borrower.id}/done`);
            else setStage('read');
          }}
        />
      )}
    </div>
  );
}

function ProcessingModal({ step, email }: { step: number; email: string }) {
  const steps = [
    { label: 'تأكيد التوقيع', detail: 'جارٍ تسجيل التوقيع الإلكتروني…' },
    { label: 'إنشاء ملف PDF', detail: 'تركيب الوثيقة الموقّعة بصيغة A4…' },
    { label: 'حفظ وإرسال نسخة', detail: `إرسال إلى ${email} وحفظها في السجل…` },
    { label: 'اكتمل', detail: 'تم بنجاح ✓' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-pop w-full max-w-md p-7">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-gold-50 border border-gold-200 flex items-center justify-center">
            <div className="w-5 h-5 border-[2.5px] border-gold-200 border-t-gold rounded-full animate-spin" />
          </div>
          <div>
            <div className="font-bold text-navy">جارٍ معالجة التوقيع</div>
            <div className="text-xs text-navy-400 mt-0.5">يرجى الانتظار لحظة…</div>
          </div>
        </div>
        <ul className="space-y-2.5">
          {steps.slice(0, 3).map((s, i) => {
            const status = i < step ? 'done' : i === step ? 'active' : 'pending';
            return (
              <li
                key={i}
                className={cn(
                  'flex items-center gap-3 text-sm transition-all',
                  status === 'pending' && 'opacity-40',
                )}
              >
                <span
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold',
                    status === 'done' && 'bg-emerald-500 text-white',
                    status === 'active' && 'bg-gold text-white',
                    status === 'pending' && 'bg-navy-50 text-navy-300',
                  )}
                >
                  {status === 'done' ? '✓' : i + 1}
                </span>
                <div>
                  <div className={cn('font-semibold', status === 'done' ? 'text-emerald-700' : 'text-navy')}>
                    {s.label}
                  </div>
                  {status === 'active' && (
                    <div className="text-xs text-navy-400 mt-0.5">{s.detail}</div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function SuccessModal({
  docTitle,
  email,
  allComplete,
  onContinue,
}: {
  docTitle: string;
  email: string;
  allComplete: boolean;
  onContinue: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-pop w-full max-w-md p-8 text-center animate-pop">
        <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto mb-5">
          <svg className="w-9 h-9 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-navy mb-1.5">
          {allComplete ? 'اكتمل التوقيع بنجاح' : 'تم توقيع المستند'}
        </h2>
        <div className="text-sm text-navy-400 mb-1 truncate">{docTitle}</div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 mt-5 text-sm">
          <div className="flex items-center justify-center gap-2 text-emerald-700 font-semibold mb-1">
            <span>✉</span>
            تم إرسال نسخة إلى البريد الإلكتروني
          </div>
          <div dir="ltr" className="text-xs text-emerald-700/80">
            {email}
          </div>
        </div>
        <div className="text-xs text-navy-400 mt-3">
          {allComplete
            ? 'جاهز للانتقال إلى ملخص العملية…'
            : 'سيتم الانتقال إلى المستند التالي تلقائيًا…'}
        </div>
        <button onClick={onContinue} className="btn-primary w-full mt-5">
          {allComplete ? 'عرض السجل النهائي' : 'متابعة الآن'}
        </button>
      </div>
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
                active && 'bg-navy text-white border-navy shadow-card',
                !active && signed && 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
                !active && info && 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
                !active &&
                  !signed &&
                  !info &&
                  'bg-white text-navy-400 border-navy-50 hover:border-navy-100 hover:text-navy',
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
