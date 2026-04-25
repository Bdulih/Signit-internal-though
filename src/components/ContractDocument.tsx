import { forwardRef } from 'react';
import type { AuditEntry, Borrower, ContractDoc } from '@/lib/types';
import { fakeSha, formatDate, formatSar, maskOtp } from '@/lib/cn';

interface Props {
  borrower: Borrower;
  doc: ContractDoc;
  audit?: AuditEntry;
  withSignature?: boolean;
}

export const ContractDocument = forwardRef<HTMLDivElement, Props>(function ContractDocument(
  { borrower, doc, audit, withSignature = false },
  ref,
) {
  const paras = doc.bodyParagraphs(borrower);
  return (
    <div
      ref={ref}
      dir="rtl"
      lang="ar"
      style={{
        position: 'relative',
        width: 'min(100%, 794px)',
        margin: '0 auto',
        background: '#fff',
        boxShadow: '0 4px 16px rgba(11,37,69,0.06)',
        fontFamily: 'Tajawal, "IBM Plex Sans Arabic", system-ui, sans-serif',
        color: '#0B2545',
        border: '1px solid #0B2545',
        overflow: 'hidden',
      }}
    >
      {/* Watermark */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 0,
        }}
      >
        <div
          style={{
            transform: 'rotate(-28deg)',
            color: 'rgba(220, 38, 38, 0.10)',
            fontSize: 60,
            fontWeight: 900,
            letterSpacing: 6,
            whiteSpace: 'nowrap',
          }}
        >
          نسخة تجريبية · غير ملزمة قانونيًا
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 1, padding: '40px 56px 32px' }}>
        {/* Header bar */}
        <div
          style={{
            background: '#0B2545',
            margin: '-40px -56px 24px',
            padding: '16px 56px',
            color: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                border: '1px solid rgba(201,169,97,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#C9A961',
                fontWeight: 800,
                fontSize: 18,
              }}
            >
              ج
            </div>
            <div>
              <div style={{ color: '#C9A961', fontWeight: 800, fontSize: 18, lineHeight: 1.1 }}>جياد كابيتال</div>
              <div style={{ fontSize: 9, letterSpacing: 3, color: 'rgba(255,255,255,0.7)' }}>JYAD CAPITAL</div>
            </div>
          </div>
          <div style={{ textAlign: 'left', direction: 'ltr', fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>
            <div>Phase {doc.phase} · {doc.id}</div>
            <div style={{ marginTop: 2 }}>{new Date().toLocaleDateString('ar-SA')}</div>
          </div>
        </div>

        {/* Title */}
        <div style={{ borderBottom: '2px solid #C9A961', paddingBottom: 12, marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: '#C9A961', fontWeight: 700, letterSpacing: 1.5, marginBottom: 4 }}>
            {doc.phase === 1 ? 'المرحلة الأولى — وثائق البرنامج' : 'المرحلة الثانية — إصدار الصكوك'}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.3 }}>{doc.title}</h1>
        </div>

        {/* Parties / Key data */}
        <section
          style={{
            background: '#FAFAF7',
            border: '1px solid #E8ECF3',
            borderRadius: 10,
            padding: '14px 16px',
            marginBottom: 22,
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: '#6b7280',
              fontWeight: 700,
              letterSpacing: 1,
              marginBottom: 8,
              textTransform: 'uppercase',
            }}
          >
            بيانات الأطراف
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: '8px 24px',
              fontSize: 12,
            }}
          >
            <KV k="الجهة المصدِرة" v={borrower.company.name} />
            <KV k="السجل التجاري" v={borrower.company.crNumber} />
            <KV k="نوع الكيان" v={borrower.company.type === 'LLC' ? 'شركة ذات مسؤولية محدودة' : 'شركة مساهمة سعودية'} />
            <KV k="المرجع التأسيسي" v={borrower.company.articlesRef} />
            <KV k="العنوان الوطني" v={borrower.company.nationalAddress} />
            <KV k="الموقّع المفوّض" v={borrower.signer.fullName} />
            <KV k="الهوية الوطنية" v={borrower.signer.nationalId} />
            <KV k="القيمة المعتمدة" v={formatSar(borrower.guarantee.amountSar)} />
          </div>
        </section>

        {/* Body */}
        <div style={{ fontSize: 13.5, lineHeight: 1.95 }}>
          {paras.map((p, i) => (
            <p key={i} style={{ marginBottom: 12, textAlign: 'justify' }}>
              {p}
            </p>
          ))}
        </div>

        {/* Signature blocks */}
        <div
          style={{
            marginTop: 30,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 32,
          }}
        >
          <SigBlock
            party="الطرف الأول"
            name="جياد كابيتال للاستثمار"
            role="بصفته المُرتِّب والوكيل الاستثماري"
            signatureUrl={withSignature ? '' : ''}
          />
          <SigBlock
            party="الطرف الثاني"
            name={borrower.signer.fullName}
            role={`بصفته المفوّض عن ${borrower.company.name}`}
            signatureUrl={withSignature && audit ? audit.signatureDataUrl : ''}
          />
        </div>

        {/* Audit / Verification footer (Arabic only) */}
        {withSignature && audit && (
          <div
            style={{
              marginTop: 28,
              borderTop: '1.5px solid #0B2545',
              paddingTop: 14,
              fontSize: 11,
              color: '#0B2545',
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: '#6b7280',
                fontWeight: 700,
                letterSpacing: 1,
                marginBottom: 8,
                textTransform: 'uppercase',
              }}
            >
              توثيق التوقيع الإلكتروني
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '4px 24px',
                lineHeight: 1.7,
              }}
            >
              <KV k="الموقّع" v={borrower.signer.fullName} />
              <KV k="رقم الهوية" v={borrower.signer.nationalId} />
              <KV k="رقم الجوّال" v={borrower.signer.mobile} />
              <KV k="البريد الإلكتروني" v={borrower.signer.email} />
              <KV k="تاريخ التوقيع" v={formatDate(audit.signedAt)} />
              <KV k="رمز التحقق (OTP)" v={maskOtp(audit.otpUsed)} />
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ color: '#6b7280', fontSize: 10, marginBottom: 2 }}>بصمة التوقيع المشفّرة</div>
                <div
                  dir="ltr"
                  style={{
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: 10,
                    color: '#0B2545',
                    wordBreak: 'break-all',
                  }}
                >
                  {fakeSha(audit.otpUsed + ':' + audit.docId + ':' + borrower.id)}
                </div>
              </div>
            </div>
          </div>
        )}

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
            <strong>تنبيه:</strong> هذا المستند للعلم فقط — يُوقَّع رسميًا خارج هذه المنصة عبر منظومة "نافذ" الوطنية.
          </div>
        )}

        {/* Page footer */}
        <div
          style={{
            marginTop: 24,
            paddingTop: 12,
            borderTop: '1px solid #E8ECF3',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 9,
            color: '#9ca3af',
          }}
        >
          <div>© جياد كابيتال — منصة التوقيع الداخلية</div>
          <div style={{ color: '#dc2626', fontWeight: 700 }}>نسخة تجريبية — غير ملزمة قانونيًا</div>
        </div>
      </div>
    </div>
  );
});

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div style={{ color: '#6b7280', fontSize: 10, marginBottom: 2 }}>{k}</div>
      <div style={{ fontWeight: 600, fontSize: 12 }}>{v}</div>
    </div>
  );
}

function SigBlock({
  party,
  name,
  role,
  signatureUrl,
}: {
  party: string;
  name: string;
  role: string;
  signatureUrl?: string;
}) {
  return (
    <div>
      <div style={{ fontSize: 10, color: '#C9A961', fontWeight: 700, letterSpacing: 1.5, marginBottom: 6, textTransform: 'uppercase' }}>
        {party}
      </div>
      <div
        style={{
          height: 56,
          marginBottom: 8,
          borderBottom: '1.5px solid #0B2545',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          paddingBottom: 2,
        }}
      >
        {signatureUrl && (
          <img
            src={signatureUrl}
            alt="توقيع"
            style={{ maxHeight: 50, maxWidth: '100%', objectFit: 'contain' }}
            crossOrigin="anonymous"
          />
        )}
      </div>
      <div style={{ fontWeight: 700, fontSize: 13 }}>{name}</div>
      <div style={{ fontSize: 11, color: '#6b7280' }}>{role}</div>
    </div>
  );
}
