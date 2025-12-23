'use client';

import { useState, useMemo } from 'react';
import { mockJobs, mockTeamMembers, mockSubcontractors } from '@/lib/mock-data';
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
import { Job, JobStatus, PaymentStatus } from '@/types';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function JobsPage() {
  // Filter state
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all');
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus>('all');
  const [salesRepFilter, setSalesRepFilter] = useState<string>('all');
  const [pmFilter, setPmFilter] = useState<string>('all');
  const [subcontractorFilter, setSubcontractorFilter] = useState<string>('all');

  // Jobs state (for inline editing)
  const [jobs, setJobs] = useState<Job[]>(mockJobs);

  // Modal states
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);

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

  // Toggle handlers for checkboxes
  const handleToggleDepositPaid = (jobId: string, value: boolean) => {
    setJobs(prev =>
      prev.map(job =>
        job.id === jobId
          ? { ...job, depositPaid: value, balanceDue: value ? job.jobValue - job.depositRequired : job.jobValue }
          : job
      )
    );
  };

  const handleToggleJobPaid = (jobId: string, value: boolean) => {
    setJobs(prev =>
      prev.map(job =>
        job.id === jobId
          ? { ...job, jobPaid: value, balanceDue: value ? 0 : job.jobValue - (job.depositPaid ? job.depositRequired : 0) }
          : job
      )
    );
  };

  const handleToggleSalesCommissionPaid = (jobId: string, value: boolean) => {
    setJobs(prev =>
      prev.map(job =>
        job.id === jobId ? { ...job, salesCommissionPaid: value } : job
      )
    );
  };

  const handleTogglePMCommissionPaid = (jobId: string, value: boolean) => {
    setJobs(prev =>
      prev.map(job =>
        job.id === jobId ? { ...job, pmCommissionPaid: value } : job
      )
    );
  };

  const handleToggleSubPaid = (jobId: string, value: boolean) => {
    setJobs(prev =>
      prev.map(job =>
        job.id === jobId ? { ...job, subcontractorPaid: value } : job
      )
    );
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

  const handleCreateJob = (newJob: Job) => {
    setJobs(prev => [newJob, ...prev]);
    toast.success('Trabalho criado com sucesso!');
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

  const handleConfirmDelete = (jobId: string) => {
    setJobs(prev => prev.filter(job => job.id !== jobId));
    toast.success('Trabalho excluído com sucesso!');
  };

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
            teamMembers={mockTeamMembers}
            subcontractors={mockSubcontractors}
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
        teamMembers={mockTeamMembers}
        subcontractors={mockSubcontractors}
      />

      {/* Job Create Modal */}
      <JobCreateModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onCreate={handleCreateJob}
        teamMembers={mockTeamMembers}
        subcontractors={mockSubcontractors}
      />

      {/* Job Delete Dialog */}
      <JobDeleteDialog
        job={jobToDelete}
        isOpen={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
