'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Job, JobStatus, ProjectType, TeamMember, Subcontractor } from '@/types';
import { Save, X, User, DollarSign, Building } from 'lucide-react';
import { AddressAutocomplete, AddressResult } from '@/components/address-autocomplete';
import { US_STATES } from '@/lib/constants';

interface JobCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (job: Job) => void;
    teamMembers: TeamMember[];
    subcontractors: Subcontractor[];
}

export function JobCreateModal({
    isOpen,
    onClose,
    onCreate,
    teamMembers,
    subcontractors,
}: JobCreateModalProps) {
    const [formData, setFormData] = useState({
        clientName: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        projectType: 'interior' as ProjectType,
        status: 'lead' as JobStatus,
        jobValue: 0,
        scheduledStartDate: '',
        scheduledEndDate: '',
        salesRepId: '',
        projectManagerId: '',
        subcontractorId: '',
        notes: '',
    });

    const handleAddressSelect = (addr: AddressResult) => {
        setFormData((prev) => ({
            ...prev,
            address: addr.street || addr.display.split(',')[0],
            city: addr.city,
            state: addr.state,
            zipCode: addr.zipCode || '',
        }));
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const salesReps = teamMembers.filter(m => m.role === 'sales' || m.role === 'both');
    const pms = teamMembers.filter(m => m.role === 'pm' || m.role === 'both');

    const handleSubmit = () => {
        if (!formData.clientName.trim()) {
            return;
        }

        setIsSubmitting(true);

        const salesRep = teamMembers.find(m => m.id === formData.salesRepId);
        const pm = teamMembers.find(m => m.id === formData.projectManagerId);
        const sub = subcontractors.find(s => s.id === formData.subcontractorId);

        const salesCommissionPct = salesRep?.defaultCommissionPct || 5;
        const pmCommissionPct = pm?.defaultCommissionPct || 3;
        const subPayoutPct = sub?.defaultPayoutPct || 60;

        const jobValue = formData.jobValue;
        const depositRequired = jobValue * 0.30;
        const subTotal = jobValue * 0.60;
        const grossProfit = jobValue - subTotal;

        // eslint-disable-next-line react-hooks/purity
        const timestamp = Date.now();
        const newJob: Job = {
            id: timestamp.toString(),
            jobNumber: `JOB-${timestamp.toString().slice(-6)}`,
            clientName: formData.clientName,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
            projectType: formData.projectType,
            status: formData.status,
            jobDate: new Date().toISOString().split('T')[0],
            scheduledStartDate: formData.scheduledStartDate,
            scheduledEndDate: formData.scheduledEndDate,
            jobValue,
            subMaterials: jobValue * 0.15,
            subLabor: jobValue * 0.45,
            subTotal,
            grossProfit,
            grossMarginPct: 40,
            salesRepId: formData.salesRepId || undefined,
            salesRep,
            projectManagerId: formData.projectManagerId || undefined,
            projectManager: pm,
            subcontractorId: formData.subcontractorId || undefined,
            subcontractor: sub,
            depositRequired,
            depositPaid: false,
            jobPaid: false,
            balanceDue: jobValue,
            salesCommissionPct,
            salesCommissionAmount: jobValue * (salesCommissionPct / 100),
            salesCommissionPaid: false,
            pmCommissionPct,
            pmCommissionAmount: jobValue * (pmCommissionPct / 100),
            pmCommissionPaid: false,
            subcontractorPrice: jobValue * (subPayoutPct / 100),
            subcontractorPaid: false,
            meetsMinGp: grossProfit >= 900,
            meetsTargetGm: true,
            profitFlag: grossProfit >= 900 ? 'OK' : 'RAISE PRICE',
            notes: formData.notes,
            photos: [],
            paymentHistory: [],
        };

        onCreate(newJob);
        setIsSubmitting(false);
        resetForm();
        onClose();
    };

    const resetForm = () => {
        setFormData({
            clientName: '',
            address: '',
            city: '',
            state: '',
            zipCode: '',
            projectType: 'interior',
            status: 'lead',
            jobValue: 0,
            scheduledStartDate: '',
            scheduledEndDate: '',
            salesRepId: '',
            projectManagerId: '',
            subcontractorId: '',
            notes: '',
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Novo Trabalho</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Client Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="clientName" className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Nome do Cliente *
                            </Label>
                            <Input
                                id="clientName"
                                value={formData.clientName}
                                onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                                placeholder="Ex: João Silva"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="jobValue" className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                Valor do Trabalho *
                            </Label>
                            <Input
                                id="jobValue"
                                type="number"
                                value={formData.jobValue || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, jobValue: parseFloat(e.target.value) || 0 }))}
                                placeholder="0.00"
                            />
                        </div>

                        <div className="col-span-2 space-y-2">
                            <Label htmlFor="address">
                                Endereço
                            </Label>
                            <AddressAutocomplete
                                value={formData.address}
                                onAddressSelect={handleAddressSelect}
                                onChange={(value) => setFormData(prev => ({ ...prev, address: value }))}
                                placeholder="Digite o endereço..."
                            />
                        </div>
                    </div>

                    {/* Address Details */}
                    <div className="grid grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="city" className="flex items-center gap-2">
                                <Building className="h-4 w-4" />
                                Cidade
                            </Label>
                            <Input
                                id="city"
                                value={formData.city}
                                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                                placeholder="Cidade"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="state">Estado</Label>
                            <Select
                                value={formData.state}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, state: value }))}
                            >
                                <SelectTrigger id="state">
                                    <SelectValue placeholder="State" />
                                </SelectTrigger>
                                <SelectContent>
                                    {US_STATES.map((state) => (
                                        <SelectItem key={state.value} value={state.value}>
                                            {state.value} - {state.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="zipCode">ZIP Code</Label>
                            <Input
                                id="zipCode"
                                value={formData.zipCode}
                                onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                                placeholder="12345"
                                maxLength={10}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Tipo de Projeto</Label>
                            <Select
                                value={formData.projectType}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, projectType: value as ProjectType }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="interior">Interior</SelectItem>
                                    <SelectItem value="exterior">Exterior</SelectItem>
                                    <SelectItem value="both">Interior e Exterior</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Schedule Details */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as JobStatus }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="lead">Lead</SelectItem>
                                    <SelectItem value="got_the_job">Fechado</SelectItem>
                                    <SelectItem value="scheduled">Agendado</SelectItem>
                                    <SelectItem value="completed">Concluído</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Data de Início</Label>
                            <Input
                                type="date"
                                value={formData.scheduledStartDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, scheduledStartDate: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Data de Término</Label>
                            <Input
                                type="date"
                                value={formData.scheduledEndDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, scheduledEndDate: e.target.value }))}
                            />
                        </div>
                    </div>

                    {/* Team Assignment */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Vendedor</Label>
                            <Select
                                value={formData.salesRepId}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, salesRepId: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {salesReps.map((rep) => (
                                        <SelectItem key={rep.id} value={rep.id}>
                                            {rep.name} ({rep.defaultCommissionPct}%)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Gerente de Projeto</Label>
                            <Select
                                value={formData.projectManagerId}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, projectManagerId: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {pms.map((pm) => (
                                        <SelectItem key={pm.id} value={pm.id}>
                                            {pm.name} ({pm.defaultCommissionPct}%)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Subcontratado</Label>
                            <Select
                                value={formData.subcontractorId}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, subcontractorId: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {subcontractors.map((sub) => (
                                        <SelectItem key={sub.id} value={sub.id}>
                                            {sub.name} ({sub.defaultPayoutPct}%)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notas</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Observações sobre o trabalho..."
                            rows={3}
                        />
                    </div>

                    {/* Preview */}
                    {formData.jobValue > 0 && (
                        <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                            <h4 className="font-semibold text-sm">Resumo Financeiro</h4>
                            <div className="grid grid-cols-4 gap-4 text-sm">
                                <div>
                                    <p className="text-slate-500">Valor Total</p>
                                    <p className="font-semibold">${formData.jobValue.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500">Depósito (30%)</p>
                                    <p className="font-semibold">${(formData.jobValue * 0.30).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500">Custo Sub (60%)</p>
                                    <p className="font-semibold">${(formData.jobValue * 0.60).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500">Lucro Bruto (40%)</p>
                                    <p className="font-semibold text-green-600">${(formData.jobValue * 0.40).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                    <Button variant="outline" onClick={onClose}>
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting || !formData.clientName.trim()}>
                        <Save className="h-4 w-4 mr-2" />
                        Criar Trabalho
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
