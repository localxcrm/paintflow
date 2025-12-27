'use client';

import { useState } from 'react';
import { mockIssues } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus,
  AlertCircle,
  Clock,
  CheckCircle2,
  MessageSquare,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  Zap,
  Edit,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { IssueStatus, IssuePriority } from '@/types';
import { format, parseISO } from 'date-fns';

type Issue = typeof mockIssues[0];

const statusConfig: Record<IssueStatus, { label: string; className: string; icon: React.ReactNode }> = {
  open: { label: 'Open', className: 'bg-red-100 text-red-700', icon: <AlertCircle className="h-4 w-4" /> },
  in_discussion: { label: 'Discussing', className: 'bg-amber-100 text-amber-700', icon: <MessageSquare className="h-4 w-4" /> },
  solved: { label: 'Solved', className: 'bg-green-100 text-green-700', icon: <CheckCircle2 className="h-4 w-4" /> },
};

const priorityConfig: Record<IssuePriority, { label: string; className: string; icon: React.ReactNode }> = {
  1: { label: 'High', className: 'text-red-600', icon: <ArrowUp className="h-4 w-4" /> },
  2: { label: 'Medium', className: 'text-amber-600', icon: <ArrowRight className="h-4 w-4" /> },
  3: { label: 'Low', className: 'text-slate-600', icon: <ArrowDown className="h-4 w-4" /> },
};

const teamMembers = ['Mike Johnson', 'Sarah Davis', 'Tom Wilson', 'Lisa Chen', 'David Martinez'];

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>(mockIssues);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [newIssue, setNewIssue] = useState({
    title: '',
    description: '',
    priority: 2 as IssuePriority,
    issueType: 'short_term' as 'short_term' | 'long_term',
    createdBy: '',
  });

  const shortTermIssues = issues.filter((i) => i.issueType === 'short_term');
  const longTermIssues = issues.filter((i) => i.issueType === 'long_term');

  const openCount = issues.filter((i) => i.status === 'open').length;
  const discussingCount = issues.filter((i) => i.status === 'in_discussion').length;
  const solvedCount = issues.filter((i) => i.status === 'solved').length;

  const updateIssueStatus = (issueId: string, status: IssueStatus) => {
    setIssues(issues.map(i => i.id === issueId ? { ...i, status } : i));
  };

  const addIssue = () => {
    if (!newIssue.title || !newIssue.createdBy) return;
    const issue: Issue = {
      id: Date.now().toString(),
      title: newIssue.title,
      description: newIssue.description,
      priority: newIssue.priority,
      status: 'open',
      issueType: newIssue.issueType,
      createdBy: newIssue.createdBy,
      createdAt: new Date().toISOString(),
    };
    setIssues([issue, ...issues]);
    setNewIssue({ title: '', description: '', priority: 2, issueType: 'short_term', createdBy: '' });
    setIsAddModalOpen(false);
  };

  const updateIssue = () => {
    if (!editingIssue) return;
    setIssues(issues.map(i => i.id === editingIssue.id ? editingIssue : i));
    setEditingIssue(null);
  };

  const deleteIssue = (issueId: string) => {
    setIssues(issues.filter(i => i.id !== issueId));
  };

  function IssueCard({ issue }: { issue: Issue }) {
    const status = statusConfig[issue.status];
    const priority = priorityConfig[issue.priority];

    return (
      <Card className={cn('hover:shadow-md transition-shadow group', issue.status === 'solved' && 'opacity-60')}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Select value={issue.status} onValueChange={(v) => updateIssueStatus(issue.id, v as IssueStatus)}>
                  <SelectTrigger className={cn('w-32 gap-1 h-7 text-xs', status.className)}>
                    {status.icon}
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_discussion">Discussing</SelectItem>
                    <SelectItem value="solved">Solved</SelectItem>
                  </SelectContent>
                </Select>
                <div className={cn('flex items-center gap-1 text-sm', priority.className)}>
                  {priority.icon}
                  {priority.label}
                </div>
              </div>
              <h3 className={cn('font-medium text-slate-900', issue.status === 'solved' && 'line-through')}>
                {issue.title}
              </h3>
              {issue.description && (
                <p className="text-sm text-slate-500 mt-1 line-clamp-2">{issue.description}</p>
              )}
              <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                <span>Created by {issue.createdBy.split(' ')[0]}</span>
                <span>{format(parseISO(issue.createdAt), 'MMM d')}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingIssue(issue)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteIssue(issue.id)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Issues List</h1>
          <p className="text-slate-500">IDS: Identify, Discuss, Solve</p>
        </div>
        <Button className="gap-2" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Issue
        </Button>
      </div>

      {/* IDS Process Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">IDS Process</h3>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">I</p>
              <p className="text-sm text-slate-600">Identify</p>
              <p className="text-xs text-slate-500">What&apos;s the real issue?</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">D</p>
              <p className="text-sm text-slate-600">Discuss</p>
              <p className="text-xs text-slate-500">Open dialogue</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">S</p>
              <p className="text-sm text-slate-600">Solve</p>
              <p className="text-xs text-slate-500">Take action</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Total Issues</p><p className="text-2xl font-bold">{issues.length}</p></div><AlertCircle className="h-8 w-8 text-slate-400" /></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Open</p><p className="text-2xl font-bold text-red-600">{openCount}</p></div><AlertCircle className="h-8 w-8 text-red-500" /></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Discussing</p><p className="text-2xl font-bold text-amber-600">{discussingCount}</p></div><MessageSquare className="h-8 w-8 text-amber-500" /></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Solved</p><p className="text-2xl font-bold text-green-600">{solvedCount}</p></div><CheckCircle2 className="h-8 w-8 text-green-500" /></div></CardContent></Card>
      </div>

      {/* Search */}
      <Input placeholder="Search issues..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="max-w-md" />

      {/* Issues Tabs */}
      <Tabs defaultValue="short_term" className="space-y-4">
        <TabsList>
          <TabsTrigger value="short_term" className="gap-2"><Clock className="h-4 w-4" />Short-Term ({shortTermIssues.length})</TabsTrigger>
          <TabsTrigger value="long_term" className="gap-2"><AlertCircle className="h-4 w-4" />Long-Term / V/TO ({longTermIssues.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="short_term" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Short-Term Issues</CardTitle>
              <CardDescription>Issues to solve this quarter - discuss in weekly L10 meetings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {shortTermIssues
                .filter((i) => searchQuery ? i.title.toLowerCase().includes(searchQuery.toLowerCase()) : true)
                .sort((a, b) => a.priority - b.priority)
                .map((issue) => (<IssueCard key={issue.id} issue={issue} />))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="long_term" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Long-Term Issues</CardTitle>
              <CardDescription>V/TO parking lot - issues for future consideration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {longTermIssues
                .filter((i) => searchQuery ? i.title.toLowerCase().includes(searchQuery.toLowerCase()) : true)
                .sort((a, b) => a.priority - b.priority)
                .map((issue) => (<IssueCard key={issue.id} issue={issue} />))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Issue Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add New Issue</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Title</Label><Input value={newIssue.title} onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })} placeholder="What's the issue?" /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={newIssue.description} onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })} rows={2} placeholder="More details..." /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Priority</Label><Select value={newIssue.priority.toString()} onValueChange={(v) => setNewIssue({ ...newIssue, priority: Number(v) as IssuePriority })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">High</SelectItem><SelectItem value="2">Medium</SelectItem><SelectItem value="3">Low</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Type</Label><Select value={newIssue.issueType} onValueChange={(v: 'short_term' | 'long_term') => setNewIssue({ ...newIssue, issueType: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="short_term">Short-Term</SelectItem><SelectItem value="long_term">Long-Term</SelectItem></SelectContent></Select></div>
            </div>
            <div className="space-y-2"><Label>Created By</Label><Select value={newIssue.createdBy} onValueChange={(v) => setNewIssue({ ...newIssue, createdBy: v })}><SelectTrigger><SelectValue placeholder="Select person" /></SelectTrigger><SelectContent>{teamMembers.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></div>
            <div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button><Button onClick={addIssue}>Add Issue</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Issue Modal */}
      <Dialog open={!!editingIssue} onOpenChange={() => setEditingIssue(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Issue</DialogTitle></DialogHeader>
          {editingIssue && (
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Title</Label><Input value={editingIssue.title} onChange={(e) => setEditingIssue({ ...editingIssue, title: e.target.value })} /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={editingIssue.description || ''} onChange={(e) => setEditingIssue({ ...editingIssue, description: e.target.value })} rows={2} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Priority</Label><Select value={editingIssue.priority.toString()} onValueChange={(v) => setEditingIssue({ ...editingIssue, priority: Number(v) as IssuePriority })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">High</SelectItem><SelectItem value="2">Medium</SelectItem><SelectItem value="3">Low</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Type</Label><Select value={editingIssue.issueType} onValueChange={(v: 'short_term' | 'long_term') => setEditingIssue({ ...editingIssue, issueType: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="short_term">Short-Term</SelectItem><SelectItem value="long_term">Long-Term</SelectItem></SelectContent></Select></div>
              </div>
              <div className="space-y-2"><Label>Status</Label><Select value={editingIssue.status} onValueChange={(v: IssueStatus) => setEditingIssue({ ...editingIssue, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="open">Open</SelectItem><SelectItem value="in_discussion">Discussing</SelectItem><SelectItem value="solved">Solved</SelectItem></SelectContent></Select></div>
              <div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => setEditingIssue(null)}>Cancel</Button><Button onClick={updateIssue}>Save Changes</Button></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
