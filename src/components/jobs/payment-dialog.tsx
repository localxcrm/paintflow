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
import { PaymentMethod } from '@/types';
import { DollarSign, Calendar, CreditCard, FileText } from 'lucide-react';

export type PaymentDialogType =
    | 'deposit'
    | 'job_payment'
    | 'sales_commission'
    | 'pm_commission'
    | 'subcontractor';

interface PaymentDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: PaymentDialogData) => void;
    type: PaymentDialogType;
    amount: number;
    recipientName?: string;
}

export interface PaymentDialogData {
    date: string;
    method: PaymentMethod;
    notes: string;
}

const typeLabels: Record<PaymentDialogType, { title: string; description: string }> = {
    deposit: {
        title: 'Registrar Depósito',
        description: 'Confirme o recebimento do depósito do cliente'
    },
    job_payment: {
        title: 'Registrar Pagamento Final',
        description: 'Confirme o recebimento do pagamento total do trabalho'
    },
    sales_commission: {
        title: 'Pagar Comissão de Vendas',
        description: 'Registre o pagamento da comissão do vendedor'
    },
    pm_commission: {
        title: 'Pagar Comissão PM',
        description: 'Registre o pagamento da comissão do gerente de projeto'
    },
    subcontractor: {
        title: 'Pagar Subcontratado',
        description: 'Registre o pagamento ao subcontratado'
    },
};

const paymentMethodLabels: Record<PaymentMethod, string> = {
    cash: 'Dinheiro',
    check: 'Cheque',
    venmo: 'Venmo',
    zelle: 'Zelle',
    credit_card: 'Cartão de Crédito',
    bank_transfer: 'Transferência Bancária',
    other: 'Outro',
};

export function PaymentDialog({
    isOpen,
    onClose,
    onConfirm,
    type,
    amount,
    recipientName,
}: PaymentDialogProps) {
    const [formData, setFormData] = useState<PaymentDialogData>({
        date: new Date().toISOString().split('T')[0],
        method: 'cash',
        notes: '',
    });

    const handleConfirm = () => {
        onConfirm(formData);
        // Reset form
        setFormData({
            date: new Date().toISOString().split('T')[0],
            method: 'cash',
            notes: '',
        });
    };

    const handleClose = () => {
        setFormData({
            date: new Date().toISOString().split('T')[0],
            method: 'cash',
            notes: '',
        });
        onClose();
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(value);
    };

    const { title, description } = typeLabels[type];

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        {title}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-2">
                    <p className="text-sm text-slate-500">{description}</p>

                    {/* Amount Display */}
                    <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-green-600 font-medium">Valor</p>
                        <p className="text-2xl font-bold text-green-700">{formatCurrency(amount)}</p>
                        {recipientName && (
                            <p className="text-sm text-green-600 mt-1">Para: {recipientName}</p>
                        )}
                    </div>

                    {/* Date */}
                    <div className="space-y-2">
                        <Label htmlFor="paymentDate" className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Data do Pagamento
                        </Label>
                        <Input
                            id="paymentDate"
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                        />
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Forma de Pagamento
                        </Label>
                        <Select
                            value={formData.method}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, method: value as PaymentMethod }))}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(paymentMethodLabels).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes" className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Observações
                        </Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Notas sobre este pagamento..."
                            rows={2}
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
                    <Button variant="outline" onClick={handleClose}>
                        Cancelar
                    </Button>
                    <Button onClick={handleConfirm} className="bg-green-600 hover:bg-green-700">
                        Confirmar Pagamento
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
