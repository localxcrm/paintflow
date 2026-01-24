'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
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
    Shield, FileText, Pencil, Loader2, Calendar as CalendarIcon, Copy, Check,
    Key, Eye, EyeOff, Smartphone, X
} from 'lucide-react';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/ui/image-upload';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TeamMember {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
    defaultCommissionPct?: number;
    color?: string;
    isActive: boolean;
}

interface Subcontractor {
    id: string;
    name: string;
    email: string;
    phone?: string;
    specialty: string;
    defaultPayoutPct?: number;
    color?: string;
    isActive: boolean;
    calendarToken?: string;
    userId?: string; // Link to User for app login
    hasAppAccess?: boolean;
    // Compliance fields
    licenseNumber?: string;
    licenseExpirationDate?: string;
    licenseImageUrl?: string;
    insuranceNumber?: string;
    insuranceExpirationDate?: string;
    insuranceImageUrl?: string;
}

const roleLabels: Record<string, string> = {
    sales: 'Vendedor',
    pm: 'Gerente de Projeto',
    both: 'Vendedor + PM',
    admin: 'Office Admin',
    owner: 'Dono (Owner)',
};

const specialtyLabels: Record<string, string> = {
    interior: 'Interior',
    exterior: 'Exterior',
    both: 'Interior + Exterior',
};

const colorOptions = [
    { value: '#3B82F6', label: 'Azul' },
    { value: '#10B981', label: 'Verde' },
    { value: '#8B5CF6', label: 'Roxo' },
    { value: '#F97316', label: 'Laranja' },
    { value: '#EC4899', label: 'Rosa' },
    { value: '#EAB308', label: 'Amarelo' },
    { value: '#EF4444', label: 'Vermelho' },
    { value: '#14B8A6', label: 'Turquesa' },
];

export default function EquipePage() {
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Member modals
    const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
    const [deleteMemberId, setDeleteMemberId] = useState<string | null>(null);
    const [memberForm, setMemberForm] = useState({
        name: '',
        email: '',
        phone: '',
        role: 'both',
        defaultCommissionPct: 5,
    });

    // Subcontractor modals
    const [isSubModalOpen, setIsSubModalOpen] = useState(false);
    const [editingSub, setEditingSub] = useState<Subcontractor | null>(null);
    const [deleteSubId, setDeleteSubId] = useState<string | null>(null);
    const [subForm, setSubForm] = useState({
        name: '',
        email: '',
        phone: '',
        specialty: 'both',
        defaultPayoutPct: 60,
        color: '#10B981',
        password: '',
        enableAppAccess: false,
        // Compliance fields
        licenseNumber: '',
        licenseExpirationDate: null as Date | null,
        licenseImageUrl: null as string | null,
        insuranceNumber: '',
        insuranceExpirationDate: null as Date | null,
        insuranceImageUrl: null as string | null,
    });
    const [copiedToken, setCopiedToken] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [isSavingSub, setIsSavingSub] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [teamRes, subRes] = await Promise.all([
                fetch('/api/team'),
                fetch('/api/subcontractors')
            ]);

            if (teamRes.ok) {
                const data = await teamRes.json();
                setMembers(data.teamMembers || []);
            }

            if (subRes.ok) {
                const data = await subRes.json();
                setSubcontractors(data.subcontractors || []);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Erro ao carregar dados');
        } finally {
            setIsLoading(false);
        }
    };

    // Team Member Handlers
    const openMemberModal = (member?: TeamMember) => {
        if (member) {
            setEditingMember(member);
            setMemberForm({
                name: member.name,
                email: member.email || '',
                phone: member.phone || '',
                role: member.role || 'both',
                defaultCommissionPct: member.defaultCommissionPct || 5,
            });
        } else {
            setEditingMember(null);
            setMemberForm({
                name: '',
                email: '',
                phone: '',
                role: 'both',
                defaultCommissionPct: 5,
            });
        }
        setIsMemberModalOpen(true);
    };

    const handleSaveMember = async () => {
        if (!memberForm.name.trim()) return;

        try {
            if (editingMember) {
                // Update
                const res = await fetch('/api/team', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: editingMember.id, ...memberForm }),
                });
                if (res.ok) {
                    const updated = await res.json();
                    setMembers(prev => prev.map(m => m.id === updated.id ? updated : m));
                    toast.success('Membro atualizado!');
                    setIsMemberModalOpen(false);
                } else {
                    const error = await res.json();
                    toast.error(error.error || 'Erro ao atualizar membro');
                }
            } else {
                // Create
                const res = await fetch('/api/team', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(memberForm),
                });
                if (res.ok) {
                    const created = await res.json();
                    setMembers(prev => [...prev, created]);
                    toast.success('Membro adicionado!');
                    setIsMemberModalOpen(false);
                } else {
                    const error = await res.json();
                    toast.error(error.error || 'Erro ao adicionar membro');
                }
            }
        } catch (error) {
            console.error('Error saving member:', error);
            toast.error('Erro ao salvar membro');
        }
    };

    const handleDeleteMember = async () => {
        if (!deleteMemberId) return;
        try {
            const res = await fetch(`/api/team?id=${deleteMemberId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                setMembers(prev => prev.filter(m => m.id !== deleteMemberId));
                toast.success('Membro removido!');
            }
        } catch (error) {
            console.error('Error deleting member:', error);
            toast.error('Erro ao remover membro');
        }
        setDeleteMemberId(null);
    };

    // Subcontractor Handlers
    const openSubModal = (sub?: Subcontractor) => {
        if (sub) {
            setEditingSub(sub);
            setSubForm({
                name: sub.name,
                email: sub.email || '',
                phone: sub.phone || '',
                specialty: sub.specialty || 'both',
                defaultPayoutPct: sub.defaultPayoutPct || 60,
                color: sub.color || '#10B981',
                password: '',
                enableAppAccess: !!sub.userId,
                // Compliance fields
                licenseNumber: sub.licenseNumber || '',
                licenseExpirationDate: sub.licenseExpirationDate ? new Date(sub.licenseExpirationDate) : null,
                licenseImageUrl: sub.licenseImageUrl || null,
                insuranceNumber: sub.insuranceNumber || '',
                insuranceExpirationDate: sub.insuranceExpirationDate ? new Date(sub.insuranceExpirationDate) : null,
                insuranceImageUrl: sub.insuranceImageUrl || null,
            });
        } else {
            setEditingSub(null);
            setSubForm({
                name: '',
                email: '',
                phone: '',
                specialty: 'both',
                defaultPayoutPct: 60,
                color: '#10B981',
                password: '',
                enableAppAccess: false,
                licenseNumber: '',
                licenseExpirationDate: null,
                licenseImageUrl: null,
                insuranceNumber: '',
                insuranceExpirationDate: null,
                insuranceImageUrl: null,
            });
        }
        setShowPassword(false);
        setIsSubModalOpen(true);
    };

    const handleSaveSub = async () => {
        if (!subForm.name.trim()) return;

        // Validate password if enabling app access
        if (subForm.enableAppAccess && !editingSub?.userId && !subForm.password) {
            toast.error('Senha é obrigatória para acesso ao app');
            return;
        }

        if (subForm.enableAppAccess && !subForm.email) {
            toast.error('Email é obrigatório para acesso ao app');
            return;
        }

        if (subForm.password && subForm.password.length < 6) {
            toast.error('Senha deve ter pelo menos 6 caracteres');
            return;
        }

        setIsSavingSub(true);
        try {
            if (editingSub) {
                // Update
                const res = await fetch('/api/subcontractors', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: editingSub.id,
                        ...subForm,
                        // Only send password if it was changed
                        password: subForm.password || undefined,
                        // Format dates as ISO strings for database
                        licenseExpirationDate: subForm.licenseExpirationDate
                            ? subForm.licenseExpirationDate.toISOString().split('T')[0]
                            : null,
                        insuranceExpirationDate: subForm.insuranceExpirationDate
                            ? subForm.insuranceExpirationDate.toISOString().split('T')[0]
                            : null,
                    }),
                });
                if (res.ok) {
                    const updated = await res.json();
                    setSubcontractors(prev => prev.map(s => s.id === updated.id ? updated : s));
                    toast.success('Subcontratado atualizado!');
                    setIsSubModalOpen(false);
                } else {
                    const error = await res.json();
                    toast.error(error.error || 'Erro ao atualizar subcontratado');
                }
            } else {
                // Create
                const res = await fetch('/api/subcontractors', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...subForm,
                        // Format dates as ISO strings for database
                        licenseExpirationDate: subForm.licenseExpirationDate
                            ? subForm.licenseExpirationDate.toISOString().split('T')[0]
                            : null,
                        insuranceExpirationDate: subForm.insuranceExpirationDate
                            ? subForm.insuranceExpirationDate.toISOString().split('T')[0]
                            : null,
                    }),
                });
                if (res.ok) {
                    const created = await res.json();
                    setSubcontractors(prev => [...prev, created]);
                    if (subForm.enableAppAccess) {
                        toast.success('Subcontratado criado com acesso ao app!');
                    } else {
                        toast.success('Subcontratado adicionado!');
                    }
                    setIsSubModalOpen(false);
                } else {
                    const error = await res.json();
                    toast.error(error.error || 'Erro ao adicionar subcontratado');
                }
            }
        } catch (error) {
            console.error('Error saving subcontractor:', error);
            toast.error('Erro ao salvar subcontratado');
        } finally {
            setIsSavingSub(false);
        }
    };

    const handleDeleteSub = async () => {
        if (!deleteSubId) return;
        try {
            const res = await fetch(`/api/subcontractors?id=${deleteSubId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                setSubcontractors(prev => prev.filter(s => s.id !== deleteSubId));
                toast.success('Subcontratado removido!');
            }
        } catch (error) {
            console.error('Error deleting subcontractor:', error);
            toast.error('Erro ao remover subcontratado');
        }
        setDeleteSubId(null);
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex items-center gap-2 text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Carregando equipe...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Team Members Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Equipe</h1>
                    <p className="text-slate-500">Vendedores e Gerentes de Projeto</p>
                </div>
                <Button className="gap-2" onClick={() => openMemberModal()}>
                    <Plus className="h-4 w-4" />
                    Adicionar Membro
                </Button>
            </div>

            {/* Team Members Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {members.map((member) => (
                    <Card key={member.id}>
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-12 w-12">
                                        <AvatarFallback className="text-white bg-blue-600">
                                            {getInitials(member.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{member.name}</p>
                                        <Badge variant="secondary" className="text-xs">
                                            {roleLabels[member.role] || member.role}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-slate-400 hover:text-blue-500"
                                        onClick={() => openMemberModal(member)}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-slate-400 hover:text-red-500"
                                        onClick={() => setDeleteMemberId(member.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="mt-4 space-y-2 text-sm text-slate-500">
                                {member.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        {member.email}
                                    </div>
                                )}
                                {member.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4" />
                                        {member.phone}
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <Percent className="h-4 w-4" />
                                    Comissao: {member.defaultCommissionPct || 0}%
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
                        <Button className="mt-4 gap-2" onClick={() => openMemberModal()}>
                            <Plus className="h-4 w-4" />
                            Adicionar Primeiro Membro
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Subcontractors Section */}
            <Separator className="my-8" />

            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">Subcontratados</h2>
                    <p className="text-sm text-slate-500">Equipes de pintura terceirizadas</p>
                </div>
                <Button variant="outline" className="gap-2" onClick={() => openSubModal()}>
                    <Plus className="h-4 w-4" />
                    Adicionar Subcontratado
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {subcontractors.map((sub) => (
                    <Card key={sub.id}>
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarFallback
                                            className="text-white text-sm"
                                            style={{ backgroundColor: sub.color || '#10B981' }}
                                        >
                                            {getInitials(sub.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{sub.name}</p>
                                        <div className="flex items-center gap-1">
                                            <Badge variant="outline" className="text-xs">
                                                {specialtyLabels[sub.specialty] || sub.specialty}
                                            </Badge>
                                            {sub.userId && (
                                                <Badge className="text-xs bg-blue-100 text-blue-700">
                                                    <Smartphone className="h-3 w-3 mr-1" />
                                                    App
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-slate-400 hover:text-blue-500"
                                        onClick={() => openSubModal(sub)}
                                    >
                                        <Pencil className="h-4 w-4" />
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
                                {sub.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        {sub.email}
                                    </div>
                                )}
                                {sub.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4" />
                                        {sub.phone}
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <Percent className="h-4 w-4" />
                                    Payout: {sub.defaultPayoutPct || 60}%
                                </div>
                            </div>
                            {/* Calendar Link */}
                            {sub.calendarToken && (
                                <div className="mt-3 pt-3 border-t">
                                    <button
                                        onClick={() => {
                                            const url = `${window.location.origin}/api/calendar/${sub.calendarToken}`;
                                            navigator.clipboard.writeText(url);
                                            setCopiedToken(sub.id);
                                            setTimeout(() => setCopiedToken(null), 2000);
                                            toast.success('Link copiado! Envie para o subcontratado adicionar ao calendário.');
                                        }}
                                        className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 w-full"
                                    >
                                        {copiedToken === sub.id ? (
                                            <>
                                                <Check className="h-3 w-3" />
                                                Link copiado!
                                            </>
                                        ) : (
                                            <>
                                                <CalendarIcon className="h-3 w-3" />
                                                <span className="truncate">Copiar link do calendário</span>
                                                <Copy className="h-3 w-3 ml-auto" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {subcontractors.length === 0 && (
                <Card>
                    <CardContent className="p-8 text-center">
                        <Wrench className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">Nenhum subcontratado cadastrado.</p>
                        <Button className="mt-4 gap-2" variant="outline" onClick={() => openSubModal()}>
                            <Plus className="h-4 w-4" />
                            Adicionar Primeiro Subcontratado
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Member Modal */}
            <Dialog open={isMemberModalOpen} onOpenChange={setIsMemberModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingMember ? 'Editar Membro' : 'Novo Membro da Equipe'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div className="grid gap-2">
                            <Label htmlFor="memberName">Nome *</Label>
                            <Input
                                id="memberName"
                                value={memberForm.name}
                                onChange={(e) => setMemberForm(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Nome completo"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="memberEmail">Email</Label>
                            <Input
                                id="memberEmail"
                                type="email"
                                value={memberForm.email}
                                onChange={(e) => setMemberForm(prev => ({ ...prev, email: e.target.value }))}
                                placeholder="email@example.com"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="memberPhone">Telefone</Label>
                            <PhoneInput
                                id="memberPhone"
                                value={memberForm.phone}
                                onChange={(value) => setMemberForm(prev => ({ ...prev, phone: value }))}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Funcao</Label>
                                <Select
                                    value={memberForm.role}
                                    onValueChange={(value) => setMemberForm(prev => ({ ...prev, role: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="sales">Vendedor</SelectItem>
                                        <SelectItem value="pm">Gerente de Projeto</SelectItem>
                                        <SelectItem value="both">Vendedor + PM</SelectItem>
                                        <SelectItem value="admin">Office Admin</SelectItem>
                                        <SelectItem value="owner">Dono (Owner)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="commission">Comissao (%)</Label>
                                <Input
                                    id="commission"
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={memberForm.defaultCommissionPct}
                                    onChange={(e) => setMemberForm(prev => ({ ...prev, defaultCommissionPct: Number(e.target.value) }))}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="outline" onClick={() => setIsMemberModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleSaveMember} disabled={!memberForm.name}>
                                {editingMember ? 'Salvar' : 'Adicionar'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Subcontractor Modal */}
            <Dialog open={isSubModalOpen} onOpenChange={setIsSubModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingSub ? 'Editar Subcontratado' : 'Novo Subcontratado'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div className="grid gap-2">
                            <Label htmlFor="subName">Nome/Empresa *</Label>
                            <Input
                                id="subName"
                                value={subForm.name}
                                onChange={(e) => setSubForm(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Nome da empresa ou pessoa"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="subEmail">Email</Label>
                                <Input
                                    id="subEmail"
                                    type="email"
                                    value={subForm.email}
                                    onChange={(e) => setSubForm(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="email@example.com"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="subPhone">Telefone</Label>
                                <PhoneInput
                                    id="subPhone"
                                    value={subForm.phone}
                                    onChange={(value) => setSubForm(prev => ({ ...prev, phone: value }))}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Especialidade</Label>
                                <Select
                                    value={subForm.specialty}
                                    onValueChange={(value) => setSubForm(prev => ({ ...prev, specialty: value }))}
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
                                    min="0"
                                    max="100"
                                    value={subForm.defaultPayoutPct}
                                    onChange={(e) => setSubForm(prev => ({ ...prev, defaultPayoutPct: Number(e.target.value) }))}
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Cor (para calendario/mapa)</Label>
                            <Select
                                value={subForm.color}
                                onValueChange={(value) => setSubForm(prev => ({ ...prev, color: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {colorOptions.map(c => (
                                        <SelectItem key={c.value} value={c.value}>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-4 h-4 rounded"
                                                    style={{ backgroundColor: c.value }}
                                                />
                                                {c.label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* App Access Section */}
                        <Separator />
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Smartphone className="h-4 w-4 text-blue-600" />
                                    <Label className="font-medium">Acesso ao App</Label>
                                </div>
                                <Button
                                    type="button"
                                    variant={subForm.enableAppAccess ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setSubForm(prev => ({ ...prev, enableAppAccess: !prev.enableAppAccess }))}
                                >
                                    {subForm.enableAppAccess ? 'Ativado' : 'Desativado'}
                                </Button>
                            </div>

                            {subForm.enableAppAccess && (
                                <div className="space-y-3 p-3 bg-blue-50 rounded-lg">
                                    <p className="text-xs text-blue-700">
                                        {editingSub?.userId
                                            ? 'O subcontratado já tem acesso ao app. Deixe a senha em branco para manter a atual.'
                                            : 'O subcontratado poderá acessar o app com email e senha.'}
                                    </p>
                                    <div className="grid gap-2">
                                        <Label htmlFor="subPassword">
                                            {editingSub?.userId ? 'Nova Senha (opcional)' : 'Senha *'}
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="subPassword"
                                                type={showPassword ? 'text' : 'password'}
                                                value={subForm.password}
                                                onChange={(e) => setSubForm(prev => ({ ...prev, password: e.target.value }))}
                                                placeholder={editingSub?.userId ? 'Deixe em branco para manter' : 'Mínimo 6 caracteres'}
                                                className="pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Compliance Section - License */}
                        <Separator />
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-green-600" />
                                <Label className="font-medium">Licenca</Label>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="licenseNumber">Numero da Licenca</Label>
                                <Input
                                    id="licenseNumber"
                                    value={subForm.licenseNumber}
                                    onChange={(e) => setSubForm(prev => ({ ...prev, licenseNumber: e.target.value }))}
                                    placeholder="Opcional"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>Data de Expiracao</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="justify-start text-left font-normal w-full">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {subForm.licenseExpirationDate ? (
                                                format(subForm.licenseExpirationDate, 'P', { locale: ptBR })
                                            ) : (
                                                <span className="text-slate-400">Selecione a data</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent align="start" className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={subForm.licenseExpirationDate || undefined}
                                            onSelect={(date) => setSubForm(prev => ({ ...prev, licenseExpirationDate: date || null }))}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="grid gap-2">
                                <Label>Foto da Licenca (opcional)</Label>
                                {subForm.licenseImageUrl ? (
                                    <div className="relative">
                                        <img
                                            src={subForm.licenseImageUrl}
                                            alt="Licenca"
                                            className="h-24 w-full object-cover rounded border"
                                        />
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="destructive"
                                            className="absolute top-1 right-1"
                                            onClick={() => setSubForm(prev => ({ ...prev, licenseImageUrl: null }))}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ) : (
                                    <ImageUpload
                                        onUpload={(url) => setSubForm(prev => ({ ...prev, licenseImageUrl: url }))}
                                        folder="compliance"
                                        maxSize={5}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Compliance Section - Insurance */}
                        <Separator />
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-blue-600" />
                                <Label className="font-medium">Seguro</Label>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="insuranceNumber">Numero do Seguro</Label>
                                <Input
                                    id="insuranceNumber"
                                    value={subForm.insuranceNumber}
                                    onChange={(e) => setSubForm(prev => ({ ...prev, insuranceNumber: e.target.value }))}
                                    placeholder="Opcional"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>Data de Expiracao</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="justify-start text-left font-normal w-full">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {subForm.insuranceExpirationDate ? (
                                                format(subForm.insuranceExpirationDate, 'P', { locale: ptBR })
                                            ) : (
                                                <span className="text-slate-400">Selecione a data</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent align="start" className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={subForm.insuranceExpirationDate || undefined}
                                            onSelect={(date) => setSubForm(prev => ({ ...prev, insuranceExpirationDate: date || null }))}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="grid gap-2">
                                <Label>Foto do Seguro (opcional)</Label>
                                {subForm.insuranceImageUrl ? (
                                    <div className="relative">
                                        <img
                                            src={subForm.insuranceImageUrl}
                                            alt="Seguro"
                                            className="h-24 w-full object-cover rounded border"
                                        />
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="destructive"
                                            className="absolute top-1 right-1"
                                            onClick={() => setSubForm(prev => ({ ...prev, insuranceImageUrl: null }))}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ) : (
                                    <ImageUpload
                                        onUpload={(url) => setSubForm(prev => ({ ...prev, insuranceImageUrl: url }))}
                                        folder="compliance"
                                        maxSize={5}
                                    />
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="outline" onClick={() => setIsSubModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleSaveSub} disabled={!subForm.name || isSavingSub}>
                                {isSavingSub ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    editingSub ? 'Salvar' : 'Adicionar'
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Member Confirmation */}
            <AlertDialog open={!!deleteMemberId} onOpenChange={() => setDeleteMemberId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remover Membro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acao nao pode ser desfeita. O membro sera removido da equipe.
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
                            Esta acao nao pode ser desfeita. O subcontratado sera removido.
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
