'use client';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Job } from '@/types';
import { formatCurrency } from '@/lib/utils/job-calculations';

interface JobDeleteDialogProps {
    job: Job | null;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (jobId: string) => void;
}

export function JobDeleteDialog({
    job,
    isOpen,
    onClose,
    onConfirm,
}: JobDeleteDialogProps) {
    if (!job) return null;

    const handleConfirm = () => {
        onConfirm(job.id);
        onClose();
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Excluir Trabalho?</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                        <p>
                            Você tem certeza que deseja excluir este trabalho? Esta ação não pode ser desfeita.
                        </p>
                        <div className="mt-4 p-3 bg-slate-100 rounded-lg">
                            <p className="font-semibold text-slate-900">{job.clientName}</p>
                            <p className="text-sm text-slate-600">{job.jobNumber}</p>
                            <p className="text-sm text-slate-600">{job.address}, {job.city}</p>
                            <p className="text-lg font-bold text-slate-900 mt-2">
                                {formatCurrency(job.jobValue)}
                            </p>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        Excluir
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
