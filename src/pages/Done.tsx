import { useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getBorrower } from '@/lib/storage';
import { buildDocsForBorrower, countSignableSigned } from '@/lib/contracts';
import { ContractDocument } from '@/components/ContractDocument';
import { downloadBlob, pdfFilename, renderContractPdf } from '@/lib/pdf';
import type { AuditEntry, Borrower, ContractDoc } from '@/lib/types';
import { formatDate, maskOtp } from '@/lib/cn';

export function Done() {
  const { id } = useParams<{ id: string }>();
  const borrower = id ? getBorrower(id) : undefined;
  const docs = useMemo<ContractDoc[]>(
    () => (borrower ? buildDocsForBorrower(borrower) : []),
    [borrower],
  );
  const [reDownloading, setReDownloading] = useState<string | null>(null);
  const [renderTarget, setRenderTarget] = useState<{ doc: ContractDoc; audit: AuditEntry } | null>(
    null,
  );
  const hiddenRef = useRef<HTMLDivElement | null>(null);

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

  const progress = countSignableSigned(borrower, docs);
  const allDone = progress.signed === progress.total;

  async function redownload(audit: AuditEntry) {
    const doc = docs.find((d) => d.id === audit.docId);
    if (!doc || !borrower) return;
    setReDownloading(audit.docId);
    setRenderTarget({ doc, audit });
    await new Promise((r) => setTimeout(r, 60));
    try {
      if (hiddenRef.current) {
        const blob = await renderContractPdf({
          node: hiddenRef.current,
          borrower,
          doc,
          audit,
        });
        downloadBlob(blob, pdfFilename(doc, borrower));
      }
    } catch (err) {
      console.error('re-render failed', err);
    } finally {
      setRenderTarget(null);
      setReDownloading(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 mb-2">
              <span
                className={
                  allDone
                    ? 'inline-block w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold'
                    : 'inline-block w-8 h-8 rounded-full bg-gold text-white flex items-center justify-center font-bold'
                }
              >
                {allDone ? '✓' : '…'}
              </span>
              <h1 className="text-2xl font-bold text-navy">
                {allDone ? 'اكتمل التوقيع' : 'قيد المتابعة'}
              </h1>
            </div>
            <div className="text-sm text-navy-400">
              {borrower.company.name} · س.ت {borrower.company.crNumber}
            </div>
            <div className="text-xs text-navy-400 mt-1">
              تم إنشاء الملف: {formatDate(borrower.createdAt)}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {!allDone && (
              <Link to={`/borrowers/${borrower.id}/sign`} className="btn-primary">
                متابعة التوقيع
              </Link>
            )}
            <Link to="/" className="btn-outline">
              العودة للوحة
            </Link>
          </div>
        </div>
      </div>

      <section className="card p-5 mb-6">
        <h2 className="font-bold text-navy mb-4">المستندات الموقّعة</h2>
        {borrower.auditLog.length === 0 ? (
          <div className="text-sm text-navy-400">لم يتم توقيع أي مستند بعد.</div>
        ) : (
          <ul className="divide-y divide-navy-50">
            {borrower.auditLog.map((a) => (
              <li key={a.docId} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-navy truncate">{a.docTitle}</div>
                  <div className="text-xs text-navy-400">
                    {formatDate(a.signedAt)} · رمز {maskOtp(a.otpUsed)}
                  </div>
                </div>
                <button
                  className="btn-ghost text-xs"
                  onClick={() => redownload(a)}
                  disabled={reDownloading === a.docId}
                >
                  {reDownloading === a.docId ? 'جارٍ التحميل…' : 'تنزيل PDF'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-5 mb-6">
        <h2 className="font-bold text-navy mb-4">سجل التدقيق</h2>
        {borrower.auditLog.length === 0 ? (
          <div className="text-sm text-navy-400">لا توجد سجلات بعد.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-right text-xs text-navy-400 border-b border-navy-50">
                  <th className="py-2 pr-2">المستند</th>
                  <th className="py-2 pr-2">التاريخ</th>
                  <th className="py-2 pr-2">رمز OTP</th>
                  <th className="py-2 pr-2">التوقيع</th>
                </tr>
              </thead>
              <tbody>
                {borrower.auditLog.map((a) => (
                  <tr key={a.docId} className="border-b border-navy-50 last:border-0">
                    <td className="py-2 pr-2 font-semibold text-navy">{a.docTitle}</td>
                    <td className="py-2 pr-2 text-xs text-navy-400 whitespace-nowrap">
                      {formatDate(a.signedAt)}
                    </td>
                    <td className="py-2 pr-2 text-xs text-navy-400" dir="ltr">
                      {maskOtp(a.otpUsed)}
                    </td>
                    <td className="py-2 pr-2">
                      {a.signatureDataUrl ? (
                        <img
                          src={a.signatureDataUrl}
                          alt="توقيع"
                          className="h-8 bg-white border border-navy-50 rounded"
                        />
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div
        style={{
          position: 'fixed',
          left: -10000,
          top: 0,
          opacity: 1,
          pointerEvents: 'none',
        }}
        aria-hidden
      >
        {renderTarget && (
          <ContractDocument
            ref={hiddenRef}
            borrower={borrower as Borrower}
            doc={renderTarget.doc}
          />
        )}
      </div>
    </div>
  );
}
