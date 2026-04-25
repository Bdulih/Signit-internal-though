import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { Borrower } from '@/lib/types';
import { deleteBorrower, getAllBorrowers } from '@/lib/storage';
import { buildDocsForBorrower, countSignableSigned } from '@/lib/contracts';
import { maybeSeedDemos, reseedDemos } from '@/lib/seed';
import { cn, formatSar } from '@/lib/cn';

export function Dashboard() {
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);

  useEffect(() => {
    maybeSeedDemos();
    setBorrowers(getAllBorrowers());
  }, []);

  function refresh() {
    setBorrowers(getAllBorrowers());
  }

  function onDelete(id: string) {
    if (!window.confirm('هل أنت متأكد من حذف ملف المقترض؟ لا يمكن التراجع.')) return;
    deleteBorrower(id);
    refresh();
  }

  function onReseed() {
    if (!window.confirm('سيتم استبدال البيانات الحالية ببيانات تجريبية جاهزة. متابعة؟')) return;
    reseedDemos();
    refresh();
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
        <div>
          <div className="text-xs font-semibold text-gold tracking-[0.22em] mb-1">
            JYAD CAPITAL · LOAN BOOK
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-navy leading-tight">
            لوحة المقترضين
          </h1>
          <p className="text-sm text-navy-400 mt-2 max-w-xl">
            إدارة ملفات المقترضين، توقيع وثائق إصدار الصكوك، ومتابعة سجل
            التوقيعات الإلكترونية.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={onReseed} className="btn-ghost text-xs" title="إعادة تحميل بيانات تجريبية">
            ↻ بيانات تجريبية
          </button>
          <Link to="/admin/borrowers/new" className="btn-primary">
            + إنشاء ملف مقترض
          </Link>
        </div>
      </div>

      {borrowers.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <SummaryStrip borrowers={borrowers} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
            {borrowers.map((b) => (
              <BorrowerCard key={b.id} borrower={b} onDelete={() => onDelete(b.id)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SummaryStrip({ borrowers }: { borrowers: Borrower[] }) {
  let totalAmount = 0;
  let inProgress = 0;
  let completed = 0;
  for (const b of borrowers) {
    totalAmount += b.guarantee.amountSar;
    const docs = buildDocsForBorrower(b);
    const { signed, total } = countSignableSigned(b, docs);
    if (signed === total && total > 0) completed++;
    else if (signed > 0) inProgress++;
  }
  const fresh = borrowers.length - inProgress - completed;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Stat k="إجمالي المقترضين" v={String(borrowers.length)} />
      <Stat k="القيمة الإجمالية" v={formatSar(totalAmount)} />
      <Stat k="قيد التوقيع" v={String(inProgress + fresh)} accent="gold" />
      <Stat k="مكتمل" v={String(completed)} accent="emerald" />
    </div>
  );
}

function Stat({
  k,
  v,
  accent,
}: {
  k: string;
  v: string;
  accent?: 'gold' | 'emerald';
}) {
  return (
    <div className="card p-4">
      <div className="text-[11px] uppercase tracking-wider text-navy-400 mb-1.5">{k}</div>
      <div
        className={cn(
          'font-bold text-lg sm:text-xl truncate',
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

function EmptyState() {
  return (
    <div className="card text-center py-16 px-6">
      <div className="w-20 h-20 rounded-full bg-gold-100 text-gold-700 flex items-center justify-center text-4xl font-bold mx-auto mb-4">
        ج
      </div>
      <h2 className="text-xl font-bold text-navy mb-2">لا يوجد مقترضون بعد</h2>
      <p className="text-sm text-navy-400 mb-6 max-w-md mx-auto">
        ابدأ بإنشاء ملف مقترض جديد لتوقيع وثائق إصدار الصكوك.
      </p>
      <Link to="/admin/borrowers/new" className="btn-primary">
        إنشاء ملف مقترض
      </Link>
    </div>
  );
}

function BorrowerCard({ borrower, onDelete }: { borrower: Borrower; onDelete: () => void }) {
  const docs = buildDocsForBorrower(borrower);
  const { signed, total } = countSignableSigned(borrower, docs);
  const pct = total > 0 ? Math.round((signed / total) * 100) : 0;
  const done = pct === 100;
  const started = signed > 0;

  return (
    <div className="card p-5 flex flex-col gap-4 hover:shadow-pop transition-shadow group">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-bold text-navy text-lg truncate">{borrower.company.name}</h3>
            <span
              className={cn(
                'text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider',
                borrower.company.type === 'LLC'
                  ? 'bg-navy-50 text-navy-500'
                  : 'bg-gold-50 text-gold-700 border border-gold-200',
              )}
            >
              {borrower.company.type === 'LLC' ? 'ذ.م.م' : 'م.س'}
            </span>
            {done && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                ✓ مكتمل
              </span>
            )}
            {started && !done && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold-50 text-gold-700 border border-gold-200">
                قيد التوقيع
              </span>
            )}
          </div>
          <div className="text-xs text-navy-400">
            س.ت {borrower.company.crNumber} · {borrower.signer.fullName}
          </div>
        </div>
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 text-navy-300 hover:text-red-600 transition text-xs px-2 py-1 rounded-lg hover:bg-red-50"
          aria-label="حذف"
          title="حذف"
        >
          حذف
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-xs">
        <Info k="الضمان" v={formatSar(borrower.guarantee.amountSar)} />
        <Info k="الضامنون" v={`${borrower.guarantee.guarantors.length}`} />
        <Info
          k="الرهن"
          v={
            borrower.collateral === 'none'
              ? 'بدون'
              : borrower.collateral === 'company-owned'
              ? 'أصول الشركة'
              : 'طرف ثالث'
          }
        />
      </div>

      <div>
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-navy-400">التقدم في التوقيع</span>
          <span className="font-bold text-navy">
            {signed} / {total}
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-navy-50 overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-500',
              done ? 'bg-emerald-500' : 'bg-gold',
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        {done ? (
          <Link to={`/admin/borrowers/${borrower.id}`} className="btn-outline flex-1 text-center">
            عرض السجل
          </Link>
        ) : (
          <>
            <Link
              to={`/admin/borrowers/${borrower.id}/sign`}
              className={cn('flex-1 text-center', started ? 'btn-accent' : 'btn-primary')}
            >
              {started ? 'متابعة التوقيع' : 'بدء التوقيع'}
            </Link>
            <Link
              to={`/admin/borrowers/${borrower.id}`}
              className="btn-ghost text-sm"
              title="عرض السجل"
            >
              السجل
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-navy-400 mb-0.5">{k}</div>
      <div className="font-semibold text-navy truncate">{v}</div>
    </div>
  );
}
