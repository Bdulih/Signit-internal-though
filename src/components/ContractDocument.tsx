import { forwardRef } from 'react';
import type { Borrower, ContractDoc } from '../lib/types';

interface Props {
  doc: ContractDoc;
  borrower: Borrower;
}

function companyTypeLabel(t: Borrower['company']['type']) {
  return t === 'LLC' ? 'ذات مسؤولية محدودة' : 'مساهمة';
}

function collateralLabel(c: Borrower['collateral']) {
  if (c === 'none') return 'بدون ضمان عيني';
  if (c === 'company-owned') return 'رهن على أصول الشركة';
  return 'رهن من طرف ثالث';
}

export const ContractDocument = forwardRef<HTMLDivElement, Props>(({ doc, borrower }, ref) => {
  const paras = doc.bodyParagraphs(borrower);
  return (
    <div ref={ref} className="a4-page" dir="rtl">
      <div className="flex items-start justify-between pb-4 border-b-2 border-jyad-primary mb-6">
        <div>
          <div className="text-xs text-jyad-muted mb-1">شركة جياد كابيتال</div>
          <h1 className="text-2xl font-black text-jyad-primary leading-tight">{doc.title}</h1>
          <div className="text-xs text-jyad-muted mt-1">
            المرحلة {doc.phase === 1 ? 'الأولى — البرنامج' : 'الثانية — الإصدار'}
            {' • '}
            معرّف المستند: {doc.id}
          </div>
        </div>
        <div className="text-left">
          <div className="text-3xl font-black text-jyad-accent">جياد</div>
          <div className="text-[10px] text-jyad-muted">JYAD CAPITAL</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs bg-jyad-background rounded-lg p-3 mb-6 border border-jyad-border">
        <KeyVal k="اسم الشركة" v={borrower.company.name} />
        <KeyVal k="السجل التجاري" v={borrower.company.crNumber} />
        <KeyVal k="نوع الشركة" v={companyTypeLabel(borrower.company.type)} />
        <KeyVal k="مرجع عقد التأسيس" v={borrower.company.articlesRef} />
        <KeyVal k="العنوان الوطني" v={borrower.company.nationalAddress} />
        <KeyVal k="الموقّع المفوض" v={borrower.signer.fullName} />
        <KeyVal k="الهوية الوطنية" v={borrower.signer.nationalId} />
        <KeyVal k="انتهاء الهوية" v={borrower.signer.idExpiry} />
        <KeyVal k="الجوال" v={borrower.signer.mobile} />
        <KeyVal k="البريد الإلكتروني" v={borrower.signer.email} />
        <KeyVal k="قيمة الضمان" v={`${borrower.guarantee.amountSar.toLocaleString('ar-SA')} ريال`} />
        <KeyVal k="طبيعة الرهن" v={collateralLabel(borrower.collateral)} />
      </div>

      <article className="space-y-4 text-[15px] leading-[2] text-jyad-primary">
        {paras.map((p, i) => (
          <p key={i} className="text-justify">
            {p}
          </p>
        ))}
      </article>

      {doc.signable && (
        <div className="mt-10 pt-6 border-t border-dashed border-jyad-border grid grid-cols-2 gap-6 text-xs">
          <div>
            <div className="text-jyad-muted mb-2">الطرف الأول — جياد كابيتال</div>
            <div className="h-16 border-b border-jyad-border mb-1" />
            <div className="text-jyad-muted">الاسم والتوقيع والختم</div>
          </div>
          <div>
            <div className="text-jyad-muted mb-2">الطرف الثاني — {borrower.company.name}</div>
            <div className="h-16 border-b border-jyad-border mb-1" />
            <div className="text-jyad-muted">{borrower.signer.fullName}</div>
          </div>
        </div>
      )}

      {!doc.signable && (
        <div className="mt-8 rounded-lg bg-amber-50 border border-amber-300 p-4 text-sm text-amber-900">
          <strong>للعلم فقط —</strong> هذا المستند لا يتطلب توقيعاً داخل المنصة.
        </div>
      )}
    </div>
  );
});

function KeyVal({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-jyad-muted min-w-[110px]">{k}:</span>
      <span className="font-medium text-jyad-primary truncate">{v || '—'}</span>
    </div>
  );
}

ContractDocument.displayName = 'ContractDocument';
