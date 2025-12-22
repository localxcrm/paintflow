'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Target,
  Percent,
  Loader2,
} from 'lucide-react';
import type { KpiWithTarget } from '@/types/database';

// Temporary tenant ID - in production, this would come from auth context
const TEMP_TENANT_ID = 'tenant_demo';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  target?: number;
  achievement?: number;
  status?: 'on_track' | 'at_risk' | 'behind';
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  format?: 'currency' | 'number' | 'percent';
}

function KpiCard({
  title,
  value,
  subtitle,
  target,
  achievement,
  status,
  icon,
  trend,
  format = 'number',
}: KpiCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val;

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val);
      case 'percent':
        return `${val.toFixed(1)}%`;
      default:
        return new Intl.NumberFormat('en-US').format(val);
    }
  };

  const getStatusColor = (s?: string) => {
    switch (s) {
      case 'on_track':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'at_risk':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'behind':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (s?: string) => {
    switch (s) {
      case 'on_track':
        return 'On Track';
      case 'at_risk':
        return 'At Risk';
      case 'behind':
        return 'Behind';
      default:
        return '';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold">{formatValue(value)}</div>
          {trend && (
            <span className={trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-500'}>
              {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : trend === 'down' ? <TrendingDown className="w-4 h-4" /> : null}
            </span>
          )}
        </div>

        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}

        {target !== undefined && achievement !== undefined && (
          <div className="mt-3 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                Target: {format === 'currency' ? formatValue(target) : formatValue(target)}
              </span>
              <span className="font-medium">{achievement.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  status === 'on_track'
                    ? 'bg-green-500'
                    : status === 'at_risk'
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(achievement, 100)}%` }}
              />
            </div>
          </div>
        )}

        {status && (
          <Badge className={`mt-2 ${getStatusColor(status)}`}>
            {getStatusLabel(status)}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

export function KpiCards() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'mtd' | 'ytd'>('mtd');
  const [kpi, setKpi] = useState<KpiWithTarget | null>(null);

  useEffect(() => {
    fetchKpi();
  }, [period]);

  const fetchKpi = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/kpi?tenantId=${TEMP_TENANT_ID}&period=${period}&includeTrend=true`);
      const data = await res.json();
      if (data.kpi) {
        setKpi(data.kpi);
      }
    } catch (error) {
      console.error('Error fetching KPIs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !kpi) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // If no KPI data yet, show placeholder
  if (!kpi) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground mb-4">
            No KPI data available yet. Connect your GoHighLevel account to start tracking.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Performance Overview</h2>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as 'mtd' | 'ytd')}>
          <TabsList>
            <TabsTrigger value="mtd">MTD</TabsTrigger>
            <TabsTrigger value="ytd">YTD</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Primary KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Revenue"
          value={kpi.revenueWon}
          format="currency"
          target={kpi.revenueTarget}
          achievement={kpi.revenueAchievement}
          status={kpi.revenueStatus}
          icon={<DollarSign className="w-4 h-4" />}
        />
        <KpiCard
          title="Leads"
          value={kpi.leadsTotal}
          format="number"
          target={kpi.leadsTarget}
          achievement={kpi.leadsAchievement}
          status={kpi.leadsStatus}
          icon={<Users className="w-4 h-4" />}
        />
        <KpiCard
          title="Jobs Won"
          value={kpi.jobsWon}
          format="number"
          target={kpi.jobsTarget}
          achievement={kpi.jobsAchievement}
          status={kpi.jobsStatus}
          icon={<Target className="w-4 h-4" />}
        />
        <KpiCard
          title="Close Rate"
          value={kpi.closeRate || 0}
          format="percent"
          subtitle={`${kpi.jobsWon} won / ${kpi.jobsWon + kpi.jobsLost} total`}
          icon={<Percent className="w-4 h-4" />}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Marketing Spend"
          value={kpi.marketingSpend}
          format="currency"
          icon={<DollarSign className="w-4 h-4" />}
        />
        <KpiCard
          title="CPL (Cost per Lead)"
          value={kpi.cpl || 0}
          format="currency"
          subtitle="Lower is better"
          icon={<DollarSign className="w-4 h-4" />}
        />
        <KpiCard
          title="CAC (Customer Acquisition)"
          value={kpi.cac || 0}
          format="currency"
          subtitle="Lower is better"
          icon={<DollarSign className="w-4 h-4" />}
        />
        <KpiCard
          title="Avg Ticket"
          value={kpi.averageTicket || 0}
          format="currency"
          subtitle="Per job"
          icon={<DollarSign className="w-4 h-4" />}
        />
      </div>

      {/* Pipeline Status */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Lead Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">New</span>
                <span className="font-medium">{kpi.leadsNew}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Contacted</span>
                <span className="font-medium">{kpi.leadsContacted}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Qualified</span>
                <span className="font-medium">{kpi.leadsQualified}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Estimates Sent</span>
                <span className="font-medium">{kpi.estimatesSent}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Estimate Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Scheduled</span>
                <span className="font-medium">{kpi.estimatesScheduled}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Sent</span>
                <span className="font-medium">{kpi.estimatesSent}</span>
              </div>
              <div className="flex justify-between items-center text-green-600">
                <span className="text-sm">Accepted (Won)</span>
                <span className="font-medium">{kpi.estimatesAccepted}</span>
              </div>
              <div className="flex justify-between items-center text-red-600">
                <span className="text-sm">Declined (Lost)</span>
                <span className="font-medium">{kpi.estimatesDeclined}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
