'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { DollarSign, Percent, Building, Save, Megaphone, Trash2, Plus, Users, UserPlus, Loader2, ImageIcon, Upload, X, Home, Pencil, FileText, Star, Copy, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { InviteUserDialog } from '@/components/users/invite-user-dialog';
import { useOrganization } from '@/contexts/organization-context';
import { RoomType, ROOM_TYPE_TYPE_LABELS, DEFAULT_SCOPE_OPTIONS } from '@/types/room-type';
import { OSTemplate } from '@/types/os-template';

interface MarketingChannel {
    id: string;
    label: string;
    color: string;
}

interface BusinessSettings {
    companyName: string;
    defaultDepositPct: number;
    targetGrossMarginPct: number;
    minGrossProfitPerJob: number;
    salesCommissionPct: number;
    pmCommissionPct: number;
    currency: string;
    dateFormat: string;
    marketingChannels: MarketingChannel[];
}

interface OrgUser {
    id: string;
    name: string;
    email: string;
    role: string;
    orgRole: string;
    isActive: boolean;
    createdAt: string;
}

const roleLabels: Record<string, string> = {
    admin: 'Administrador',
    user: 'Usuário',
    viewer: 'Visualizador',
    owner: 'Proprietário',
    member: 'Membro',
};

export default function ConfiguracoesPage() {
    const { organization, refreshOrganization } = useOrganization();
    const [settings, setSettings] = useState<BusinessSettings>({
        companyName: 'PaintFlow Demo',
        defaultDepositPct: 30,
        targetGrossMarginPct: 40,
        minGrossProfitPerJob: 900,
        salesCommissionPct: 5,
        pmCommissionPct: 3,
        currency: 'USD',
        dateFormat: 'DD/MM/YYYY',
        marketingChannels: [
            { id: 'google', label: 'Google Ads', color: 'bg-blue-500' },
            { id: 'facebook', label: 'Facebook/Meta', color: 'bg-indigo-500' },
            { id: 'referral', label: 'Indicação', color: 'bg-green-500' },
            { id: 'yard_sign', label: 'Placa de Obra', color: 'bg-yellow-500' },
            { id: 'door_knock', label: 'Door Knock', color: 'bg-orange-500' },
            { id: 'repeat', label: 'Cliente Repetido', color: 'bg-purple-500' },
            { id: 'other', label: 'Outro', color: 'bg-slate-500' },
        ],
    });
    const [isSaving, setIsSaving] = useState(false);

    // Logo state
    const [logoUrl, setLogoUrl] = useState('');
    const [isSavingLogo, setIsSavingLogo] = useState(false);

    // Users state
    const [users, setUsers] = useState<OrgUser[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

    // Room Types state
    const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
    const [isLoadingRoomTypes, setIsLoadingRoomTypes] = useState(true);
    const [isAddingRoomType, setIsAddingRoomType] = useState(false);
    const [editingRoomType, setEditingRoomType] = useState<RoomType | null>(null);
    const [newRoomType, setNewRoomType] = useState({
        name: '',
        description: '',
        type: 'room' as RoomType['type'],
        defaultScope: ['Paredes'],
    });

    // OS Templates state
    const [osTemplates, setOsTemplates] = useState<OSTemplate[]>([]);
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

    const loadUsers = useCallback(async () => {
        try {
            const res = await fetch('/api/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
            }
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setIsLoadingUsers(false);
        }
    }, []);

    const loadRoomTypes = useCallback(async () => {
        try {
            const res = await fetch('/api/room-types?includeInactive=true');
            if (res.ok) {
                const data = await res.json();
                setRoomTypes(data.roomTypes || []);
            }
        } catch (error) {
            console.error('Error loading room types:', error);
        } finally {
            setIsLoadingRoomTypes(false);
        }
    }, []);

    const loadOsTemplates = useCallback(async () => {
        try {
            const res = await fetch('/api/os-templates');
            if (res.ok) {
                const data = await res.json();
                setOsTemplates(data.templates || []);
            }
        } catch (error) {
            console.error('Error loading OS templates:', error);
        } finally {
            setIsLoadingTemplates(false);
        }
    }, []);

    useEffect(() => {
        const stored = localStorage.getItem('paintflow_settings');
        if (stored) {
            try {
                setSettings(JSON.parse(stored));
            } catch {
                // Invalid JSON
            }
        }

        loadUsers();
        loadRoomTypes();
        loadOsTemplates();
    }, [loadUsers, loadRoomTypes, loadOsTemplates]);

    const handleAddRoomType = async () => {
        if (!newRoomType.name.trim()) {
            toast.error('Nome do cômodo é obrigatório');
            return;
        }

        try {
            const res = await fetch('/api/room-types', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newRoomType),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Erro ao criar cômodo');
            }

            toast.success('Cômodo criado com sucesso!');
            setNewRoomType({ name: '', description: '', type: 'room', defaultScope: ['Paredes'] });
            setIsAddingRoomType(false);
            loadRoomTypes();
        } catch (error) {
            console.error('Error creating room type:', error);
            toast.error(error instanceof Error ? error.message : 'Erro ao criar cômodo');
        }
    };

    const handleUpdateRoomType = async () => {
        if (!editingRoomType) return;

        try {
            const res = await fetch(`/api/room-types/${editingRoomType.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editingRoomType.name,
                    description: editingRoomType.description,
                    type: editingRoomType.type,
                    defaultScope: editingRoomType.defaultScope,
                    isActive: editingRoomType.isActive,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Erro ao atualizar cômodo');
            }

            toast.success('Cômodo atualizado com sucesso!');
            setEditingRoomType(null);
            loadRoomTypes();
        } catch (error) {
            console.error('Error updating room type:', error);
            toast.error(error instanceof Error ? error.message : 'Erro ao atualizar cômodo');
        }
    };

    const handleDeleteRoomType = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este cômodo?')) {
            return;
        }

        try {
            const res = await fetch(`/api/room-types/${id}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                throw new Error('Erro ao excluir cômodo');
            }

            toast.success('Cômodo excluído com sucesso!');
            loadRoomTypes();
        } catch (error) {
            console.error('Error deleting room type:', error);
            toast.error('Erro ao excluir cômodo');
        }
    };

    const toggleScopeItem = (scope: string[], item: string) => {
        if (scope.includes(item)) {
            return scope.filter(s => s !== item);
        }
        return [...scope, item];
    };

    const handleSetDefaultTemplate = async (id: string) => {
        try {
            const res = await fetch(`/api/os-templates/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isDefault: true }),
            });

            if (!res.ok) {
                throw new Error('Erro ao definir template padrão');
            }

            toast.success('Template definido como padrão!');
            loadOsTemplates();
        } catch (error) {
            console.error('Error setting default template:', error);
            toast.error('Erro ao definir template padrão');
        }
    };

    const handleDeleteTemplate = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este template?')) {
            return;
        }

        try {
            const res = await fetch(`/api/os-templates/${id}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                throw new Error('Erro ao excluir template');
            }

            toast.success('Template excluído com sucesso!');
            loadOsTemplates();
        } catch (error) {
            console.error('Error deleting template:', error);
            toast.error('Erro ao excluir template');
        }
    };

    const handleSave = () => {
        setIsSaving(true);
        localStorage.setItem('paintflow_settings', JSON.stringify(settings));

        setTimeout(() => {
            setIsSaving(false);
            toast.success('Configurações salvas com sucesso!');
        }, 500);
    };

    const handleRemoveUser = async (userId: string) => {
        if (!confirm('Tem certeza que deseja remover este usuário da organização?')) {
            return;
        }

        try {
            const res = await fetch(`/api/users?id=${userId}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Erro ao remover usuário');
            }

            toast.success('Usuário removido com sucesso');
            loadUsers();
        } catch (error) {
            console.error('Error removing user:', error);
            toast.error(error instanceof Error ? error.message : 'Erro ao remover usuário');
        }
    };

    const handleSaveLogo = async () => {
        setIsSavingLogo(true);
        try {
            const res = await fetch('/api/organizations/logo', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ logo: logoUrl || null }),
            });

            if (!res.ok) {
                throw new Error('Erro ao salvar logo');
            }

            await refreshOrganization();
            toast.success('Logo atualizada com sucesso!');
        } catch (error) {
            console.error('Error saving logo:', error);
            toast.error('Erro ao salvar logo');
        } finally {
            setIsSavingLogo(false);
        }
    };

    const handleRemoveLogo = async () => {
        setLogoUrl('');
        setIsSavingLogo(true);
        try {
            const res = await fetch('/api/organizations/logo', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ logo: null }),
            });

            if (!res.ok) {
                throw new Error('Erro ao remover logo');
            }

            await refreshOrganization();
            toast.success('Logo removida com sucesso!');
        } catch (error) {
            console.error('Error removing logo:', error);
            toast.error('Erro ao remover logo');
        } finally {
            setIsSavingLogo(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>
                <p className="text-slate-500">Configure seu negócio e preferências</p>
            </div>

            {/* Logo da Empresa */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5" />
                        Logo da Empresa
                    </CardTitle>
                    <CardDescription>
                        A logo aparece na barra lateral e nas ordens de serviço públicas
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Preview da logo atual */}
                    {organization?.logo && (
                        <div className="flex items-center gap-4 p-4 bg-slate-100 rounded-lg">
                            <Image
                                src={organization.logo}
                                alt="Logo atual"
                                width={160}
                                height={64}
                                className="h-16 w-auto object-contain"
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleRemoveLogo}
                                disabled={isSavingLogo}
                                title="Remover logo"
                            >
                                <X className="h-4 w-4 text-red-500" />
                            </Button>
                        </div>
                    )}

                    {/* Input para URL da logo */}
                    <div className="grid gap-2">
                        <Label htmlFor="logoUrl">URL da Logo</Label>
                        <div className="flex gap-2">
                            <Input
                                id="logoUrl"
                                type="url"
                                placeholder="https://exemplo.com/sua-logo.png"
                                value={logoUrl}
                                onChange={(e) => setLogoUrl(e.target.value)}
                            />
                            <Button
                                onClick={handleSaveLogo}
                                disabled={isSavingLogo || !logoUrl}
                                className="gap-2"
                            >
                                {isSavingLogo ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Upload className="h-4 w-4" />
                                )}
                                Salvar
                            </Button>
                        </div>
                        <p className="text-xs text-slate-500">
                            Use uma URL de imagem pública (PNG, JPG, SVG). Recomendado: 200x60px
                        </p>
                    </div>

                    {/* Preview da nova logo */}
                    {logoUrl && (
                        <div className="p-4 border rounded-lg">
                            <p className="text-sm text-slate-500 mb-2">Preview:</p>
                            <div className="bg-slate-900 p-4 rounded-lg inline-block">
                                <Image
                                    src={logoUrl}
                                    alt="Preview da logo"
                                    width={160}
                                    height={48}
                                    className="h-10 w-auto object-contain"
                                    onError={() => toast.error('URL de imagem inválida')}
                                />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Users Management */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Usuários
                            </CardTitle>
                            <CardDescription>
                                Gerencie os usuários da sua organização
                            </CardDescription>
                        </div>
                        <Button onClick={() => setInviteDialogOpen(true)} className="gap-2">
                            <UserPlus className="h-4 w-4" />
                            Adicionar Usuário
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoadingUsers ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>Nenhum usuário encontrado</p>
                            <p className="text-sm">Adicione usuários para colaborar na sua organização</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Função</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {roleLabels[user.orgRole] || roleLabels[user.role] || user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.isActive ? 'default' : 'secondary'}>
                                                {user.isActive ? 'Ativo' : 'Inativo'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {user.orgRole !== 'owner' && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleRemoveUser(user.id)}
                                                    title="Remover usuário"
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Room Types Management */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Home className="h-5 w-5" />
                                Cômodos
                            </CardTitle>
                            <CardDescription>
                                Gerencie os tipos de cômodos disponíveis para suas ordens de serviço
                            </CardDescription>
                        </div>
                        <Button onClick={() => setIsAddingRoomType(true)} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Novo Cômodo
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Add Room Type Form */}
                    {isAddingRoomType && (
                        <div className="border rounded-lg p-4 space-y-4 bg-slate-50">
                            <h4 className="font-medium">Novo Cômodo</h4>
                            <div className="grid gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Nome *</Label>
                                        <Input
                                            placeholder="Ex: Sala de TV"
                                            value={newRoomType.name}
                                            onChange={(e) => setNewRoomType(prev => ({ ...prev, name: e.target.value }))}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Tipo</Label>
                                        <Select
                                            value={newRoomType.type}
                                            onValueChange={(value) => setNewRoomType(prev => ({ ...prev, type: value as RoomType['type'] }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="room">Cômodo</SelectItem>
                                                <SelectItem value="area">Área</SelectItem>
                                                <SelectItem value="exterior">Exterior</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Descrição</Label>
                                    <Textarea
                                        placeholder="Descrição opcional do cômodo..."
                                        value={newRoomType.description}
                                        onChange={(e) => setNewRoomType(prev => ({ ...prev, description: e.target.value }))}
                                        rows={2}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Escopo Padrão</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {DEFAULT_SCOPE_OPTIONS.map((item) => (
                                            <Badge
                                                key={item}
                                                variant={newRoomType.defaultScope.includes(item) ? 'default' : 'outline'}
                                                className="cursor-pointer"
                                                onClick={() => setNewRoomType(prev => ({
                                                    ...prev,
                                                    defaultScope: toggleScopeItem(prev.defaultScope, item)
                                                }))}
                                            >
                                                {item}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => {
                                    setIsAddingRoomType(false);
                                    setNewRoomType({ name: '', description: '', type: 'room', defaultScope: ['Paredes'] });
                                }}>
                                    Cancelar
                                </Button>
                                <Button onClick={handleAddRoomType}>
                                    Criar Cômodo
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Edit Room Type Form */}
                    {editingRoomType && (
                        <div className="border rounded-lg p-4 space-y-4 bg-blue-50">
                            <h4 className="font-medium">Editando: {editingRoomType.name}</h4>
                            <div className="grid gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Nome *</Label>
                                        <Input
                                            value={editingRoomType.name}
                                            onChange={(e) => setEditingRoomType(prev => prev ? { ...prev, name: e.target.value } : null)}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Tipo</Label>
                                        <Select
                                            value={editingRoomType.type}
                                            onValueChange={(value) => setEditingRoomType(prev => prev ? { ...prev, type: value as RoomType['type'] } : null)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="room">Cômodo</SelectItem>
                                                <SelectItem value="area">Área</SelectItem>
                                                <SelectItem value="exterior">Exterior</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Descrição</Label>
                                    <Textarea
                                        value={editingRoomType.description || ''}
                                        onChange={(e) => setEditingRoomType(prev => prev ? { ...prev, description: e.target.value } : null)}
                                        rows={2}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Escopo Padrão</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {DEFAULT_SCOPE_OPTIONS.map((item) => (
                                            <Badge
                                                key={item}
                                                variant={editingRoomType.defaultScope.includes(item) ? 'default' : 'outline'}
                                                className="cursor-pointer"
                                                onClick={() => setEditingRoomType(prev => prev ? {
                                                    ...prev,
                                                    defaultScope: toggleScopeItem(prev.defaultScope, item)
                                                } : null)}
                                            >
                                                {item}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        checked={editingRoomType.isActive}
                                        onChange={(e) => setEditingRoomType(prev => prev ? { ...prev, isActive: e.target.checked } : null)}
                                        className="rounded"
                                    />
                                    <Label htmlFor="isActive">Ativo (aparece nas opções)</Label>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setEditingRoomType(null)}>
                                    Cancelar
                                </Button>
                                <Button onClick={handleUpdateRoomType}>
                                    Salvar Alterações
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Room Types List */}
                    {isLoadingRoomTypes ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                        </div>
                    ) : roomTypes.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <Home className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>Nenhum cômodo cadastrado</p>
                            <p className="text-sm">Adicione cômodos para usar nas suas ordens de serviço</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Descrição</TableHead>
                                    <TableHead>Escopo Padrão</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-[100px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {roomTypes.map((roomType) => (
                                    <TableRow key={roomType.id} className={!roomType.isActive ? 'opacity-50' : ''}>
                                        <TableCell className="font-medium">{roomType.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {ROOM_TYPE_TYPE_LABELS[roomType.type]}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate text-slate-500">
                                            {roomType.description || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {roomType.defaultScope.slice(0, 3).map((item) => (
                                                    <Badge key={item} variant="secondary" className="text-xs">
                                                        {item}
                                                    </Badge>
                                                ))}
                                                {roomType.defaultScope.length > 3 && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        +{roomType.defaultScope.length - 3}
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={roomType.isActive ? 'default' : 'secondary'}>
                                                {roomType.isActive ? 'Ativo' : 'Inativo'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setEditingRoomType(roomType)}
                                                    title="Editar"
                                                >
                                                    <Pencil className="h-4 w-4 text-blue-500" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteRoomType(roomType.id)}
                                                    title="Excluir"
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* OS Templates Management */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Templates de OS
                            </CardTitle>
                            <CardDescription>
                                Crie templates com configurações padrão para suas ordens de serviço
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isLoadingTemplates ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                        </div>
                    ) : osTemplates.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>Nenhum template cadastrado</p>
                            <p className="text-sm">Templates são criados automaticamente ao salvar uma OS como template</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {osTemplates.map((template) => (
                                <div
                                    key={template.id}
                                    className={`flex items-center justify-between p-4 border rounded-lg ${
                                        template.isDefault ? 'border-blue-300 bg-blue-50' : 'bg-white'
                                    }`}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-medium">{template.name}</h4>
                                            {template.isDefault && (
                                                <Badge variant="secondary" className="gap-1">
                                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                    Padrão
                                                </Badge>
                                            )}
                                        </div>
                                        {template.description && (
                                            <p className="text-sm text-slate-500 mt-1">{template.description}</p>
                                        )}
                                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <Home className="h-3 w-3" />
                                                {template.rooms?.length || 0} cômodos
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Copy className="h-3 w-3" />
                                                {template.tasks?.length || 0} tarefas
                                            </span>
                                            {template.estimatedDuration && (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {template.estimatedDuration}h
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {!template.isDefault && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleSetDefaultTemplate(template.id)}
                                                title="Definir como padrão"
                                                className="gap-1"
                                            >
                                                <Star className="h-4 w-4" />
                                                Usar como Padrão
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteTemplate(template.id)}
                                            title="Excluir template"
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <p className="text-xs text-slate-500 text-center pt-2">
                        Para criar um novo template, configure uma OS e clique em &quot;Salvar como Template&quot;
                    </p>
                </CardContent>
            </Card>

            {/* Business Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building className="h-5 w-5" />
                        Dados da Empresa
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="companyName">Nome da Empresa</Label>
                        <Input
                            id="companyName"
                            value={settings.companyName}
                            onChange={(e) => setSettings(prev => ({ ...prev, companyName: e.target.value }))}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Moeda</Label>
                            <Select
                                value={settings.currency}
                                onValueChange={(value) => setSettings(prev => ({ ...prev, currency: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="USD">USD ($)</SelectItem>
                                    <SelectItem value="BRL">BRL (R$)</SelectItem>
                                    <SelectItem value="EUR">EUR (€)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Formato de Data</Label>
                            <Select
                                value={settings.dateFormat}
                                onValueChange={(value) => setSettings(prev => ({ ...prev, dateFormat: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Financial Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Configurações Financeiras
                    </CardTitle>
                    <CardDescription>
                        Defina os padrões para cálculos de trabalhos
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="depositPct">Depósito Padrão (%)</Label>
                            <Input
                                id="depositPct"
                                type="number"
                                value={settings.defaultDepositPct}
                                onChange={(e) => setSettings(prev => ({ ...prev, defaultDepositPct: Number(e.target.value) }))}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="marginPct">Margem Bruta Alvo (%)</Label>
                            <Input
                                id="marginPct"
                                type="number"
                                value={settings.targetGrossMarginPct}
                                onChange={(e) => setSettings(prev => ({ ...prev, targetGrossMarginPct: Number(e.target.value) }))}
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="minProfit">Lucro Bruto Mínimo por Trabalho ($)</Label>
                        <Input
                            id="minProfit"
                            type="number"
                            value={settings.minGrossProfitPerJob}
                            onChange={(e) => setSettings(prev => ({ ...prev, minGrossProfitPerJob: Number(e.target.value) }))}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Commission Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Percent className="h-5 w-5" />
                        Comissões Padrão
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="salesComm">Comissão Vendas (%)</Label>
                            <Input
                                id="salesComm"
                                type="number"
                                value={settings.salesCommissionPct}
                                onChange={(e) => setSettings(prev => ({ ...prev, salesCommissionPct: Number(e.target.value) }))}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="pmComm">Comissão PM (%)</Label>
                            <Input
                                id="pmComm"
                                type="number"
                                value={settings.pmCommissionPct}
                                onChange={(e) => setSettings(prev => ({ ...prev, pmCommissionPct: Number(e.target.value) }))}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Marketing Channels */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Megaphone className="h-5 w-5" />
                        Canais de Marketing
                    </CardTitle>
                    <CardDescription>
                        Defina os canais de origem dos seus leads
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        {settings.marketingChannels?.map((channel, index) => (
                            <div key={channel.id} className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded-full ${channel.color}`} />
                                <Input
                                    value={channel.label}
                                    onChange={(e) => {
                                        const newChannels = [...(settings.marketingChannels || [])];
                                        newChannels[index].label = e.target.value;
                                        setSettings(prev => ({ ...prev, marketingChannels: newChannels }));
                                    }}
                                    className="flex-1"
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        const newChannels = settings.marketingChannels?.filter((_, i) => i !== index);
                                        setSettings(prev => ({ ...prev, marketingChannels: newChannels }));
                                    }}
                                    disabled={(settings.marketingChannels?.length || 0) <= 1}
                                >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            </div>
                        ))}
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => {
                            const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-yellow-500', 'bg-cyan-500', 'bg-indigo-500'];
                            const randomColor = colors[Math.floor(Math.random() * colors.length)];
                            const newChannel = {
                                id: `custom_${Date.now()}`,
                                label: 'Novo Canal',
                                color: randomColor
                            };
                            setSettings(prev => ({
                                ...prev,
                                marketingChannels: [...(prev.marketingChannels || []), newChannel]
                            }));
                        }}
                        className="w-full"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Canal
                    </Button>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                    <Save className="h-4 w-4" />
                    {isSaving ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
            </div>

            {/* Invite User Dialog */}
            <InviteUserDialog
                open={inviteDialogOpen}
                onOpenChange={setInviteDialogOpen}
                onUserCreated={loadUsers}
            />
        </div>
    );
}
