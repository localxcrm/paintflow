import { Job, JobKPIs, BusinessSettings, JobStatus, PaymentStatus } from '@/types';

// Calculate job financials from job value
export function calculateJobFinancials(
  jobValue: number,
  settings: BusinessSettings,
  salesCommissionPct: number = 0,
  pmCommissionPct: number = 0
) {
  const subMaterials = jobValue * (settings.subMaterialsPct / 100);
  const subLabor = jobValue * (settings.subLaborPct / 100);
  const subTotal = jobValue * (settings.subPayoutPct / 100);
  const grossProfit = jobValue - subTotal;
  const grossMarginPct = jobValue > 0 ? (grossProfit / jobValue) * 100 : 0;
  const salesCommissionAmount = jobValue * (salesCommissionPct / 100);
  const pmCommissionAmount = jobValue * (pmCommissionPct / 100);
  const depositRequired = jobValue * (settings.defaultDepositPct / 100);

  // Determine profit flags
  const meetsMinGp = grossProfit >= settings.minGrossProfitPerJob;
  const meetsTargetGm = grossMarginPct >= settings.targetGrossMarginPct;

  let profitFlag: 'OK' | 'RAISE PRICE' | 'FIX SCOPE' = 'OK';
  if (!meetsMinGp) {
    profitFlag = 'RAISE PRICE';
  } else if (!meetsTargetGm) {
    profitFlag = 'FIX SCOPE';
  }

  return {
    subMaterials,
    subLabor,
    subTotal,
    grossProfit,
    grossMarginPct,
    salesCommissionAmount,
    pmCommissionAmount,
    depositRequired,
    meetsMinGp,
    meetsTargetGm,
    profitFlag,
  };
}

// Calculate KPIs from jobs array
export function calculateKPIs(jobs: Job[]): JobKPIs {
  const totalJobValue = jobs.reduce((sum, job) => sum + job.jobValue, 0);
  const totalGrossProfit = jobs.reduce((sum, job) => sum + job.grossProfit, 0);

  const salesCommissionsPending = jobs
    .filter(job => !job.salesCommissionPaid)
    .reduce((sum, job) => sum + job.salesCommissionAmount, 0);

  const salesCommissionsPaid = jobs
    .filter(job => job.salesCommissionPaid)
    .reduce((sum, job) => sum + job.salesCommissionAmount, 0);

  const pmCommissionsPending = jobs
    .filter(job => !job.pmCommissionPaid)
    .reduce((sum, job) => sum + job.pmCommissionAmount, 0);

  const pmCommissionsPaid = jobs
    .filter(job => job.pmCommissionPaid)
    .reduce((sum, job) => sum + job.pmCommissionAmount, 0);

  const subcontractorPending = jobs
    .filter(job => !job.subcontractorPaid)
    .reduce((sum, job) => sum + job.subcontractorPrice, 0);

  const subcontractorPaid = jobs
    .filter(job => job.subcontractorPaid)
    .reduce((sum, job) => sum + job.subcontractorPrice, 0);

  return {
    totalJobValue,
    averageJobValue: jobs.length > 0 ? totalJobValue / jobs.length : 0,
    jobCount: jobs.length,
    totalGrossProfit,
    salesCommissionsPending,
    salesCommissionsPaid,
    pmCommissionsPending,
    pmCommissionsPaid,
    subcontractorPending,
    subcontractorPaid,
  };
}

// Filter jobs by status
export function filterJobsByStatus(jobs: Job[], status: JobStatus | 'all'): Job[] {
  if (status === 'all') return jobs;
  return jobs.filter(job => job.status === status);
}

// Filter jobs by payment status
export function filterJobsByPaymentStatus(jobs: Job[], paymentStatus: PaymentStatus): Job[] {
  switch (paymentStatus) {
    case 'deposit_pending':
      return jobs.filter(job => !job.depositPaid);
    case 'job_unpaid':
      return jobs.filter(job => job.depositPaid && !job.jobPaid);
    case 'fully_paid':
      return jobs.filter(job => job.depositPaid && job.jobPaid);
    default:
      return jobs;
  }
}

// Filter jobs by sales rep
export function filterJobsBySalesRep(jobs: Job[], salesRepId: string | 'all'): Job[] {
  if (salesRepId === 'all') return jobs;
  return jobs.filter(job => job.salesRepId === salesRepId);
}

// Filter jobs by project manager
export function filterJobsByPM(jobs: Job[], pmId: string | 'all'): Job[] {
  if (pmId === 'all') return jobs;
  return jobs.filter(job => job.projectManagerId === pmId);
}

// Filter jobs by subcontractor
export function filterJobsBySubcontractor(jobs: Job[], subId: string | 'all'): Job[] {
  if (subId === 'all') return jobs;
  return jobs.filter(job => job.subcontractorId === subId);
}

// Get job value by status for chart
export function getJobValueByStatus(jobs: Job[]): { status: string; value: number; count: number }[] {
  const statusMap = new Map<JobStatus, { value: number; count: number }>();

  const statuses: JobStatus[] = ['lead', 'got_the_job', 'scheduled', 'completed'];
  statuses.forEach(status => {
    statusMap.set(status, { value: 0, count: 0 });
  });

  jobs.forEach(job => {
    const current = statusMap.get(job.status) || { value: 0, count: 0 };
    statusMap.set(job.status, {
      value: current.value + job.jobValue,
      count: current.count + 1,
    });
  });

  const statusLabels: Record<JobStatus, string> = {
    lead: 'Lead',
    got_the_job: 'Got the Job',
    scheduled: 'Scheduled',
    completed: 'Completed',
  };

  return statuses.map(status => ({
    status: statusLabels[status],
    value: statusMap.get(status)?.value || 0,
    count: statusMap.get(status)?.count || 0,
  }));
}

// Get jobs distribution for pie chart
export function getJobsDistribution(jobs: Job[]): { name: string; value: number; fill: string }[] {
  const statusColors: Record<JobStatus, string> = {
    lead: '#94a3b8', // Gray
    got_the_job: '#3b82f6', // Blue
    scheduled: '#eab308', // Yellow
    completed: '#22c55e', // Green
  };

  const statusLabels: Record<JobStatus, string> = {
    lead: 'Lead',
    got_the_job: 'Got the Job',
    scheduled: 'Scheduled',
    completed: 'Completed',
  };

  const counts = new Map<JobStatus, number>();
  jobs.forEach(job => {
    counts.set(job.status, (counts.get(job.status) || 0) + 1);
  });

  return (Object.keys(statusLabels) as JobStatus[]).map(status => ({
    name: statusLabels[status],
    value: counts.get(status) || 0,
    fill: statusColors[status],
  }));
}

// Format currency
export function formatCurrency(amount: number, compact = false): string {
  if (compact && amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (compact && amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format date
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Get status badge color
export function getStatusColor(status: JobStatus): string {
  const colors: Record<JobStatus, string> = {
    lead: 'bg-slate-100 text-slate-800',
    got_the_job: 'bg-blue-100 text-blue-800',
    scheduled: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
  };
  return colors[status];
}

// Get profit flag color
export function getProfitFlagColor(flag: 'OK' | 'RAISE PRICE' | 'FIX SCOPE'): string {
  const colors = {
    'OK': 'bg-green-100 text-green-800',
    'RAISE PRICE': 'bg-red-100 text-red-800',
    'FIX SCOPE': 'bg-yellow-100 text-yellow-800',
  };
  return colors[flag];
}

// Get payment status color
export function getPaymentStatusColor(depositPaid: boolean, jobPaid: boolean): string {
  if (jobPaid) return 'bg-green-100 text-green-800';
  if (depositPaid) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
}

// Get payment status label
export function getPaymentStatusLabel(depositPaid: boolean, jobPaid: boolean): string {
  if (jobPaid) return 'Paid';
  if (depositPaid) return 'Deposit Paid';
  return 'Unpaid';
}
