import type { AuditEntry, Borrower } from './types';
import { buildDocsForBorrower } from './contracts';
import { upsertBorrower, getAllBorrowers, clearAll } from './storage';

const SEED_FLAG = 'jyad.signit.seeded.v1';

function makeSignatureDataUrl(seedStr: string): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 90;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 320, 90);
  ctx.strokeStyle = '#0B2545';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) h = (h * 31 + seedStr.charCodeAt(i)) >>> 0;
  const r = (n: number) => {
    h = (h * 1664525 + 1013904223) >>> 0;
    return n + ((h % 1000) / 1000) * 0;
  };
  void r(0);
  const wig = (i: number) => ((seedStr.charCodeAt(i % seedStr.length) || 50) % 30) - 15;
  ctx.moveTo(20, 55 + wig(0));
  ctx.bezierCurveTo(60, 20 + wig(1), 110, 80 + wig(2), 150, 40 + wig(3));
  ctx.bezierCurveTo(190, 18 + wig(4), 230, 70 + wig(5), 270, 45 + wig(6));
  ctx.bezierCurveTo(285, 38 + wig(7), 295, 55 + wig(8), 305, 50 + wig(9));
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(40, 70 + wig(10));
  ctx.bezierCurveTo(80, 65 + wig(11), 150, 78 + wig(12), 220, 70 + wig(13));
  ctx.lineWidth = 1.2;
  ctx.stroke();
  return canvas.toDataURL('image/png');
}

function makeAudit(
  borrowerId: string,
  docs: ReturnType<typeof buildDocsForBorrower>,
  count: number,
  daysAgoStart: number,
): AuditEntry[] {
  const signable = docs.filter((d) => d.signable).slice(0, count);
  const now = Date.now();
  return signable.map((d, i) => {
    const ageMs = (daysAgoStart - i * 0.05) * 86400000;
    const otp = String(((Math.abs(d.id.length * 7 + i * 13 + borrowerId.length * 3) + 100000) % 900000) + 100000);
    return {
      docId: d.id,
      docTitle: d.title,
      signedAt: new Date(now - ageMs).toISOString(),
      otpUsed: otp,
      signatureDataUrl: makeSignatureDataUrl(borrowerId + ':' + d.id),
    };
  });
}

function buildSeedBorrowers(): Borrower[] {
  const now = Date.now();

  // 1) LLC — fresh, no signatures yet — single guarantor, company-owned pledge
  const b1Base: Borrower = {
    id: 'b_seed_rawasekh',
    createdAt: new Date(now - 2 * 86400000).toISOString(),
    company: {
      name: 'شركة الرواسخ للتجارة',
      crNumber: '1010234567',
      articlesRef: 'AR-2021-0456',
      type: 'LLC',
      nationalAddress: 'الرياض — حي الورود — 12651',
    },
    signer: {
      fullName: 'سعد بن عبدالعزيز الراشد',
      nationalId: '1087654321',
      idExpiry: '2030-05-14',
      email: 'saad@rawasekh.sa',
      mobile: '+966501234567',
    },
    guarantee: {
      amountSar: 50_000_000,
      guarantors: [
        { id: 'g_rwk_1', name: 'عبدالعزيز بن محمد الراشد', nationalId: '1034567890' },
      ],
    },
    collateral: 'company-owned',
    auditLog: [],
  };

  // 2) JSC — in progress — 3 guarantors — third-party pledge
  const b2Base: Borrower = {
    id: 'b_seed_zahed',
    createdAt: new Date(now - 8 * 86400000).toISOString(),
    company: {
      name: 'مجموعة الزاهد القابضة',
      crNumber: '1010987654',
      articlesRef: 'AR-2018-1142',
      type: 'JSC',
      nationalAddress: 'جدة — حي الشاطئ — 23234',
    },
    signer: {
      fullName: 'عبدالله بن محمد الزاهد',
      nationalId: '1029384756',
      idExpiry: '2032-11-02',
      email: 'a.zahed@zahed-holding.sa',
      mobile: '+966555012345',
    },
    guarantee: {
      amountSar: 250_000_000,
      guarantors: [
        { id: 'g_zhd_1', name: 'محمد بن عبدالله الزاهد', nationalId: '1011223344' },
        { id: 'g_zhd_2', name: 'فهد بن محمد الزاهد', nationalId: '1055443322' },
        { id: 'g_zhd_3', name: 'سلمان بن عبدالله الزاهد', nationalId: '1066778899' },
      ],
    },
    collateral: 'third-party',
    auditLog: [],
  };

  // 3) LLC — slightly started — 1 guarantor — no collateral
  const b3Base: Borrower = {
    id: 'b_seed_marafiq',
    createdAt: new Date(now - 1 * 86400000).toISOString(),
    company: {
      name: 'شركة المرافق الذهبية المحدودة',
      crNumber: '1010445566',
      articlesRef: 'AR-2022-0089',
      type: 'LLC',
      nationalAddress: 'الدمام — حي الفيصلية — 32253',
    },
    signer: {
      fullName: 'نورا بنت فهد العتيبي',
      nationalId: '1098765432',
      idExpiry: '2029-08-21',
      email: 'noura@marafiq-gold.sa',
      mobile: '+966503344556',
    },
    guarantee: {
      amountSar: 18_000_000,
      guarantors: [
        { id: 'g_mrf_1', name: 'فهد بن سعد العتيبي', nationalId: '1077889900' },
      ],
    },
    collateral: 'none',
    auditLog: [],
  };

  // 4) JSC — completed — 2 guarantors — company-owned pledge
  const b4Base: Borrower = {
    id: 'b_seed_advanced',
    createdAt: new Date(now - 18 * 86400000).toISOString(),
    company: {
      name: 'الشركة السعودية للأنظمة المتقدمة',
      crNumber: '1010772233',
      articlesRef: 'AR-2015-0312',
      type: 'JSC',
      nationalAddress: 'الرياض — حي الملقا — 13524',
    },
    signer: {
      fullName: 'خالد بن سلمان الدوسري',
      nationalId: '1044556677',
      idExpiry: '2031-03-09',
      email: 'k.aldosari@sasys.sa',
      mobile: '+966551122334',
    },
    guarantee: {
      amountSar: 500_000_000,
      guarantors: [
        { id: 'g_sas_1', name: 'منصور بن عبدالعزيز السبيعي', nationalId: '1023344556' },
        { id: 'g_sas_2', name: 'بدر بن خالد الدوسري', nationalId: '1099887766' },
      ],
    },
    collateral: 'company-owned',
    auditLog: [],
  };

  // Compute audit logs based on real doc lists
  const b2Docs = buildDocsForBorrower(b2Base);
  const b2Signable = b2Docs.filter((d) => d.signable).length;
  const b2 = { ...b2Base, auditLog: makeAudit(b2Base.id, b2Docs, Math.min(6, b2Signable), 4) };

  const b3Docs = buildDocsForBorrower(b3Base);
  const b3 = { ...b3Base, auditLog: makeAudit(b3Base.id, b3Docs, 2, 0.6) };

  const b4Docs = buildDocsForBorrower(b4Base);
  const b4SignableCount = b4Docs.filter((d) => d.signable).length;
  const b4 = { ...b4Base, auditLog: makeAudit(b4Base.id, b4Docs, b4SignableCount, 16) };

  return [b1Base, b2, b3, b4];
}

export function maybeSeedDemos(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (window.localStorage.getItem(SEED_FLAG)) return false;
    if (getAllBorrowers().length > 0) {
      window.localStorage.setItem(SEED_FLAG, '1');
      return false;
    }
    const seeds = buildSeedBorrowers();
    // upsertBorrower prepends, so seed in reverse for nice display order
    for (let i = seeds.length - 1; i >= 0; i--) upsertBorrower(seeds[i]);
    window.localStorage.setItem(SEED_FLAG, '1');
    return true;
  } catch {
    return false;
  }
}

export function reseedDemos(): void {
  if (typeof window === 'undefined') return;
  clearAll();
  const seeds = buildSeedBorrowers();
  for (let i = seeds.length - 1; i >= 0; i--) upsertBorrower(seeds[i]);
  try {
    window.localStorage.setItem(SEED_FLAG, '1');
  } catch {
    // ignore
  }
}
