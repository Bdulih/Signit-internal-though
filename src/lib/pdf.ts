import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { AuditEntry, Borrower, ContractDoc } from './types';
import { fakeSha, formatDate } from './cn';

interface RenderArgs {
  node: HTMLElement;
  borrower: Borrower;
  doc: ContractDoc;
  audit: AuditEntry;
}

const NAVY: [number, number, number] = [11, 37, 69];
const GOLD: [number, number, number] = [201, 169, 97];
const RED: [number, number, number] = [200, 40, 40];

function sanitize(name: string): string {
  return name.replace(/[^\p{L}\p{N}\-_ ]+/gu, '').replace(/\s+/g, '_').slice(0, 80);
}

function drawWatermark(pdf: jsPDF, pageW: number, pageH: number) {
  const anyPdf = pdf as unknown as {
    saveGraphicsState?: () => void;
    restoreGraphicsState?: () => void;
    setGState?: (g: unknown) => void;
    GState?: new (o: { opacity: number }) => unknown;
  };
  anyPdf.saveGraphicsState?.();
  if (anyPdf.setGState && anyPdf.GState) {
    anyPdf.setGState(new anyPdf.GState({ opacity: 0.14 }));
  }
  pdf.setTextColor(RED[0], RED[1], RED[2]);
  pdf.setFontSize(48);
  pdf.setFont('helvetica', 'bold');
  const cx = pageW / 2;
  const cy = pageH / 2;
  pdf.text('DEMO — NOT LEGALLY BINDING', cx, cy, {
    align: 'center',
    baseline: 'middle',
    angle: 30,
  });
  anyPdf.restoreGraphicsState?.();
}

function drawHeader(pdf: jsPDF, pageW: number, doc: ContractDoc) {
  pdf.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
  pdf.rect(0, 0, pageW, 60, 'F');
  pdf.setTextColor(GOLD[0], GOLD[1], GOLD[2]);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text('JYAD CAPITAL', 36, 26);
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Internal Signing Platform — DEMO', 36, 42);
  pdf.setFontSize(8);
  const right = `Doc ${doc.id}   |   Phase ${doc.phase}`;
  pdf.text(right, pageW - 36, 42, { align: 'right' });
}

function drawFooter(
  pdf: jsPDF,
  pageW: number,
  pageH: number,
  borrower: Borrower,
  audit: AuditEntry,
) {
  const startY = pageH - 150;
  pdf.setDrawColor(NAVY[0], NAVY[1], NAVY[2]);
  pdf.setLineWidth(0.6);
  pdf.line(36, startY, pageW - 36, startY);

  pdf.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('Signed by / تم التوقيع بواسطة', 36, startY + 16);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  const lines = [
    `Signer: ${borrower.signer.fullName}`,
    `National ID: ${borrower.signer.nationalId}`,
    `Mobile: ${borrower.signer.mobile}   Email: ${borrower.signer.email}`,
    `Signed at: ${formatDate(audit.signedAt)}`,
    `OTP hash: ${fakeSha(audit.otpUsed + ':' + audit.docId + ':' + borrower.id)}`,
  ];
  lines.forEach((l, i) => pdf.text(l, 36, startY + 32 + i * 12));

  if (audit.signatureDataUrl) {
    try {
      pdf.addImage(audit.signatureDataUrl, 'PNG', pageW - 196, startY + 14, 160, 70);
      pdf.setFontSize(8);
      pdf.setTextColor(120, 120, 120);
      pdf.text('Signature / التوقيع', pageW - 36, startY + 96, { align: 'right' });
    } catch {
      // ignore
    }
  }

  pdf.setDrawColor(200, 200, 200);
  pdf.line(36, pageH - 30, pageW - 36, pageH - 30);
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.text('© Jyad Capital — Internal Demo Only', 36, pageH - 16);
  pdf.text('DEMO DATA — NOT LEGALLY BINDING', pageW - 36, pageH - 16, { align: 'right' });
}

export async function renderContractPdf({ node, borrower, doc, audit }: RenderArgs): Promise<Blob> {
  if (typeof document !== 'undefined' && 'fonts' in document) {
    try {
      await (document as Document & { fonts: { ready: Promise<void> } }).fonts.ready;
    } catch {
      // ignore
    }
  }

  const canvas = await html2canvas(node, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
  });

  const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  const margin = 36;
  const headerH = 60;
  const footerReserve = 170;
  const availW = pageW - margin * 2;
  const availH = pageH - headerH - footerReserve - margin;

  const imgRatio = canvas.height / canvas.width;
  let drawW = availW;
  let drawH = drawW * imgRatio;
  if (drawH > availH) {
    drawH = availH;
    drawW = drawH / imgRatio;
  }

  const img = canvas.toDataURL('image/png');

  drawHeader(pdf, pageW, doc);
  pdf.addImage(
    img,
    'PNG',
    (pageW - drawW) / 2,
    headerH + 10,
    drawW,
    drawH,
    undefined,
    'FAST',
  );
  drawFooter(pdf, pageW, pageH, borrower, audit);
  drawWatermark(pdf, pageW, pageH);

  return pdf.output('blob');
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
}

export function pdfFilename(doc: ContractDoc, borrower: Borrower): string {
  return `${sanitize(doc.title)}__${sanitize(borrower.company.name)}.pdf`;
}
