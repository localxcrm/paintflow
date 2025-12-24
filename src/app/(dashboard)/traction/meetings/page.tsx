'use client';

import { useState } from 'react';
import { mockMeetings, mockScorecardMetrics, mockRocks, mockTodos, mockIssues } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus,
  Calendar,
  Clock,
  Users,
  Star,
  PlayCircle,
  CheckCircle2,
  BarChart3,
  Mountain,
  AlertCircle,
  Edit,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

type Meeting = typeof mockMeetings[0];

const teamMembers = ['Mike Johnson', 'Sarah Davis', 'Tom Wilson', 'Lisa Chen', 'David Martinez'];

const l10Agenda = [
  { name: 'Segue', duration: 5, description: 'Good news - personal & professional' },
  { name: 'Scorecard', duration: 5, description: 'Review weekly metrics' },
  { name: 'Rock Review', duration: 5, description: 'On track / Off track status' },
  { name: 'Headlines', duration: 5, description: 'Customer & employee updates' },
  { name: 'To-Do List', duration: 5, description: 'Review last week\'s to-dos' },
  { name: 'IDS', duration: 60, description: 'Identify, Discuss, Solve issues' },
  { name: 'Conclude', duration: 5, description: 'Recap to-dos, rate meeting 1-10' },
];

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>(mockMeetings);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [newMeeting, setNewMeeting] = useState({
    meetingDate: format(new Date(), 'yyyy-MM-dd'),
    meetingType: 'l10' as 'l10' | 'quarterly' | 'annual',
    attendees: [] as string[],
    segueNotes: '',
    headlines: '',
    ratingAvg: 8,
  });

  const avgRating = meetings.length > 0
    ? meetings.reduce((sum, m) => sum + m.ratingAvg, 0) / meetings.length
    : 0;

  // Quick stats for current meeting prep
  const onTrackScorecard = mockScorecardMetrics.filter((m) => m.entries[0]?.onTrack).length;
  const totalScorecard = mockScorecardMetrics.length;
  const onTrackRocks = mockRocks.filter((r) => r.status === 'on_track' || r.status === 'complete').length;
  const totalRocks = mockRocks.filter((r) => r.status !== 'dropped').length;
  const pendingTodos = mockTodos.filter((t) => t.status === 'pending').length;
  const openIssues = mockIssues.filter((i) => i.status !== 'solved').length;

  const addMeeting = () => {
    if (!newMeeting.meetingDate) return;
    const meeting: Meeting = {
      id: Date.now().toString(),
      meetingDate: newMeeting.meetingDate,
      meetingType: newMeeting.meetingType,
      attendees: newMeeting.attendees,
      segueNotes: newMeeting.segueNotes,
      headlines: newMeeting.headlines,
      ratingAvg: newMeeting.ratingAvg,
    };
    setMeetings([meeting, ...meetings]);
    setNewMeeting({
      meetingDate: format(new Date(), 'yyyy-MM-dd'),
      meetingType: 'l10',
      attendees: [],
      segueNotes: '',
      headlines: '',
      ratingAvg: 8,
    });
    setIsAddModalOpen(false);
  };

  const updateMeeting = () => {
    if (!editingMeeting) return;
    setMeetings(meetings.map(m => m.id === editingMeeting.id ? editingMeeting : m));
    setEditingMeeting(null);
  };

  const deleteMeeting = (meetingId: string) => {
    setMeetings(meetings.filter(m => m.id !== meetingId));
  };

  const toggleAttendee = (person: string, isNew: boolean) => {
    if (isNew) {
      setNewMeeting({
        ...newMeeting,
        attendees: newMeeting.attendees.includes(person)
          ? newMeeting.attendees.filter(a => a !== person)
          : [...newMeeting.attendees, person]
      });
    } else if (editingMeeting) {
      setEditingMeeting({
        ...editingMeeting,
        attendees: editingMeeting.attendees.includes(person)
          ? editingMeeting.attendees.filter(a => a !== person)
          : [...editingMeeting.attendees, person]
      });
    }
  };

  function MeetingCard({ meeting }: { meeting: Meeting }) {
    const ratingColor = meeting.ratingAvg >= 8 ? 'text-green-600' : meeting.ratingAvg >= 6 ? 'text-amber-600' : 'text-red-600';

    return (
      <Card className="hover:shadow-md transition-shadow group">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">
                  {meeting.meetingType === 'l10' ? 'Level 10' : meeting.meetingType === 'quarterly' ? 'Quarterly' : 'Annual'}
                </Badge>
                <span className="text-sm text-slate-500">{format(parseISO(meeting.meetingDate), 'EEEE, MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1"><Users className="h-4 w-4" />{meeting.attendees.length} attendees</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <Star className={cn('h-5 w-5', ratingColor)} />
                  <span className={cn('text-2xl font-bold', ratingColor)}>{meeting.ratingAvg}</span>
                </div>
                <p className="text-xs text-slate-500">Meeting Rating</p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingMeeting(meeting)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteMeeting(meeting.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </div>
            </div>
          </div>

          {meeting.segueNotes && (
            <div className="mt-4 p-3 bg-slate-50 rounded-lg">
              <p className="text-xs font-medium text-slate-500 mb-1">Segue Highlights</p>
              <p className="text-sm text-slate-700">{meeting.segueNotes}</p>
            </div>
          )}

          {meeting.headlines && (
            <div className="mt-2 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs font-medium text-blue-600 mb-1">Headlines</p>
              <p className="text-sm text-slate-700">{meeting.headlines}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">L10 Meetings</h1>
          <p className="text-slate-500">Weekly Level 10 Meeting tracker</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Log Meeting
          </Button>
          <Button className="gap-2">
            <PlayCircle className="h-4 w-4" />
            Start Meeting
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Avg Rating</p><p className={cn('text-2xl font-bold', avgRating >= 8 ? 'text-green-600' : avgRating >= 6 ? 'text-amber-600' : 'text-red-600')}>{avgRating.toFixed(1)}</p></div><Star className="h-8 w-8 text-amber-400" /></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Meetings Held</p><p className="text-2xl font-bold">{meetings.length}</p></div><Calendar className="h-8 w-8 text-blue-500" /></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Open Issues</p><p className="text-2xl font-bold text-amber-600">{openIssues}</p></div><AlertCircle className="h-8 w-8 text-amber-500" /></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Pending To-Dos</p><p className="text-2xl font-bold">{pendingTodos}</p></div><CheckCircle2 className="h-8 w-8 text-slate-400" /></div></CardContent></Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* L10 Agenda */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" />L10 Agenda</CardTitle>
            <CardDescription>90-minute meeting structure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {l10Agenda.map((item, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center text-sm font-bold">{item.duration}m</div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.description}</p>
                </div>
              </div>
            ))}
            <Separator />
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="font-medium text-blue-900">Total Duration</span>
              <span className="text-xl font-bold text-blue-700">90 min</span>
            </div>
          </CardContent>
        </Card>

        {/* Meeting Prep */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Meeting Prep</CardTitle>
              <CardDescription>Current status for your next L10</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Scorecard */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-blue-500" /><span className="font-medium">Scorecard</span></div>
                  <span className="text-sm text-slate-500">{onTrackScorecard}/{totalScorecard} on track</span>
                </div>
                <Progress value={(onTrackScorecard / totalScorecard) * 100} className="h-2" />
              </div>

              {/* Rocks */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2"><Mountain className="h-5 w-5 text-purple-500" /><span className="font-medium">Rocks</span></div>
                  <span className="text-sm text-slate-500">{onTrackRocks}/{totalRocks} on track</span>
                </div>
                <Progress value={(onTrackRocks / totalRocks) * 100} className="h-2" />
              </div>

              {/* To-Dos */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-500" /><span className="font-medium">To-Dos</span></div>
                  <Badge variant={pendingTodos > 5 ? 'destructive' : 'secondary'}>{pendingTodos} pending</Badge>
                </div>
              </div>

              {/* Issues */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-amber-500" /><span className="font-medium">Issues for IDS</span></div>
                  <Badge variant={openIssues > 10 ? 'destructive' : 'secondary'}>{openIssues} open</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Past Meetings */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Meetings</CardTitle>
              <CardDescription>Past L10 meeting history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {meetings.map((meeting) => (<MeetingCard key={meeting.id} meeting={meeting} />))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Meeting Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Log Meeting</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Meeting Date</Label><Input type="date" value={newMeeting.meetingDate} onChange={(e) => setNewMeeting({ ...newMeeting, meetingDate: e.target.value })} /></div>
              <div className="space-y-2"><Label>Meeting Type</Label><Select value={newMeeting.meetingType} onValueChange={(v: 'l10' | 'quarterly' | 'annual') => setNewMeeting({ ...newMeeting, meetingType: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="l10">Level 10</SelectItem><SelectItem value="quarterly">Quarterly</SelectItem><SelectItem value="annual">Annual</SelectItem></SelectContent></Select></div>
            </div>
            <div className="space-y-2">
              <Label>Attendees</Label>
              <div className="flex flex-wrap gap-2">
                {teamMembers.map((person) => (
                  <Button key={person} variant={newMeeting.attendees.includes(person) ? 'default' : 'outline'} size="sm" onClick={() => toggleAttendee(person, true)}>
                    {person.split(' ')[0]}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2"><Label>Rating (1-10)</Label><Input type="number" min="1" max="10" value={newMeeting.ratingAvg} onChange={(e) => setNewMeeting({ ...newMeeting, ratingAvg: Number(e.target.value) })} /></div>
            <div className="space-y-2"><Label>Segue Notes</Label><Textarea value={newMeeting.segueNotes} onChange={(e) => setNewMeeting({ ...newMeeting, segueNotes: e.target.value })} rows={2} placeholder="Good news from the team..." /></div>
            <div className="space-y-2"><Label>Headlines</Label><Textarea value={newMeeting.headlines} onChange={(e) => setNewMeeting({ ...newMeeting, headlines: e.target.value })} rows={2} placeholder="Customer/employee updates..." /></div>
            <div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button><Button onClick={addMeeting}>Log Meeting</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Meeting Modal */}
      <Dialog open={!!editingMeeting} onOpenChange={() => setEditingMeeting(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Meeting</DialogTitle></DialogHeader>
          {editingMeeting && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Meeting Date</Label><Input type="date" value={editingMeeting.meetingDate.split('T')[0]} onChange={(e) => setEditingMeeting({ ...editingMeeting, meetingDate: e.target.value })} /></div>
                <div className="space-y-2"><Label>Meeting Type</Label><Select value={editingMeeting.meetingType} onValueChange={(v: 'l10' | 'quarterly' | 'annual') => setEditingMeeting({ ...editingMeeting, meetingType: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="l10">Level 10</SelectItem><SelectItem value="quarterly">Quarterly</SelectItem><SelectItem value="annual">Annual</SelectItem></SelectContent></Select></div>
              </div>
              <div className="space-y-2">
                <Label>Attendees</Label>
                <div className="flex flex-wrap gap-2">
                  {teamMembers.map((person) => (
                    <Button key={person} variant={editingMeeting.attendees.includes(person) ? 'default' : 'outline'} size="sm" onClick={() => toggleAttendee(person, false)}>
                      {person.split(' ')[0]}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2"><Label>Rating (1-10)</Label><Input type="number" min="1" max="10" value={editingMeeting.ratingAvg} onChange={(e) => setEditingMeeting({ ...editingMeeting, ratingAvg: Number(e.target.value) })} /></div>
              <div className="space-y-2"><Label>Segue Notes</Label><Textarea value={editingMeeting.segueNotes || ''} onChange={(e) => setEditingMeeting({ ...editingMeeting, segueNotes: e.target.value })} rows={2} /></div>
              <div className="space-y-2"><Label>Headlines</Label><Textarea value={editingMeeting.headlines || ''} onChange={(e) => setEditingMeeting({ ...editingMeeting, headlines: e.target.value })} rows={2} /></div>
              <div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => setEditingMeeting(null)}>Cancel</Button><Button onClick={updateMeeting}>Save Changes</Button></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
