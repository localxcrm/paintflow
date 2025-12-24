'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  JobKPICards,
  JobFilters,
  JobCharts,
  JobTable,
  JobCreateModal,
  JobDeleteDialog,
  JobKanban,
  JobCalendar,
  JobMapView,
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
import { Plus, Loader2, List, Calendar, MapPin, Columns } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentState {
  isOpen: boolean;
  type: PaymentDialogType;
  jobId: string;
  amount: number;
  recipientName?: string;
}

export default function JobsPage() {
  const router = useRouter();

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

  // Helper to update payment status via API
  const updatePaymentStatus = async (jobId: string, payload: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to update');

      const updatedJob = await res.json();
      setJobs(prev =>
        prev.map(j => j.id === jobId ? { ...j, ...updatedJob } : j)
      );
      return true;
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Erro ao atualizar pagamento');
      return false;
    }
  };

  // Open payment dialog instead of toggling directly
  const handleToggleDepositPaid = async (jobId: string, value: boolean) => {
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
      const job = jobs.find(j => j.id === jobId);
      if (job) {
        await updatePaymentStatus(jobId, {
          depositPaid: false,
          depositPaymentMethod: null,
          depositPaymentDate: null,
          balanceDue: job.jobValue,
        });
      }
    }
  };

  const handleToggleJobPaid = async (jobId: string, value: boolean) => {
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
      const job = jobs.find(j => j.id === jobId);
      if (job) {
        await updatePaymentStatus(jobId, {
          jobPaid: false,
          jobPaymentMethod: null,
          jobPaymentDate: null,
          balanceDue: job.jobValue - (job.depositPaid ? job.depositRequired : 0),
        });
      }
    }
  };

  const handleToggleSalesCommissionPaid = async (jobId: string, value: boolean) => {
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
      await updatePaymentStatus(jobId, { salesCommissionPaid: false });
    }
  };

  const handleTogglePMCommissionPaid = async (jobId: string, value: boolean) => {
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
      await updatePaymentStatus(jobId, { pmCommissionPaid: false });
    }
  };

  const handleToggleSubPaid = async (jobId: string, value: boolean) => {
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
      await updatePaymentStatus(jobId, { subcontractorPaid: false });
    }
  };

  // Handle payment confirmation
  const handlePaymentConfirm = async (data: PaymentDialogData) => {
    const { jobId, type } = paymentState;
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

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

    // Build update payload based on payment type
    let updatePayload: Record<string, unknown> = {
      paymentHistory: updatedHistory,
    };

    switch (type) {
      case 'deposit':
        updatePayload = {
          ...updatePayload,
          depositPaid: true,
          depositPaymentMethod: data.method,
          depositPaymentDate: data.date,
          balanceDue: job.jobValue - job.depositRequired,
        };
        break;
      case 'job_payment':
        updatePayload = {
          ...updatePayload,
          jobPaid: true,
          jobPaymentMethod: data.method,
          jobPaymentDate: data.date,
          balanceDue: 0,
        };
        break;
      case 'sales_commission':
        updatePayload = {
          ...updatePayload,
          salesCommissionPaid: true,
        };
        break;
      case 'pm_commission':
        updatePayload = {
          ...updatePayload,
          pmCommissionPaid: true,
        };
        break;
      case 'subcontractor':
        updatePayload = {
          ...updatePayload,
          subcontractorPaid: true,
        };
        break;
    }

    try {
      // Persist to backend
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });

      if (!res.ok) {
        throw new Error('Failed to save payment');
      }

      const updatedJob = await res.json();

      // Update local state with response from server
      setJobs(prev =>
        prev.map(j => j.id === jobId ? { ...j, ...updatedJob } : j)
      );

      setPaymentState(prev => ({ ...prev, isOpen: false }));
      toast.success('Pagamento registrado com sucesso!');
    } catch (error) {
      console.error('Error saving payment:', error);
      toast.error('Erro ao salvar pagamento. Tente novamente.');
    }
  };

  // Navigate to job detail page
  const handleJobClick = (job: Job) => {
    router.push(`/jobs/${job.id}`);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Job Manager</h1>
          <p className="text-slate-500">Track jobs, payments, and commissions</p>
        </div>
        <Button className="gap-2 whitespace-nowrap" onClick={handleOpenCreateModal}>
          <Plus className="h-4 w-4" />
          New Job
        </Button>
      </div>

      {/* KPI Cards */}
      <JobKPICards kpis={kpis} />

      {/* Charts */}
      <JobCharts valueByStatus={valueByStatus} distribution={distribution} />

      {/* Tabs for different views */}
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
          <TabsTrigger value="list" className="gap-2">
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">List</span>
          </TabsTrigger>
          <TabsTrigger value="kanban" className="gap-2">
            <Columns className="h-4 w-4" />
            <span className="hidden sm:inline">Kanban</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Calendar</span>
          </TabsTrigger>
          <TabsTrigger value="map" className="gap-2">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Map</span>
          </TabsTrigger>
        </TabsList>

        {/* List View */}
        <TabsContent value="list" className="space-y-4">
          {/* Filters */}
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

          {/* Data Table */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                All Jobs ({filteredJobs.length})
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
        </TabsContent>

        {/* Kanban View */}
        <TabsContent value="kanban">
          <JobKanban jobs={filteredJobs} onJobClick={handleJobClick} />
        </TabsContent>

        {/* Calendar View */}
        <TabsContent value="calendar">
          <JobCalendar
            jobs={jobs}
            subcontractors={subcontractors}
            onJobClick={handleJobClick}
          />
        </TabsContent>

        {/* Map View */}
        <TabsContent value="map">
          <JobMapView jobs={jobs} subcontractors={subcontractors} />
        </TabsContent>
      </Tabs>

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
