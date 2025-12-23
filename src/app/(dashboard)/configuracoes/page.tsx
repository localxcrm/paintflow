'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Settings, DollarSign, Percent, Building, Save, Megaphone, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

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

export default function ConfiguracoesPage() {
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

    useEffect(() => {
        const stored = localStorage.getItem('paintflow_settings');
        if (stored) {
            setSettings(JSON.parse(stored));
        }
    }, []);

    const handleSave = () => {
        setIsSaving(true);
        localStorage.setItem('paintflow_settings', JSON.stringify(settings));

        setTimeout(() => {
            setIsSaving(false);
            toast.success('Configurações salvas com sucesso!');
        }, 500);
    };

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>
                <p className="text-slate-500">Configure seu negócio e preferências</p>
            </div>

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
        </div>
    );
}
