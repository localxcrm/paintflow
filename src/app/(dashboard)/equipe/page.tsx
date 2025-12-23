'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Users, Plus, Trash2, Mail, Phone, UserCog } from 'lucide-react';
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

const roleLabels = {
    sales: 'Vendedor',
    pm: 'Gerente de Projeto',
    both: 'Vendedor + PM',
};

export default function EquipePage() {
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
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [newMember, setNewMember] = useState({
        name: '',
        email: '',
        phone: '',
        role: 'both' as 'sales' | 'pm' | 'both',
        defaultCommissionPct: 5,
    });

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
        setIsAddDialogOpen(false);
        toast.success('Membro adicionado com sucesso!');
    };

    const handleDeleteMember = () => {
        if (deleteId) {
            setMembers(prev => prev.filter(m => m.id !== deleteId));
            setDeleteId(null);
            toast.success('Membro removido!');
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Equipe</h1>
                    <p className="text-slate-500">Gerencie vendedores e gerentes de projeto</p>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
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
                                    placeholder="email@exemplo.com"
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
                                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
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
                                    onClick={() => setDeleteId(member.id)}
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
                                    <UserCog className="h-4 w-4" />
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
                        <Button className="mt-4 gap-2" onClick={() => setIsAddDialogOpen(true)}>
                            <Plus className="h-4 w-4" />
                            Adicionar Primeiro Membro
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Subcontractors */}
            <div className="mt-8">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Subcontratados</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {mockSubcontractors.map((sub) => (
                        <Card key={sub.id}>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarFallback className="bg-slate-600 text-white text-sm">
                                            {sub.name.slice(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{sub.name}</p>
                                        <p className="text-xs text-slate-500">
                                            {sub.specialty === 'interior' ? 'Interior' : sub.specialty === 'exterior' ? 'Exterior' : 'Interior + Exterior'}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-3 text-sm text-slate-500">
                                    <p>Payout: {sub.defaultPayoutPct}%</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
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
        </div>
    );
}
