'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Job, JobStatus } from '@/types';
import {
  formatCurrency,
  formatDate,
  getStatusColor,
  getProfitFlagColor,
} from '@/lib/utils/job-calculations';
import { MoreHorizontal, Eye, Edit, Trash2, FileText } from 'lucide-react';
import Link from 'next/link';

interface JobTableProps {
  jobs: Job[];
  onToggleDepositPaid: (jobId: string, value: boolean) => void;
  onToggleJobPaid: (jobId: string, value: boolean) => void;
  onToggleSalesCommissionPaid: (jobId: string, value: boolean) => void;
  onTogglePMCommissionPaid: (jobId: string, value: boolean) => void;
  onToggleSubPaid: (jobId: string, value: boolean) => void;
  onJobClick: (job: Job) => void;
  onDeleteJob?: (job: Job) => void;
}

const statusLabels: Record<JobStatus, string> = {
  lead: 'Lead',
  got_the_job: 'Fechado',
  scheduled: 'Agendado',
  completed: 'Concluído',
};

export function JobTable({
  jobs,
  onToggleDepositPaid,
  onToggleJobPaid,
  onToggleSalesCommissionPaid,
  onTogglePMCommissionPaid,
  onToggleSubPaid,
  onJobClick,
  onDeleteJob,
}: JobTableProps) {
  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="font-semibold">Cliente</TableHead>
              <TableHead className="font-semibold">Data</TableHead>
              <TableHead className="font-semibold text-right">Valor</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Vendedor</TableHead>
              <TableHead className="font-semibold">PM</TableHead>
              <TableHead className="font-semibold">Sub</TableHead>
              <TableHead className="font-semibold text-center">Depósito</TableHead>
              <TableHead className="font-semibold text-center">Pago</TableHead>
              <TableHead className="font-semibold text-right">Com. Vendas</TableHead>
              <TableHead className="font-semibold text-center">Pago</TableHead>
              <TableHead className="font-semibold text-right">Com. PM</TableHead>
              <TableHead className="font-semibold text-center">Pago</TableHead>
              <TableHead className="font-semibold text-right">Valor Sub</TableHead>
              <TableHead className="font-semibold text-center">Pago</TableHead>
              <TableHead className="font-semibold">Flag</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={job.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => onJobClick(job)}>
                <TableCell>
                  <div>
                    <p className="font-medium text-slate-900">{job.clientName}</p>
                    <p className="text-xs text-slate-500">{job.jobNumber}</p>
                  </div>
                </TableCell>
                <TableCell className="text-slate-600 text-sm">
                  {formatDate(job.jobDate)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(job.jobValue)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getStatusColor(job.status)}>
                    {statusLabels[job.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-slate-600">
                  {job.salesRep?.name || '-'}
                </TableCell>
                <TableCell className="text-sm text-slate-600">
                  {job.projectManager?.name || '-'}
                </TableCell>
                <TableCell className="text-sm text-slate-600">
                  {job.subcontractor?.name || '-'}
                </TableCell>
                <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={job.depositPaid}
                    onCheckedChange={(checked) =>
                      onToggleDepositPaid(job.id, checked as boolean)
                    }
                  />
                </TableCell>
                <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={job.jobPaid}
                    onCheckedChange={(checked) =>
                      onToggleJobPaid(job.id, checked as boolean)
                    }
                  />
                </TableCell>
                <TableCell className="text-right text-sm">
                  <div>
                    <p>{formatCurrency(job.salesCommissionAmount)}</p>
                    <p className="text-xs text-slate-400">{job.salesCommissionPct}%</p>
                  </div>
                </TableCell>
                <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={job.salesCommissionPaid}
                    onCheckedChange={(checked) =>
                      onToggleSalesCommissionPaid(job.id, checked as boolean)
                    }
                  />
                </TableCell>
                <TableCell className="text-right text-sm">
                  <div>
                    <p>{formatCurrency(job.pmCommissionAmount)}</p>
                    <p className="text-xs text-slate-400">{job.pmCommissionPct}%</p>
                  </div>
                </TableCell>
                <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={job.pmCommissionPaid}
                    onCheckedChange={(checked) =>
                      onTogglePMCommissionPaid(job.id, checked as boolean)
                    }
                  />
                </TableCell>
                <TableCell className="text-right text-sm font-medium">
                  {formatCurrency(job.subcontractorPrice)}
                </TableCell>
                <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={job.subcontractorPaid}
                    onCheckedChange={(checked) =>
                      onToggleSubPaid(job.id, checked as boolean)
                    }
                  />
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getProfitFlagColor(job.profitFlag)}>
                    {job.profitFlag}
                  </Badge>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/jobs/${job.id}`} className="gap-2">
                          <FileText className="h-4 w-4" />
                          Página do Job
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2" onClick={() => onJobClick(job)}>
                        <Eye className="h-4 w-4" />
                        Ver Detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2" onClick={() => onJobClick(job)}>
                        <Edit className="h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2 text-red-600"
                        onClick={() => onDeleteJob?.(job)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {jobs.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          Nenhum trabalho encontrado com os filtros selecionados.
        </div>
      )}
    </div>
  );
}
