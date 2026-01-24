'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { formatPhoneUS } from '@/lib/utils/phone';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, Save, Lock, Eye, EyeOff, Loader2, Link2, Unlink } from 'lucide-react';
import { toast } from 'sonner';

interface UserProfile {
    id: string;
    name: string;
    email: string;
    phone: string;
}

interface GhlStatus {
    isLinked: boolean;
    ghlUserId: string | null;
    ghlLocationId: string | null;
    ghlLinkedAt: string | null;
}

export default function PerfilPage() {
    const [profile, setProfile] = useState<UserProfile>({
        id: '',
        name: '',
        email: '',
        phone: '',
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // GHL status
    const [ghlStatus, setGhlStatus] = useState<GhlStatus | null>(null);
    const [isUnlinkingGhl, setIsUnlinkingGhl] = useState(false);
    const [unlinkPassword, setUnlinkPassword] = useState('');
    const [showUnlinkPassword, setShowUnlinkPassword] = useState(false);

    // Password change state
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    useEffect(() => {
        loadProfile();
        loadGhlStatus();
    }, []);

    const loadProfile = async () => {
        try {
            const res = await fetch('/api/users/profile');
            if (res.ok) {
                const data = await res.json();
                setProfile({
                    id: data.user.id,
                    name: data.user.name || '',
                    email: data.user.email || '',
                    phone: formatPhoneUS(data.user.phone) || '',
                });
            } else {
                // Fallback to localStorage if API fails
                const stored = localStorage.getItem('paintpro_user');
                if (stored) {
                    try {
                        const user = JSON.parse(stored);
                        setProfile({
                            id: user.id || '',
                            name: user.name || '',
                            email: user.email || '',
                            phone: formatPhoneUS(user.phone) || '',
                        });
                    } catch {
                        // Invalid JSON in localStorage
                    }
                }
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            toast.error('Erro ao carregar perfil');
        } finally {
            setIsLoading(false);
        }
    };

    const loadGhlStatus = async () => {
        try {
            const res = await fetch('/api/users/ghl-status');
            if (res.ok) {
                const data = await res.json();
                setGhlStatus(data);
            }
        } catch (error) {
            console.error('Error loading GHL status:', error);
        }
    };

    const handleUnlinkGhl = async () => {
        if (!unlinkPassword) {
            toast.error('Digite sua senha para desvincular');
            return;
        }

        setIsUnlinkingGhl(true);

        try {
            const res = await fetch('/api/users/ghl-unlink', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: unlinkPassword }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Erro ao desvincular');
            }

            setGhlStatus({ isLinked: false, ghlUserId: null, ghlLocationId: null, ghlLinkedAt: null });
            setUnlinkPassword('');
            toast.success('Conta GoHighLevel desvinculada com sucesso!');
        } catch (error) {
            console.error('Error unlinking GHL:', error);
            toast.error(error instanceof Error ? error.message : 'Erro ao desvincular');
        } finally {
            setIsUnlinkingGhl(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);

        try {
            const res = await fetch('/api/users/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: profile.name,
                    phone: profile.phone,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Erro ao salvar');
            }

            // Update localStorage for header sync
            const stored = localStorage.getItem('paintpro_user');
            try {
                const user = stored ? JSON.parse(stored) : {};
                localStorage.setItem('paintpro_user', JSON.stringify({
                    ...user,
                    name: profile.name,
                    phone: profile.phone,
                }));
            } catch {
                // Ignore localStorage errors
            }

            toast.success('Perfil atualizado com sucesso!');
        } catch (error) {
            console.error('Error saving profile:', error);
            toast.error(error instanceof Error ? error.message : 'Erro ao salvar perfil');
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async () => {
        // Validation
        if (!passwordData.currentPassword) {
            toast.error('Digite a senha atual');
            return;
        }

        if (!passwordData.newPassword) {
            toast.error('Digite a nova senha');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            toast.error('A nova senha deve ter pelo menos 6 caracteres');
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('As senhas não coincidem');
            return;
        }

        setIsChangingPassword(true);

        try {
            const res = await fetch('/api/users/password', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Erro ao alterar senha');
            }

            // Clear password fields
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });

            toast.success('Senha alterada com sucesso!');
        } catch (error) {
            console.error('Error changing password:', error);
            toast.error(error instanceof Error ? error.message : 'Erro ao alterar senha');
        } finally {
            setIsChangingPassword(false);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || 'U';
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Meu Perfil</h1>
                <p className="text-slate-500">Gerencie suas informações pessoais</p>
            </div>

            {/* Personal Info Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Informações Pessoais
                    </CardTitle>
                    <CardDescription>
                        Atualize seus dados de contato
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Avatar */}
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                            <AvatarFallback className="bg-blue-600 text-white text-2xl">
                                {getInitials(profile.name)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-medium">{profile.name || 'Seu Nome'}</p>
                            <p className="text-sm text-slate-500">{profile.email}</p>
                        </div>
                    </div>

                    <Separator />

                    {/* Form */}
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name" className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Nome Completo
                            </Label>
                            <Input
                                id="name"
                                value={profile.name}
                                onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Seu nome"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email" className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={profile.email}
                                disabled
                                className="bg-slate-50"
                            />
                            <p className="text-xs text-slate-500">
                                O email não pode ser alterado
                            </p>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="phone" className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                Telefone
                            </Label>
                            <PhoneInput
                                id="phone"
                                value={profile.phone}
                                onChange={(value) => setProfile(prev => ({ ...prev, phone: value }))}
                                placeholder="(555) 123-4567"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                            {isSaving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Password Change Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5" />
                        Alterar Senha
                    </CardTitle>
                    <CardDescription>
                        Atualize sua senha de acesso
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="currentPassword">Senha Atual</Label>
                        <div className="relative">
                            <Input
                                id="currentPassword"
                                type={showPasswords.current ? 'text' : 'password'}
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                                placeholder="Digite sua senha atual"
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="newPassword">Nova Senha</Label>
                        <div className="relative">
                            <Input
                                id="newPassword"
                                type={showPasswords.new ? 'text' : 'password'}
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                                placeholder="Mínimo 6 caracteres"
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                        <div className="relative">
                            <Input
                                id="confirmPassword"
                                type={showPasswords.confirm ? 'text' : 'password'}
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                placeholder="Digite novamente a nova senha"
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button
                            onClick={handleChangePassword}
                            disabled={isChangingPassword}
                            variant="outline"
                            className="gap-2"
                        >
                            {isChangingPassword ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Lock className="h-4 w-4" />
                            )}
                            {isChangingPassword ? 'Alterando...' : 'Alterar Senha'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* GoHighLevel Integration Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Link2 className="h-5 w-5" />
                        Integracao GoHighLevel
                    </CardTitle>
                    <CardDescription>
                        Gerencie sua conexao com o GoHighLevel
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {ghlStatus?.isLinked ? (
                        <>
                            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                                <Badge variant="default" className="bg-green-600">
                                    Vinculado
                                </Badge>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-green-800">
                                        Conta vinculada ao GoHighLevel
                                    </p>
                                    {ghlStatus.ghlLinkedAt && (
                                        <p className="text-xs text-green-600">
                                            Vinculado em {new Date(ghlStatus.ghlLinkedAt).toLocaleDateString('pt-BR')}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-3">
                                <p className="text-sm text-slate-600">
                                    Para desvincular sua conta do GoHighLevel, digite sua senha:
                                </p>
                                <div className="relative">
                                    <Input
                                        type={showUnlinkPassword ? 'text' : 'password'}
                                        value={unlinkPassword}
                                        onChange={(e) => setUnlinkPassword(e.target.value)}
                                        placeholder="Digite sua senha"
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowUnlinkPassword(!showUnlinkPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showUnlinkPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                <div className="flex justify-end">
                                    <Button
                                        onClick={handleUnlinkGhl}
                                        disabled={isUnlinkingGhl}
                                        variant="destructive"
                                        className="gap-2"
                                    >
                                        {isUnlinkingGhl ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Unlink className="h-4 w-4" />
                                        )}
                                        {isUnlinkingGhl ? 'Desvinculando...' : 'Desvincular'}
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <Badge variant="outline" className="text-slate-500">
                                Nao Vinculado
                            </Badge>
                            <div className="flex-1">
                                <p className="text-sm text-slate-600">
                                    Sua conta nao esta vinculada ao GoHighLevel.
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    Acesse pelo menu do GoHighLevel para vincular automaticamente.
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
