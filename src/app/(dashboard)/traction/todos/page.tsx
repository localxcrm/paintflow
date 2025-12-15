'use client';

import { useState } from 'react';
import { mockTodos } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  CheckCircle2,
  Circle,
  Calendar,
  User,
  Clock,
  Trash2,
  Edit,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO, isToday, isTomorrow, isPast, addDays } from 'date-fns';

type Todo = typeof mockTodos[0];

function formatDueDate(dateString: string) {
  const date = parseISO(dateString);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'MMM d');
}

const teamMembers = ['Mike Johnson', 'Sarah Davis', 'Tom Wilson', 'Lisa Chen', 'David Martinez'];

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>(mockTodos);
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [newTodo, setNewTodo] = useState({ title: '', owner: '', dueDate: '' });

  const filteredTodos = todos.filter((todo) => {
    if (filter === 'pending' && todo.status !== 'pending') return false;
    if (filter === 'done' && todo.status !== 'done') return false;
    if (searchQuery) {
      return (
        todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        todo.owner.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return true;
  });

  const pendingCount = todos.filter((t) => t.status === 'pending').length;
  const doneCount = todos.filter((t) => t.status === 'done').length;
  const overdueCount = todos.filter(
    (t) => t.status === 'pending' && isPast(parseISO(t.dueDate)) && !isToday(parseISO(t.dueDate))
  ).length;

  const todosByOwner = filteredTodos.reduce((acc, todo) => {
    if (!acc[todo.owner]) acc[todo.owner] = [];
    acc[todo.owner].push(todo);
    return acc;
  }, {} as Record<string, Todo[]>);

  const toggleTodo = (todoId: string) => {
    setTodos(todos.map(t =>
      t.id === todoId ? { ...t, status: t.status === 'done' ? 'pending' : 'done' } : t
    ));
  };

  const addTodo = () => {
    if (!newTodo.title || !newTodo.owner) return;
    const todo: Todo = {
      id: Date.now().toString(),
      title: newTodo.title,
      owner: newTodo.owner,
      dueDate: newTodo.dueDate || format(addDays(new Date(), 7), 'yyyy-MM-dd'),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setTodos([todo, ...todos]);
    setNewTodo({ title: '', owner: '', dueDate: '' });
    setIsAddModalOpen(false);
  };

  const updateTodo = () => {
    if (!editingTodo) return;
    setTodos(todos.map(t => t.id === editingTodo.id ? editingTodo : t));
    setEditingTodo(null);
  };

  const deleteTodo = (todoId: string) => {
    setTodos(todos.filter(t => t.id !== todoId));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">To-Do List</h1>
          <p className="text-slate-500">7-day action items - tasks that move rocks forward</p>
        </div>
        <Button className="gap-2" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Add To-Do
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Pending</p><p className="text-2xl font-bold">{pendingCount}</p></div><Circle className="h-8 w-8 text-slate-400" /></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Completed</p><p className="text-2xl font-bold text-green-600">{doneCount}</p></div><CheckCircle2 className="h-8 w-8 text-green-500" /></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Overdue</p><p className="text-2xl font-bold text-red-600">{overdueCount}</p></div><Clock className="h-8 w-8 text-red-500" /></div></CardContent></Card>
        <Card><CardContent className="p-4"><div><p className="text-sm text-slate-500">Completion Rate</p><p className="text-2xl font-bold">{todos.length > 0 ? Math.round((doneCount / todos.length) * 100) : 0}%</p></div></CardContent></Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Input placeholder="Search to-dos..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="max-w-md" />
        <div className="flex gap-2">
          <Button variant={filter === 'all' ? 'secondary' : 'outline'} size="sm" onClick={() => setFilter('all')}>All</Button>
          <Button variant={filter === 'pending' ? 'secondary' : 'outline'} size="sm" onClick={() => setFilter('pending')}>Pending</Button>
          <Button variant={filter === 'done' ? 'secondary' : 'outline'} size="sm" onClick={() => setFilter('done')}>Done</Button>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(todosByOwner).map(([owner, ownerTodos]) => (
          <Card key={owner}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-slate-400" />
                {owner}
                <Badge variant="outline" className="ml-2">{ownerTodos.filter((t) => t.status === 'pending').length} pending</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {ownerTodos.map((todo) => {
                const isOverdue = todo.status === 'pending' && isPast(parseISO(todo.dueDate)) && !isToday(parseISO(todo.dueDate));
                const isDueToday = isToday(parseISO(todo.dueDate));
                return (
                  <div key={todo.id} className={cn('flex items-center gap-3 p-3 rounded-lg border transition-colors group', todo.status === 'done' ? 'bg-slate-50 border-slate-200' : isOverdue ? 'bg-red-50 border-red-200' : isDueToday ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200 hover:bg-slate-50')}>
                    <Checkbox checked={todo.status === 'done'} onCheckedChange={() => toggleTodo(todo.id)} className={cn('h-5 w-5', todo.status === 'done' && 'bg-green-500 border-green-500')} />
                    <div className="flex-1 min-w-0"><p className={cn('font-medium', todo.status === 'done' && 'line-through text-slate-400')}>{todo.title}</p></div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={todo.status === 'done' ? 'secondary' : isOverdue ? 'destructive' : isDueToday ? 'default' : 'outline'} className="gap-1"><Calendar className="h-3 w-3" />{formatDueDate(todo.dueDate)}</Badge>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 h-8 w-8" onClick={() => setEditingTodo(todo)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 h-8 w-8" onClick={() => deleteTodo(todo.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add New To-Do</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Title</Label><Input value={newTodo.title} onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })} placeholder="What needs to be done?" /></div>
            <div className="space-y-2"><Label>Owner</Label><Select value={newTodo.owner} onValueChange={(v) => setNewTodo({ ...newTodo, owner: v })}><SelectTrigger><SelectValue placeholder="Select owner" /></SelectTrigger><SelectContent>{teamMembers.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={newTodo.dueDate} onChange={(e) => setNewTodo({ ...newTodo, dueDate: e.target.value })} /></div>
            <div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button><Button onClick={addTodo}>Add To-Do</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingTodo} onOpenChange={() => setEditingTodo(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit To-Do</DialogTitle></DialogHeader>
          {editingTodo && (
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Title</Label><Input value={editingTodo.title} onChange={(e) => setEditingTodo({ ...editingTodo, title: e.target.value })} /></div>
              <div className="space-y-2"><Label>Owner</Label><Select value={editingTodo.owner} onValueChange={(v) => setEditingTodo({ ...editingTodo, owner: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{teamMembers.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={editingTodo.dueDate.split('T')[0]} onChange={(e) => setEditingTodo({ ...editingTodo, dueDate: e.target.value })} /></div>
              <div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => setEditingTodo(null)}>Cancel</Button><Button onClick={updateTodo}>Save Changes</Button></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
