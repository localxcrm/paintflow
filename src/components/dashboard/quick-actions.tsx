'use client';

import Link from 'next/link';
import { Plus, FileText, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Link href="/leads?action=new">
        <Button
          size="lg"
          className="w-full h-20 text-lg font-semibold bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-6 h-6 mr-2" />
          New Lead
        </Button>
      </Link>
      <Link href="/estimates/new">
        <Button
          size="lg"
          variant="outline"
          className="w-full h-20 text-lg font-semibold border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
        >
          <FileText className="w-6 h-6 mr-2" />
          Quick Estimate
        </Button>
      </Link>
      <Link href="/jobs">
        <Button
          size="lg"
          variant="outline"
          className="w-full h-20 text-lg font-semibold border-2 border-slate-300 hover:bg-slate-50"
        >
          <Calendar className="w-6 h-6 mr-2" />
          Today&apos;s Jobs
        </Button>
      </Link>
      <Link href="/jobs?filter=payment">
        <Button
          size="lg"
          variant="outline"
          className="w-full h-20 text-lg font-semibold border-2 border-green-600 text-green-600 hover:bg-green-50"
        >
          <DollarSign className="w-6 h-6 mr-2" />
          Record Payment
        </Button>
      </Link>
    </div>
  );
}
