'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Phone, Building, Save } from 'lucide-react';
import { toast } from 'sonner';

interface UserProfile {
    name: string;
    email: string;
    phone: string;
    company: string;
}

export default function PerfilPage() {
    const [profile, setProfile] = useState<UserProfile>({
        name: '',
        email: '',
        phone: '',
        company: '',
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        // Load from localStorage
        const stored = localStorage.getItem('paintpro_user');
        if (stored) {
            const user = JSON.parse(stored);
            setProfile({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                company: user.company || 'PaintFlow Demo',
            });
        }
    }, []);

    const handleSave = () => {
        setIsSaving(true);

        // Save to localStorage
        const stored = localStorage.getItem('paintpro_user');
        const user = stored ? JSON.parse(stored) : {};
        localStorage.setItem('paintpro_user', JSON.stringify({
            ...user,
            ...profile,
        }));

        setTimeout(() => {
            setIsSaving(false);
            toast.success('Perfil atualizado com sucesso!');
        }, 500);
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || 'U';
    };

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Meu Perfil</h1>
                <p className="text-slate-500">Gerencie suas informações pessoais</p>
            </div>

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
                                onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                                placeholder="seu@email.com"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="phone" className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                Telefone
                            </Label>
                            <Input
                                id="phone"
                                value={profile.phone}
                                onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                                placeholder="(11) 99999-9999"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="company" className="flex items-center gap-2">
                                <Building className="h-4 w-4" />
                                Empresa
                            </Label>
                            <Input
                                id="company"
                                value={profile.company}
                                onChange={(e) => setProfile(prev => ({ ...prev, company: e.target.value }))}
                                placeholder="Nome da sua empresa"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                            <Save className="h-4 w-4" />
                            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
