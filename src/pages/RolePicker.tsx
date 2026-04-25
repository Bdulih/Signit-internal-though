import { Link, Navigate } from 'react-router-dom';
import { getSession } from '@/lib/auth';

export function RolePicker() {
  const s = getSession();
  if (s?.role === 'staff') return <Navigate to="/admin" replace />;
  if (s?.role === 'client' && s.borrowerId) return <Navigate to="/sign" replace />;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-3 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-navy text-gold font-bold text-3xl flex items-center justify-center shadow-pop">
            ج
          </div>
          <div className="text-right">
            <div className="text-gold text-2xl font-bold leading-tight">جياد كابيتال</div>
            <div className="text-[11px] tracking-[0.25em] text-navy-400">JYAD CAPITAL</div>
          </div>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-navy mb-2">
          منصة التوقيع الإلكتروني للصكوك
        </h1>
        <p className="text-sm sm:text-base text-navy-400 max-w-xl mx-auto">
          ابدأ بتسجيل الدخول وفقًا لدورك في عملية إصدار الصكوك.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <RoleCard
          to="/login/staff"
          tag="JYAD STAFF"
          title="الدخول كموظف"
          desc="إنشاء ملفات المقترضين، إعداد حزم وثائق الإصدار، ومتابعة سجل التوقيعات."
          features={[
            'إنشاء ملفات مقترضين جديدة',
            'إرسال حزم التوقيع للعملاء',
            'مراجعة سجل التدقيق وتنزيل الوثائق',
          ]}
          accent="navy"
        />
        <RoleCard
          to="/login/client"
          tag="BORROWER · CLIENT"
          title="الدخول كعميل (مقترض)"
          desc="استلام حزمة الوثائق، مراجعتها وتوقيعها إلكترونيًا برمز التحقق."
          features={[
            'استلام حزمة وثائق الإصدار',
            'التوقيع برمز OTP إلى الجوّال',
            'استلام نسخة PDF بالبريد الإلكتروني',
          ]}
          accent="gold"
        />
      </div>

      <div className="text-center text-xs text-navy-400 mt-10">
        نسخة تجريبية داخلية — جميع البيانات مُولَّدة آليًا ولا تُمثّل عملاء فعليين.
      </div>
    </div>
  );
}

function RoleCard({
  to,
  tag,
  title,
  desc,
  features,
  accent,
}: {
  to: string;
  tag: string;
  title: string;
  desc: string;
  features: string[];
  accent: 'navy' | 'gold';
}) {
  return (
    <Link
      to={to}
      className="card p-7 sm:p-8 group hover:shadow-pop transition-all hover:-translate-y-0.5 flex flex-col"
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={
            accent === 'navy'
              ? 'text-[10px] font-bold tracking-[0.22em] text-navy-400'
              : 'text-[10px] font-bold tracking-[0.22em] text-gold-700'
          }
        >
          {tag}
        </div>
        <span
          className={
            accent === 'navy'
              ? 'text-navy-300 group-hover:text-navy transition'
              : 'text-gold-400 group-hover:text-gold-700 transition'
          }
        >
          ←
        </span>
      </div>
      <h2 className="text-2xl font-bold text-navy mb-2">{title}</h2>
      <p className="text-sm text-navy-400 mb-5">{desc}</p>
      <ul className="space-y-2 mt-auto">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm text-navy-600">
            <span
              className={
                accent === 'navy'
                  ? 'inline-block w-1.5 h-1.5 rounded-full bg-navy-300'
                  : 'inline-block w-1.5 h-1.5 rounded-full bg-gold'
              }
            />
            {f}
          </li>
        ))}
      </ul>
    </Link>
  );
}
