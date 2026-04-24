# جياد كابيتال — منصة التوقيع الداخلية (نموذج تجريبي)

Internal e-signature prototype for Jyad Capital's sukuk-issuance workflow. Arabic-first, RTL, GitHub-Pages–deployed static SPA.

> وضع تجريبي — لا تُستخدم هذه المنصة لتوقيع مستندات حقيقية.

## Stack

- Vite 5 + React 18 + TypeScript (strict)
- Tailwind CSS (hand-rolled utilities, no shadcn)
- `react-router-dom` v6 with **HashRouter** (required for GH Pages deep links)
- `react-signature-canvas`, `jspdf`, `html2canvas`
- No backend. State persists in `localStorage` under `jyad.signit.borrowers.v1`.

## Develop

```bash
npm install
npm run dev
# http://localhost:5173/Signit-internal-though/
```

## Build

```bash
npm run build
npm run preview
```

## Deploy

Push to `main`. The `.github/workflows/deploy.yml` workflow builds and deploys to GitHub Pages.

After the first push, enable Pages in **Settings → Pages → Source → GitHub Actions**.

Live URL: https://bdulih.github.io/Signit-internal-though/
