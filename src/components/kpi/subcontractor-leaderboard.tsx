'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Star, Trophy, Medal, Award } from 'lucide-react';
import { SubcontractorRankEntry } from '@/types/kpi';
import { cn } from '@/lib/utils';

interface SubcontractorLeaderboardProps {
  data: SubcontractorRankEntry[];
  onSubcontractorClick?: (id: string) => void;
}

type SortField = 'reviews' | 'jobs' | 'revenue';

const SORT_LABELS: Record<SortField, string> = {
  reviews: 'Avaliacoes',
  jobs: 'Trabalhos',
  revenue: 'Receita',
};

// Position badges for top 3
function PositionBadge({ position }: { position: number }) {
  if (position === 1) {
    return <Trophy className="w-5 h-5 text-yellow-500" />;
  }
  if (position === 2) {
    return <Medal className="w-5 h-5 text-slate-400" />;
  }
  if (position === 3) {
    return <Award className="w-5 h-5 text-amber-600" />;
  }
  return (
    <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-slate-500">
      {position}
    </span>
  );
}

export function SubcontractorLeaderboard({ data, onSubcontractorClick }: SubcontractorLeaderboardProps) {
  const [sortBy, setSortBy] = useState<SortField>('reviews');

  // Sort data based on selected field
  const sortedData = [...data].sort((a, b) => {
    switch (sortBy) {
      case 'reviews':
        return b.reviewCount - a.reviewCount;
      case 'jobs':
        return b.jobsCompleted - a.jobsCompleted;
      case 'revenue':
        return b.totalRevenue - a.totalRevenue;
      default:
        return 0;
    }
  });

  // Take top 5
  const topFive = sortedData.slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Ranking de Subempreiteiros</CardTitle>

          {/* Sort toggle buttons */}
          <div className="flex gap-1">
            {(['reviews', 'jobs', 'revenue'] as SortField[]).map((field) => (
              <Button
                key={field}
                variant={sortBy === field ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSortBy(field)}
                className="text-xs"
              >
                {SORT_LABELS[field]}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topFive.map((sub, index) => {
            const initials = sub.name
              .split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            return (
              <div
                key={sub.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg transition-colors",
                  index === 0 && "bg-yellow-50 border border-yellow-200",
                  index === 1 && "bg-slate-50",
                  index === 2 && "bg-amber-50/50",
                  onSubcontractorClick && "cursor-pointer hover:bg-slate-100"
                )}
                onClick={() => onSubcontractorClick?.(sub.id)}
              >
                {/* Position badge */}
                <PositionBadge position={index + 1} />

                {/* Avatar */}
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-slate-200 text-slate-600 text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                {/* Name and company */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{sub.name}</p>
                  {sub.companyName && (
                    <p className="text-xs text-slate-500 truncate">{sub.companyName}</p>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm">
                  {/* Reviews */}
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-medium">
                      {sub.avgReviewScore?.toFixed(1) ?? '-'}
                    </span>
                    <span className="text-slate-400">({sub.reviewCount})</span>
                  </div>

                  {/* Jobs */}
                  <div className="text-slate-600">
                    {sub.jobsCompleted} trab.
                  </div>

                  {/* Revenue */}
                  <div className="font-medium text-slate-900">
                    ${(sub.totalRevenue / 1000).toFixed(0)}K
                  </div>
                </div>
              </div>
            );
          })}

          {topFive.length === 0 && (
            <p className="text-center text-slate-500 py-4">
              Nenhum subempreiteiro encontrado
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
