import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Borrower, ContractDoc } from './types';

interface RenderArgs {
  node: HTMLElement;
  borrower: Borrower;
  doc: ContractDoc;
}

function sanitize(name: string): string {
  return name.replace(/[^\p{L}\p{N}\-_ ]+/gu, '').replace(/\s+/g, '_').slice(0, 80);
}

export async function renderContractPdf({ node, borrower: _borrower, doc: _doc }: RenderArgs): Promise<Blob> {
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

  const margin = 24;
  const availW = pageW - margin * 2;
  const availH = pageH - margin * 2;

  const imgRatio = canvas.height / canvas.width;
  let drawW = availW;
  let drawH = drawW * imgRatio;
  if (drawH > availH) {
    drawH = availH;
    drawW = drawH / imgRatio;
  }

  const img = canvas.toDataURL('image/png');
  const x = (pageW - drawW) / 2;
  const y = (pageH - drawH) / 2;
  pdf.addImage(img, 'PNG', x, y, drawW, drawH, undefined, 'FAST');

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
