import type { ReportsResponse, RevenueReport, SubPerformanceReport, LeadSourceROIReport } from '@/types/reports';
import {
  createPDFDocument,
  addSectionTitle,
  addMetricRow,
  addTable,
  savePDF,
  formatCurrency,
  formatPercent,
  type PDFOptions,
} from './pdf-generator';

/**
 * Generate Revenue Report PDF
 */
export function generateRevenueReportPDF(
  report: RevenueReport,
  dateRange: { start: string; end: string },
  download: boolean = true
): void {
  const options: PDFOptions = {
    title: 'Relatório de Receita',
    subtitle: 'PaintFlow',
    dateRange,
    orientation: 'portrait',
  };

  const doc = createPDFDocument(options);
  let yPos = 45;

  // Summary metrics
  yPos = addSectionTitle(doc, 'Resumo', yPos);
  yPos = addMetricRow(doc, [
    { 
      label: 'Receita Total', 
      value: formatCurrency(report.totalRevenue),
      change: `${report.percentChange > 0 ? '+' : ''}${formatPercent(report.percentChange)}`,
    },
    { 
      label: 'Trabalhos', 
      value: report.jobsCompleted.toString(),
    },
    { 
      label: 'Ticket Médio', 
      value: formatCurrency(report.avgJobValue),
    },
  ], yPos);

  yPos += 5;

  // Revenue by project type
  yPos = addSectionTitle(doc, 'Receita por Tipo de Projeto', yPos);
  yPos = addTable(
    doc,
    ['Tipo', 'Receita', '% do Total'],
    [
      [
        'Interior',
        formatCurrency(report.byProjectType.interior),
        formatPercent((report.byProjectType.interior / report.totalRevenue) * 100 || 0),
      ],
      [
        'Exterior',
        formatCurrency(report.byProjectType.exterior),
        formatPercent((report.byProjectType.exterior / report.totalRevenue) * 100 || 0),
      ],
      [
        'Ambos',
        formatCurrency(report.byProjectType.both),
        formatPercent((report.byProjectType.both / report.totalRevenue) * 100 || 0),
      ],
    ],
    yPos,
    {
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
      },
    }
  );

  // Daily data table (last 30 days max)
  if (report.dailyData.length > 0) {
    yPos = addSectionTitle(doc, 'Receita Diária', yPos);
    const dailyRows = report.dailyData.slice(-30).map((d) => [
      d.date,
      formatCurrency(d.revenue),
      d.jobCount.toString(),
    ]);
    yPos = addTable(
      doc,
      ['Data', 'Receita', 'Jobs'],
      dailyRows,
      yPos,
      {
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' },
        },
      }
    );
  }

  const filename = `relatorio-receita-${dateRange.start}-${dateRange.end}.pdf`;
  if (download) {
    savePDF(doc, filename);
  }
}

/**
 * Generate Subcontractor Performance Report PDF
 */
export function generateSubPerformanceReportPDF(
  report: SubPerformanceReport,
  dateRange: { start: string; end: string },
  download: boolean = true
): void {
  const options: PDFOptions = {
    title: 'Relatório de Performance - Subcontratados',
    subtitle: 'PaintFlow',
    dateRange,
    orientation: 'landscape',
  };

  const doc = createPDFDocument(options);
  let yPos = 45;

  // Summary metrics
  yPos = addSectionTitle(doc, 'Resumo', yPos);
  yPos = addMetricRow(doc, [
    { label: 'Total de Subs', value: report.summary.totalSubcontractors.toString() },
    { label: 'Ativos', value: report.summary.activeSubcontractors.toString() },
    { label: 'Margem Média', value: formatPercent(report.summary.avgProfitMargin) },
    { label: 'Pontualidade', value: formatPercent(report.summary.avgOnTimeRate) },
  ], yPos);

  yPos += 5;

  // Top performer highlight
  if (report.summary.topPerformer) {
    doc.setFontSize(10);
    doc.setTextColor(34, 197, 94);
    doc.text(
      `🏆 Top Performer: ${report.summary.topPerformer.name} (${formatPercent(report.summary.topPerformer.avgProfitMargin)} margem)`,
      15,
      yPos
    );
    doc.setTextColor(0);
    yPos += 10;
  }

  // Performance table
  yPos = addSectionTitle(doc, 'Performance Individual', yPos);
  const performanceRows = report.subcontractors.map((sub) => [
    sub.name,
    sub.companyName || '-',
    `${sub.completedJobs}/${sub.totalJobs}`,
    formatCurrency(sub.totalRevenue),
    formatPercent(sub.avgProfitMargin),
    formatPercent(sub.onTimeRate),
    sub.avgDaysToComplete ? sub.avgDaysToComplete.toFixed(1) : '-',
  ]);

  yPos = addTable(
    doc,
    ['Nome', 'Empresa', 'Jobs', 'Receita', 'Margem', 'Pontualidade', 'Dias/Job'],
    performanceRows,
    yPos,
    {
      columnStyles: {
        2: { halign: 'center' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right' },
      },
    }
  );

  const filename = `relatorio-subs-${dateRange.start}-${dateRange.end}.pdf`;
  if (download) {
    savePDF(doc, filename);
  }
}

/**
 * Generate Lead Source ROI Report PDF
 */
export function generateLeadROIReportPDF(
  report: LeadSourceROIReport,
  dateRange: { start: string; end: string },
  download: boolean = true
): void {
  const options: PDFOptions = {
    title: 'Relatório de ROI - Fontes de Lead',
    subtitle: 'PaintFlow',
    dateRange,
    orientation: 'landscape',
  };

  const doc = createPDFDocument(options);
  let yPos = 45;

  // Summary metrics
  yPos = addSectionTitle(doc, 'Resumo', yPos);
  yPos = addMetricRow(doc, [
    { label: 'Investimento Total', value: formatCurrency(report.summary.totalMarketingSpend) },
    { label: 'Receita Gerada', value: formatCurrency(report.summary.totalRevenue) },
    { label: 'Lucro Total', value: formatCurrency(report.summary.totalProfit) },
    { 
      label: 'ROI Geral', 
      value: formatPercent(report.summary.overallROI),
      change: report.summary.overallROI > 0 ? 'Positivo' : 'Negativo',
    },
  ], yPos);

  yPos += 5;

  // Best performers highlight
  if (report.summary.bestROISource) {
    doc.setFontSize(10);
    doc.text(
      `Melhor ROI: ${report.summary.bestROISource.label} (${formatPercent(report.summary.bestROISource.roi)})`,
      15,
      yPos
    );
    yPos += 6;
  }
  if (report.summary.bestConversionSource) {
    doc.text(
      `Melhor Conversão: ${report.summary.bestConversionSource.label} (${formatPercent(report.summary.bestConversionSource.conversionRate)})`,
      15,
      yPos
    );
    yPos += 10;
  }

  // ROI by source table
  yPos = addSectionTitle(doc, 'Performance por Fonte', yPos);
  const roiRows = report.sources.map((source) => [
    source.label,
    source.totalLeads.toString(),
    source.convertedLeads.toString(),
    formatPercent(source.conversionRate),
    formatCurrency(source.totalRevenue),
    formatCurrency(source.marketingSpend),
    formatPercent(source.roi),
    formatCurrency(source.costPerLead),
    formatCurrency(source.costPerAcquisition),
  ]);

  yPos = addTable(
    doc,
    ['Fonte', 'Leads', 'Conv.', 'Taxa', 'Receita', 'Investimento', 'ROI', 'CPL', 'CPA'],
    roiRows,
    yPos,
    {
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' },
        8: { halign: 'right' },
      },
    }
  );

  const filename = `relatorio-roi-${dateRange.start}-${dateRange.end}.pdf`;
  if (download) {
    savePDF(doc, filename);
  }
}

/**
 * Generate Full Reports PDF (all reports combined)
 */
export function generateFullReportPDF(
  data: ReportsResponse,
  download: boolean = true
): void {
  const dateRange = { start: data.dateRange.startDate, end: data.dateRange.endDate };
  
  const options: PDFOptions = {
    title: 'Relatório Completo',
    subtitle: 'PaintFlow Analytics',
    dateRange,
    orientation: 'landscape',
  };

  const doc = createPDFDocument(options);
  let yPos = 50;

  // Revenue Section
  yPos = addSectionTitle(doc, '📊 Receita', yPos);
  yPos = addMetricRow(doc, [
    { 
      label: 'Receita Total', 
      value: formatCurrency(data.revenue.totalRevenue),
      change: `${data.revenue.percentChange > 0 ? '+' : ''}${formatPercent(data.revenue.percentChange)}`,
    },
    { label: 'Trabalhos', value: data.revenue.jobsCompleted.toString() },
    { label: 'Ticket Médio', value: formatCurrency(data.revenue.avgJobValue) },
  ], yPos);

  // Sub Performance Section
  yPos = addSectionTitle(doc, '👥 Subcontratados', yPos + 5);
  yPos = addMetricRow(doc, [
    { label: 'Ativos', value: data.subPerformance.summary.activeSubcontractors.toString() },
    { label: 'Margem Média', value: formatPercent(data.subPerformance.summary.avgProfitMargin) },
    { label: 'Pontualidade', value: formatPercent(data.subPerformance.summary.avgOnTimeRate) },
  ], yPos);

  // Lead ROI Section
  yPos = addSectionTitle(doc, '🎯 Marketing ROI', yPos + 5);
  yPos = addMetricRow(doc, [
    { label: 'Investimento', value: formatCurrency(data.leadSourceROI.summary.totalMarketingSpend) },
    { label: 'Receita', value: formatCurrency(data.leadSourceROI.summary.totalRevenue) },
    { label: 'ROI Geral', value: formatPercent(data.leadSourceROI.summary.overallROI) },
  ], yPos);

  // Add page break for details
  doc.addPage();
  yPos = 20;

  // Top Subcontractors Table
  yPos = addSectionTitle(doc, 'Top 5 Subcontratados', yPos);
  const topSubs = data.subPerformance.subcontractors.slice(0, 5).map((sub) => [
    sub.name,
    formatCurrency(sub.totalRevenue),
    formatPercent(sub.avgProfitMargin),
    `${sub.completedJobs} jobs`,
  ]);
  yPos = addTable(doc, ['Nome', 'Receita', 'Margem', 'Jobs'], topSubs, yPos);

  // Lead Sources Table
  yPos = addSectionTitle(doc, 'Performance por Fonte de Lead', yPos);
  const leadSources = data.leadSourceROI.sources.map((source) => [
    source.label,
    source.totalLeads.toString(),
    formatPercent(source.conversionRate),
    formatCurrency(source.totalRevenue),
    formatPercent(source.roi),
  ]);
  yPos = addTable(doc, ['Fonte', 'Leads', 'Conversão', 'Receita', 'ROI'], leadSources, yPos);

  const filename = `relatorio-completo-${dateRange.start}-${dateRange.end}.pdf`;
  if (download) {
    savePDF(doc, filename);
  }
}
