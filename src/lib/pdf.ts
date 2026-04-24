import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { AuditEntry, Borrower, ContractDoc } from './types';

function fakeOtpHash(otp: string): string {
  let h = 0;
  for (let i = 0; i < otp.length; i++) {
    h = (h << 5) - h + otp.charCodeAt(i);
    h |= 0;
  }
  const hex = (h >>> 0).toString(16).padStart(8, '0');
  return `sha256:demo:${hex}${hex}${hex}${hex}`.slice(0, 24);
}

export function sanitizeFilename(s: string): string {
  return s
    .replace(/[\/\\?%*:|"<>]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 80);
}

export async function renderContractPdf(opts: {
  node: HTMLElement;
  borrower: Borrower;
  doc: ContractDoc;
  audit: AuditEntry;
}): Promise<Blob> {
  const { node, borrower, doc, audit } = opts;

  try {
    if ('fonts' in document) {
      await (document as Document & { fonts: { ready: Promise<void> } }).fonts.ready;
    }
  } catch {
    // non-critical
  }

  const canvas = await html2canvas(node, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const margin = 28;
  const headerHeight = 60;
  const footerHeight = 110;

  pdf.setFillColor(11, 37, 69);
  pdf.rect(0, 0, pageWidth, headerHeight, 'F');
  pdf.setTextColor(201, 169, 97);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.text('JYAD CAPITAL', pageWidth - margin, 26, { align: 'right' });
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text('Internal Signing Platform — DEMO', pageWidth - margin, 44, { align: 'right' });
  pdf.setFontSize(8);
  pdf.text(`Doc ID: ${doc.id}`, margin, 26);
  pdf.text(`Phase ${doc.phase}`, margin, 44);

  const imgMaxWidth = pageWidth - margin * 2;
  const imgMaxHeight = pageHeight - headerHeight - footerHeight - margin;
  const ratio = Math.min(imgMaxWidth / canvas.width, imgMaxHeight / canvas.height);
  const imgW = canvas.width * ratio;
  const imgH = canvas.height * ratio;
  const imgX = (pageWidth - imgW) / 2;
  const imgY = headerHeight + 12;
  pdf.addImage(imgData, 'PNG', imgX, imgY, imgW, imgH, undefined, 'FAST');

  const footerTop = pageHeight - footerHeight;
  pdf.setDrawColor(229, 231, 235);
  pdf.line(margin, footerTop, pageWidth - margin, footerTop);

  pdf.setFontSize(9);
  pdf.setTextColor(11, 37, 69);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Signer / الموقّع', pageWidth - margin, footerTop + 16, { align: 'right' });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text(`Name: ${borrower.signer.fullName}`, pageWidth - margin, footerTop + 30, { align: 'right' });
  pdf.text(`National ID: ${borrower.signer.nationalId}`, pageWidth - margin, footerTop + 42, { align: 'right' });
  pdf.text(`Mobile: ${borrower.signer.mobile}  |  Email: ${borrower.signer.email}`, pageWidth - margin, footerTop + 54, { align: 'right' });
  pdf.text(`Signed at: ${new Date(audit.signedAt).toLocaleString('en-GB')}`, pageWidth - margin, footerTop + 66, { align: 'right' });
  pdf.text(`OTP hash: ${fakeOtpHash(audit.otpUsed)}`, pageWidth - margin, footerTop + 78, { align: 'right' });

  if (audit.signatureDataUrl) {
    try {
      pdf.addImage(audit.signatureDataUrl, 'PNG', margin, footerTop + 14, 160, 60);
      pdf.setFontSize(7);
      pdf.setTextColor(107, 114, 128);
      pdf.text('Signature', margin, footerTop + 84);
    } catch {
      // signature rendering is non-critical
    }
  }

  pdf.setTextColor(220, 38, 38);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(48);
  pdf.text('DEMO — NOT LEGALLY BINDING', pageWidth / 2, pageHeight / 2, {
    align: 'center',
    angle: 30,
  });

  return pdf.output('blob');
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
