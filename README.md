# Signit — Jyad Capital Internal E-Signature Prototype

Internal UX prototype for a sequential e-signature flow used during sukuk (Islamic debt) issuance, modeled after Saudi Arabia's Signit platform. Built for a stakeholder demo — **not for real contract execution**.

**Live demo:** https://bdulih.github.io/signit-internal-though/

---

## Stack

- Vite + React 18 + TypeScript
- Tailwind CSS (custom Jyad navy/gold theme)
- `react-router-dom` with **HashRouter** (GitHub Pages-friendly)
- `react-signature-canvas` for the signature pad
- `jsPDF` + `html2canvas` for client-side PDF rendering
- Full Arabic RTL (`<html dir="rtl" lang="ar">`) — Tajawal / IBM Plex Sans Arabic
- LocalStorage-only persistence (no backend)

---

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173/signit-internal-though/
npm run build    # production build in dist/
npm run preview  # preview the production build
```

---

## Demo walkthrough (2 minutes)

1. Open the live URL. You land on **لوحة المقترضين** (Borrower Dashboard) — empty state.
2. Click **+ مقترض جديد**. Click **تعبئة بيانات تجريبية** for a one-click demo seed (an LLC with a 50M SAR guarantee, one guarantor, company-owned collateral). Or fill the fields yourself.
3. Submit. You're dropped into the **sign flow** with a sequential stepper showing all auto-generated documents for this borrower.
4. Read the A4-styled Arabic contract. Click **توقيع**. Enter **any 6 digits** in the OTP modal (the helper text says so — this is a demo).
5. Draw a signature (or switch to the typed-name fallback). Click **اعتماد التوقيع**.
6. The signed PDF auto-downloads. The stepper advances to the next document.
7. Repeat through all documents — the sequence adapts based on company type (LLC vs JSC), guarantor count (loop), and collateral choice (bilateral vs trilateral pledge).
8. When finished, open **عرض السجل النهائي** to see the audit log and re-download any signed PDF.

---

## Document sequence (auto-generated)

### Phase 1 — Program
- **1a.** إقرار مالك الشركة *(LLC only)*  /  **1b.** إقرار موافقة مجلس الإدارة *(JSC only)*
- **2.** قرار موافقة على إصدار أدوات دين — مدير الشركة
- **3.** اتفاقية الترتيب
- **4.** إعلان الوكالة الرئيسي
- **5.** اتفاقية المرابحة الرئيسية
- **6.** اتفاقية الضمان — *one per guarantor*
- **7.** اتفاقية الرهن الثنائي *(if collateral = company-owned)*  /  اتفاقية الرهن الثلاثي *(if collateral = third-party)*
- **Info card** — سند لأمر (issued via Nafith externally — not signable here)

### Phase 2 — Issuance
- اتفاقية الصك الرئيسي والشروط النهائية
- مستند الطرح
- طلب الشراء
- إيجاب البائع
- قبول المشتري

Each document is pre-filled with borrower data injected as a key-value header, with 3–4 paragraphs of formal legal Arabic prose. Every page carries the red **نموذج تجريبي — ليس ملزماً قانونياً** watermark.

---

## Branding

| | |
|---|---|
| Primary | `#0B2545` (navy) |
| Accent | `#C9A961` (gold) |
| Background | `#FAFAF7` (off-white) |

---

## Data model (localStorage)

```ts
Borrower {
  id, createdAt,
  company:   { name, crNumber, articlesRef, type (LLC|JSC), nationalAddress },
  signer:    { fullName, nationalId, idExpiry, email, mobile },
  guarantee: { amountSar, guarantors: [{ name, nationalId }] },
  collateral: 'none' | 'company-owned' | 'third-party',
  auditLog:  [{ docId, docTitle, signedAt, otpUsed, signatureDataUrl }],
}
```

Storage key: `jyad.signit.borrowers.v1`. Nothing leaves the browser.

---

## Deployment

`.github/workflows/deploy.yml` builds on every push to `main` and publishes to GitHub Pages via `actions/deploy-pages@v4`.

- `vite.config.ts` sets `base: '/signit-internal-though/'` to match the repo name.
- `dist/index.html` is copied to `dist/404.html` so HashRouter deep links survive a hard refresh.
- **First-time setup:** on GitHub, go to **Settings → Pages → Source → GitHub Actions** to enable.

---

## Known limitations

- **Static-only.** No backend, no database, no server-side validation.
- **LocalStorage wipes** on browser clear / incognito / different device.
- **Public repo.** Do not enter real PII, real national IDs, real mobile numbers.
- **OTP is a no-op.** Any 6 digits accepted.
- **PDF Arabic rendering** works by rasterizing the rendered DOM — image, not selectable text.
- **Contract bodies are placeholder prose.** Not vetted by counsel.
- **No real Nafath / Absher integration.**
- **No role-based access.**
- **No multi-signer coordination.**

---

## To productionize

- [ ] Backend service + Postgres
- [ ] Real OTP provider (Unifonic / Taqnyat / Mobily)
- [ ] Nafath integration
- [ ] Legally-reviewed contract templates
- [ ] Digital signature standards (xAdES / PAdES)
- [ ] Text-native Arabic PDF rendering (server-side Puppeteer/Chromium)
- [ ] Role-based access
- [ ] Audit log immutability (hash chaining, WORM)
- [ ] Document versioning + amendments
- [ ] Multi-signer workflow
- [ ] Private hosting behind Jyad SSO
- [ ] SOC 2 / CMA regulatory alignment
- [ ] Nafith integration for promissory notes
