import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
    lastAutoTable: {
      finalY: number;
    };
  }
}

export interface PDFOptions {
  title: string;
  subtitle?: string;
  dateRange?: { start: string; end: string };
  orientation?: 'portrait' | 'landscape';
  filename?: string;
}

/**
 * Create a new PDF document with header
 */
export function createPDFDocument(options: PDFOptions): jsPDF {
  const doc = new jsPDF({
    orientation: options.orientation || 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Add header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(options.title, pageWidth / 2, 20, { align: 'center' });
  
  // Add subtitle if provided
  if (options.subtitle) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(options.subtitle, pageWidth / 2, 28, { align: 'center' });
  }
  
  // Add date range if provided
  if (options.dateRange) {
    const dateRangeText = `Período: ${formatDate(options.dateRange.start)} - ${formatDate(options.dateRange.end)}`;
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(dateRangeText, pageWidth / 2, options.subtitle ? 35 : 28, { align: 'center' });
    doc.setTextColor(0);
  }
  
  // Add generation timestamp
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, pageWidth - 15, 10, { align: 'right' });
  doc.setTextColor(0);
  
  return doc;
}

/**
 * Format date string for display
 */
export function formatDate(dateStr: string): string {
  try {
    return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return dateStr;
  }
}

/**
 * Format currency value
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format percentage value
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Add a section title to the PDF
 */
export function addSectionTitle(doc: jsPDF, title: string, yPos: number): number {
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(50, 50, 50);
  doc.text(title, 15, yPos);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'normal');
  return yPos + 8;
}

/**
 * Add a metric card row to the PDF
 */
export function addMetricRow(
  doc: jsPDF,
  metrics: { label: string; value: string; change?: string }[],
  yPos: number
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const metricWidth = (pageWidth - 30) / metrics.length;
  
  metrics.forEach((metric, index) => {
    const xPos = 15 + (index * metricWidth);
    
    // Metric value
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(metric.value, xPos + metricWidth / 2, yPos, { align: 'center' });
    
    // Metric label
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(metric.label, xPos + metricWidth / 2, yPos + 6, { align: 'center' });
    
    // Change indicator
    if (metric.change) {
      doc.setFontSize(8);
      const isPositive = metric.change.startsWith('+');
      doc.setTextColor(isPositive ? 34 : 239, isPositive ? 197 : 68, isPositive ? 94 : 68);
      doc.text(metric.change, xPos + metricWidth / 2, yPos + 11, { align: 'center' });
    }
    
    doc.setTextColor(0);
  });
  
  return yPos + 20;
}

/**
 * Add a table to the PDF
 */
export function addTable(
  doc: jsPDF,
  headers: string[],
  data: (string | number)[][],
  yPos: number,
  options?: {
    columnStyles?: Record<number, { halign?: 'left' | 'center' | 'right'; cellWidth?: number }>;
  }
): number {
  autoTable(doc, {
    startY: yPos,
    head: [headers],
    body: data,
    theme: 'striped',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: options?.columnStyles || {},
    margin: { left: 15, right: 15 },
  });
  
  return doc.lastAutoTable.finalY + 10;
}

/**
 * Save the PDF document
 */
export function savePDF(doc: jsPDF, filename: string): void {
  doc.save(filename);
}

/**
 * Get PDF as blob URL
 */
export function getPDFBlobUrl(doc: jsPDF): string {
  return doc.output('bloburl').toString();
}
