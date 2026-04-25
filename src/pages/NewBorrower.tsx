import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Borrower, CollateralType, CompanyType, Guarantor } from '@/lib/types';
import { uid } from '@/lib/cn';
import { upsertBorrower } from '@/lib/storage';

interface Draft {
  companyName: string;
  crNumber: string;
  articlesRef: string;
  companyType: CompanyType;
  nationalAddress: string;
  signerFullName: string;
  signerNationalId: string;
  signerIdExpiry: string;
  signerEmail: string;
  signerMobile: string;
  amountSar: string;
  guarantors: Guarantor[];
  collateral: CollateralType;
}

const DEMO_SEED: Draft = {
  companyName: 'شركة الرواسخ للتجارة',
  crNumber: '1010234567',
  articlesRef: 'AR-2021-0456',
  companyType: 'LLC',
  nationalAddress: 'الرياض — حي الورود — 12651',
  signerFullName: 'سعد بن عبدالعزيز الراشد',
  signerNationalId: '1087654321',
  signerIdExpiry: '2030-05-14',
  signerEmail: 'saad@rawasekh.sa',
  signerMobile: '+966501234567',
  amountSar: '50000000',
  guarantors: [{ id: uid('g'), name: 'عبدالعزيز بن محمد الراشد', nationalId: '1034567890' }],
  collateral: 'company-owned',
};

const EMPTY: Draft = {
  companyName: '',
  crNumber: '',
  articlesRef: '',
  companyType: 'LLC',
  nationalAddress: '',
  signerFullName: '',
  signerNationalId: '',
  signerIdExpiry: '',
  signerEmail: '',
  signerMobile: '',
  amountSar: '',
  guarantors: [{ id: uid('g'), name: '', nationalId: '' }],
  collateral: 'none',
};

export function NewBorrower() {
  const nav = useNavigate();
  const [d, setD] = useState<Draft>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set<K extends keyof Draft>(k: K, v: Draft[K]) {
    setD((prev) => ({ ...prev, [k]: v }));
  }

  function addGuarantor() {
    set('guarantors', [...d.guarantors, { id: uid('g'), name: '', nationalId: '' }]);
  }

  function removeGuarantor(id: string) {
    set(
      'guarantors',
      d.guarantors.filter((g) => g.id !== id),
    );
  }

  function updateGuarantor(id: string, patch: Partial<Guarantor>) {
    set(
      'guarantors',
      d.guarantors.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    );
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!d.companyName.trim()) e.companyName = 'مطلوب';
    if (!d.crNumber.trim()) e.crNumber = 'مطلوب';
    if (!d.articlesRef.trim()) e.articlesRef = 'مطلوب';
    if (!d.nationalAddress.trim()) e.nationalAddress = 'مطلوب';
    if (!d.signerFullName.trim()) e.signerFullName = 'مطلوب';
    if (!d.signerNationalId.trim()) e.signerNationalId = 'مطلوب';
    if (!d.signerIdExpiry.trim()) e.signerIdExpiry = 'مطلوب';
    if (!d.signerEmail.trim()) e.signerEmail = 'مطلوب';
    if (!d.signerMobile.trim()) e.signerMobile = 'مطلوب';
    const amt = Number(d.amountSar);
    if (!Number.isFinite(amt) || amt <= 0) e.amountSar = 'يجب أن تكون قيمة صحيحة أكبر من صفر';
    d.guarantors.forEach((g) => {
      if (!g.name.trim()) e[`g_name_${g.id}`] = 'اسم الضامن مطلوب';
      if (!g.nationalId.trim()) e[`g_id_${g.id}`] = 'هوية الضامن مطلوبة';
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit() {
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const b: Borrower = {
      id: uid('b'),
      createdAt: new Date().toISOString(),
      company: {
        name: d.companyName.trim(),
        crNumber: d.crNumber.trim(),
        articlesRef: d.articlesRef.trim(),
        type: d.companyType,
        nationalAddress: d.nationalAddress.trim(),
      },
      signer: {
        fullName: d.signerFullName.trim(),
        nationalId: d.signerNationalId.trim(),
        idExpiry: d.signerIdExpiry.trim(),
        email: d.signerEmail.trim(),
        mobile: d.signerMobile.trim(),
      },
      guarantee: {
        amountSar: Number(d.amountSar),
        guarantors: d.guarantors.map((g) => ({
          id: g.id,
          name: g.name.trim(),
          nationalId: g.nationalId.trim(),
        })),
      },
      collateral: d.collateral,
      auditLog: [],
    };
    upsertBorrower(b);
    nav(`/admin/borrowers/${b.id}/sign`);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy">إضافة مقترض</h1>
          <p className="text-sm text-navy-400 mt-1">
            أدخل بيانات الشركة والموقّع والضمانات قبل بدء التوقيع.
          </p>
        </div>
        <button
          type="button"
          className="btn-ghost text-sm"
          onClick={() => setD(DEMO_SEED)}
        >
          تعبئة بيانات تجريبية
        </button>
      </div>

      <Section title="بيانات الشركة">
        <Field label="اسم الشركة" err={errors.companyName}>
          <input
            className="input"
            value={d.companyName}
            onChange={(e) => set('companyName', e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="السجل التجاري" err={errors.crNumber}>
            <input
              className="input"
              value={d.crNumber}
              onChange={(e) => set('crNumber', e.target.value)}
            />
          </Field>
          <Field label="المرجع التأسيسي" err={errors.articlesRef}>
            <input
              className="input"
              value={d.articlesRef}
              onChange={(e) => set('articlesRef', e.target.value)}
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="نوع الشركة">
            <select
              className="input"
              value={d.companyType}
              onChange={(e) => set('companyType', e.target.value as CompanyType)}
            >
              <option value="LLC">ذات مسؤولية محدودة (ذ.م.م)</option>
              <option value="JSC">شركة مساهمة (م.س)</option>
            </select>
          </Field>
          <Field label="العنوان الوطني" err={errors.nationalAddress}>
            <input
              className="input"
              value={d.nationalAddress}
              onChange={(e) => set('nationalAddress', e.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section title="بيانات الموقّع المفوّض">
        <Field label="الاسم الكامل" err={errors.signerFullName}>
          <input
            className="input"
            value={d.signerFullName}
            onChange={(e) => set('signerFullName', e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="رقم الهوية الوطنية" err={errors.signerNationalId}>
            <input
              className="input"
              value={d.signerNationalId}
              onChange={(e) => set('signerNationalId', e.target.value)}
            />
          </Field>
          <Field label="تاريخ انتهاء الهوية" err={errors.signerIdExpiry}>
            <input
              type="date"
              className="input"
              value={d.signerIdExpiry}
              onChange={(e) => set('signerIdExpiry', e.target.value)}
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="البريد الإلكتروني" err={errors.signerEmail}>
            <input
              className="input"
              type="email"
              dir="ltr"
              value={d.signerEmail}
              onChange={(e) => set('signerEmail', e.target.value)}
            />
          </Field>
          <Field label="رقم الجوّال" err={errors.signerMobile}>
            <input
              className="input"
              dir="ltr"
              value={d.signerMobile}
              onChange={(e) => set('signerMobile', e.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section title="الضمان">
        <Field label="قيمة الضمان (ريال)" err={errors.amountSar}>
          <input
            className="input"
            inputMode="numeric"
            dir="ltr"
            value={d.amountSar}
            onChange={(e) => set('amountSar', e.target.value.replace(/[^\d]/g, ''))}
          />
        </Field>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="label mb-0">الضامنون</div>
            <button
              type="button"
              className="btn-ghost text-xs"
              onClick={addGuarantor}
            >
              + إضافة ضامن
            </button>
          </div>
          {d.guarantors.map((g, idx) => (
            <div key={g.id} className="rounded-xl border border-navy-50 p-3 bg-white">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-navy-400">ضامن #{idx + 1}</div>
                {d.guarantors.length > 1 && (
                  <button
                    type="button"
                    className="text-xs text-red-600 hover:underline"
                    onClick={() => removeGuarantor(g.id)}
                  >
                    إزالة
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="اسم الضامن" err={errors[`g_name_${g.id}`]}>
                  <input
                    className="input"
                    value={g.name}
                    onChange={(e) => updateGuarantor(g.id, { name: e.target.value })}
                  />
                </Field>
                <Field label="الهوية الوطنية" err={errors[`g_id_${g.id}`]}>
                  <input
                    className="input"
                    value={g.nationalId}
                    onChange={(e) => updateGuarantor(g.id, { nationalId: e.target.value })}
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="الرهن">
        <Field label="نوع الرهن">
          <select
            className="input"
            value={d.collateral}
            onChange={(e) => set('collateral', e.target.value as CollateralType)}
          >
            <option value="none">بدون رهن</option>
            <option value="company-owned">رهن أصول مملوكة للشركة (ثنائي)</option>
            <option value="third-party">رهن أصول طرف ثالث (ثلاثي)</option>
          </select>
        </Field>
      </Section>

      <div className="flex flex-col sm:flex-row gap-2 justify-end mt-6">
        <button onClick={() => nav('/')} className="btn-outline">
          إلغاء
        </button>
        <button onClick={submit} className="btn-primary">
          حفظ والبدء بالتوقيع
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card p-5 mb-4">
      <h2 className="font-bold text-navy mb-4">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  err,
  children,
}: {
  label: string;
  err?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <div className="label">{label}</div>
      {children}
      {err && <div className="text-xs text-red-600 mt-1">{err}</div>}
    </label>
  );
}
