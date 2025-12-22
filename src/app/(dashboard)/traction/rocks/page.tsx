'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus,
  Mountain,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Calendar,
  User,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  Target,
  History,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  useRocks,
  Rock,
  RockStatus,
  getQuarterEndDate,
} from '@/hooks/useRocks';

const statusConfig: Record<RockStatus, { label: string; className: string; icon: React.ReactNode }> = {
  on_track: { label: 'No Caminho', className: 'bg-green-100 text-green-700', icon: <CheckCircle2 className="h-4 w-4" /> },
  off_track: { label: 'Fora do Caminho', className: 'bg-red-100 text-red-700', icon: <AlertCircle className="h-4 w-4" /> },
  complete: { label: 'Concluido', className: 'bg-blue-100 text-blue-700', icon: <CheckCircle2 className="h-4 w-4" /> },
  dropped: { label: 'Abandonado', className: 'bg-slate-100 text-slate-700', icon: <XCircle className="h-4 w-4" /> },
};

// Owners list - can be customized
const teamMembers = ['Voce', 'Gerente', 'Vendedor', 'Pintor Lider'];

interface NewRockForm {
  title: string;
  description: string;
  owner: string;
  dueDate: string;
  rockType: 'company' | 'individual';
  milestones: string[];
}

export default function RocksPage() {
  const {
    isLoading,
    currentQuarter,
    currentYear,
    addRock,
    updateRock,
    deleteRock,
    updateStatus,
    toggleMilestone,
    addMilestone,
    deleteMilestone,
    getRocksByQuarter,
  } = useRocks();

  const [selectedQuarter, setSelectedQuarter] = useState(currentQuarter);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRock, setEditingRock] = useState<Rock | null>(null);
  const [expandedRock, setExpandedRock] = useState<string | null>(null);
  const [newMilestoneText, setNewMilestoneText] = useState<Record<string, string>>({});
  const [newRock, setNewRock] = useState<NewRockForm>({
    title: '',
    description: '',
    owner: '',
    dueDate: '',
    rockType: 'company',
    milestones: [''],
  });

  // Filter rocks by selected quarter
  const filteredRocks = getRocksByQuarter(selectedQuarter, selectedYear);
  const companyRocks = filteredRocks.filter((r) => r.rockType === 'company');
  const individualRocks = filteredRocks.filter((r) => r.rockType === 'individual');

  // Stats
  const totalRocks = filteredRocks.length;
  const completedRocks = filteredRocks.filter((r) => r.status === 'complete').length;
  const onTrackRocks = filteredRocks.filter((r) => r.status === 'on_track').length;
  const offTrackRocks = filteredRocks.filter((r) => r.status === 'off_track').length;
  const completionPercent = totalRocks > 0 ? Math.round((completedRocks / totalRocks) * 100) : 0;

  // Group individual rocks by owner
  const rocksByOwner = individualRocks.reduce((acc, rock) => {
    if (!acc[rock.owner]) acc[rock.owner] = [];
    acc[rock.owner].push(rock);
    return acc;
  }, {} as Record<string, Rock[]>);

  const handleAddRock = () => {
    if (!newRock.title || !newRock.owner) return;

    const milestones = newRock.milestones
      .filter((m) => m.trim())
      .map((title, i) => ({
        id: `new-${Date.now()}-${i}`,
        title: title.trim(),
        completed: false,
      }));

    addRock({
      title: newRock.title,
      description: newRock.description,
      owner: newRock.owner,
      rockType: newRock.rockType,
      quarter: selectedQuarter,
      year: selectedYear,
      status: 'on_track',
      dueDate: newRock.dueDate || getQuarterEndDate(selectedQuarter, selectedYear),
      milestones,
    });

    setNewRock({
      title: '',
      description: '',
      owner: '',
      dueDate: '',
      rockType: 'company',
      milestones: [''],
    });
    setIsAddModalOpen(false);
  };

  const handleUpdateRock = () => {
    if (!editingRock) return;
    updateRock(editingRock.id, {
      title: editingRock.title,
      description: editingRock.description,
      owner: editingRock.owner,
      rockType: editingRock.rockType,
      dueDate: editingRock.dueDate,
    });
    setEditingRock(null);
  };

  const handleAddMilestone = (rockId: string) => {
    const text = newMilestoneText[rockId]?.trim();
    if (!text) return;
    addMilestone(rockId, text);
    setNewMilestoneText({ ...newMilestoneText, [rockId]: '' });
  };

  function RockCard({ rock }: { rock: Rock }) {
    const daysUntilDue = differenceInDays(parseISO(rock.dueDate), new Date());
    const isOverdue = daysUntilDue < 0 && rock.status !== 'complete';
    const status = statusConfig[rock.status];
    const isExpanded = expandedRock === rock.id;

    return (
      <Card className={cn('hover:shadow-md transition-shadow', rock.status === 'complete' && 'opacity-75')}>
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1">
              <h3 className={cn('font-medium text-slate-900', rock.status === 'complete' && 'line-through')}>
                {rock.title}
              </h3>
              {rock.description && (
                <p className="text-sm text-slate-500 mt-1 line-clamp-2">{rock.description}</p>
              )}
            </div>
            <Select value={rock.status} onValueChange={(v) => updateStatus(rock.id, v as RockStatus)}>
              <SelectTrigger className={cn('w-36 gap-1', status.className)}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="on_track">No Caminho</SelectItem>
                <SelectItem value="off_track">Fora do Caminho</SelectItem>
                <SelectItem value="complete">Concluido</SelectItem>
                <SelectItem value="dropped">Abandonado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Progress bar */}
          {rock.milestones.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Progresso</span>
                <span>{rock.progress}%</span>
              </div>
              <Progress value={rock.progress} className="h-2" />
            </div>
          )}

          {/* Meta info */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-slate-500">
                <User className="h-4 w-4" />
                {rock.owner}
              </div>
              <div className={cn('flex items-center gap-1', isOverdue ? 'text-red-600' : 'text-slate-500')}>
                <Calendar className="h-4 w-4" />
                {format(parseISO(rock.dueDate), 'd MMM', { locale: ptBR })}
                {isOverdue && <span className="font-medium">(Atrasado)</span>}
              </div>
              {rock.milestones.length > 0 && (
                <div className="flex items-center gap-1 text-slate-500">
                  <Target className="h-4 w-4" />
                  {rock.milestones.filter((m) => m.completed).length}/{rock.milestones.length} marcos
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setExpandedRock(isExpanded ? null : rock.id)}
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingRock(rock)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteRock(rock.id)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>

          {/* Expanded content - Milestones */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t space-y-3">
              <h4 className="font-medium text-sm text-slate-700">Marcos (Milestones)</h4>

              {rock.milestones.map((milestone) => (
                <div key={milestone.id} className="flex items-center gap-2">
                  <Checkbox
                    checked={milestone.completed}
                    onCheckedChange={() => toggleMilestone(rock.id, milestone.id)}
                  />
                  <span className={cn('text-sm flex-1', milestone.completed && 'line-through text-slate-400')}>
                    {milestone.title}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => deleteMilestone(rock.id, milestone.id)}
                  >
                    <Trash2 className="h-3 w-3 text-red-400" />
                  </Button>
                </div>
              ))}

              {/* Add milestone */}
              <div className="flex gap-2">
                <Input
                  placeholder="Novo marco..."
                  value={newMilestoneText[rock.id] || ''}
                  onChange={(e) => setNewMilestoneText({ ...newMilestoneText, [rock.id]: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddMilestone(rock.id)}
                  className="h-8 text-sm"
                />
                <Button size="sm" variant="outline" onClick={() => handleAddMilestone(rock.id)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Status history */}
              {rock.statusHistory.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-sm text-slate-700 mb-2 flex items-center gap-1">
                    <History className="h-4 w-4" /> Historico
                  </h4>
                  <div className="space-y-1 text-xs text-slate-500">
                    {rock.statusHistory.slice(-3).map((change, i) => (
                      <div key={i}>
                        {format(parseISO(change.date), 'd MMM', { locale: ptBR })}:{' '}
                        {statusConfig[change.from].label} → {statusConfig[change.to].label}
                        {change.note && <span className="italic"> - {change.note}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rocks</h1>
          <p className="text-slate-500">
            Q{selectedQuarter} {selectedYear} - Prioridades do trimestre
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={`${selectedQuarter}-${selectedYear}`}
            onValueChange={(v) => {
              const [q, y] = v.split('-');
              setSelectedQuarter(parseInt(q));
              setSelectedYear(parseInt(y));
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[currentYear - 1, currentYear, currentYear + 1].map((year) =>
                [1, 2, 3, 4].map((q) => (
                  <SelectItem key={`${q}-${year}`} value={`${q}-${year}`}>
                    Q{q} {year}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <Button className="gap-2" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Adicionar Rock
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Rocks</p>
                <p className="text-2xl font-bold">{totalRocks}</p>
              </div>
              <Mountain className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">No Caminho</p>
                <p className="text-2xl font-bold text-green-600">{onTrackRocks}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Fora do Caminho</p>
                <p className="text-2xl font-bold text-red-600">{offTrackRocks}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-slate-500">Conclusao</p>
              <p className="text-2xl font-bold">{completionPercent}%</p>
            </div>
            <Progress value={completionPercent} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="company" className="space-y-4">
        <TabsList>
          <TabsTrigger value="company" className="gap-2">
            <Mountain className="h-4 w-4" />
            Rocks da Empresa ({companyRocks.length})
          </TabsTrigger>
          <TabsTrigger value="individual" className="gap-2">
            <User className="h-4 w-4" />
            Rocks Individuais ({individualRocks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rocks da Empresa</CardTitle>
              <CardDescription>3-7 prioridades mais importantes para a empresa neste trimestre</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {companyRocks.length === 0 ? (
                <p className="text-slate-500 text-center py-8">Nenhum rock da empresa neste trimestre</p>
              ) : (
                companyRocks.map((rock) => <RockCard key={rock.id} rock={rock} />)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="individual" className="space-y-6">
          {Object.keys(rocksByOwner).length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-slate-500 text-center">Nenhum rock individual neste trimestre</p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(rocksByOwner).map(([owner, ownerRocks]) => (
              <Card key={owner}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-slate-400" />
                    {owner}
                  </CardTitle>
                  <CardDescription>{ownerRocks.length} rock(s) neste trimestre</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {ownerRocks.map((rock) => (
                    <RockCard key={rock.id} rock={rock} />
                  ))}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Add Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Rock</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Titulo</Label>
              <Input
                value={newRock.title}
                onChange={(e) => setNewRock({ ...newRock, title: e.target.value })}
                placeholder="Qual e o rock?"
              />
            </div>
            <div className="space-y-2">
              <Label>Descricao</Label>
              <Textarea
                value={newRock.description}
                onChange={(e) => setNewRock({ ...newRock, description: e.target.value })}
                rows={2}
                placeholder="Detalhes sobre o rock..."
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={newRock.rockType}
                onValueChange={(v: 'company' | 'individual') => setNewRock({ ...newRock, rockType: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="company">Rock da Empresa</SelectItem>
                  <SelectItem value="individual">Rock Individual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Responsavel</Label>
              <Select value={newRock.owner} onValueChange={(v) => setNewRock({ ...newRock, owner: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data Limite</Label>
              <Input
                type="date"
                value={newRock.dueDate}
                onChange={(e) => setNewRock({ ...newRock, dueDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Marcos (Milestones)</Label>
              {newRock.milestones.map((milestone, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={milestone}
                    onChange={(e) => {
                      const updated = [...newRock.milestones];
                      updated[i] = e.target.value;
                      setNewRock({ ...newRock, milestones: updated });
                    }}
                    placeholder={`Marco ${i + 1}...`}
                  />
                  {i > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const updated = newRock.milestones.filter((_, idx) => idx !== i);
                        setNewRock({ ...newRock, milestones: updated });
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNewRock({ ...newRock, milestones: [...newRock.milestones, ''] })}
              >
                <Plus className="h-4 w-4 mr-1" /> Adicionar Marco
              </Button>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddRock}>Adicionar Rock</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editingRock} onOpenChange={() => setEditingRock(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Rock</DialogTitle>
          </DialogHeader>
          {editingRock && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Titulo</Label>
                <Input
                  value={editingRock.title}
                  onChange={(e) => setEditingRock({ ...editingRock, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Descricao</Label>
                <Textarea
                  value={editingRock.description || ''}
                  onChange={(e) => setEditingRock({ ...editingRock, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={editingRock.rockType}
                  onValueChange={(v: 'company' | 'individual') =>
                    setEditingRock({ ...editingRock, rockType: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="company">Rock da Empresa</SelectItem>
                    <SelectItem value="individual">Rock Individual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Responsavel</Label>
                <Select
                  value={editingRock.owner}
                  onValueChange={(v) => setEditingRock({ ...editingRock, owner: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data Limite</Label>
                <Input
                  type="date"
                  value={editingRock.dueDate.split('T')[0]}
                  onChange={(e) => setEditingRock({ ...editingRock, dueDate: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditingRock(null)}>
                  Cancelar
                </Button>
                <Button onClick={handleUpdateRock}>Salvar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
