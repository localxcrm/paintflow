'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  JobKPICards,
  JobFilters,
  JobCharts,
  JobTable,
  JobDetailModal,
  JobCreateModal,
  JobDeleteDialog
} from '@/components/jobs';
import { PaymentDialog, PaymentDialogType, PaymentDialogData } from '@/components/jobs/payment-dialog';
import {
  calculateKPIs,
  filterJobsByStatus,
  filterJobsByPaymentStatus,
  filterJobsBySalesRep,
  filterJobsByPM,
  filterJobsBySubcontractor,
  getJobValueByStatus,
  getJobsDistribution,
} from '@/lib/utils/job-calculations';
import { Job, JobStatus, PaymentStatus, PaymentHistoryItem, TeamMember, Subcontractor } from '@/types';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentState {
  isOpen: boolean;
  type: PaymentDialogType;
  jobId: string;
  amount: number;
  recipientName?: string;
}

export default function JobsPage() {
  // Data state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all');
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus>('all');
  const [salesRepFilter, setSalesRepFilter] = useState<string>('all');
  const [pmFilter, setPmFilter] = useState<string>('all');
  const [subcontractorFilter, setSubcontractorFilter] = useState<string>('all');

  // Modal states
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);

  // Payment dialog state
  const [paymentState, setPaymentState] = useState<PaymentState>({
    isOpen: false,
    type: 'deposit',
    jobId: '',
    amount: 0,
  });

  // Load data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [jobsRes, teamRes, subsRes] = await Promise.all([
        fetch('/api/jobs'),
        fetch('/api/team'),
        fetch('/api/subcontractors')
      ]);

      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        // Transform the data to match our Job type
        const transformedJobs = (jobsData.jobs || []).map((job: Record<string, unknown>) => ({
          ...job,
          salesRep: job.salesRep || null,
          projectManager: job.projectManager || null,
          subcontractor: job.Subcontractor || null,
        }));
        setJobs(transformedJobs);
      }

      if (teamRes.ok) {
        const teamData = await teamRes.json();
        setTeamMembers(teamData.teamMembers || []);
      }

      if (subsRes.ok) {
        const subsData = await subsRes.json();
        setSubcontractors(subsData.subcontractors || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters
  const filteredJobs = useMemo(() => {
    let result = jobs;
    result = filterJobsByStatus(result, statusFilter);
    result = filterJobsByPaymentStatus(result, paymentFilter);
    result = filterJobsBySalesRep(result, salesRepFilter);
    result = filterJobsByPM(result, pmFilter);
    result = filterJobsBySubcontractor(result, subcontractorFilter);
    return result;
  }, [jobs, statusFilter, paymentFilter, salesRepFilter, pmFilter, subcontractorFilter]);

  // Calculate KPIs from filtered jobs
  const kpis = useMemo(() => calculateKPIs(filteredJobs), [filteredJobs]);

  // Chart data
  const valueByStatus = useMemo(() => getJobValueByStatus(filteredJobs), [filteredJobs]);
  const distribution = useMemo(() => getJobsDistribution(filteredJobs), [filteredJobs]);

  // Clear all filters
  const clearFilters = () => {
    setStatusFilter('all');
    setPaymentFilter('all');
    setSalesRepFilter('all');
    setPmFilter('all');
    setSubcontractorFilter('all');
  };

  // Open payment dialog instead of toggling directly
  const handleToggleDepositPaid = (jobId: string, value: boolean) => {
    if (value) {
      const job = jobs.find(j => j.id === jobId);
      if (job) {
        setPaymentState({
          isOpen: true,
          type: 'deposit',
          jobId,
          amount: job.depositRequired,
          recipientName: job.clientName,
        });
      }
    } else {
      setJobs(prev =>
        prev.map(job =>
          job.id === jobId
            ? { ...job, depositPaid: false, balanceDue: job.jobValue }
            : job
        )
      );
    }
  };

  const handleToggleJobPaid = (jobId: string, value: boolean) => {
    if (value) {
      const job = jobs.find(j => j.id === jobId);
      if (job) {
        setPaymentState({
          isOpen: true,
          type: 'job_payment',
          jobId,
          amount: job.balanceDue,
          recipientName: job.clientName,
        });
      }
    } else {
      setJobs(prev =>
        prev.map(job =>
          job.id === jobId
            ? { ...job, jobPaid: false, balanceDue: job.jobValue - (job.depositPaid ? job.depositRequired : 0) }
            : job
        )
      );
    }
  };

  const handleToggleSalesCommissionPaid = (jobId: string, value: boolean) => {
    if (value) {
      const job = jobs.find(j => j.id === jobId);
      if (job) {
        setPaymentState({
          isOpen: true,
          type: 'sales_commission',
          jobId,
          amount: job.salesCommissionAmount,
          recipientName: job.salesRep?.name,
        });
      }
    } else {
      setJobs(prev =>
        prev.map(job =>
          job.id === jobId ? { ...job, salesCommissionPaid: false } : job
        )
      );
    }
  };

  const handleTogglePMCommissionPaid = (jobId: string, value: boolean) => {
    if (value) {
      const job = jobs.find(j => j.id === jobId);
      if (job) {
        setPaymentState({
          isOpen: true,
          type: 'pm_commission',
          jobId,
          amount: job.pmCommissionAmount,
          recipientName: job.projectManager?.name,
        });
      }
    } else {
      setJobs(prev =>
        prev.map(job =>
          job.id === jobId ? { ...job, pmCommissionPaid: false } : job
        )
      );
    }
  };

  const handleToggleSubPaid = (jobId: string, value: boolean) => {
    if (value) {
      const job = jobs.find(j => j.id === jobId);
      if (job) {
        setPaymentState({
          isOpen: true,
          type: 'subcontractor',
          jobId,
          amount: job.subcontractorPrice,
          recipientName: job.subcontractor?.name,
        });
      }
    } else {
      setJobs(prev =>
        prev.map(job =>
          job.id === jobId ? { ...job, subcontractorPaid: false } : job
        )
      );
    }
  };

  // Handle payment confirmation
  const handlePaymentConfirm = (data: PaymentDialogData) => {
    const { jobId, type } = paymentState;

    setJobs(prev =>
      prev.map(job => {
        if (job.id !== jobId) return job;

        // Create payment history entry
        const historyEntry: PaymentHistoryItem = {
          id: Date.now().toString(),
          date: data.date,
          type: type === 'deposit' ? 'deposit' :
            type === 'job_payment' ? 'final_payment' :
              type === 'sales_commission' ? 'sales_commission' :
                type === 'pm_commission' ? 'pm_commission' : 'subcontractor',
          method: data.method,
          amount: paymentState.amount,
          notes: data.notes,
        };

        const updatedHistory = [...(job.paymentHistory || []), historyEntry];

        switch (type) {
          case 'deposit':
            return {
              ...job,
              depositPaid: true,
              depositPaymentMethod: data.method,
              depositPaymentDate: data.date,
              balanceDue: job.jobValue - job.depositRequired,
              paymentHistory: updatedHistory,
            };
          case 'job_payment':
            return {
              ...job,
              jobPaid: true,
              jobPaymentMethod: data.method,
              jobPaymentDate: data.date,
              balanceDue: 0,
              paymentHistory: updatedHistory,
            };
          case 'sales_commission':
            return {
              ...job,
              salesCommissionPaid: true,
              paymentHistory: updatedHistory,
            };
          case 'pm_commission':
            return {
              ...job,
              pmCommissionPaid: true,
              paymentHistory: updatedHistory,
            };
          case 'subcontractor':
            return {
              ...job,
              subcontractorPaid: true,
              paymentHistory: updatedHistory,
            };
          default:
            return job;
        }
      })
    );

    setPaymentState(prev => ({ ...prev, isOpen: false }));
    toast.success('Pagamento registrado com sucesso!');
  };

  // Detail Modal handlers
  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedJob(null);
  };

  const handleSaveJob = (updatedJob: Job) => {
    setJobs(prev =>
      prev.map(job =>
        job.id === updatedJob.id ? updatedJob : job
      )
    );
  };

  // Create Modal handlers
  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleCreateJob = async (newJob: Job) => {
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newJob),
      });

      if (res.ok) {
        const createdJob = await res.json();
        setJobs(prev => [createdJob, ...prev]);
        toast.success('Trabalho criado com sucesso!');
      } else {
        toast.error('Erro ao criar trabalho');
      }
    } catch (error) {
      console.error('Error creating job:', error);
      toast.error('Erro ao criar trabalho');
    }
  };

  // Delete handlers
  const handleDeleteClick = (job: Job) => {
    setJobToDelete(job);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setJobToDelete(null);
  };

  const handleConfirmDelete = async (jobId: string) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setJobs(prev => prev.filter(job => job.id !== jobId));
        toast.success('Trabalho excluído com sucesso!');
      } else {
        toast.error('Erro ao excluir trabalho');
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      toast.error('Erro ao excluir trabalho');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Carregando trabalhos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Gerenciador de Trabalhos</h1>
        <p className="text-slate-500">Acompanhe trabalhos, pagamentos e comissões</p>
      </div>

      {/* KPI Cards */}
      <JobKPICards kpis={kpis} />

      {/* Charts */}
      <JobCharts valueByStatus={valueByStatus} distribution={distribution} />

      {/* Filters + New Job Button */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex-1">
          <JobFilters
            statusFilter={statusFilter}
            paymentFilter={paymentFilter}
            salesRepFilter={salesRepFilter}
            pmFilter={pmFilter}
            subcontractorFilter={subcontractorFilter}
            teamMembers={teamMembers}
            subcontractors={subcontractors}
            onStatusChange={setStatusFilter}
            onPaymentChange={setPaymentFilter}
            onSalesRepChange={setSalesRepFilter}
            onPMChange={setPmFilter}
            onSubcontractorChange={setSubcontractorFilter}
            onClearFilters={clearFilters}
          />
        </div>
        <Button className="gap-2 whitespace-nowrap" onClick={handleOpenCreateModal}>
          <Plus className="h-4 w-4" />
          Novo Trabalho
        </Button>
      </div>

      {/* Data Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Todos os Trabalhos ({filteredJobs.length})
          </h2>
        </div>
        <JobTable
          jobs={filteredJobs}
          onToggleDepositPaid={handleToggleDepositPaid}
          onToggleJobPaid={handleToggleJobPaid}
          onToggleSalesCommissionPaid={handleToggleSalesCommissionPaid}
          onTogglePMCommissionPaid={handleTogglePMCommissionPaid}
          onToggleSubPaid={handleToggleSubPaid}
          onJobClick={handleJobClick}
          onDeleteJob={handleDeleteClick}
        />
      </div>

      {/* Job Detail Modal */}
      <JobDetailModal
        job={selectedJob}
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        onSave={handleSaveJob}
        teamMembers={teamMembers}
        subcontractors={subcontractors}
      />

      {/* Job Create Modal */}
      <JobCreateModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onCreate={handleCreateJob}
        teamMembers={teamMembers}
        subcontractors={subcontractors}
      />

      {/* Job Delete Dialog */}
      <JobDeleteDialog
        job={jobToDelete}
        isOpen={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
      />

      {/* Payment Dialog */}
      <PaymentDialog
        isOpen={paymentState.isOpen}
        onClose={() => setPaymentState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handlePaymentConfirm}
        type={paymentState.type}
        amount={paymentState.amount}
        recipientName={paymentState.recipientName}
      />
    </div>
  );
}
