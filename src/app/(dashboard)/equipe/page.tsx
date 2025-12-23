'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Users, Plus, Trash2, Mail, Phone, Percent, Wrench,
    Shield, FileText, Calendar, AlertTriangle, Eye
} from 'lucide-react';
import { mockTeamMembers, mockSubcontractors } from '@/lib/mock-data';
import { toast } from 'sonner';

interface TeamMember {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: 'sales' | 'pm' | 'both';
    defaultCommissionPct: number;
    isActive: boolean;
}

interface Subcontractor {
    id: string;
    name: string;
    email: string;
    phone?: string;
    specialty: 'interior' | 'exterior' | 'both';
    defaultPayoutPct: number;
    // Insurance
    insuranceCompany?: string;
    insurancePolicyNumber?: string;
    insuranceExpirationDate?: string;
    // License
    licenseNumber?: string; // HIC number
    licenseExpirationDate?: string;
    isActive: boolean;
}

const roleLabels = {
    sales: 'Vendedor',
    pm: 'Gerente de Projeto',
    both: 'Vendedor + PM',
};

const specialtyLabels = {
    interior: 'Interior',
    exterior: 'Exterior',
    both: 'Interior + Exterior',
};

// Check if date is expired or expiring soon (within 30 days)
const getExpirationStatus = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const daysUntil = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) return 'expired';
    if (daysUntil <= 30) return 'expiring';
    return 'valid';
};

export default function EquipePage() {
    // Team Members State
    const [members, setMembers] = useState<TeamMember[]>(
        mockTeamMembers.map(m => ({
            id: m.id,
            name: m.name,
            email: m.email || `${m.name.toLowerCase().replace(' ', '.')}@email.com`,
            phone: m.phone,
            role: m.role,
            defaultCommissionPct: m.defaultCommissionPct,
            isActive: m.isActive,
        }))
    );
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const [deleteMemberId, setDeleteMemberId] = useState<string | null>(null);
    const [newMember, setNewMember] = useState({
        name: '',
        email: '',
        phone: '',
        role: 'both' as 'sales' | 'pm' | 'both',
        defaultCommissionPct: 5,
    });

    // Subcontractors State
    const [subcontractors, setSubcontractors] = useState<Subcontractor[]>(
        mockSubcontractors.map(s => ({
            id: s.id,
            name: s.name,
            email: s.email || `${s.name.toLowerCase().replace(' ', '.')}@email.com`,
            phone: s.phone,
            specialty: s.specialty,
            defaultPayoutPct: s.defaultPayoutPct,
            isActive: s.isActive,
        }))
    );
    const [isAddSubOpen, setIsAddSubOpen] = useState(false);
    const [deleteSubId, setDeleteSubId] = useState<string | null>(null);
    const [viewSubId, setViewSubId] = useState<string | null>(null);
    const [newSub, setNewSub] = useState({
        name: '',
        email: '',
        phone: '',
        specialty: 'both' as 'interior' | 'exterior' | 'both',
        defaultPayoutPct: 60,
        insuranceCompany: '',
        insurancePolicyNumber: '',
        insuranceExpirationDate: '',
        licenseNumber: '',
        licenseExpirationDate: '',
    });

    // Team Member Handlers
    const handleAddMember = () => {
        if (!newMember.name.trim() || !newMember.email.trim()) return;

        const member: TeamMember = {
            id: Date.now().toString(),
            name: newMember.name,
            email: newMember.email,
            phone: newMember.phone,
            role: newMember.role,
            defaultCommissionPct: newMember.defaultCommissionPct,
            isActive: true,
        };

        setMembers(prev => [...prev, member]);
        setNewMember({ name: '', email: '', phone: '', role: 'both', defaultCommissionPct: 5 });
        setIsAddMemberOpen(false);
        toast.success('Membro adicionado com sucesso!');
    };

    const handleDeleteMember = () => {
        if (deleteMemberId) {
            setMembers(prev => prev.filter(m => m.id !== deleteMemberId));
            setDeleteMemberId(null);
            toast.success('Membro removido!');
        }
    };

    // Subcontractor Handlers
    const handleAddSub = () => {
        if (!newSub.name.trim() || !newSub.email.trim()) return;

        const sub: Subcontractor = {
            id: Date.now().toString(),
            name: newSub.name,
            email: newSub.email,
            phone: newSub.phone,
            specialty: newSub.specialty,
            defaultPayoutPct: newSub.defaultPayoutPct,
            insuranceCompany: newSub.insuranceCompany || undefined,
            insurancePolicyNumber: newSub.insurancePolicyNumber || undefined,
            insuranceExpirationDate: newSub.insuranceExpirationDate || undefined,
            licenseNumber: newSub.licenseNumber || undefined,
            licenseExpirationDate: newSub.licenseExpirationDate || undefined,
            isActive: true,
        };

        setSubcontractors(prev => [...prev, sub]);
        setNewSub({
            name: '', email: '', phone: '', specialty: 'both', defaultPayoutPct: 60,
            insuranceCompany: '', insurancePolicyNumber: '', insuranceExpirationDate: '',
            licenseNumber: '', licenseExpirationDate: '',
        });
        setIsAddSubOpen(false);
        toast.success('Subcontratado adicionado com sucesso!');
    };

    const handleDeleteSub = () => {
        if (deleteSubId) {
            setSubcontractors(prev => prev.filter(s => s.id !== deleteSubId));
            setDeleteSubId(null);
            toast.success('Subcontratado removido!');
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const viewingSub = subcontractors.find(s => s.id === viewSubId);

    return (
        <div className="space-y-6">
            {/* Team Members Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Equipe</h1>
                    <p className="text-slate-500">Vendedores e Gerentes de Projeto</p>
                </div>
                <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Adicionar Membro
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Novo Membro da Equipe</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                            <div className="grid gap-2">
                                <Label htmlFor="memberName">Nome *</Label>
                                <Input
                                    id="memberName"
                                    value={newMember.name}
                                    onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Nome completo"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="memberEmail">Email *</Label>
                                <Input
                                    id="memberEmail"
                                    type="email"
                                    value={newMember.email}
                                    onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="email@example.com"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="memberPhone">Telefone</Label>
                                <Input
                                    id="memberPhone"
                                    value={newMember.phone}
                                    onChange={(e) => setNewMember(prev => ({ ...prev, phone: e.target.value }))}
                                    placeholder="(555) 123-4567"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Função</Label>
                                    <Select
                                        value={newMember.role}
                                        onValueChange={(value) => setNewMember(prev => ({ ...prev, role: value as 'sales' | 'pm' | 'both' }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="sales">Vendedor</SelectItem>
                                            <SelectItem value="pm">Gerente de Projeto</SelectItem>
                                            <SelectItem value="both">Vendedor + PM</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="commission">Comissão (%)</Label>
                                    <Input
                                        id="commission"
                                        type="number"
                                        value={newMember.defaultCommissionPct}
                                        onChange={(e) => setNewMember(prev => ({ ...prev, defaultCommissionPct: Number(e.target.value) }))}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" onClick={() => setIsAddMemberOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button onClick={handleAddMember} disabled={!newMember.name || !newMember.email}>
                                    Adicionar
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Team Members Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {members.map((member) => (
                    <Card key={member.id}>
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-12 w-12">
                                        <AvatarFallback className="bg-blue-600 text-white">
                                            {getInitials(member.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{member.name}</p>
                                        <Badge variant="secondary" className="text-xs">
                                            {roleLabels[member.role]}
                                        </Badge>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-slate-400 hover:text-red-500"
                                    onClick={() => setDeleteMemberId(member.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="mt-4 space-y-2 text-sm text-slate-500">
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    {member.email}
                                </div>
                                {member.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4" />
                                        {member.phone}
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <Percent className="h-4 w-4" />
                                    Comissão: {member.defaultCommissionPct}%
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {members.length === 0 && (
                <Card>
                    <CardContent className="p-8 text-center">
                        <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">Nenhum membro na equipe.</p>
                        <Button className="mt-4 gap-2" onClick={() => setIsAddMemberOpen(true)}>
                            <Plus className="h-4 w-4" />
                            Adicionar Primeiro Membro
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Subcontractors Section */}
            <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Subcontratados</h2>
                        <p className="text-sm text-slate-500">Equipes de pintura terceirizadas</p>
                    </div>
                    <Dialog open={isAddSubOpen} onOpenChange={setIsAddSubOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <Plus className="h-4 w-4" />
                                Adicionar Subcontratado
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Novo Subcontratado</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                                {/* Basic Info */}
                                <div className="grid gap-2">
                                    <Label htmlFor="subName">Nome/Empresa *</Label>
                                    <Input
                                        id="subName"
                                        value={newSub.name}
                                        onChange={(e) => setNewSub(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="Nome da empresa ou pessoa"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="subEmail">Email *</Label>
                                        <Input
                                            id="subEmail"
                                            type="email"
                                            value={newSub.email}
                                            onChange={(e) => setNewSub(prev => ({ ...prev, email: e.target.value }))}
                                            placeholder="email@example.com"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="subPhone">Telefone</Label>
                                        <Input
                                            id="subPhone"
                                            value={newSub.phone}
                                            onChange={(e) => setNewSub(prev => ({ ...prev, phone: e.target.value }))}
                                            placeholder="(555) 123-4567"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Especialidade</Label>
                                        <Select
                                            value={newSub.specialty}
                                            onValueChange={(value) => setNewSub(prev => ({ ...prev, specialty: value as 'interior' | 'exterior' | 'both' }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="interior">Interior</SelectItem>
                                                <SelectItem value="exterior">Exterior</SelectItem>
                                                <SelectItem value="both">Interior + Exterior</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="payout">Payout (%)</Label>
                                        <Input
                                            id="payout"
                                            type="number"
                                            value={newSub.defaultPayoutPct}
                                            onChange={(e) => setNewSub(prev => ({ ...prev, defaultPayoutPct: Number(e.target.value) }))}
                                        />
                                    </div>
                                </div>

                                <Separator />

                                {/* Insurance Section */}
                                <div className="space-y-3">
                                    <h4 className="font-medium flex items-center gap-2">
                                        <Shield className="h-4 w-4" />
                                        Seguro (Insurance)
                                    </h4>
                                    <div className="grid gap-2">
                                        <Label htmlFor="insuranceCompany">Companhia de Seguro</Label>
                                        <Input
                                            id="insuranceCompany"
                                            value={newSub.insuranceCompany}
                                            onChange={(e) => setNewSub(prev => ({ ...prev, insuranceCompany: e.target.value }))}
                                            placeholder="Ex: State Farm, Liberty Mutual"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="insurancePolicy">Número da Apólice (Policy #)</Label>
                                            <Input
                                                id="insurancePolicy"
                                                value={newSub.insurancePolicyNumber}
                                                onChange={(e) => setNewSub(prev => ({ ...prev, insurancePolicyNumber: e.target.value }))}
                                                placeholder="POL-123456"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="insuranceExp">Data de Vencimento</Label>
                                            <Input
                                                id="insuranceExp"
                                                type="date"
                                                value={newSub.insuranceExpirationDate}
                                                onChange={(e) => setNewSub(prev => ({ ...prev, insuranceExpirationDate: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* License Section */}
                                <div className="space-y-3">
                                    <h4 className="font-medium flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        Licença (HIC - Home Improvement Contractor)
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="licenseNumber">Número HIC</Label>
                                            <Input
                                                id="licenseNumber"
                                                value={newSub.licenseNumber}
                                                onChange={(e) => setNewSub(prev => ({ ...prev, licenseNumber: e.target.value }))}
                                                placeholder="HIC-0123456"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="licenseExp">Data de Vencimento</Label>
                                            <Input
                                                id="licenseExp"
                                                type="date"
                                                value={newSub.licenseExpirationDate}
                                                onChange={(e) => setNewSub(prev => ({ ...prev, licenseExpirationDate: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-4">
                                    <Button variant="outline" onClick={() => setIsAddSubOpen(false)}>
                                        Cancelar
                                    </Button>
                                    <Button onClick={handleAddSub} disabled={!newSub.name || !newSub.email}>
                                        Adicionar
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {subcontractors.map((sub) => {
                        const insuranceStatus = getExpirationStatus(sub.insuranceExpirationDate);
                        const licenseStatus = getExpirationStatus(sub.licenseExpirationDate);
                        const hasWarning = insuranceStatus === 'expired' || insuranceStatus === 'expiring' ||
                            licenseStatus === 'expired' || licenseStatus === 'expiring';

                        return (
                            <Card key={sub.id} className={hasWarning ? 'border-orange-300' : ''}>
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarFallback className="bg-slate-600 text-white text-sm">
                                                    {getInitials(sub.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{sub.name}</p>
                                                <Badge variant="outline" className="text-xs">
                                                    {specialtyLabels[sub.specialty]}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-slate-400 hover:text-blue-500"
                                                onClick={() => setViewSubId(sub.id)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-slate-400 hover:text-red-500"
                                                onClick={() => setDeleteSubId(sub.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="mt-3 space-y-1 text-sm text-slate-500">
                                        <div className="flex items-center gap-2">
                                            <Percent className="h-4 w-4" />
                                            Payout: {sub.defaultPayoutPct}%
                                        </div>
                                        {/* Insurance Status */}
                                        <div className="flex items-center gap-2">
                                            <Shield className="h-4 w-4" />
                                            {sub.insurancePolicyNumber ? (
                                                <span className={
                                                    insuranceStatus === 'expired' ? 'text-red-600 font-medium' :
                                                        insuranceStatus === 'expiring' ? 'text-orange-600 font-medium' : ''
                                                }>
                                                    {insuranceStatus === 'expired' && <AlertTriangle className="h-3 w-3 inline mr-1" />}
                                                    Seguro: {sub.insuranceExpirationDate}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">Sem seguro</span>
                                            )}
                                        </div>
                                        {/* License Status */}
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4" />
                                            {sub.licenseNumber ? (
                                                <span className={
                                                    licenseStatus === 'expired' ? 'text-red-600 font-medium' :
                                                        licenseStatus === 'expiring' ? 'text-orange-600 font-medium' : ''
                                                }>
                                                    {licenseStatus === 'expired' && <AlertTriangle className="h-3 w-3 inline mr-1" />}
                                                    HIC: {sub.licenseNumber}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">Sem licença</span>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {subcontractors.length === 0 && (
                    <Card>
                        <CardContent className="p-8 text-center">
                            <Wrench className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500">Nenhum subcontratado cadastrado.</p>
                            <Button className="mt-4 gap-2" variant="outline" onClick={() => setIsAddSubOpen(true)}>
                                <Plus className="h-4 w-4" />
                                Adicionar Primeiro Subcontratado
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* View Subcontractor Details Modal */}
            <Dialog open={!!viewSubId} onOpenChange={() => setViewSubId(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Detalhes do Subcontratado</DialogTitle>
                    </DialogHeader>
                    {viewingSub && (
                        <div className="space-y-4 mt-2">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-12 w-12">
                                    <AvatarFallback className="bg-slate-600 text-white">
                                        {getInitials(viewingSub.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium text-lg">{viewingSub.name}</p>
                                    <Badge variant="outline">{specialtyLabels[viewingSub.specialty]}</Badge>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Email:</span>
                                    <span>{viewingSub.email}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Telefone:</span>
                                    <span>{viewingSub.phone || 'Não informado'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Payout:</span>
                                    <span>{viewingSub.defaultPayoutPct}%</span>
                                </div>
                            </div>

                            <Separator />

                            {/* Insurance Details */}
                            <div className="space-y-2">
                                <h4 className="font-medium flex items-center gap-2">
                                    <Shield className="h-4 w-4" />
                                    Seguro
                                </h4>
                                <div className="text-sm space-y-1 pl-6">
                                    <p><span className="text-slate-500">Companhia:</span> {viewingSub.insuranceCompany || 'N/A'}</p>
                                    <p><span className="text-slate-500">Apólice:</span> {viewingSub.insurancePolicyNumber || 'N/A'}</p>
                                    <p>
                                        <span className="text-slate-500">Vence em:</span>{' '}
                                        <span className={
                                            getExpirationStatus(viewingSub.insuranceExpirationDate) === 'expired' ? 'text-red-600 font-medium' :
                                                getExpirationStatus(viewingSub.insuranceExpirationDate) === 'expiring' ? 'text-orange-600 font-medium' : ''
                                        }>
                                            {viewingSub.insuranceExpirationDate || 'N/A'}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            {/* License Details */}
                            <div className="space-y-2">
                                <h4 className="font-medium flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Licença HIC
                                </h4>
                                <div className="text-sm space-y-1 pl-6">
                                    <p><span className="text-slate-500">Número:</span> {viewingSub.licenseNumber || 'N/A'}</p>
                                    <p>
                                        <span className="text-slate-500">Vence em:</span>{' '}
                                        <span className={
                                            getExpirationStatus(viewingSub.licenseExpirationDate) === 'expired' ? 'text-red-600 font-medium' :
                                                getExpirationStatus(viewingSub.licenseExpirationDate) === 'expiring' ? 'text-orange-600 font-medium' : ''
                                        }>
                                            {viewingSub.licenseExpirationDate || 'N/A'}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4">
                                <Button variant="outline" className="w-full" onClick={() => setViewSubId(null)}>
                                    Fechar
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Member Confirmation */}
            <AlertDialog open={!!deleteMemberId} onOpenChange={() => setDeleteMemberId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remover Membro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O membro será removido da equipe.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteMember} className="bg-red-600 hover:bg-red-700">
                            Remover
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Subcontractor Confirmation */}
            <AlertDialog open={!!deleteSubId} onOpenChange={() => setDeleteSubId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remover Subcontratado?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O subcontratado será removido.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteSub} className="bg-red-600 hover:bg-red-700">
                            Remover
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
