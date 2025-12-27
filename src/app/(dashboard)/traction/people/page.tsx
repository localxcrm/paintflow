'use client';

import { useState } from 'react';
import { mockSeats, mockVTO } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import {
  Plus,
  UserCheck,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Calendar,
  AlertTriangle,
  Edit,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type Rating = '+' | '+/-' | '-';

interface PersonAnalyzer {
  id: string;
  name: string;
  role: string;
  reviewDate: string;
  coreValueRatings: Record<string, Rating>;
  gwc: {
    getsIt: boolean;
    wantsIt: boolean;
    capacity: boolean;
  };
  overallStatus: 'right_person_right_seat' | 'needs_work' | 'wrong_fit';
}

const ratingConfig: Record<Rating, { icon: React.ReactNode; className: string }> = {
  '+': { icon: <CheckCircle2 className="h-4 w-4" />, className: 'text-green-600 bg-green-50' },
  '+/-': { icon: <MinusCircle className="h-4 w-4" />, className: 'text-amber-600 bg-amber-50' },
  '-': { icon: <XCircle className="h-4 w-4" />, className: 'text-red-600 bg-red-50' },
};

function RatingBadge({ rating, onClick }: { rating: Rating; onClick?: () => void }) {
  const config = ratingConfig[rating];
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center justify-center w-8 h-8 rounded-lg transition-colors',
        config.className,
        onClick && 'hover:opacity-80 cursor-pointer'
      )}
    >
      {config.icon}
    </button>
  );
}

// Initialize mock people analyzer data
const initialPeopleAnalyzer: PersonAnalyzer[] = mockSeats
  .filter((seat) => seat.personName)
  .map((seat) => ({
    id: seat.personId || seat.id,
    name: seat.personName!,
    role: seat.seatName,
    reviewDate: '2024-12-01',
    coreValueRatings: mockVTO.coreValues.reduce((acc, value) => {
      const shortName = value.split(' - ')[0];
      acc[shortName] = '+' as Rating;
      return acc;
    }, {} as Record<string, Rating>),
    gwc: {
      getsIt: seat.gwcGetsIt,
      wantsIt: seat.gwcWantsIt,
      capacity: seat.gwcCapacity,
    },
    overallStatus: seat.isRightPersonRightSeat ? 'right_person_right_seat' : 'needs_work',
  }));

export default function PeoplePage() {
  const [people, setPeople] = useState<PersonAnalyzer[]>(initialPeopleAnalyzer);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<PersonAnalyzer | null>(null);
  const [newPerson, setNewPerson] = useState({
    name: '',
    role: '',
  });

  const coreValues = mockVTO.coreValues.map((v) => v.split(' - ')[0]);

  const rightPersonRightSeat = people.filter((p) => p.overallStatus === 'right_person_right_seat').length;
  const needsWork = people.filter((p) => p.overallStatus === 'needs_work').length;

  const cycleRating = (personId: string, coreValue: string) => {
    setPeople(people.map(p => {
      if (p.id !== personId) return p;
      const currentRating = p.coreValueRatings[coreValue] || '+';
      const nextRating: Rating = currentRating === '+' ? '+/-' : currentRating === '+/-' ? '-' : '+';
      const newRatings = { ...p.coreValueRatings, [coreValue]: nextRating };

      // Recalculate overall status
      const hasMinusRating = Object.values(newRatings).some(r => r === '-');
      const hasGWCIssue = !p.gwc.getsIt || !p.gwc.wantsIt || !p.gwc.capacity;
      const overallStatus = hasMinusRating || hasGWCIssue ? 'needs_work' : 'right_person_right_seat';

      return { ...p, coreValueRatings: newRatings, overallStatus };
    }));
  };

  const toggleGWC = (personId: string, field: 'getsIt' | 'wantsIt' | 'capacity') => {
    setPeople(people.map(p => {
      if (p.id !== personId) return p;
      const newGwc = { ...p.gwc, [field]: !p.gwc[field] };

      // Recalculate overall status
      const hasMinusRating = Object.values(p.coreValueRatings).some(r => r === '-');
      const hasGWCIssue = !newGwc.getsIt || !newGwc.wantsIt || !newGwc.capacity;
      const overallStatus = hasMinusRating || hasGWCIssue ? 'needs_work' : 'right_person_right_seat';

      return { ...p, gwc: newGwc, overallStatus };
    }));
  };

  const addPerson = () => {
    if (!newPerson.name || !newPerson.role) return;
    const person: PersonAnalyzer = {
      id: Date.now().toString(),
      name: newPerson.name,
      role: newPerson.role,
      reviewDate: format(new Date(), 'yyyy-MM-dd'),
      coreValueRatings: coreValues.reduce((acc, v) => ({ ...acc, [v]: '+' as Rating }), {}),
      gwc: { getsIt: true, wantsIt: true, capacity: true },
      overallStatus: 'right_person_right_seat',
    };
    setPeople([...people, person]);
    setNewPerson({ name: '', role: '' });
    setIsAddModalOpen(false);
  };

  const updatePerson = () => {
    if (!editingPerson) return;
    setPeople(people.map(p => p.id === editingPerson.id ? editingPerson : p));
    setEditingPerson(null);
  };

  const deletePerson = (personId: string) => {
    setPeople(people.filter(p => p.id !== personId));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">People Analyzer</h1>
          <p className="text-slate-500">Quarterly review - Core Values + GWC assessment</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Person
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Start Review
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Team Size</p><p className="text-2xl font-bold">{people.length}</p></div><UserCheck className="h-8 w-8 text-slate-400" /></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Right Person, Right Seat</p><p className="text-2xl font-bold text-green-600">{rightPersonRightSeat}</p></div><CheckCircle2 className="h-8 w-8 text-green-500" /></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Needs Work</p><p className="text-2xl font-bold text-amber-600">{needsWork}</p></div><AlertTriangle className="h-8 w-8 text-amber-500" /></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Last Review</p><p className="text-lg font-bold">Dec 1, 2024</p></div><Calendar className="h-8 w-8 text-blue-500" /></div></CardContent></Card>
      </div>

      {/* Core Values Reference */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Core Values</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {mockVTO.coreValues.map((value, index) => (
              <Badge key={index} variant="outline" className="bg-white">{value}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* People Analyzer Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Assessment</CardTitle>
          <CardDescription>Click ratings to cycle through +, +/-, - values. Click GWC to toggle.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-white min-w-[200px]">Person</TableHead>
                  {coreValues.map((value) => (
                    <TableHead key={value} className="text-center min-w-[100px]">
                      <div className="text-xs leading-tight">{value}</div>
                    </TableHead>
                  ))}
                  <TableHead className="text-center bg-slate-50">G</TableHead>
                  <TableHead className="text-center bg-slate-50">W</TableHead>
                  <TableHead className="text-center bg-slate-50">C</TableHead>
                  <TableHead className="text-center min-w-[120px]">Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {people.map((person) => (
                  <TableRow key={person.id} className="group">
                    <TableCell className="sticky left-0 bg-white">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                            {person.name.split(' ').map((n) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{person.name}</p>
                          <p className="text-xs text-slate-500">{person.role}</p>
                        </div>
                      </div>
                    </TableCell>
                    {coreValues.map((value) => {
                      const rating = person.coreValueRatings[value] || '+';
                      return (
                        <TableCell key={value} className="text-center">
                          <div className="flex justify-center">
                            <RatingBadge rating={rating} onClick={() => cycleRating(person.id, value)} />
                          </div>
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center bg-slate-50">
                      <div className="flex justify-center">
                        <RatingBadge rating={person.gwc.getsIt ? '+' : '-'} onClick={() => toggleGWC(person.id, 'getsIt')} />
                      </div>
                    </TableCell>
                    <TableCell className="text-center bg-slate-50">
                      <div className="flex justify-center">
                        <RatingBadge rating={person.gwc.wantsIt ? '+' : '-'} onClick={() => toggleGWC(person.id, 'wantsIt')} />
                      </div>
                    </TableCell>
                    <TableCell className="text-center bg-slate-50">
                      <div className="flex justify-center">
                        <RatingBadge rating={person.gwc.capacity ? '+' : '-'} onClick={() => toggleGWC(person.id, 'capacity')} />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="secondary"
                        className={cn(
                          person.overallStatus === 'right_person_right_seat'
                            ? 'bg-green-100 text-green-700'
                            : person.overallStatus === 'needs_work'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                        )}
                      >
                        {person.overallStatus === 'right_person_right_seat' ? 'RPRS' : person.overallStatus === 'needs_work' ? 'Needs Work' : 'Wrong Fit'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingPerson(person)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deletePerson(person.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Rating Legend */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Rating Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <RatingBadge rating="+" />
              <div>
                <p className="font-medium text-green-700">Plus (+)</p>
                <p className="text-xs text-slate-600">Consistently exhibits this value/trait</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
              <RatingBadge rating="+/-" />
              <div>
                <p className="font-medium text-amber-700">Plus/Minus (+/-)</p>
                <p className="text-xs text-slate-600">Sometimes exhibits, needs improvement</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
              <RatingBadge rating="-" />
              <div>
                <p className="font-medium text-red-700">Minus (-)</p>
                <p className="text-xs text-slate-600">Does not exhibit this value/trait</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Person Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Team Member</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Name</Label><Input value={newPerson.name} onChange={(e) => setNewPerson({ ...newPerson, name: e.target.value })} placeholder="Full name" /></div>
            <div className="space-y-2"><Label>Role / Seat</Label><Input value={newPerson.role} onChange={(e) => setNewPerson({ ...newPerson, role: e.target.value })} placeholder="e.g., Sales Manager" /></div>
            <div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button><Button onClick={addPerson}>Add Person</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Person Modal */}
      <Dialog open={!!editingPerson} onOpenChange={() => setEditingPerson(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Team Member</DialogTitle></DialogHeader>
          {editingPerson && (
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Name</Label><Input value={editingPerson.name} onChange={(e) => setEditingPerson({ ...editingPerson, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Role / Seat</Label><Input value={editingPerson.role} onChange={(e) => setEditingPerson({ ...editingPerson, role: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>Overall Status</Label>
                <Select value={editingPerson.overallStatus} onValueChange={(v: 'right_person_right_seat' | 'needs_work' | 'wrong_fit') => setEditingPerson({ ...editingPerson, overallStatus: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="right_person_right_seat">Right Person, Right Seat</SelectItem>
                    <SelectItem value="needs_work">Needs Work</SelectItem>
                    <SelectItem value="wrong_fit">Wrong Fit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => setEditingPerson(null)}>Cancel</Button><Button onClick={updatePerson}>Save Changes</Button></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
