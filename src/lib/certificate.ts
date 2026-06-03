import { jsPDF } from 'jspdf';

export function generateCertificatePdf(
  userName: string,
  courseName: string,
  issuedAt?: Date,
): void {
  const padding = 20;
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  doc.setFillColor(245, 245, 245);
  doc.rect(0, 0, 297, 210, 'F');
  doc.setLineWidth(2);
  doc.setDrawColor(40, 40, 40);
  doc.rect(padding, padding, 297 - 2 * padding, 210 - 2 * padding, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(40);
  doc.setTextColor(30, 30, 30);
  doc.text('Certificate of Completion', 148.5, 60, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(16);
  doc.text('This is to certify that', 148.5, 90, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(30);
  doc.text(userName || 'Student', 148.5, 110, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(16);
  doc.text('has successfully completed the course', 148.5, 130, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(50, 100, 200);
  const titleLines = doc.splitTextToSize(courseName, 200);
  doc.text(titleLines, 148.5, 150, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  const dateStr = issuedAt
    ? issuedAt.toLocaleDateString()
    : new Date().toLocaleDateString();
  doc.text(`Date of Completion: ${dateStr}`, 148.5, 175, { align: 'center' });

  doc.save(`Certificate_${courseName.replace(/\s+/g, '_')}.pdf`);
}
