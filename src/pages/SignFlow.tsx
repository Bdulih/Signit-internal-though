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
import { getSession } from '@/lib/auth';

type Stage = 'read' | 'otp' | 'sign' | 'batch-signing' | 'complete' | 'downloading';

export function SignFlow() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [borrower, setBorrower] = useState<Borrower | undefined>(() =>
    id ? getBorrower(id) : undefined,
  );
  const [index, setIndex] = useState(0);
  const [stage, setStage] = useState<Stage>('read');
  const [pendingOtp, setPendingOtp] = useState<string>('');
  const [signMode, setSignMode] = useState<'single' | 'all'>('single');
  const [batchProgress, setBatchProgress] = useState({ done: 0, total: 0 });
  const [downloadProgress, setDownloadProgress] = useState({ done: 0, total: 0 });
  const [renderTarget, setRenderTarget] = useState<{
    doc: ContractDoc;
    audit: AuditEntry;
  } | null>(null);
  const contractRef = useRef<HTMLDivElement | null>(null);
  const captureRef = useRef<HTMLDivElement | null>(null);

  const docs = useMemo<ContractDoc[]>(
    () => (borrower ? buildDocsForBorrower(borrower) : []),
    [borrower],
  );

  useEffect(() => {
    if (!borrower || docs.length === 0) return;
    const first = nextUnsignedIndex(borrower, docs, 0);
    if (first === -1) {
      setStage('complete');
      setIndex(docs.length - 1);
    } else {
      setIndex(first);
    }
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
          العودة
        </Link>
      </div>
    );
  }

  const current = docs[index];
  const progress = countSignableSigned(borrower, docs);
  const remainingCount = progress.total - progress.signed;
  const role = getSession()?.role ?? 'staff';
  const doneHref =
    role === 'client' ? `/sign/${borrower.id}/done` : `/admin/borrowers/${borrower.id}`;

  // Last signature for sticky reuse
  const lastSignature = useMemo(() => {
    if (borrower.auditLog.length === 0) return undefined;
    return [...borrower.auditLog]
      .sort((a, b) => b.signedAt.localeCompare(a.signedAt))[0]?.signatureDataUrl;
  }, [borrower.auditLog]);

  function advanceTo(updated: Borrower) {
    const nextIdx = nextUnsignedIndex(updated, docs, index + 1);
    if (nextIdx === -1) {
      const any = nextUnsignedIndex(updated, docs, 0);
      if (any === -1) {
        setStage('complete');
        return;
      }
      setIndex(any);
    } else {
      setIndex(nextIdx);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function startSingleSign() {
    setSignMode('single');
    setStage('otp');
  }

  function startSignAll() {
    setSignMode('all');
    setStage('otp');
  }

  function onOtpVerified(otp: string) {
    setPendingOtp(otp);
    setStage('sign');
  }

  async function onSigned(dataUrl: string) {
    if (!borrower) return;
    const otp = pendingOtp || '000000';

    if (signMode === 'all') {
      // Apply this signature to ALL remaining unsigned signable docs
      const remainingDocs = docs.filter(
        (d) => d.signable && !borrower.auditLog.some((a) => a.docId === d.id),
      );
      setBatchProgress({ done: 0, total: remainingDocs.length });
      setStage('batch-signing');

      let updated = borrower;
      for (let i = 0; i < remainingDocs.length; i++) {
        const d = remainingDocs[i];
        const audit: AuditEntry = {
          docId: d.id,
          docTitle: d.title,
          signedAt: new Date(Date.now() + i).toISOString(),
          otpUsed: otp,
          signatureDataUrl: dataUrl,
        };
        updated = {
          ...updated,
          auditLog: [...updated.auditLog.filter((a) => a.docId !== d.id), audit],
        };
        setBatchProgress({ done: i + 1, total: remainingDocs.length });
        await new Promise((r) => setTimeout(r, 90));
      }
      upsertBorrower(updated);
      setBorrower(updated);
      setPendingOtp('');
      await new Promise((r) => setTimeout(r, 250));
      setStage('complete');
      return;
    }

    // Single doc signing
    if (!current) return;
    const audit: AuditEntry = {
      docId: current.id,
      docTitle: current.title,
      signedAt: new Date().toISOString(),
      otpUsed: otp,
      signatureDataUrl: dataUrl,
    };
    const updated: Borrower = {
      ...borrower,
      auditLog: [...borrower.auditLog.filter((a) => a.docId !== current.id), audit],
    };
    upsertBorrower(updated);
    setBorrower(updated);
    setPendingOtp('');
    setStage('read');

    // Auto-advance
    setTimeout(() => {
      const nextIdx = nextUnsignedIndex(updated, docs, index + 1);
      if (nextIdx === -1) {
        const any = nextUnsignedIndex(updated, docs, 0);
        if (any === -1) {
          setStage('complete');
          return;
        }
        setIndex(any);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setIndex(nextIdx);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 600);
  }

  function skipInfoOnly() {
    if (!borrower) return;
    advanceTo(borrower);
  }

  async function downloadAll() {
    if (!borrower) return;
    const auditByDoc = new Map(borrower.auditLog.map((a) => [a.docId, a]));
    const signedDocs = docs.filter((d) => auditByDoc.has(d.id));
    setDownloadProgress({ done: 0, total: signedDocs.length });
    setStage('downloading');

    for (let i = 0; i < signedDocs.length; i++) {
      const d = signedDocs[i];
      const audit = auditByDoc.get(d.id);
      if (!audit) continue;
      setRenderTarget({ doc: d, audit });
      // wait for hidden capture node to mount
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      await new Promise((r) => setTimeout(r, 60));
      try {
        if (captureRef.current) {
          const blob = await renderContractPdf({
            node: captureRef.current,
            borrower,
            doc: d,
          });
          downloadBlob(blob, pdfFilename(d, borrower));
        }
      } catch (err) {
        console.error('Download failed for', d.id, err);
      }
      setDownloadProgress({ done: i + 1, total: signedDocs.length });
      await new Promise((r) => setTimeout(r, 200));
    }

    setRenderTarget(null);
    setStage('complete');
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
                <button onClick={startSingleSign} className="btn-primary w-full mt-4">
                  توقيع هذا المستند
                </button>
              )
            ) : (
              <button onClick={skipInfoOnly} className="btn-accent w-full mt-4">
                للعلم فقط — متابعة
              </button>
            )}
          </div>

          {/* Sign-all CTA — only show when there's > 1 doc remaining */}
          {remainingCount > 1 && (
            <button
              onClick={startSignAll}
              className="card p-4 w-full text-right bg-gradient-to-br from-gold to-gold-600 text-white hover:shadow-pop transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              <div className="text-[10px] font-semibold tracking-wider uppercase text-white/80">
                توقيع سريع
              </div>
              <div className="font-bold text-base mt-1">
                توقيع جميع الوثائق دفعة واحدة
              </div>
              <div className="text-xs text-white/80 mt-1.5">
                سيتم تطبيق توقيع واحد على {remainingCount} وثيقة متبقية بعد التحقق برمز OTP.
              </div>
              <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold bg-white/15 rounded-lg px-2.5 py-1.5">
                ⚡ توقيع الكل دفعة واحدة
              </div>
            </button>
          )}

          <div className="card p-4 bg-gradient-to-br from-navy to-navy-600 text-white">
            <div className="text-[10px] font-semibold tracking-wider uppercase text-gold/80">
              توقيع آمن
            </div>
            <div className="text-xs text-white/80 mt-1.5 leading-relaxed">
              يتم توثيق كل توقيع برمز OTP وحفظ نسخة في السجل. يمكن تنزيل جميع
              الوثائق بصيغة PDF بعد إكمال التوقيع.
            </div>
          </div>

          <Link
            to={doneHref}
            className="btn-ghost w-full text-center text-xs"
          >
            عرض السجل والوثائق
          </Link>
        </aside>

        <div className="order-1 lg:order-2">
          {current && (
            <ContractDocument ref={contractRef} borrower={borrower} doc={current} />
          )}
        </div>
      </div>

      {/* Hidden offscreen capture node for batch PDF rendering */}
      <div
        aria-hidden
        style={{ position: 'fixed', left: -10000, top: 0, opacity: 1, pointerEvents: 'none' }}
      >
        {renderTarget && (
          <ContractDocument
            ref={captureRef}
            borrower={borrower}
            doc={renderTarget.doc}
            audit={renderTarget.audit}
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
        lastSignature={lastSignature}
        onClose={() => setStage('read')}
        onSigned={onSigned}
      />

      {stage === 'batch-signing' && (
        <BatchSigningModal done={batchProgress.done} total={batchProgress.total} />
      )}

      {stage === 'downloading' && (
        <DownloadingModal done={downloadProgress.done} total={downloadProgress.total} />
      )}

      {stage === 'complete' && (
        <CompleteModal
          borrower={borrower}
          onDownloadAll={downloadAll}
          onGoToSummary={() => nav(doneHref)}
        />
      )}
    </div>
  );
}

function BatchSigningModal({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-pop w-full max-w-md p-7 animate-pop">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-gold-50 border border-gold-200 flex items-center justify-center">
            <div className="w-5 h-5 border-[2.5px] border-gold-200 border-t-gold rounded-full animate-spin" />
          </div>
          <div>
            <div className="font-bold text-navy">جارٍ توقيع الوثائق</div>
            <div className="text-xs text-navy-400 mt-0.5">
              تم توقيع {done} من {total} وثيقة…
            </div>
          </div>
        </div>
        <div className="w-full h-2 rounded-full bg-navy-50 overflow-hidden">
          <div
            className="h-full bg-gold transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function DownloadingModal({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-pop w-full max-w-md p-7 animate-pop">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
            <div className="w-5 h-5 border-[2.5px] border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          </div>
          <div>
            <div className="font-bold text-navy">جارٍ تنزيل الوثائق</div>
            <div className="text-xs text-navy-400 mt-0.5">
              تم تجهيز {done} من {total} ملف PDF…
            </div>
          </div>
        </div>
        <div className="w-full h-2 rounded-full bg-navy-50 overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function CompleteModal({
  borrower,
  onDownloadAll,
  onGoToSummary,
}: {
  borrower: Borrower;
  onDownloadAll: () => void;
  onGoToSummary: () => void;
}) {
  const signedCount = borrower.auditLog.length;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-pop w-full max-w-md p-8 text-center animate-pop">
        <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto mb-5">
          <svg
            className="w-9 h-9 text-emerald-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-navy mb-1.5">
          اكتمل التوقيع بنجاح
        </h2>
        <p className="text-sm text-navy-400 mb-1">
          تم توقيع {signedCount} وثيقة لإصدار صكوك
        </p>
        <p className="text-sm font-semibold text-navy">{borrower.company.name}</p>

        <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 mt-5 text-sm">
          <div className="flex items-center justify-center gap-2 text-emerald-700 font-semibold mb-1">
            <span>✉</span>
            تم إرسال نسخة من جميع الوثائق إلى البريد الإلكتروني
          </div>
          <div dir="ltr" className="text-xs text-emerald-700/80">
            {borrower.signer.email}
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-6">
          <button onClick={onDownloadAll} className="btn-primary w-full">
            ⬇ تنزيل جميع الوثائق ({signedCount} PDF)
          </button>
          <button onClick={onGoToSummary} className="btn-outline w-full">
            عرض السجل والملخص
          </button>
        </div>
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
