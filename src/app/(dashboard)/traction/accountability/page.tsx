'use client';

import { useState } from 'react';
import { mockSeats } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus,
  Edit,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  GitBranch,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Seat = typeof mockSeats[0];

const teamMembers = ['Mike Johnson', 'Sarah Davis', 'Tom Wilson', 'Lisa Chen', 'David Martinez'];

function GWCBadge({ label, value, onClick }: { label: string; value: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors',
        value ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'
      )}
    >
      {value ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {label}
    </button>
  );
}

export default function AccountabilityPage() {
  const [seats, setSeats] = useState<Seat[]>(mockSeats);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSeat, setEditingSeat] = useState<Seat | null>(null);
  const [newSeat, setNewSeat] = useState({
    seatName: '',
    roleDescription: '',
    personName: '',
    reportsToId: '',
    responsibilities: ['', '', '', '', ''],
    gwcGetsIt: true,
    gwcWantsIt: true,
    gwcCapacity: true,
  });

  const topLevelSeats = seats.filter((s) => !s.reportsToId);
  const totalSeats = seats.length;
  const filledSeats = seats.filter((s) => s.personName).length;
  const rightPersonRightSeat = seats.filter((s) => s.isRightPersonRightSeat).length;

  const toggleGWC = (seatId: string, field: 'gwcGetsIt' | 'gwcWantsIt' | 'gwcCapacity') => {
    setSeats(seats.map(s => {
      if (s.id !== seatId) return s;
      const updated = { ...s, [field]: !s[field] };
      updated.isRightPersonRightSeat = updated.gwcGetsIt && updated.gwcWantsIt && updated.gwcCapacity;
      return updated;
    }));
  };

  const addSeat = () => {
    if (!newSeat.seatName) return;
    const seat: Seat = {
      id: Date.now().toString(),
      seatName: newSeat.seatName,
      roleDescription: newSeat.roleDescription,
      personId: newSeat.personName ? Date.now().toString() : undefined,
      personName: newSeat.personName || undefined,
      reportsToId: newSeat.reportsToId || undefined,
      responsibilities: newSeat.responsibilities.filter(r => r.trim()),
      gwcGetsIt: newSeat.gwcGetsIt,
      gwcWantsIt: newSeat.gwcWantsIt,
      gwcCapacity: newSeat.gwcCapacity,
      isRightPersonRightSeat: newSeat.gwcGetsIt && newSeat.gwcWantsIt && newSeat.gwcCapacity,
    };
    setSeats([...seats, seat]);
    setNewSeat({
      seatName: '',
      roleDescription: '',
      personName: '',
      reportsToId: '',
      responsibilities: ['', '', '', '', ''],
      gwcGetsIt: true,
      gwcWantsIt: true,
      gwcCapacity: true,
    });
    setIsAddModalOpen(false);
  };

  const updateSeat = () => {
    if (!editingSeat) return;
    const updated = {
      ...editingSeat,
      isRightPersonRightSeat: editingSeat.gwcGetsIt && editingSeat.gwcWantsIt && editingSeat.gwcCapacity,
    };
    setSeats(seats.map(s => s.id === editingSeat.id ? updated : s));
    setEditingSeat(null);
  };

  const deleteSeat = (seatId: string) => {
    setSeats(seats.filter(s => s.id !== seatId));
  };

  function SeatCard({ seat, level = 0 }: { seat: Seat; level?: number }) {
    const childSeats = seats.filter((s) => s.reportsToId === seat.id);

    return (
      <div className={cn('space-y-4', level > 0 && 'ml-8 border-l-2 border-slate-200 pl-4')}>
        <Card className={cn(
          'hover:shadow-md transition-shadow group',
          !seat.isRightPersonRightSeat && seat.personName && 'border-amber-300 bg-amber-50'
        )}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <Avatar className="h-12 w-12 shrink-0">
                <AvatarFallback className={cn(
                  'text-lg',
                  seat.personName ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                )}>
                  {seat.personName
                    ? seat.personName.split(' ').map((n) => n[0]).join('')
                    : '?'}
                </AvatarFallback>
              </Avatar>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-900">{seat.seatName}</h3>
                    <p className="text-sm text-slate-500">{seat.roleDescription}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingSeat(seat)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteSeat(seat.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>

                {/* Person assigned */}
                <div className="mt-3">
                  {seat.personName ? (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-400" />
                      <span className="font-medium">{seat.personName}</span>
                      {seat.isRightPersonRightSeat ? (
                        <Badge className="bg-green-100 text-green-700 gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Right Person, Right Seat
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-700 gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Needs Attention
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-slate-500">
                      <User className="h-3 w-3 mr-1" />
                      Open Seat
                    </Badge>
                  )}
                </div>

                {/* GWC */}
                {seat.personName && (
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs text-slate-500 font-medium">GWC:</span>
                    <GWCBadge label="Gets It" value={seat.gwcGetsIt} onClick={() => toggleGWC(seat.id, 'gwcGetsIt')} />
                    <GWCBadge label="Wants It" value={seat.gwcWantsIt} onClick={() => toggleGWC(seat.id, 'gwcWantsIt')} />
                    <GWCBadge label="Capacity" value={seat.gwcCapacity} onClick={() => toggleGWC(seat.id, 'gwcCapacity')} />
                  </div>
                )}

                {/* Responsibilities */}
                {seat.responsibilities.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-medium text-slate-500 mb-2">5 Key Responsibilities</p>
                    <ul className="space-y-1">
                      {seat.responsibilities.map((resp, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-slate-700">
                          <div className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center text-xs font-medium text-slate-500">
                            {index + 1}
                          </div>
                          {resp}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Child seats */}
        {childSeats.map((child) => (
          <SeatCard key={child.id} seat={child} level={level + 1} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Accountability Chart</h1>
          <p className="text-slate-500">The right structure with the right people in the right seats</p>
        </div>
        <Button className="gap-2" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Seat
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Total Seats</p><p className="text-2xl font-bold">{totalSeats}</p></div><GitBranch className="h-8 w-8 text-slate-400" /></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Filled Seats</p><p className="text-2xl font-bold text-blue-600">{filledSeats}</p></div><User className="h-8 w-8 text-blue-500" /></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Open Seats</p><p className="text-2xl font-bold text-amber-600">{totalSeats - filledSeats}</p></div><AlertCircle className="h-8 w-8 text-amber-500" /></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">RPRS Score</p><p className="text-2xl font-bold text-green-600">{filledSeats > 0 ? Math.round((rightPersonRightSeat / filledSeats) * 100) : 0}%</p></div><CheckCircle2 className="h-8 w-8 text-green-500" /></div></CardContent></Card>
      </div>

      {/* GWC Legend */}
      <Card className="bg-slate-50">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-6">
            <span className="text-sm font-medium text-slate-700">GWC = </span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-blue-600">G</span>
              <span className="text-sm text-slate-600">Gets It (understands the role)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-blue-600">W</span>
              <span className="text-sm text-slate-600">Wants It (passionate about it)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-blue-600">C</span>
              <span className="text-sm text-slate-600">Capacity (time, skills, knowledge)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Org Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Structure</CardTitle>
          <CardDescription>Click any seat to edit responsibilities or reassign. Click GWC badges to toggle.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {topLevelSeats.map((seat) => (
            <SeatCard key={seat.id} seat={seat} />
          ))}
        </CardContent>
      </Card>

      {/* Add Seat Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add New Seat</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Seat Name</Label><Input value={newSeat.seatName} onChange={(e) => setNewSeat({ ...newSeat, seatName: e.target.value })} placeholder="e.g., Operations Manager" /></div>
            <div className="space-y-2"><Label>Role Description</Label><Input value={newSeat.roleDescription} onChange={(e) => setNewSeat({ ...newSeat, roleDescription: e.target.value })} placeholder="Brief description of the role" /></div>
            <div className="space-y-2"><Label>Assign Person (optional)</Label><Select value={newSeat.personName} onValueChange={(v) => setNewSeat({ ...newSeat, personName: v })}><SelectTrigger><SelectValue placeholder="Select person or leave empty" /></SelectTrigger><SelectContent><SelectItem value="">-- Open Seat --</SelectItem>{teamMembers.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Reports To (optional)</Label><Select value={newSeat.reportsToId} onValueChange={(v) => setNewSeat({ ...newSeat, reportsToId: v })}><SelectTrigger><SelectValue placeholder="Select parent seat" /></SelectTrigger><SelectContent><SelectItem value="">-- Top Level --</SelectItem>{seats.map((s) => <SelectItem key={s.id} value={s.id}>{s.seatName}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2">
              <Label>5 Key Responsibilities</Label>
              {newSeat.responsibilities.map((resp, i) => (
                <Input key={i} value={resp} onChange={(e) => {
                  const newResps = [...newSeat.responsibilities];
                  newResps[i] = e.target.value;
                  setNewSeat({ ...newSeat, responsibilities: newResps });
                }} placeholder={`Responsibility ${i + 1}`} />
              ))}
            </div>
            {newSeat.personName && (
              <div className="space-y-2">
                <Label>GWC Assessment</Label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2"><Checkbox checked={newSeat.gwcGetsIt} onCheckedChange={(c) => setNewSeat({ ...newSeat, gwcGetsIt: c === true })} />Gets It</label>
                  <label className="flex items-center gap-2"><Checkbox checked={newSeat.gwcWantsIt} onCheckedChange={(c) => setNewSeat({ ...newSeat, gwcWantsIt: c === true })} />Wants It</label>
                  <label className="flex items-center gap-2"><Checkbox checked={newSeat.gwcCapacity} onCheckedChange={(c) => setNewSeat({ ...newSeat, gwcCapacity: c === true })} />Capacity</label>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button><Button onClick={addSeat}>Add Seat</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Seat Modal */}
      <Dialog open={!!editingSeat} onOpenChange={() => setEditingSeat(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Seat</DialogTitle></DialogHeader>
          {editingSeat && (
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Seat Name</Label><Input value={editingSeat.seatName} onChange={(e) => setEditingSeat({ ...editingSeat, seatName: e.target.value })} /></div>
              <div className="space-y-2"><Label>Role Description</Label><Input value={editingSeat.roleDescription} onChange={(e) => setEditingSeat({ ...editingSeat, roleDescription: e.target.value })} /></div>
              <div className="space-y-2"><Label>Assign Person</Label><Select value={editingSeat.personName || ''} onValueChange={(v) => setEditingSeat({ ...editingSeat, personName: v || undefined, personId: v ? editingSeat.personId || Date.now().toString() : undefined })}><SelectTrigger><SelectValue placeholder="Select person or leave empty" /></SelectTrigger><SelectContent><SelectItem value="">-- Open Seat --</SelectItem>{teamMembers.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Reports To</Label><Select value={editingSeat.reportsToId || ''} onValueChange={(v) => setEditingSeat({ ...editingSeat, reportsToId: v || undefined })}><SelectTrigger><SelectValue placeholder="Select parent seat" /></SelectTrigger><SelectContent><SelectItem value="">-- Top Level --</SelectItem>{seats.filter(s => s.id !== editingSeat.id).map((s) => <SelectItem key={s.id} value={s.id}>{s.seatName}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2">
                <Label>5 Key Responsibilities</Label>
                {[0, 1, 2, 3, 4].map((i) => (
                  <Input key={i} value={editingSeat.responsibilities[i] || ''} onChange={(e) => {
                    const newResps = [...editingSeat.responsibilities];
                    while (newResps.length <= i) newResps.push('');
                    newResps[i] = e.target.value;
                    setEditingSeat({ ...editingSeat, responsibilities: newResps });
                  }} placeholder={`Responsibility ${i + 1}`} />
                ))}
              </div>
              {editingSeat.personName && (
                <div className="space-y-2">
                  <Label>GWC Assessment</Label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2"><Checkbox checked={editingSeat.gwcGetsIt} onCheckedChange={(c) => setEditingSeat({ ...editingSeat, gwcGetsIt: c === true })} />Gets It</label>
                    <label className="flex items-center gap-2"><Checkbox checked={editingSeat.gwcWantsIt} onCheckedChange={(c) => setEditingSeat({ ...editingSeat, gwcWantsIt: c === true })} />Wants It</label>
                    <label className="flex items-center gap-2"><Checkbox checked={editingSeat.gwcCapacity} onCheckedChange={(c) => setEditingSeat({ ...editingSeat, gwcCapacity: c === true })} />Capacity</label>
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => setEditingSeat(null)}>Cancel</Button><Button onClick={updateSeat}>Save Changes</Button></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
