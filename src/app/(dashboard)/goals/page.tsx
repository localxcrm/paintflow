'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Save, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import type { Target, Seasonality } from '@/types/database';

// Temporary tenant ID - in production, this would come from auth context
const TEMP_TENANT_ID = 'tenant_demo';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_KEYS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
] as const;

export default function GoalsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentYear] = useState(new Date().getFullYear());

  // Annual Target State
  const [revenueTarget, setRevenueTarget] = useState(1000000);
  const [averageTicket, setAverageTicket] = useState(3500);
  const [closeRate, setCloseRate] = useState(30);
  const [marketingBudget, setMarketingBudget] = useState(60000);
  const [cplTarget, setCplTarget] = useState(150);
  const [cacTarget, setCacTarget] = useState(500);

  // Calculated values
  const [jobsTarget, setJobsTarget] = useState(0);
  const [leadsTarget, setLeadsTarget] = useState(0);

  // Seasonality State
  const [seasonality, setSeasonality] = useState<Record<string, number>>({
    january: 8.33,
    february: 8.33,
    march: 8.33,
    april: 8.33,
    may: 8.33,
    june: 8.33,
    july: 8.33,
    august: 8.33,
    september: 8.33,
    october: 8.33,
    november: 8.33,
    december: 8.37,
  });

  // Monthly breakdown (calculated)
  const [monthlyTargets, setMonthlyTargets] = useState<Array<{
    month: string;
    revenue: number;
    leads: number;
    jobs: number;
    dailyLeads: number;
    dailyRevenue: number;
  }>>([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Auto-calculate jobs and leads when inputs change
    const jobs = averageTicket > 0 ? Math.ceil(revenueTarget / averageTicket) : 0;
    const leads = closeRate > 0 ? Math.ceil(jobs / (closeRate / 100)) : 0;
    setJobsTarget(jobs);
    setLeadsTarget(leads);
  }, [revenueTarget, averageTicket, closeRate]);

  useEffect(() => {
    // Calculate monthly breakdown
    const monthly = MONTHS.map((month, index) => {
      const key = MONTH_KEYS[index];
      const pct = seasonality[key] / 100;
      const monthlyRevenue = revenueTarget * pct;
      const monthlyJobs = Math.round(jobsTarget * pct);
      const monthlyLeads = Math.round(leadsTarget * pct);
      const businessDays = 22; // Average

      return {
        month,
        revenue: monthlyRevenue,
        leads: monthlyLeads,
        jobs: monthlyJobs,
        dailyLeads: monthlyLeads / businessDays,
        dailyRevenue: monthlyRevenue / businessDays,
      };
    });

    setMonthlyTargets(monthly);
  }, [revenueTarget, jobsTarget, leadsTarget, seasonality]);

  const fetchData = async () => {
    try {
      // Fetch targets
      const targetsRes = await fetch(`/api/targets?tenantId=${TEMP_TENANT_ID}&year=${currentYear}&periodType=annual`);
      const targetsData = await targetsRes.json();

      if (targetsData.targets && targetsData.targets.length > 0) {
        const target = targetsData.targets[0];
        setRevenueTarget(target.revenueTarget || 1000000);
        setAverageTicket(target.averageTicketTarget || 3500);
        setCloseRate(target.closeRateTarget || 30);
        setMarketingBudget(target.marketingBudget || 60000);
        setCplTarget(target.cplTarget || 150);
        setCacTarget(target.cacTarget || 500);
      }

      // Fetch seasonality
      const seasonalityRes = await fetch(`/api/seasonality?tenantId=${TEMP_TENANT_ID}&year=${currentYear}`);
      const seasonalityData = await seasonalityRes.json();

      if (seasonalityData.seasonality && !seasonalityData.seasonality.isDefault) {
        const s = Array.isArray(seasonalityData.seasonality)
          ? seasonalityData.seasonality[0]
          : seasonalityData.seasonality;

        if (s) {
          setSeasonality({
            january: s.january,
            february: s.february,
            march: s.march,
            april: s.april,
            may: s.may,
            june: s.june,
            july: s.july,
            august: s.august,
            september: s.september,
            october: s.october,
            november: s.november,
            december: s.december,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const saveTargets = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: TEMP_TENANT_ID,
          year: currentYear,
          periodType: 'annual',
          revenueTarget,
          jobsTarget,
          leadsTarget,
          estimatesTarget: leadsTarget,
          closeRateTarget: closeRate,
          averageTicketTarget: averageTicket,
          marketingBudget,
          cplTarget,
          cacTarget,
        }),
      });

      if (!res.ok) throw new Error('Failed to save targets');

      toast.success('Annual targets saved');
    } catch (error) {
      toast.error('Failed to save targets');
    } finally {
      setSaving(false);
    }
  };

  const saveSeasonality = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/seasonality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: TEMP_TENANT_ID,
          year: currentYear,
          ...seasonality,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save seasonality');
      }

      toast.success('Seasonality saved');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save seasonality');
    } finally {
      setSaving(false);
    }
  };

  const applyTemplate = async (template: 'equal' | 'painting') => {
    setSaving(true);
    try {
      const res = await fetch('/api/seasonality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: TEMP_TENANT_ID,
          year: currentYear,
          template,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      // Update local state
      if (data.seasonality) {
        setSeasonality({
          january: data.seasonality.january,
          february: data.seasonality.february,
          march: data.seasonality.march,
          april: data.seasonality.april,
          may: data.seasonality.may,
          june: data.seasonality.june,
          july: data.seasonality.july,
          august: data.seasonality.august,
          september: data.seasonality.september,
          october: data.seasonality.october,
          november: data.seasonality.november,
          december: data.seasonality.december,
        });
      }

      toast.success('Template applied');
    } catch (error) {
      toast.error('Failed to apply template');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const seasonalityTotal = Object.values(seasonality).reduce((sum, val) => sum + val, 0);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Goals & Targets</h1>
        <p className="text-muted-foreground">
          Set your annual revenue goals and the system will calculate monthly and daily targets
        </p>
      </div>

      <Tabs defaultValue="annual" className="space-y-4">
        <TabsList>
          <TabsTrigger value="annual">Annual Targets</TabsTrigger>
          <TabsTrigger value="seasonality">Seasonality</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Breakdown</TabsTrigger>
        </TabsList>

        {/* Annual Targets */}
        <TabsContent value="annual">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Goals</CardTitle>
                <CardDescription>
                  Set your annual revenue target and the system will calculate everything else
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="revenueTarget">Annual Revenue Target</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                    <Input
                      id="revenueTarget"
                      type="number"
                      className="pl-7"
                      value={revenueTarget}
                      onChange={(e) => setRevenueTarget(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="averageTicket">Average Ticket (Job Value)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                    <Input
                      id="averageTicket"
                      type="number"
                      className="pl-7"
                      value={averageTicket}
                      onChange={(e) => setAverageTicket(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="closeRate">Target Close Rate (%)</Label>
                  <div className="relative">
                    <Input
                      id="closeRate"
                      type="number"
                      value={closeRate}
                      onChange={(e) => setCloseRate(Number(e.target.value))}
                    />
                    <span className="absolute right-3 top-2.5 text-muted-foreground">%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Calculated Targets
                </CardTitle>
                <CardDescription>
                  Based on your inputs, here&apos;s what you need
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Jobs Needed</p>
                    <p className="text-2xl font-bold">{jobsTarget.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">per year</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Leads Needed</p>
                    <p className="text-2xl font-bold">{leadsTarget.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">per year</p>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Monthly Revenue</span>
                    <span className="font-medium">{formatCurrency(revenueTarget / 12)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Monthly Jobs</span>
                    <span className="font-medium">{Math.ceil(jobsTarget / 12)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Daily Leads (avg)</span>
                    <span className="font-medium">{(leadsTarget / 260).toFixed(1)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Marketing Budget</CardTitle>
                <CardDescription>
                  Set your marketing spend targets
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="marketingBudget">Annual Marketing Budget</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                    <Input
                      id="marketingBudget"
                      type="number"
                      className="pl-7"
                      value={marketingBudget}
                      onChange={(e) => setMarketingBudget(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cplTarget">Target CPL</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                      <Input
                        id="cplTarget"
                        type="number"
                        className="pl-7"
                        value={cplTarget}
                        onChange={(e) => setCplTarget(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cacTarget">Target CAC</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                      <Input
                        id="cacTarget"
                        type="number"
                        className="pl-7"
                        value={cacTarget}
                        onChange={(e) => setCacTarget(Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-sm text-muted-foreground">
                    Marketing as % of Revenue: <span className="font-medium">{((marketingBudget / revenueTarget) * 100).toFixed(1)}%</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <Button onClick={saveTargets} disabled={saving} className="w-full">
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Annual Targets
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Seasonality */}
        <TabsContent value="seasonality">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Seasonal Distribution</CardTitle>
                  <CardDescription>
                    Adjust how your annual targets are distributed across months
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => applyTemplate('equal')}>
                    Equal (8.33%)
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => applyTemplate('painting')}>
                    Painting Season
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                {MONTHS.map((month, index) => {
                  const key = MONTH_KEYS[index];
                  return (
                    <div key={month} className="space-y-2">
                      <Label className="text-sm">{month}</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          value={seasonality[key]}
                          onChange={(e) => setSeasonality(prev => ({
                            ...prev,
                            [key]: Number(e.target.value),
                          }))}
                        />
                        <span className="absolute right-3 top-2.5 text-muted-foreground text-sm">%</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className={`text-sm ${Math.abs(seasonalityTotal - 100) > 1 ? 'text-red-500' : 'text-green-500'}`}>
                  Total: {seasonalityTotal.toFixed(2)}%
                  {Math.abs(seasonalityTotal - 100) > 1 && ' (must equal 100%)'}
                </div>
                <Button onClick={saveSeasonality} disabled={saving || Math.abs(seasonalityTotal - 100) > 1}>
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Seasonality
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monthly Breakdown */}
        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle>Monthly & Daily Targets</CardTitle>
              <CardDescription>
                Your targets broken down by month based on seasonality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2">Month</th>
                      <th className="text-right py-3 px-2">Revenue</th>
                      <th className="text-right py-3 px-2">Jobs</th>
                      <th className="text-right py-3 px-2">Leads</th>
                      <th className="text-right py-3 px-2">Daily Leads</th>
                      <th className="text-right py-3 px-2">Daily Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyTargets.map((target, index) => (
                      <tr key={target.month} className={index % 2 === 0 ? 'bg-muted/50' : ''}>
                        <td className="py-3 px-2 font-medium">{target.month}</td>
                        <td className="py-3 px-2 text-right">{formatCurrency(target.revenue)}</td>
                        <td className="py-3 px-2 text-right">{target.jobs}</td>
                        <td className="py-3 px-2 text-right">{target.leads}</td>
                        <td className="py-3 px-2 text-right">{target.dailyLeads.toFixed(1)}</td>
                        <td className="py-3 px-2 text-right">{formatCurrency(target.dailyRevenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t font-bold">
                      <td className="py-3 px-2">Total</td>
                      <td className="py-3 px-2 text-right">{formatCurrency(revenueTarget)}</td>
                      <td className="py-3 px-2 text-right">{jobsTarget}</td>
                      <td className="py-3 px-2 text-right">{leadsTarget}</td>
                      <td className="py-3 px-2 text-right">-</td>
                      <td className="py-3 px-2 text-right">-</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
