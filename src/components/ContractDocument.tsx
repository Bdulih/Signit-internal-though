import { forwardRef } from 'react';
import type { Borrower, ContractDoc } from '@/lib/types';
import { formatSar } from '@/lib/cn';

interface Props {
  borrower: Borrower;
  doc: ContractDoc;
}

export const ContractDocument = forwardRef<HTMLDivElement, Props>(function ContractDocument(
  { borrower, doc },
  ref,
) {
  const paras = doc.bodyParagraphs(borrower);
  return (
    <div
      ref={ref}
      dir="rtl"
      lang="ar"
      className="bg-white mx-auto shadow-card print:shadow-none"
      style={{
        width: 'min(100%, 794px)',
        minHeight: 1000,
        padding: '48px 56px',
        fontFamily: 'Tajawal, "IBM Plex Sans Arabic", system-ui, sans-serif',
        color: '#0B2545',
        border: '1px solid #0B2545',
      }}
    >
      <div
        style={{
          borderBottom: '3px solid #0B2545',
          paddingBottom: 16,
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
        }}
      >
        <div>
          <div style={{ color: '#C9A961', fontWeight: 800, fontSize: 28, lineHeight: 1 }}>جياد</div>
          <div style={{ color: '#0B2545', fontSize: 10, letterSpacing: 3, marginTop: 4 }}>
            JYAD CAPITAL
          </div>
          <div style={{ color: '#6b7280', fontSize: 10, marginTop: 6 }}>
            منصة التوقيع الداخلية — نسخة تجريبية
          </div>
        </div>
        <div style={{ textAlign: 'left', direction: 'ltr', color: '#0B2545' }}>
          <div style={{ fontSize: 11, color: '#6b7280' }}>
            Phase {doc.phase} · Doc {doc.id}
          </div>
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
            {new Date().toLocaleDateString('ar-SA')}
          </div>
        </div>
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>{doc.title}</h1>
      <div style={{ color: '#6b7280', fontSize: 12, marginBottom: 20 }}>
        {doc.phase === 1 ? 'المرحلة الأولى — وثائق البرنامج' : 'المرحلة الثانية — إصدار الصكوك'}
      </div>

      <section
        style={{
          background: '#FAFAF7',
          border: '1px solid #E8ECF3',
          borderRadius: 10,
          padding: 16,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: '10px 24px',
            fontSize: 13,
          }}
        >
          <KV k="اسم الشركة" v={borrower.company.name} />
          <KV k="السجل التجاري" v={borrower.company.crNumber} />
          <KV k="نوع الشركة" v={borrower.company.type === 'LLC' ? 'ذات مسؤولية محدودة' : 'شركة مساهمة'} />
          <KV k="المرجع التأسيسي" v={borrower.company.articlesRef} />
          <KV k="العنوان الوطني" v={borrower.company.nationalAddress} />
          <KV k="الموقّع المفوّض" v={borrower.signer.fullName} />
          <KV k="الهوية الوطنية" v={borrower.signer.nationalId} />
          <KV k="قيمة الضمان" v={formatSar(borrower.guarantee.amountSar)} />
        </div>
      </section>

      <div style={{ fontSize: 14, lineHeight: 1.9 }}>
        {paras.map((p, i) => (
          <p key={i} style={{ marginBottom: 14, textAlign: 'justify' }}>
            {p}
          </p>
        ))}
      </div>

      <div
        style={{
          marginTop: 40,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 32,
        }}
      >
        <SigBlock party="الطرف الأول" name="جياد كابيتال" role="المُرتِّب / الوكيل" />
        <SigBlock
          party="الطرف الثاني"
          name={borrower.signer.fullName}
          role={borrower.company.name}
        />
      </div>

      {!doc.signable && (
        <div
          style={{
            marginTop: 24,
            padding: 12,
            background: '#FEF3C7',
            border: '1px solid #F59E0B',
            borderRadius: 8,
            fontSize: 12,
            color: '#92400E',
          }}
        >
          هذا المستند للعلم فقط — لا يُوقَّع داخل هذه المنصة.
        </div>
      )}
    </div>
  );
});

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div style={{ color: '#6b7280', fontSize: 11, marginBottom: 2 }}>{k}</div>
      <div style={{ fontWeight: 600, fontSize: 13 }}>{v}</div>
    </div>
  );
}

function SigBlock({ party, name, role }: { party: string; name: string; role: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>{party}</div>
      <div
        style={{
          borderBottom: '1.5px solid #0B2545',
          height: 40,
          marginBottom: 8,
        }}
      />
      <div style={{ fontWeight: 700, fontSize: 13 }}>{name}</div>
      <div style={{ fontSize: 11, color: '#6b7280' }}>{role}</div>
    </div>
  );
}
