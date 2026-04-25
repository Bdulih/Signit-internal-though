import { Link, Navigate } from 'react-router-dom';
import { getSession } from '@/lib/auth';
import { getBorrower } from '@/lib/storage';
import { buildDocsForBorrower, countSignableSigned } from '@/lib/contracts';
import { cn, formatSar } from '@/lib/cn';

export function ClientHome() {
  const session = getSession();
  if (!session || session.role !== 'client' || !session.borrowerId) {
    return <Navigate to="/login/client" replace />;
  }
  const borrower = getBorrower(session.borrowerId);
  if (!borrower) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-navy mb-2">انتهت صلاحية الجلسة</h2>
        <Link to="/" className="btn-primary inline-block mt-4">
          العودة لتسجيل الدخول
        </Link>
      </div>
    );
  }

  const docs = buildDocsForBorrower(borrower);
  const { signed, total } = countSignableSigned(borrower, docs);
  const remaining = total - signed;
  const allDone = remaining === 0;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="card p-6 sm:p-8 mb-5">
        <div className="text-[11px] font-bold tracking-[0.22em] text-gold-700 mb-1">
          أهلًا بك في منصة جياد كابيتال
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-navy">
          مرحبًا، {borrower.signer.fullName}
        </h1>
        <p className="text-sm text-navy-400 mt-2">
          يسرّنا استقبالك. فيما يلي ملخّص حزمة التوقيع الخاصة بإصدار صكوك{' '}
          <span className="font-semibold text-navy">{borrower.company.name}</span>.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <Stat k="إجمالي الوثائق" v={String(total)} />
          <Stat k="موقّعة" v={String(signed)} accent="emerald" />
          <Stat k="قيد التوقيع" v={String(remaining)} accent="gold" />
          <Stat k="قيمة الإصدار" v={formatSar(borrower.guarantee.amountSar)} />
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-navy-400">التقدم</span>
            <span className="font-bold text-navy">
              {total > 0 ? Math.round((signed / total) * 100) : 0}٪
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-navy-50 overflow-hidden">
            <div
              className={cn('h-full transition-all duration-700', allDone ? 'bg-emerald-500' : 'bg-gold')}
              style={{ width: `${total > 0 ? (signed / total) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mt-6">
          {allDone ? (
            <Link to={`/sign/${borrower.id}/done`} className="btn-primary flex-1 text-center">
              عرض الوثائق المُكتملة
            </Link>
          ) : (
            <Link to={`/sign/${borrower.id}`} className="btn-primary flex-1 text-center">
              {signed > 0 ? 'متابعة التوقيع' : 'بدء التوقيع'}
            </Link>
          )}
          <Link to={`/sign/${borrower.id}/done`} className="btn-outline">
            عرض السجل
          </Link>
        </div>
      </div>

      <div className="card p-5">
        <div className="text-[10px] font-bold tracking-wider uppercase text-navy-400 mb-3">
          قائمة الوثائق
        </div>
        <ul className="divide-y divide-navy-50">
          {docs.map((d, i) => {
            const sg = borrower.auditLog.some((a) => a.docId === d.id);
            return (
              <li key={d.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0 flex items-center gap-3">
                  <span
                    className={cn(
                      'w-7 h-7 rounded-full text-[11px] font-bold flex items-center justify-center flex-shrink-0',
                      sg
                        ? 'bg-emerald-100 text-emerald-700'
                        : !d.signable
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-navy-50 text-navy-400',
                    )}
                  >
                    {sg ? '✓' : !d.signable ? 'i' : i + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="font-semibold text-navy text-sm truncate">{d.title}</div>
                    <div className="text-[11px] text-navy-400">
                      {d.phase === 1 ? 'المرحلة 1 — البرنامج' : 'المرحلة 2 — الإصدار'}
                      {!d.signable && ' · للعلم فقط'}
                    </div>
                  </div>
                </div>
                <span
                  className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded-full',
                    sg && 'bg-emerald-50 text-emerald-700 border border-emerald-200',
                    !sg && !d.signable && 'bg-amber-50 text-amber-700 border border-amber-200',
                    !sg && d.signable && 'bg-navy-50 text-navy-400',
                  )}
                >
                  {sg ? 'موقّعة' : !d.signable ? 'للعلم' : 'بانتظار التوقيع'}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function Stat({ k, v, accent }: { k: string; v: string; accent?: 'gold' | 'emerald' }) {
  return (
    <div className="rounded-xl bg-bg border border-navy-50 px-3 py-3">
      <div className="text-[10px] uppercase tracking-wider text-navy-400 mb-1">{k}</div>
      <div
        className={cn(
          'font-bold text-lg truncate',
          accent === 'gold' && 'text-gold-700',
          accent === 'emerald' && 'text-emerald-600',
          !accent && 'text-navy',
        )}
      >
        {v}
      </div>
    </div>
  );
}
