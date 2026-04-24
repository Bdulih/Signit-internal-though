import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { Borrower } from '@/lib/types';
import { deleteBorrower, getAllBorrowers } from '@/lib/storage';
import { buildDocsForBorrower, countSignableSigned } from '@/lib/contracts';
import { cn, formatSar } from '@/lib/cn';

export function Dashboard() {
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);

  useEffect(() => {
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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy">لوحة المقترضين</h1>
          <p className="text-sm text-navy-400 mt-1">
            إدارة ملفات المقترضين وتوقيع وثائق إصدار الصكوك
          </p>
        </div>
        <Link to="/borrowers/new" className="btn-primary">
          + إنشاء ملف مقترض
        </Link>
      </div>

      {borrowers.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {borrowers.map((b) => (
            <BorrowerCard key={b.id} borrower={b} onDelete={() => onDelete(b.id)} />
          ))}
        </div>
      )}
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
      <Link to="/borrowers/new" className="btn-primary">
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
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
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
          </div>
          <div className="text-xs text-navy-400 mt-1">س.ت: {borrower.company.crNumber}</div>
        </div>
        <button
          onClick={onDelete}
          className="text-navy-300 hover:text-red-600 transition text-sm"
          aria-label="حذف"
          title="حذف"
        >
          حذف
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <Info k="الموقّع" v={borrower.signer.fullName} />
        <Info k="قيمة الضمان" v={formatSar(borrower.guarantee.amountSar)} />
        <Info k="عدد الضامنين" v={String(borrower.guarantee.guarantors.length)} />
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
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-navy-400">التقدم</span>
          <span className="font-semibold text-navy">
            {signed} / {total}
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-navy-50 overflow-hidden">
          <div
            className={cn(
              'h-full transition-all',
              done ? 'bg-emerald-500' : 'bg-gold',
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        {done ? (
          <Link to={`/borrowers/${borrower.id}/done`} className="btn-outline flex-1 text-center">
            مكتمل — عرض السجل
          </Link>
        ) : (
          <Link
            to={`/borrowers/${borrower.id}/sign`}
            className={cn('flex-1 text-center', started ? 'btn-accent' : 'btn-primary')}
          >
            {started ? 'متابعة' : 'بدء التوقيع'}
          </Link>
        )}
        <Link
          to={`/borrowers/${borrower.id}/done`}
          className="btn-ghost text-sm"
          title="السجل"
        >
          السجل
        </Link>
      </div>
    </div>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-navy-400">{k}</div>
      <div className="font-semibold text-navy truncate">{v}</div>
    </div>
  );
}
