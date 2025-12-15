'use client';

import { useState } from 'react';
import { mockScorecardMetrics } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Edit, TrendingUp, TrendingDown, Target, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO, subWeeks } from 'date-fns';

type ScorecardMetric = typeof mockScorecardMetrics[0];

const teamMembers = ['Mike Johnson', 'Sarah Davis', 'Tom Wilson', 'Lisa Chen', 'David Martinez'];

function formatValue(value: number, type: 'number' | 'currency' | 'percent') {
  switch (type) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    case 'percent':
      return `${value}%`;
    default:
      return value.toString();
  }
}

export default function ScorecardPage() {
  const [metrics, setMetrics] = useState<ScorecardMetric[]>(mockScorecardMetrics);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMetric, setEditingMetric] = useState<ScorecardMetric | null>(null);
  const [isDataEntryOpen, setIsDataEntryOpen] = useState(false);
  const [newMetric, setNewMetric] = useState({
    name: '',
    owner: '',
    category: 'leading' as 'leading' | 'lagging',
    goalType: 'number' as 'number' | 'currency' | 'percent',
    goalValue: 0,
    goalDirection: 'above' as 'above' | 'below',
  });

  // Calculate overall health
  const latestEntries = metrics.map((m) => m.entries[0]);
  const onTrackCount = latestEntries.filter((e) => e?.onTrack).length;
  const totalMetrics = metrics.length;
  const healthPercent = totalMetrics > 0 ? Math.round((onTrackCount / totalMetrics) * 100) : 0;

  const addMetric = () => {
    if (!newMetric.name || !newMetric.owner) return;
    const metric: ScorecardMetric = {
      id: Date.now().toString(),
      name: newMetric.name,
      owner: newMetric.owner,
      category: newMetric.category,
      goalType: newMetric.goalType,
      goalValue: newMetric.goalValue,
      goalDirection: newMetric.goalDirection,
      entries: Array.from({ length: 13 }, (_, i) => ({
        weekEndingDate: format(subWeeks(new Date(), i), 'yyyy-MM-dd'),
        actualValue: 0,
        onTrack: false,
      })),
    };
    setMetrics([...metrics, metric]);
    setNewMetric({ name: '', owner: '', category: 'leading', goalType: 'number', goalValue: 0, goalDirection: 'above' });
    setIsAddModalOpen(false);
  };

  const updateMetric = () => {
    if (!editingMetric) return;
    setMetrics(metrics.map(m => m.id === editingMetric.id ? editingMetric : m));
    setEditingMetric(null);
  };

  const deleteMetric = (metricId: string) => {
    setMetrics(metrics.filter(m => m.id !== metricId));
  };

  const updateMetricValue = (metricId: string, weekIndex: number, value: number) => {
    setMetrics(metrics.map(m => {
      if (m.id !== metricId) return m;
      const newEntries = [...m.entries];
      const onTrack = m.goalDirection === 'above' ? value >= m.goalValue : value <= m.goalValue;
      newEntries[weekIndex] = { ...newEntries[weekIndex], actualValue: value, onTrack };
      return { ...m, entries: newEntries };
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Scorecard</h1>
          <p className="text-slate-500">Weekly metrics - 13 week trailing view</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setIsDataEntryOpen(true)}>
            <Edit className="h-4 w-4" />
            Enter Data
          </Button>
          <Button className="gap-2" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Metric
          </Button>
        </div>
      </div>

      {/* Health Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Overall Health</p>
                <p className={cn('text-3xl font-bold', healthPercent >= 80 ? 'text-green-600' : healthPercent >= 60 ? 'text-amber-600' : 'text-red-600')}>
                  {healthPercent}%
                </p>
              </div>
              <div className={cn('p-3 rounded-full', healthPercent >= 80 ? 'bg-green-100' : healthPercent >= 60 ? 'bg-amber-100' : 'bg-red-100')}>
                <Target className={cn('h-6 w-6', healthPercent >= 80 ? 'text-green-600' : healthPercent >= 60 ? 'text-amber-600' : 'text-red-600')} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">On Track</p>
                <p className="text-3xl font-bold text-green-600">{onTrackCount}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Off Track</p>
                <p className="text-3xl font-bold text-red-600">{totalMetrics - onTrackCount}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scorecard Table */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Metrics</CardTitle>
          <CardDescription>Trailing 13-week view - scroll right to see history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-white z-10 min-w-[200px]">Metric</TableHead>
                  <TableHead className="sticky left-[200px] bg-white z-10 min-w-[100px]">Owner</TableHead>
                  <TableHead className="sticky left-[300px] bg-white z-10 min-w-[80px] text-center">Goal</TableHead>
                  {metrics[0]?.entries.map((entry, i) => (
                    <TableHead key={i} className={cn('text-center min-w-[80px]', i === 0 && 'bg-blue-50')}>
                      {format(parseISO(entry.weekEndingDate), 'MMM d')}
                    </TableHead>
                  ))}
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Leading Indicators Section */}
                <TableRow>
                  <TableCell colSpan={4 + (metrics[0]?.entries.length || 0) + 1} className="bg-blue-50 font-semibold text-blue-900">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Leading Indicators
                    </div>
                  </TableCell>
                </TableRow>
                {metrics.filter((m) => m.category === 'leading').map((metric) => (
                  <TableRow key={metric.id} className="group">
                    <TableCell className="sticky left-0 bg-white font-medium">{metric.name}</TableCell>
                    <TableCell className="sticky left-[200px] bg-white text-slate-500">{metric.owner.split(' ')[0]}</TableCell>
                    <TableCell className="sticky left-[300px] bg-white text-center font-medium">{formatValue(metric.goalValue, metric.goalType)}</TableCell>
                    {metric.entries.map((entry, i) => (
                      <TableCell key={i} className={cn('text-center', i === 0 && 'bg-blue-50', entry.onTrack ? 'text-green-600' : 'text-red-600')}>
                        <div className="flex items-center justify-center gap-1">
                          {entry.onTrack ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          {formatValue(entry.actualValue, metric.goalType)}
                        </div>
                      </TableCell>
                    ))}
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingMetric(metric)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteMetric(metric.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {/* Lagging Indicators Section */}
                <TableRow>
                  <TableCell colSpan={4 + (metrics[0]?.entries.length || 0) + 1} className="bg-green-50 font-semibold text-green-900">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4" />
                      Lagging Indicators
                    </div>
                  </TableCell>
                </TableRow>
                {metrics.filter((m) => m.category === 'lagging').map((metric) => (
                  <TableRow key={metric.id} className="group">
                    <TableCell className="sticky left-0 bg-white font-medium">{metric.name}</TableCell>
                    <TableCell className="sticky left-[200px] bg-white text-slate-500">{metric.owner.split(' ')[0]}</TableCell>
                    <TableCell className="sticky left-[300px] bg-white text-center font-medium">{formatValue(metric.goalValue, metric.goalType)}</TableCell>
                    {metric.entries.map((entry, i) => (
                      <TableCell key={i} className={cn('text-center', i === 0 && 'bg-blue-50', entry.onTrack ? 'text-green-600' : 'text-red-600')}>
                        <div className="flex items-center justify-center gap-1">
                          {entry.onTrack ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          {formatValue(entry.actualValue, metric.goalType)}
                        </div>
                      </TableCell>
                    ))}
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingMetric(metric)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteMetric(metric.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Metric Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric) => {
          const latestEntry = metric.entries[0];
          const previousEntry = metric.entries[1];
          const trend = latestEntry && previousEntry ? latestEntry.actualValue - previousEntry.actualValue : 0;

          return (
            <Card key={metric.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-slate-900">{metric.name}</p>
                    <p className="text-sm text-slate-500">{metric.owner}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={metric.category === 'leading' ? 'secondary' : 'outline'}>{metric.category}</Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100" onClick={() => setEditingMetric(metric)}><Edit className="h-4 w-4" /></Button>
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Current</p>
                    <p className={cn('text-2xl font-bold', latestEntry?.onTrack ? 'text-green-600' : 'text-red-600')}>
                      {latestEntry ? formatValue(latestEntry.actualValue, metric.goalType) : '-'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Goal</p>
                    <p className="text-xl font-medium text-slate-700">{formatValue(metric.goalValue, metric.goalType)}</p>
                  </div>
                </div>
                {trend !== 0 && (
                  <div className={cn('flex items-center gap-1 mt-2 text-sm', trend > 0 ? 'text-green-600' : 'text-red-600')}>
                    {trend > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    {trend > 0 ? '+' : ''}{metric.goalType === 'currency' ? formatValue(Math.abs(trend), 'currency') : metric.goalType === 'percent' ? `${Math.abs(trend)}%` : Math.abs(trend)} vs last week
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Metric Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add New Metric</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Metric Name</Label><Input value={newMetric.name} onChange={(e) => setNewMetric({ ...newMetric, name: e.target.value })} placeholder="e.g., Weekly Revenue" /></div>
            <div className="space-y-2"><Label>Owner</Label><Select value={newMetric.owner} onValueChange={(v) => setNewMetric({ ...newMetric, owner: v })}><SelectTrigger><SelectValue placeholder="Select owner" /></SelectTrigger><SelectContent>{teamMembers.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Category</Label><Select value={newMetric.category} onValueChange={(v: 'leading' | 'lagging') => setNewMetric({ ...newMetric, category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="leading">Leading</SelectItem><SelectItem value="lagging">Lagging</SelectItem></SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Goal Type</Label><Select value={newMetric.goalType} onValueChange={(v: 'number' | 'currency' | 'percent') => setNewMetric({ ...newMetric, goalType: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="number">Number</SelectItem><SelectItem value="currency">Currency</SelectItem><SelectItem value="percent">Percent</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Goal Value</Label><Input type="number" value={newMetric.goalValue} onChange={(e) => setNewMetric({ ...newMetric, goalValue: Number(e.target.value) })} /></div>
            </div>
            <div className="space-y-2"><Label>Goal Direction</Label><Select value={newMetric.goalDirection} onValueChange={(v: 'above' | 'below') => setNewMetric({ ...newMetric, goalDirection: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="above">At or Above Goal</SelectItem><SelectItem value="below">At or Below Goal</SelectItem></SelectContent></Select></div>
            <div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button><Button onClick={addMetric}>Add Metric</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Metric Modal */}
      <Dialog open={!!editingMetric} onOpenChange={() => setEditingMetric(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Metric</DialogTitle></DialogHeader>
          {editingMetric && (
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Metric Name</Label><Input value={editingMetric.name} onChange={(e) => setEditingMetric({ ...editingMetric, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Owner</Label><Select value={editingMetric.owner} onValueChange={(v) => setEditingMetric({ ...editingMetric, owner: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{teamMembers.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Category</Label><Select value={editingMetric.category} onValueChange={(v: 'leading' | 'lagging') => setEditingMetric({ ...editingMetric, category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="leading">Leading</SelectItem><SelectItem value="lagging">Lagging</SelectItem></SelectContent></Select></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Goal Type</Label><Select value={editingMetric.goalType} onValueChange={(v: 'number' | 'currency' | 'percent') => setEditingMetric({ ...editingMetric, goalType: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="number">Number</SelectItem><SelectItem value="currency">Currency</SelectItem><SelectItem value="percent">Percent</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Goal Value</Label><Input type="number" value={editingMetric.goalValue} onChange={(e) => setEditingMetric({ ...editingMetric, goalValue: Number(e.target.value) })} /></div>
              </div>
              <div className="space-y-2"><Label>Goal Direction</Label><Select value={editingMetric.goalDirection} onValueChange={(v: 'above' | 'below') => setEditingMetric({ ...editingMetric, goalDirection: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="above">At or Above Goal</SelectItem><SelectItem value="below">At or Below Goal</SelectItem></SelectContent></Select></div>
              <div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => setEditingMetric(null)}>Cancel</Button><Button onClick={updateMetric}>Save Changes</Button></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Data Entry Modal */}
      <Dialog open={isDataEntryOpen} onOpenChange={setIsDataEntryOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Enter Weekly Data</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-500">Enter this week's values for each metric:</p>
            {metrics.map((metric) => (
              <div key={metric.id} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{metric.name}</p>
                  <p className="text-sm text-slate-500">Goal: {formatValue(metric.goalValue, metric.goalType)}</p>
                </div>
                <Input
                  type="number"
                  className="w-32"
                  value={metric.entries[0]?.actualValue || 0}
                  onChange={(e) => updateMetricValue(metric.id, 0, Number(e.target.value))}
                />
              </div>
            ))}
            <div className="flex justify-end pt-4"><Button onClick={() => setIsDataEntryOpen(false)}>Done</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
