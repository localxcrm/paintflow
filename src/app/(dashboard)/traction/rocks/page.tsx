'use client';

import { useState } from 'react';
import { mockRocks } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Mountain, CheckCircle2, AlertCircle, XCircle, Calendar, User, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RockStatus } from '@/types';
import { format, parseISO, differenceInDays, addMonths } from 'date-fns';

type Rock = typeof mockRocks[0];

const statusConfig: Record<RockStatus, { label: string; className: string; icon: React.ReactNode }> = {
  on_track: { label: 'On Track', className: 'bg-green-100 text-green-700', icon: <CheckCircle2 className="h-4 w-4" /> },
  off_track: { label: 'Off Track', className: 'bg-red-100 text-red-700', icon: <AlertCircle className="h-4 w-4" /> },
  complete: { label: 'Complete', className: 'bg-blue-100 text-blue-700', icon: <CheckCircle2 className="h-4 w-4" /> },
  dropped: { label: 'Dropped', className: 'bg-slate-100 text-slate-700', icon: <XCircle className="h-4 w-4" /> },
};

const teamMembers = ['Mike Johnson', 'Sarah Davis', 'Tom Wilson', 'Lisa Chen', 'David Martinez'];

export default function RocksPage() {
  const [rocks, setRocks] = useState<Rock[]>(mockRocks);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRock, setEditingRock] = useState<Rock | null>(null);
  const [newRock, setNewRock] = useState({ title: '', description: '', owner: '', dueDate: '', rockType: 'individual' as 'company' | 'individual' });

  const companyRocks = rocks.filter((r) => r.rockType === 'company');
  const individualRocks = rocks.filter((r) => r.rockType === 'individual');
  const totalRocks = rocks.length;
  const completedRocks = rocks.filter((r) => r.status === 'complete').length;
  const onTrackRocks = rocks.filter((r) => r.status === 'on_track').length;
  const offTrackRocks = rocks.filter((r) => r.status === 'off_track').length;
  const completionPercent = Math.round((completedRocks / totalRocks) * 100);

  const rocksByOwner = individualRocks.reduce((acc, rock) => {
    if (!acc[rock.owner]) acc[rock.owner] = [];
    acc[rock.owner].push(rock);
    return acc;
  }, {} as Record<string, Rock[]>);

  const updateRockStatus = (rockId: string, status: RockStatus) => {
    setRocks(rocks.map(r => r.id === rockId ? { ...r, status } : r));
  };

  const addRock = () => {
    if (!newRock.title || !newRock.owner) return;
    const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
    const currentYear = new Date().getFullYear();
    const rock: Rock = {
      id: Date.now().toString(),
      title: newRock.title,
      description: newRock.description,
      owner: newRock.owner,
      dueDate: newRock.dueDate || format(addMonths(new Date(), 3), 'yyyy-MM-dd'),
      status: 'on_track',
      rockType: newRock.rockType,
      quarter: currentQuarter,
      year: currentYear,
    };
    setRocks([rock, ...rocks]);
    setNewRock({ title: '', description: '', owner: '', dueDate: '', rockType: 'individual' });
    setIsAddModalOpen(false);
  };

  const updateRock = () => {
    if (!editingRock) return;
    setRocks(rocks.map(r => r.id === editingRock.id ? editingRock : r));
    setEditingRock(null);
  };

  const deleteRock = (rockId: string) => {
    setRocks(rocks.filter(r => r.id !== rockId));
  };

  function RockCard({ rock }: { rock: Rock }) {
    const daysUntilDue = differenceInDays(parseISO(rock.dueDate), new Date());
    const isOverdue = daysUntilDue < 0 && rock.status !== 'complete';
    const status = statusConfig[rock.status];

    return (
      <Card className={cn('hover:shadow-md transition-shadow group', rock.status === 'complete' && 'opacity-75')}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1">
              <h3 className={cn('font-medium text-slate-900', rock.status === 'complete' && 'line-through')}>{rock.title}</h3>
              {rock.description && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{rock.description}</p>}
            </div>
            <Select value={rock.status} onValueChange={(v) => updateRockStatus(rock.id, v as RockStatus)}>
              <SelectTrigger className={cn('w-32 gap-1', status.className)}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="on_track">On Track</SelectItem>
                <SelectItem value="off_track">Off Track</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
                <SelectItem value="dropped">Dropped</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-slate-500"><User className="h-4 w-4" />{rock.owner.split(' ')[0]}</div>
              <div className={cn('flex items-center gap-1', isOverdue ? 'text-red-600' : 'text-slate-500')}><Calendar className="h-4 w-4" />{format(parseISO(rock.dueDate), 'MMM d')}{isOverdue && <span className="font-medium">(Overdue)</span>}</div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingRock(rock)}><Edit className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteRock(rock.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-slate-900">Rocks</h1><p className="text-slate-500">Q4 2024 Priorities - The most important things</p></div>
        <Button className="gap-2" onClick={() => setIsAddModalOpen(true)}><Plus className="h-4 w-4" />Add Rock</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Total Rocks</p><p className="text-2xl font-bold">{totalRocks}</p></div><Mountain className="h-8 w-8 text-slate-400" /></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">On Track</p><p className="text-2xl font-bold text-green-600">{onTrackRocks}</p></div><CheckCircle2 className="h-8 w-8 text-green-500" /></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Off Track</p><p className="text-2xl font-bold text-red-600">{offTrackRocks}</p></div><AlertCircle className="h-8 w-8 text-red-500" /></div></CardContent></Card>
        <Card><CardContent className="p-4"><div><p className="text-sm text-slate-500">Completion</p><p className="text-2xl font-bold">{completionPercent}%</p></div><Progress value={completionPercent} className="mt-2" /></CardContent></Card>
      </div>

      <Tabs defaultValue="company" className="space-y-4">
        <TabsList>
          <TabsTrigger value="company" className="gap-2"><Mountain className="h-4 w-4" />Company Rocks ({companyRocks.length})</TabsTrigger>
          <TabsTrigger value="individual" className="gap-2"><User className="h-4 w-4" />Individual Rocks ({individualRocks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-4">
          <Card><CardHeader><CardTitle>Company Rocks</CardTitle><CardDescription>3-7 most important priorities for the company this quarter</CardDescription></CardHeader>
            <CardContent className="space-y-4">{companyRocks.map((rock) => <RockCard key={rock.id} rock={rock} />)}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="individual" className="space-y-6">
          {Object.entries(rocksByOwner).map(([owner, ownerRocks]) => (
            <Card key={owner}><CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-slate-400" />{owner}</CardTitle><CardDescription>{ownerRocks.length} rock(s) this quarter</CardDescription></CardHeader>
              <CardContent className="space-y-4">{ownerRocks.map((rock) => <RockCard key={rock.id} rock={rock} />)}</CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add New Rock</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Title</Label><Input value={newRock.title} onChange={(e) => setNewRock({ ...newRock, title: e.target.value })} placeholder="What's the rock?" /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={newRock.description} onChange={(e) => setNewRock({ ...newRock, description: e.target.value })} rows={2} /></div>
            <div className="space-y-2"><Label>Type</Label><Select value={newRock.rockType} onValueChange={(v: 'company' | 'individual') => setNewRock({ ...newRock, rockType: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="company">Company Rock</SelectItem><SelectItem value="individual">Individual Rock</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Owner</Label><Select value={newRock.owner} onValueChange={(v) => setNewRock({ ...newRock, owner: v })}><SelectTrigger><SelectValue placeholder="Select owner" /></SelectTrigger><SelectContent>{teamMembers.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={newRock.dueDate} onChange={(e) => setNewRock({ ...newRock, dueDate: e.target.value })} /></div>
            <div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button><Button onClick={addRock}>Add Rock</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingRock} onOpenChange={() => setEditingRock(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Rock</DialogTitle></DialogHeader>
          {editingRock && (
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Title</Label><Input value={editingRock.title} onChange={(e) => setEditingRock({ ...editingRock, title: e.target.value })} /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={editingRock.description || ''} onChange={(e) => setEditingRock({ ...editingRock, description: e.target.value })} rows={2} /></div>
              <div className="space-y-2"><Label>Type</Label><Select value={editingRock.rockType} onValueChange={(v: 'company' | 'individual') => setEditingRock({ ...editingRock, rockType: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="company">Company Rock</SelectItem><SelectItem value="individual">Individual Rock</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Owner</Label><Select value={editingRock.owner} onValueChange={(v) => setEditingRock({ ...editingRock, owner: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{teamMembers.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={editingRock.dueDate.split('T')[0]} onChange={(e) => setEditingRock({ ...editingRock, dueDate: e.target.value })} /></div>
              <div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => setEditingRock(null)}>Cancel</Button><Button onClick={updateRock}>Save Changes</Button></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
