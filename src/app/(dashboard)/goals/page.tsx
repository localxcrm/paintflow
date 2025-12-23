'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Target,
  Calculator,
  CheckCircle2,
  Circle,
  Save,
  Settings,
  Mountain,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRocks } from '@/hooks/useRocks';

// Preset targets
const PRESETS = [
  { label: '$500K', value: 500000 },
  { label: '$1M', value: 1000000 },
  { label: '$1.5M', value: 1500000 },
  { label: '$2M', value: 2000000 },
];

interface FormulaParams {
  avgTicket: number;
  leadConversionRate: number; // Lead → Estimate %
  closingRate: number; // Estimate → Sale %
  marketingPercent: number;
  productionWeeks: number;
}

// Calculate goals based on annual revenue target and formula parameters
function calculateGoals(annualTarget: number, params: FormulaParams) {
  const { avgTicket, leadConversionRate, closingRate, marketingPercent, productionWeeks } = params;

  const jobsPerYear = Math.round(annualTarget / avgTicket);
  const jobsPerWeek = jobsPerYear / productionWeeks;

  // Calculate estimates needed based on closing rate (Estimate → Sale)
  const estimatesPerYear = Math.round(jobsPerYear / (closingRate / 100));

  // Calculate leads needed based on lead conversion rate (Lead → Estimate)
  const leadsPerYear = Math.round(estimatesPerYear / (leadConversionRate / 100));
  const leadsPerWeek = Math.round(leadsPerYear / productionWeeks);
  const estimatesPerWeek = Math.round(estimatesPerYear / productionWeeks);

  const revenuePerWeek = annualTarget / productionWeeks;
  const marketingAnnual = annualTarget * (marketingPercent / 100);

  return {
    annual: {
      revenue: annualTarget,
      jobs: jobsPerYear,
      estimates: estimatesPerYear,
      leads: leadsPerYear,
      marketing: marketingAnnual,
    },
    monthly: {
      revenue: Math.round(annualTarget / 12),
      jobs: Math.round(jobsPerYear / 12),
      estimates: Math.round(estimatesPerYear / 12),
      leads: Math.round(leadsPerYear / 12),
      marketing: Math.round(marketingAnnual / 12),
    },
    weekly: {
      revenue: Math.round(revenuePerWeek),
      jobs: Math.round(jobsPerWeek * 10) / 10,
      estimates: estimatesPerWeek,
      leads: leadsPerWeek,
      marketing: Math.round(marketingAnnual / 52),
    },
    quarterly: {
      revenue: Math.round(annualTarget / 4),
      jobs: Math.round(jobsPerYear / 4),
      estimates: Math.round(estimatesPerYear / 4),
      leads: Math.round(leadsPerYear / 4),
      marketing: Math.round(marketingAnnual / 4),
    },
  };
}

function formatCurrency(value: number, compact = false) {
  if (compact && value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (compact && value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toLocaleString('en-US')}`;
}

interface VTOData {
  annualTarget: number;
  formulaParams: FormulaParams;
  coreValues: string;
  coreFocus: string;
  tenYearTarget: string;
  threeYearPicture: string;
}

const defaultVTO: VTOData = {
  annualTarget: 1000000,
  formulaParams: {
    avgTicket: 9500,
    leadConversionRate: 85, // Lead → Estimate (default 85%)
    closingRate: 30, // Estimate → Sale (default 30%)
    marketingPercent: 8,
    productionWeeks: 35,
  },
  coreValues: '',
  coreFocus: '',
  tenYearTarget: '',
  threeYearPicture: '',
};

export default function GoalsPage() {
  const [vto, setVto] = useState<VTOData>(defaultVTO);
  const [customTarget, setCustomTarget] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Get rocks from shared hook
  const { getCurrentQuarterRocks, currentQuarter, currentYear, updateStatus } = useRocks();
  const quarterRocks = getCurrentQuarterRocks();

  const goals = calculateGoals(vto.annualTarget, vto.formulaParams);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('paintpro_vto');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge with defaults to handle missing fields from old saves
        // Remove old rocks field if present (now using shared rocks)
        const { rocks, ...rest } = parsed;
        setVto({
          ...defaultVTO,
          ...rest,
          formulaParams: {
            ...defaultVTO.formulaParams,
            ...parsed.formulaParams,
          },
        });
      } catch (e) {
        console.error('Error loading VTO:', e);
      }
    }
  }, []);

  // Save to localStorage
  const handleSave = () => {
    setIsSaving(true);
    try {
      localStorage.setItem('paintpro_vto', JSON.stringify(vto));
      toast.success('Configuracoes salvas!');
    } catch (e) {
      toast.error('Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePresetClick = (value: number) => {
    setVto({ ...vto, annualTarget: value });
    setCustomTarget('');
  };

  const handleCustomTarget = () => {
    const value = parseInt(customTarget.replace(/[^0-9]/g, ''));
    if (value && value > 0) {
      setVto({ ...vto, annualTarget: value });
    }
  };

  const updateFormulaParam = (key: keyof FormulaParams, value: number) => {
    setVto({
      ...vto,
      formulaParams: {
        ...vto.formulaParams,
        [key]: value,
      },
    });
  };

  // Rocks stats
  const completedRocks = quarterRocks.filter((r) => r.status === 'complete').length;
  const totalRocks = quarterRocks.length;
  const rocksProgress = totalRocks > 0 ? Math.round((completedRocks / totalRocks) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Blueprint 2026</h1>
          <p className="text-slate-500">Formula $1 Milhao - Configure sua meta anual</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>

      {/* Annual Target Selection */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-white">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <CardTitle>Meta de Faturamento Anual</CardTitle>
              <CardDescription>Selecione ou digite sua meta</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Preset Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PRESETS.map((preset) => (
              <Button
                key={preset.value}
                variant={vto.annualTarget === preset.value ? 'default' : 'outline'}
                className={`h-14 text-lg font-bold ${vto.annualTarget === preset.value
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'border-2'
                  }`}
                onClick={() => handlePresetClick(preset.value)}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Custom Input */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Ou digite um valor personalizado..."
                value={customTarget}
                onChange={(e) => setCustomTarget(e.target.value)}
                className="h-12"
              />
            </div>
            <Button onClick={handleCustomTarget} variant="outline" className="h-12">
              Aplicar
            </Button>
          </div>

          {/* Current Selection */}
          <div className="bg-white rounded-lg p-4 border">
            <p className="text-sm text-slate-500 mb-1">Meta selecionada:</p>
            <p className="text-4xl font-bold text-blue-600">
              {formatCurrency(vto.annualTarget)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Formula Parameters */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Settings className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <CardTitle>Parametros de Calculo</CardTitle>
              <CardDescription>Ajuste os valores base para calcular suas metas</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>Ticket Medio ($)</Label>
              <Input
                type="number"
                min="0"
                value={vto.formulaParams.avgTicket}
                onChange={(e) => updateFormulaParam('avgTicket', parseFloat(e.target.value) || 0)}
              />
              <p className="text-xs text-slate-500 mt-1">Valor medio por job</p>
            </div>
            <div>
              <Label>Lead → Orçamento (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={vto.formulaParams.leadConversionRate}
                onChange={(e) => updateFormulaParam('leadConversionRate', parseFloat(e.target.value) || 0)}
              />
              <p className="text-xs text-slate-500 mt-1">Taxa de conversão Lead → Orçamento</p>
            </div>
            <div>
              <Label>Orçamento → Venda (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={vto.formulaParams.closingRate}
                onChange={(e) => updateFormulaParam('closingRate', parseFloat(e.target.value) || 0)}
              />
              <p className="text-xs text-slate-500 mt-1">Taxa de fechamento</p>
            </div>
            <div>
              <Label>Marketing (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={vto.formulaParams.marketingPercent}
                onChange={(e) => updateFormulaParam('marketingPercent', parseFloat(e.target.value) || 0)}
              />
              <p className="text-xs text-slate-500 mt-1">% do faturamento</p>
            </div>
            <div>
              <Label>Semanas de Producao</Label>
              <Input
                type="number"
                min="1"
                max="52"
                value={vto.formulaParams.productionWeeks}
                onChange={(e) => updateFormulaParam('productionWeeks', parseInt(e.target.value) || 1)}
              />
              <p className="text-xs text-slate-500 mt-1">Semanas ativas/ano</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calculated Goals */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calculator className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <CardTitle>Metas Calculadas</CardTitle>
              <CardDescription>
                Ticket: {formatCurrency(vto.formulaParams.avgTicket)} | Fechamento: {vto.formulaParams.closingRate}% | Marketing: {vto.formulaParams.marketingPercent}% | {vto.formulaParams.productionWeeks} semanas
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-slate-500">Periodo</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-500">Faturamento</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-500">Jobs</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-500">Leads</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-500">Marketing</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-slate-50">
                  <td className="py-3 px-4 font-medium">Semanal</td>
                  <td className="py-3 px-4 text-right">{formatCurrency(goals.weekly.revenue, true)}</td>
                  <td className="py-3 px-4 text-right">{goals.weekly.jobs}</td>
                  <td className="py-3 px-4 text-right">{goals.weekly.leads}</td>
                  <td className="py-3 px-4 text-right">{formatCurrency(goals.weekly.marketing, true)}</td>
                </tr>
                <tr className="border-b hover:bg-slate-50">
                  <td className="py-3 px-4 font-medium">Mensal</td>
                  <td className="py-3 px-4 text-right">{formatCurrency(goals.monthly.revenue, true)}</td>
                  <td className="py-3 px-4 text-right">{goals.monthly.jobs}</td>
                  <td className="py-3 px-4 text-right">{goals.monthly.leads}</td>
                  <td className="py-3 px-4 text-right">{formatCurrency(goals.monthly.marketing, true)}</td>
                </tr>
                <tr className="border-b hover:bg-slate-50">
                  <td className="py-3 px-4 font-medium">Trimestral</td>
                  <td className="py-3 px-4 text-right">{formatCurrency(goals.quarterly.revenue, true)}</td>
                  <td className="py-3 px-4 text-right">{goals.quarterly.jobs}</td>
                  <td className="py-3 px-4 text-right">{goals.quarterly.leads}</td>
                  <td className="py-3 px-4 text-right">{formatCurrency(goals.quarterly.marketing, true)}</td>
                </tr>
                <tr className="bg-blue-50 font-bold">
                  <td className="py-3 px-4">Anual</td>
                  <td className="py-3 px-4 text-right text-blue-600">
                    {formatCurrency(goals.annual.revenue, true)}
                  </td>
                  <td className="py-3 px-4 text-right">{goals.annual.jobs}</td>
                  <td className="py-3 px-4 text-right">{goals.annual.leads}</td>
                  <td className="py-3 px-4 text-right">{formatCurrency(goals.annual.marketing, true)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quarterly Rocks Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Mountain className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <CardTitle>Rocks Q{currentQuarter} {currentYear}</CardTitle>
                <CardDescription>
                  {completedRocks} de {totalRocks} concluidos ({rocksProgress}%)
                </CardDescription>
              </div>
            </div>
            <Link href="/rocks">
              <Button variant="outline" size="sm">
                Gerenciar Rocks
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Progress value={rocksProgress} className="h-2" />
          </div>
          <div className="space-y-2">
            {quarterRocks.slice(0, 5).map((rock) => (
              <div
                key={rock.id}
                className="flex items-center gap-3 p-2 rounded hover:bg-slate-50"
              >
                <button
                  onClick={() =>
                    updateStatus(rock.id, rock.status === 'complete' ? 'on_track' : 'complete')
                  }
                  className="flex-shrink-0"
                >
                  {rock.status === 'complete' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300 hover:text-slate-400" />
                  )}
                </button>
                <span
                  className={`flex-1 text-sm ${rock.status === 'complete' ? 'line-through text-slate-400' : 'text-slate-700'
                    }`}
                >
                  {rock.title}
                </span>
                {rock.progress > 0 && (
                  <span className="text-xs text-slate-500">{rock.progress}%</span>
                )}
              </div>
            ))}
            {quarterRocks.length === 0 && (
              <p className="text-center text-slate-500 py-4">
                Nenhum rock para este trimestre.{' '}
                <Link href="/rocks" className="text-blue-600 hover:underline">
                  Adicionar rocks
                </Link>
              </p>
            )}
            {quarterRocks.length > 5 && (
              <Link
                href="/rocks"
                className="block text-center text-sm text-blue-600 hover:underline pt-2"
              >
                Ver todos os {quarterRocks.length} rocks
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* VTO Details */}
      <Card>
        <CardHeader>
          <CardTitle>Visao & Valores (VTO)</CardTitle>
          <CardDescription>Defina a visao de longo prazo do seu negocio</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Valores Fundamentais</Label>
              <Textarea
                value={vto.coreValues}
                onChange={(e) => setVto({ ...vto, coreValues: e.target.value })}
                placeholder="Ex: Qualidade, Integridade, Confiabilidade..."
                rows={3}
              />
            </div>
            <div>
              <Label>Foco Principal</Label>
              <Textarea
                value={vto.coreFocus}
                onChange={(e) => setVto({ ...vto, coreFocus: e.target.value })}
                placeholder="O que fazemos: Pintura Residencial e Comercial&#10;Quem servimos: Proprietarios em [Cidade]"
                rows={3}
              />
            </div>
            <div>
              <Label>Meta 10 Anos</Label>
              <Textarea
                value={vto.tenYearTarget}
                onChange={(e) => setVto({ ...vto, tenYearTarget: e.target.value })}
                placeholder="Ex: $10M faturamento, 50 funcionarios..."
                rows={3}
              />
            </div>
            <div>
              <Label>Visao 3 Anos</Label>
              <Textarea
                value={vto.threeYearPicture}
                onChange={(e) => setVto({ ...vto, threeYearPicture: e.target.value })}
                placeholder="Ex: $3M faturamento, 15 funcionarios, 2 equipes..."
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formula Reference */}
      <Card className="bg-slate-50">
        <CardContent className="p-4">
          <h3 className="font-semibold text-slate-700 mb-3">Como as metas sao calculadas</h3>
          <div className="text-sm text-slate-600 space-y-2">
            <p>
              <strong>Jobs = Faturamento / Ticket Medio</strong> ({formatCurrency(vto.annualTarget)} / {formatCurrency(vto.formulaParams.avgTicket)} = {goals.annual.jobs} jobs)
            </p>
            <p>
              <strong>Leads = Jobs / Taxa de Fechamento</strong> ({goals.annual.jobs} / {vto.formulaParams.closingRate}% = {goals.annual.leads} leads)
            </p>
            <p>
              <strong>Marketing = {vto.formulaParams.marketingPercent}% do Faturamento</strong> ({formatCurrency(goals.annual.marketing)}/ano)
            </p>
            <p>
              <strong>Metas semanais = Anual / {vto.formulaParams.productionWeeks} semanas</strong>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
