'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { mockLeads, mockTodos } from '@/lib/mock-data';
import { Phone, Mail, Calendar, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';

function formatDate(dateString: string) {
  const date = parseISO(dateString);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'MMM d');
}

export function UpcomingFollowups() {
  const leadsWithFollowups = mockLeads
    .filter((lead) => lead.nextFollowupDate)
    .sort((a, b) =>
      new Date(a.nextFollowupDate!).getTime() - new Date(b.nextFollowupDate!).getTime()
    )
    .slice(0, 3);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Upcoming Follow-ups</CardTitle>
        <Link href="/leads">
          <Button variant="ghost" size="sm" className="gap-1">
            View all <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {leadsWithFollowups.map((lead) => (
          <div
            key={lead.id}
            className="flex items-start justify-between p-3 rounded-lg bg-slate-50"
          >
            <div className="space-y-1">
              <p className="font-medium text-slate-900">
                {lead.firstName} {lead.lastName}
              </p>
              <p className="text-sm text-slate-500">{lead.address}</p>
              <div className="flex items-center gap-3 mt-2">
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <Phone className="w-4 h-4 mr-1" />
                  Call
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <Mail className="w-4 h-4 mr-1" />
                  Email
                </Button>
              </div>
            </div>
            <Badge
              variant={isToday(parseISO(lead.nextFollowupDate!)) ? 'destructive' : 'secondary'}
              className="flex items-center gap-1"
            >
              <Calendar className="w-3 h-3" />
              {formatDate(lead.nextFollowupDate!)}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function PendingTodos() {
  const pendingTodos = mockTodos
    .filter((todo) => todo.status === 'pending')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">To-Do List</CardTitle>
        <Link href="/traction/todos">
          <Button variant="ghost" size="sm" className="gap-1">
            View all <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {pendingTodos.map((todo) => (
          <div
            key={todo.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-slate-300">
              <CheckCircle2 className="w-4 h-4 text-slate-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-900 truncate">{todo.title}</p>
              <p className="text-sm text-slate-500">{todo.owner}</p>
            </div>
            <Badge
              variant={isToday(parseISO(todo.dueDate)) ? 'destructive' : 'outline'}
              className="shrink-0"
            >
              {formatDate(todo.dueDate)}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
