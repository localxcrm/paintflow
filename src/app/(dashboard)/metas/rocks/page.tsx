'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Mountain,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Circle,
  ArrowLeft,
  Loader2,
  Target,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

// Types
type RockStatus = 'on_track' | 'off_track' | 'complete' | 'dropped';
type RockType = 'company' | 'individual';

interface Milestone {
  id: string;
  title: string;
  completed: boolean;
}

interface Rock {
  id: string;
  title: string;
  description: string | null;
  owner: string;
  rockType: RockType;
  quarter: number;
  year: number;
  status: RockStatus;
  dueDate: string;
  milestones: Milestone[];
  statusHistory: { from: RockStatus; to: RockStatus; date: string; note?: string }[];
  createdAt: string;
  updatedAt: string;
}

const STATUS_CONFIG: Record<RockStatus, { label: string; color: string; bg: string }> = {
  on_track: { label: 'No Caminho', color: 'text-green-700', bg: 'bg-green-100' },
  off_track: { label: 'Fora do Caminho', color: 'text-red-700', bg: 'bg-red-100' },
  complete: { label: 'Concluido', color: 'text-blue-700', bg: 'bg-blue-100' },
  dropped: { label: 'Abandonado', color: 'text-slate-700', bg: 'bg-slate-100' },
};

function getCurrentQuarter(): number {
  return Math.ceil((new Date().getMonth() + 1) / 3);
}

function getCurrentYear(): number {
  return new Date().getFullYear();
}

function getQuarterEndDate(quarter: number, year: number): string {
  const monthEnd = quarter * 3;
  const lastDay = new Date(year, monthEnd, 0).getDate();
  return `${year}-${String(monthEnd).padStart(2, '0')}-${lastDay}`;
}

export default function RocksPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [rocks, setRocks] = useState<Rock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRock, setEditingRock] = useState<Rock | null>(null);
  const [newMilestone, setNewMilestone] = useState('');

  const currentQuarter = getCurrentQuarter();
  const currentYear = getCurrentYear();

  // Check for ?new=1 query param to auto-open dialog
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setIsDialogOpen(true);
      // Remove the query param from URL without navigation
      router.replace('/metas/rocks', { scroll: false });
    }
  }, [searchParams, router]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    owner: '',
    rockType: 'company' as RockType,
    quarter: currentQuarter,
    year: currentYear,
    status: 'on_track' as RockStatus,
    dueDate: getQuarterEndDate(currentQuarter, currentYear),
    milestones: [] as Milestone[],
  });

  // Fetch rocks from API
  const fetchRocks = useCallback(async () => {
    try {
      const res = await fetch(`/api/rocks?quarter=${currentQuarter}&year=${currentYear}`);
      if (res.ok) {
        const data = await res.json();
        setRocks(data.rocks || []);
      }
    } catch (error) {
      console.error('Error fetching rocks:', error);
      toast.error('Erro ao carregar rocks');
    } finally {
      setIsLoading(false);
    }
  }, [currentQuarter, currentYear]);

  useEffect(() => {
    fetchRocks();
  }, [fetchRocks]);

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      owner: '',
      rockType: 'company',
      quarter: currentQuarter,
      year: currentYear,
      status: 'on_track',
      dueDate: getQuarterEndDate(currentQuarter, currentYear),
      milestones: [],
    });
    setEditingRock(null);
    setNewMilestone('');
  };

  // Open dialog for new rock
  const openNewRockDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // Open dialog for editing
  const openEditDialog = (rock: Rock) => {
    setEditingRock(rock);
    setFormData({
      title: rock.title,
      description: rock.description || '',
      owner: rock.owner,
      rockType: rock.rockType,
      quarter: rock.quarter,
      year: rock.year,
      status: rock.status,
      dueDate: rock.dueDate,
      milestones: rock.milestones || [],
    });
    setIsDialogOpen(true);
  };

  // Add milestone to form
  const addMilestone = () => {
    if (newMilestone.trim()) {
      setFormData({
        ...formData,
        milestones: [
          ...formData.milestones,
          { id: Date.now().toString(), title: newMilestone.trim(), completed: false },
        ],
      });
      setNewMilestone('');
    }
  };

  // Remove milestone from form
  const removeMilestone = (id: string) => {
    setFormData({
      ...formData,
      milestones: formData.milestones.filter((m) => m.id !== id),
    });
  };

  // Save rock
  const handleSave = async () => {
    if (!formData.title || !formData.owner) {
      toast.error('Titulo e responsavel sao obrigatorios');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        id: editingRock?.id,
        statusHistory: editingRock?.statusHistory || [],
      };

      const method = editingRock ? 'PUT' : 'POST';
      const res = await fetch('/api/rocks', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editingRock ? 'Rock atualizado!' : 'Rock criado!');
        setIsDialogOpen(false);
        resetForm();
        fetchRocks();
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving rock:', error);
      toast.error('Erro ao salvar rock');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete rock
  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este rock?')) return;

    try {
      const res = await fetch(`/api/rocks?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Rock excluido');
        fetchRocks();
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting rock:', error);
      toast.error('Erro ao excluir rock');
    }
  };

  // Toggle milestone completion
  const toggleMilestone = async (rock: Rock, milestoneId: string) => {
    const updatedMilestones = rock.milestones.map((m) =>
      m.id === milestoneId ? { ...m, completed: !m.completed } : m
    );

    try {
      const res = await fetch('/api/rocks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: rock.id,
          milestones: updatedMilestones,
        }),
      });

      if (res.ok) {
        fetchRocks();
      }
    } catch (error) {
      console.error('Error toggling milestone:', error);
    }
  };

  // Update rock status
  const updateStatus = async (rock: Rock, newStatus: RockStatus) => {
    try {
      const statusHistory = [
        ...(rock.statusHistory || []),
        { from: rock.status, to: newStatus, date: new Date().toISOString() },
      ];

      const res = await fetch('/api/rocks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: rock.id,
          status: newStatus,
          statusHistory,
        }),
      });

      if (res.ok) {
        toast.success('Status atualizado');
        fetchRocks();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  // Calculate progress
  const calculateProgress = (milestones: Milestone[]) => {
    if (!milestones || milestones.length === 0) return 0;
    const completed = milestones.filter((m) => m.completed).length;
    return Math.round((completed / milestones.length) * 100);
  };

  // Stats
  const completedRocks = rocks.filter((r) => r.status === 'complete').length;
  const totalRocks = rocks.length;
  const overallProgress = totalRocks > 0 ? Math.round((completedRocks / totalRocks) * 100) : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0D5C75]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/metas">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Rocks Q{currentQuarter} {currentYear}</h1>
            <p className="text-slate-500">
              {completedRocks} de {totalRocks} concluidos ({overallProgress}%)
            </p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewRockDialog} className="bg-[#0D5C75] hover:bg-[#094A5E]">
              <Plus className="w-4 h-4 mr-2" />
              Novo Rock
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRock ? 'Editar Rock' : 'Novo Rock'}</DialogTitle>
              <DialogDescription>
                Rocks sao metas trimestrais importantes para o negocio
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label>Titulo *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Contratar 2 pintores"
                />
              </div>

              <div>
                <Label>Descricao</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detalhes do rock..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Responsavel *</Label>
                  <Input
                    value={formData.owner}
                    onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                    placeholder="Nome"
                  />
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select
                    value={formData.rockType}
                    onValueChange={(v) => setFormData({ ...formData, rockType: v as RockType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="company">Empresa</SelectItem>
                      <SelectItem value="individual">Individual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Trimestre</Label>
                  <Select
                    value={formData.quarter.toString()}
                    onValueChange={(v) => setFormData({ ...formData, quarter: parseInt(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Q1</SelectItem>
                      <SelectItem value="2">Q2</SelectItem>
                      <SelectItem value="3">Q3</SelectItem>
                      <SelectItem value="4">Q4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Ano</Label>
                  <Select
                    value={formData.year.toString()}
                    onValueChange={(v) => setFormData({ ...formData, year: parseInt(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={(currentYear - 1).toString()}>{currentYear - 1}</SelectItem>
                      <SelectItem value={currentYear.toString()}>{currentYear}</SelectItem>
                      <SelectItem value={(currentYear + 1).toString()}>{currentYear + 1}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v) => setFormData({ ...formData, status: v as RockStatus })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Data Limite</Label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>

              {/* Milestones */}
              <div>
                <Label>Milestones</Label>
                <div className="space-y-2 mt-2">
                  {formData.milestones.map((m) => (
                    <div key={m.id} className="flex items-center gap-2 bg-slate-50 p-2 rounded">
                      <Circle className="w-4 h-4 text-slate-400" />
                      <span className="flex-1 text-sm">{m.title}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeMilestone(m.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      value={newMilestone}
                      onChange={(e) => setNewMilestone(e.target.value)}
                      placeholder="Adicionar milestone..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addMilestone();
                        }
                      }}
                    />
                    <Button variant="outline" onClick={addMilestone} disabled={!newMilestone.trim()}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editingRock ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-500">Progresso do Trimestre</p>
              <p className="text-2xl font-bold">{overallProgress}%</p>
            </div>
          </div>
          <Progress value={overallProgress} className="h-3" />
        </CardContent>
      </Card>

      {/* Rocks List */}
      {rocks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mountain className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-700">Nenhum rock para este trimestre</h3>
            <p className="text-slate-500 mb-4">Comece adicionando seus rocks trimestrais</p>
            <Button onClick={openNewRockDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Rock
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {rocks.map((rock) => {
            const progress = calculateProgress(rock.milestones);
            const statusConfig = STATUS_CONFIG[rock.status];

            return (
              <Card key={rock.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg">{rock.title}</CardTitle>
                        <Badge className={`${statusConfig.bg} ${statusConfig.color} border-0`}>
                          {statusConfig.label}
                        </Badge>
                        <Badge variant="outline">
                          {rock.rockType === 'company' ? 'Empresa' : 'Individual'}
                        </Badge>
                      </div>
                      <CardDescription>
                        {rock.owner} • Q{rock.quarter}/{rock.year}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(rock)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDelete(rock.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {rock.description && (
                    <p className="text-sm text-slate-600 mb-4">{rock.description}</p>
                  )}

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-500">Progresso</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {/* Milestones */}
                  {rock.milestones && rock.milestones.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-700">Milestones</p>
                        <span className="text-sm text-slate-500">
                          {rock.milestones.filter((m) => m.completed).length}/{rock.milestones.length} concluidos
                        </span>
                      </div>
                      {rock.milestones.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center gap-3 hover:bg-slate-50 p-2 rounded-lg transition-colors"
                        >
                          <Checkbox
                            id={`milestone-${m.id}`}
                            checked={m.completed}
                            onCheckedChange={() => toggleMilestone(rock, m.id)}
                            className="h-5 w-5 border-2 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                          />
                          <label
                            htmlFor={`milestone-${m.id}`}
                            className={`text-sm cursor-pointer flex-1 ${
                              m.completed ? 'line-through text-slate-400' : 'text-slate-700'
                            }`}
                          >
                            {m.title}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quick Status Change */}
                  {rock.status !== 'complete' && (
                    <div className="mt-4 pt-4 border-t flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-600 border-green-200 hover:bg-green-50"
                        onClick={() => updateStatus(rock, 'complete')}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Marcar Concluido
                      </Button>
                      {rock.status === 'on_track' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => updateStatus(rock, 'off_track')}
                        >
                          Fora do Caminho
                        </Button>
                      )}
                      {rock.status === 'off_track' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() => updateStatus(rock, 'on_track')}
                        >
                          Voltar ao Caminho
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
