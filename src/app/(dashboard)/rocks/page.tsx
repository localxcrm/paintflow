'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
    Mountain,
    Plus,
    Trash2,
    Edit,
    CheckCircle2,
    Circle,
    Target,
    Calendar,
    User,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { useRocks, Rock, RockStatus, ROCK_STATUS_CONFIG } from '@/hooks/useRocks';

export default function RocksPage() {
    const {
        rocks,
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
        getCurrentQuarterRocks,
    } = useRocks();

    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [expandedRockId, setExpandedRockId] = useState<string | null>(null);
    const [deleteRockId, setDeleteRockId] = useState<string | null>(null);
    const [newMilestoneText, setNewMilestoneText] = useState<Record<string, string>>({});

    // Form state for new rock
    const [newRock, setNewRock] = useState({
        title: '',
        description: '',
        owner: 'Você',
        rockType: 'individual' as 'company' | 'individual',
    });

    const quarterRocks = getCurrentQuarterRocks();
    const completedCount = quarterRocks.filter(r => r.status === 'complete').length;
    const onTrackCount = quarterRocks.filter(r => r.status === 'on_track').length;
    const offTrackCount = quarterRocks.filter(r => r.status === 'off_track').length;

    const handleAddRock = () => {
        if (!newRock.title.trim()) return;

        const quarterEnd = new Date(currentYear, currentQuarter * 3, 0);

        addRock({
            title: newRock.title,
            description: newRock.description,
            owner: newRock.owner,
            rockType: newRock.rockType,
            quarter: currentQuarter,
            year: currentYear,
            status: 'on_track',
            dueDate: quarterEnd.toISOString().split('T')[0],
            milestones: [],
        });

        setNewRock({ title: '', description: '', owner: 'Você', rockType: 'individual' });
        setIsAddDialogOpen(false);
    };

    const handleAddMilestone = (rockId: string) => {
        const text = newMilestoneText[rockId];
        if (!text?.trim()) return;
        addMilestone(rockId, text);
        setNewMilestoneText(prev => ({ ...prev, [rockId]: '' }));
    };

    const handleDeleteRock = () => {
        if (deleteRockId) {
            deleteRock(deleteRockId);
            setDeleteRockId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-slate-500">Carregando...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Mountain className="h-6 w-6" />
                        Rocks Q{currentQuarter} {currentYear}
                    </h1>
                    <p className="text-slate-500">Metas trimestrais do EOS</p>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Novo Rock
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Adicionar Rock</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Título *</Label>
                                <Input
                                    id="title"
                                    value={newRock.title}
                                    onChange={(e) => setNewRock(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="Ex: Contratar 2 pintores"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Descrição</Label>
                                <Textarea
                                    id="description"
                                    value={newRock.description}
                                    onChange={(e) => setNewRock(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Detalhes sobre este rock..."
                                    rows={3}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Responsável</Label>
                                    <Input
                                        value={newRock.owner}
                                        onChange={(e) => setNewRock(prev => ({ ...prev, owner: e.target.value }))}
                                        placeholder="Nome"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tipo</Label>
                                    <Select
                                        value={newRock.rockType}
                                        onValueChange={(value) => setNewRock(prev => ({ ...prev, rockType: value as 'company' | 'individual' }))}
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
                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button onClick={handleAddRock} disabled={!newRock.title.trim()}>
                                    Adicionar
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg">
                                <Target className="h-5 w-5 text-slate-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{quarterRocks.length}</p>
                                <p className="text-sm text-slate-500">Total Rocks</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-green-600">{completedCount}</p>
                                <p className="text-sm text-slate-500">Concluídos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Circle className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-blue-600">{onTrackCount}</p>
                                <p className="text-sm text-slate-500">No Caminho</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <Circle className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-red-600">{offTrackCount}</p>
                                <p className="text-sm text-slate-500">Fora do Caminho</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Rocks List */}
            <div className="space-y-4">
                {quarterRocks.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center">
                            <Mountain className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500">Nenhum rock para este trimestre.</p>
                            <Button className="mt-4 gap-2" onClick={() => setIsAddDialogOpen(true)}>
                                <Plus className="h-4 w-4" />
                                Adicionar Primeiro Rock
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    quarterRocks.map((rock) => (
                        <Card key={rock.id} className="overflow-hidden">
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <CardTitle className="text-lg">{rock.title}</CardTitle>
                                            <Badge className={`${ROCK_STATUS_CONFIG[rock.status].bgClass} ${ROCK_STATUS_CONFIG[rock.status].className}`}>
                                                {ROCK_STATUS_CONFIG[rock.status].label}
                                            </Badge>
                                            <Badge variant="outline">
                                                {rock.rockType === 'company' ? 'Empresa' : 'Individual'}
                                            </Badge>
                                        </div>
                                        {rock.description && (
                                            <p className="text-sm text-slate-500 mt-1">{rock.description}</p>
                                        )}
                                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                {rock.owner}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {rock.dueDate}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Select
                                            value={rock.status}
                                            onValueChange={(value) => updateStatus(rock.id, value as RockStatus)}
                                        >
                                            <SelectTrigger className="w-[140px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="on_track">No Caminho</SelectItem>
                                                <SelectItem value="off_track">Fora do Caminho</SelectItem>
                                                <SelectItem value="complete">Concluído</SelectItem>
                                                <SelectItem value="dropped">Abandonado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setExpandedRockId(expandedRockId === rock.id ? null : rock.id)}
                                        >
                                            {expandedRockId === rock.id ? (
                                                <ChevronUp className="h-4 w-4" />
                                            ) : (
                                                <ChevronDown className="h-4 w-4" />
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:text-red-700"
                                            onClick={() => setDeleteRockId(rock.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-2">
                                {/* Progress Bar */}
                                <div className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Progresso</span>
                                        <span className="font-medium">{rock.progress}%</span>
                                    </div>
                                    <Progress value={rock.progress} className="h-2" />
                                </div>

                                {/* Expanded Section - Milestones */}
                                {expandedRockId === rock.id && (
                                    <div className="mt-4 pt-4 border-t space-y-3">
                                        <h4 className="font-medium text-sm">Milestones</h4>
                                        {rock.milestones.length === 0 ? (
                                            <p className="text-sm text-slate-500">Nenhum milestone definido.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {rock.milestones.map((milestone) => (
                                                    <div
                                                        key={milestone.id}
                                                        className="flex items-center justify-between p-2 bg-slate-50 rounded"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Checkbox
                                                                checked={milestone.completed}
                                                                onCheckedChange={() => toggleMilestone(rock.id, milestone.id)}
                                                            />
                                                            <span className={milestone.completed ? 'line-through text-slate-400' : ''}>
                                                                {milestone.title}
                                                            </span>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 text-slate-400 hover:text-red-500"
                                                            onClick={() => deleteMilestone(rock.id, milestone.id)}
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {/* Add Milestone */}
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Novo milestone..."
                                                value={newMilestoneText[rock.id] || ''}
                                                onChange={(e) => setNewMilestoneText(prev => ({ ...prev, [rock.id]: e.target.value }))}
                                                onKeyDown={(e) => e.key === 'Enter' && handleAddMilestone(rock.id)}
                                            />
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleAddMilestone(rock.id)}
                                                disabled={!newMilestoneText[rock.id]?.trim()}
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteRockId} onOpenChange={() => setDeleteRockId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Rock?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O rock e todos os seus milestones serão removidos.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteRock} className="bg-red-600 hover:bg-red-700">
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
