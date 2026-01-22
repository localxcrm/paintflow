'use client';

import type { SubEarningsSummary } from '@/types/sub-financial';

interface EarningsSummaryProps {
  summary: SubEarningsSummary;
}

export function EarningsSummary({ summary }: EarningsSummaryProps) {
  return (
    <div className="space-y-3">
      {/* Main summary cards */}
      <div className="flex gap-4 bg-white/10 rounded-xl p-3">
        <div className="flex-1 text-center">
          <p className="text-2xl font-bold text-white">
            ${summary.totalEarnings.toFixed(2)}
          </p>
          <p className="text-xs text-blue-200">Total Ganho</p>
        </div>
        <div className="w-px h-8 bg-blue-400/30 self-center" />
        <div className="flex-1 text-center">
          <p className="text-2xl font-bold text-white">
            ${summary.totalPending.toFixed(2)}
          </p>
          <p className="text-xs text-amber-200">Pendente</p>
        </div>
        <div className="w-px h-8 bg-blue-400/30 self-center" />
        <div className="flex-1 text-center">
          <p className="text-2xl font-bold text-white">
            ${summary.totalPaid.toFixed(2)}
          </p>
          <p className="text-xs text-green-200">Pago</p>
        </div>
      </div>

      {/* Effective rate card - only if owner works */}
      {summary.ownerHoursTotal && summary.ownerHoursTotal > 0 && summary.effectiveRateOverall && (
        <div className="bg-white/10 rounded-xl p-3 text-center">
          <p className="text-sm text-blue-200">Taxa Efetiva Media</p>
          <p className="text-3xl font-bold text-white">
            ${summary.effectiveRateOverall.toFixed(2)}/h
          </p>
          <p className="text-xs text-blue-300">
            {summary.ownerHoursTotal.toFixed(1)}h trabalhadas
          </p>
        </div>
      )}
    </div>
  );
}
