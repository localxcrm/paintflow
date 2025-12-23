'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { Users, Plus, Trash2, Mail, Phone, UserCog, Wrench, Percent } from 'lucide-react';
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
    const [newSub, setNewSub] = useState({
        name: '',
        email: '',
        phone: '',
        specialty: 'both' as 'interior' | 'exterior' | 'both',
        defaultPayoutPct: 60,
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
            isActive: true,
        };

        setSubcontractors(prev => [...prev, sub]);
        setNewSub({ name: '', email: '', phone: '', specialty: 'both', defaultPayoutPct: 60 });
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
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Novo Subcontratado</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="subName">Nome/Empresa *</Label>
                                    <Input
                                        id="subName"
                                        value={newSub.name}
                                        onChange={(e) => setNewSub(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="Nome da empresa ou pessoa"
                                    />
                                </div>
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
                    {subcontractors.map((sub) => (
                        <Card key={sub.id}>
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
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-slate-400 hover:text-red-500"
                                        onClick={() => setDeleteSubId(sub.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="mt-3 space-y-1 text-sm text-slate-500">
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        {sub.email}
                                    </div>
                                    {sub.phone && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4" />
                                            {sub.phone}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <Percent className="h-4 w-4" />
                                        Payout: {sub.defaultPayoutPct}%
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
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
