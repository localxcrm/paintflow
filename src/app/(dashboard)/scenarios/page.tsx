'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Save, Trash2, ArrowUpRight, ArrowDownRight, Calculator, GitCompare } from 'lucide-react';
import { cn } from '@/lib/utils';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatPct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

interface Scenario {
  id: string;
  name: string;
  description?: string;
  isBaseline: boolean;
  leadsCount: number;
  issueRate: number;
  closingRate: number;
  averageSale: number;
  markupRatio: number;
  marketingSpend: number;
  cogsLaborPct: number;
  cogsMaterialsPct: number;
  cogsOtherPct: number;
  salesCommissionPct: number;
  pmCommissionPct: number;
  ownerSalary: number;
  productionSalary: number;
  salesSalary: number;
  adminSalary: number;
  otherOverhead: number;
  results?: ScenarioResults;
}

interface ScenarioResults {
  appointments: number;
  sales: number;
  nsli: number;
  revenue: number;
  cogsLabor: number;
  cogsMaterials: number;
  cogsOther: number;
  totalCogs: number;
  grossProfit: number;
  grossMarginPct: number;
  contributionProfit: number;
  salesCommission: number;
  pmCommission: number;
  totalCommissions: number;
  totalOverhead: number;
  totalExpenses: number;
  netProfit: number;
  netMarginPct: number;
  cpl: number;
  roi: number;
  ownerTakeHome: number;
}

const defaultScenario: Omit<Scenario, 'id'> = {
  name: '',
  description: '',
  isBaseline: false,
  leadsCount: 800,
  issueRate: 0.75,
  closingRate: 0.4,
  averageSale: 4000,
  markupRatio: 1.82,
  marketingSpend: 100000,
  cogsLaborPct: 0.32,
  cogsMaterialsPct: 0.21,
  cogsOtherPct: 0.02,
  salesCommissionPct: 0.10,
  pmCommissionPct: 0.03,
  ownerSalary: 50000,
  productionSalary: 25000,
  salesSalary: 0,
  adminSalary: 40000,
  otherOverhead: 50000,
};

export default function ScenariosPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [compareScenario, setCompareScenario] = useState<Scenario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Omit<Scenario, 'id'>>(defaultScenario);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/scenarios');
      const data = await res.json();
      setScenarios(data.scenarios || []);
      if (data.scenarios?.length > 0 && !selectedScenario) {
        const baseline = data.scenarios.find((s: Scenario) => s.isBaseline) || data.scenarios[0];
        setSelectedScenario(baseline);
      }
    } catch (error) {
      console.error('Error fetching scenarios:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      setDialogOpen(false);
      setFormData(defaultScenario);
      fetchData();
    } catch (error) {
      console.error('Error saving scenario:', error);
    }
  };

  const handleUpdate = async (scenario: Scenario) => {
    try {
      const res = await fetch('/api/scenarios', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scenario),
      });
      const data = await res.json();
      setSelectedScenario({ ...scenario, results: data.results });
      fetchData();
    } catch (error) {
      console.error('Error updating scenario:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this scenario?')) return;
    try {
      await fetch(`/api/scenarios?id=${id}`, { method: 'DELETE' });
      if (selectedScenario?.id === id) setSelectedScenario(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const baseline = scenarios.find(s => s.isBaseline);
  const results = selectedScenario?.results;
  const baselineResults = baseline?.results;

  const getDiff = (current: number | undefined, base: number | undefined) => {
    if (!current || !base || base === 0) return null;
    const diff = ((current - base) / base) * 100;
    return diff;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Scenario Planner</h1>
          <p className="text-slate-500">Model what-if scenarios for your business</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> New Scenario</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Scenario</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Scenario Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Increase Prices 10%"
                  required
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={formData.description || ''}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="What changes are you modeling?"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.isBaseline}
                  onCheckedChange={(checked) => setFormData({...formData, isBaseline: checked})}
                />
                <Label>Set as baseline scenario</Label>
              </div>
              <Button type="submit" className="w-full">Create Scenario</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Scenario List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Scenarios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {scenarios.map(scenario => (
              <div
                key={scenario.id}
                className={cn(
                  'p-3 rounded-lg cursor-pointer border transition-colors',
                  selectedScenario?.id === scenario.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-slate-50 border-transparent'
                )}
                onClick={() => setSelectedScenario(scenario)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{scenario.name}</span>
                  {scenario.isBaseline && <Badge variant="secondary">Baseline</Badge>}
                </div>
                {scenario.results && (
                  <p className="text-sm text-slate-500 mt-1">
                    Net: {formatCurrency(scenario.results.netProfit)}
                  </p>
                )}
              </div>
            ))}
            {scenarios.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-4">
                No scenarios yet. Create one to get started.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Scenario Editor */}
        <div className="lg:col-span-3 space-y-6">
          {selectedScenario ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>{selectedScenario.name}</CardTitle>
                      <CardDescription>{selectedScenario.description}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(selectedScenario.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="inputs">
                    <TabsList>
                      <TabsTrigger value="inputs">Inputs</TabsTrigger>
                      <TabsTrigger value="costs">Costs</TabsTrigger>
                      <TabsTrigger value="overhead">Overhead</TabsTrigger>
                    </TabsList>

                    <TabsContent value="inputs" className="space-y-6 mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between mb-2">
                              <Label>Leads Count</Label>
                              <span className="text-sm font-medium">{selectedScenario.leadsCount}</span>
                            </div>
                            <Slider
                              value={[selectedScenario.leadsCount]}
                              onValueChange={([v]) => {
                                const updated = { ...selectedScenario, leadsCount: v };
                                setSelectedScenario(updated);
                              }}
                              onValueCommit={() => handleUpdate(selectedScenario)}
                              max={2000}
                              min={100}
                              step={10}
                            />
                          </div>
                          <div>
                            <div className="flex justify-between mb-2">
                              <Label>Issue Rate (Appt/Lead)</Label>
                              <span className="text-sm font-medium">{formatPct(selectedScenario.issueRate)}</span>
                            </div>
                            <Slider
                              value={[selectedScenario.issueRate * 100]}
                              onValueChange={([v]) => {
                                const updated = { ...selectedScenario, issueRate: v / 100 };
                                setSelectedScenario(updated);
                              }}
                              onValueCommit={() => handleUpdate(selectedScenario)}
                              max={100}
                              min={10}
                              step={1}
                            />
                          </div>
                          <div>
                            <div className="flex justify-between mb-2">
                              <Label>Closing Rate (Sale/Appt)</Label>
                              <span className="text-sm font-medium">{formatPct(selectedScenario.closingRate)}</span>
                            </div>
                            <Slider
                              value={[selectedScenario.closingRate * 100]}
                              onValueChange={([v]) => {
                                const updated = { ...selectedScenario, closingRate: v / 100 };
                                setSelectedScenario(updated);
                              }}
                              onValueCommit={() => handleUpdate(selectedScenario)}
                              max={80}
                              min={10}
                              step={1}
                            />
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between mb-2">
                              <Label>Average Sale ($)</Label>
                              <span className="text-sm font-medium">{formatCurrency(selectedScenario.averageSale)}</span>
                            </div>
                            <Slider
                              value={[selectedScenario.averageSale]}
                              onValueChange={([v]) => {
                                const updated = { ...selectedScenario, averageSale: v };
                                setSelectedScenario(updated);
                              }}
                              onValueCommit={() => handleUpdate(selectedScenario)}
                              max={15000}
                              min={1000}
                              step={100}
                            />
                          </div>
                          <div>
                            <div className="flex justify-between mb-2">
                              <Label>Markup Ratio</Label>
                              <span className="text-sm font-medium">{selectedScenario.markupRatio.toFixed(2)}x</span>
                            </div>
                            <Slider
                              value={[selectedScenario.markupRatio * 100]}
                              onValueChange={([v]) => {
                                const updated = { ...selectedScenario, markupRatio: v / 100 };
                                setSelectedScenario(updated);
                              }}
                              onValueCommit={() => handleUpdate(selectedScenario)}
                              max={300}
                              min={120}
                              step={1}
                            />
                          </div>
                          <div>
                            <div className="flex justify-between mb-2">
                              <Label>Marketing Spend ($)</Label>
                              <span className="text-sm font-medium">{formatCurrency(selectedScenario.marketingSpend)}</span>
                            </div>
                            <Slider
                              value={[selectedScenario.marketingSpend]}
                              onValueChange={([v]) => {
                                const updated = { ...selectedScenario, marketingSpend: v };
                                setSelectedScenario(updated);
                              }}
                              onValueCommit={() => handleUpdate(selectedScenario)}
                              max={300000}
                              min={10000}
                              step={5000}
                            />
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="costs" className="space-y-4 mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <Label>Labor COGS %</Label>
                            <span className="text-sm font-medium">{formatPct(selectedScenario.cogsLaborPct)}</span>
                          </div>
                          <Slider
                            value={[selectedScenario.cogsLaborPct * 100]}
                            onValueChange={([v]) => {
                              const updated = { ...selectedScenario, cogsLaborPct: v / 100 };
                              setSelectedScenario(updated);
                            }}
                            onValueCommit={() => handleUpdate(selectedScenario)}
                            max={60}
                            min={10}
                            step={1}
                          />
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <Label>Materials COGS %</Label>
                            <span className="text-sm font-medium">{formatPct(selectedScenario.cogsMaterialsPct)}</span>
                          </div>
                          <Slider
                            value={[selectedScenario.cogsMaterialsPct * 100]}
                            onValueChange={([v]) => {
                              const updated = { ...selectedScenario, cogsMaterialsPct: v / 100 };
                              setSelectedScenario(updated);
                            }}
                            onValueCommit={() => handleUpdate(selectedScenario)}
                            max={40}
                            min={5}
                            step={1}
                          />
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <Label>Other COGS %</Label>
                            <span className="text-sm font-medium">{formatPct(selectedScenario.cogsOtherPct)}</span>
                          </div>
                          <Slider
                            value={[selectedScenario.cogsOtherPct * 100]}
                            onValueChange={([v]) => {
                              const updated = { ...selectedScenario, cogsOtherPct: v / 100 };
                              setSelectedScenario(updated);
                            }}
                            onValueCommit={() => handleUpdate(selectedScenario)}
                            max={15}
                            min={0}
                            step={1}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <Label>Sales Commission %</Label>
                            <span className="text-sm font-medium">{formatPct(selectedScenario.salesCommissionPct)}</span>
                          </div>
                          <Slider
                            value={[selectedScenario.salesCommissionPct * 100]}
                            onValueChange={([v]) => {
                              const updated = { ...selectedScenario, salesCommissionPct: v / 100 };
                              setSelectedScenario(updated);
                            }}
                            onValueCommit={() => handleUpdate(selectedScenario)}
                            max={20}
                            min={0}
                            step={1}
                          />
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <Label>PM Commission %</Label>
                            <span className="text-sm font-medium">{formatPct(selectedScenario.pmCommissionPct)}</span>
                          </div>
                          <Slider
                            value={[selectedScenario.pmCommissionPct * 100]}
                            onValueChange={([v]) => {
                              const updated = { ...selectedScenario, pmCommissionPct: v / 100 };
                              setSelectedScenario(updated);
                            }}
                            onValueCommit={() => handleUpdate(selectedScenario)}
                            max={10}
                            min={0}
                            step={1}
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="overhead" className="space-y-4 mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { label: 'Owner Salary', key: 'ownerSalary' },
                          { label: 'Production Salary', key: 'productionSalary' },
                          { label: 'Sales Salary', key: 'salesSalary' },
                          { label: 'Admin Salary', key: 'adminSalary' },
                          { label: 'Other Overhead', key: 'otherOverhead' },
                        ].map(({ label, key }) => (
                          <div key={key}>
                            <Label>{label}</Label>
                            <Input
                              type="number"
                              value={(selectedScenario as unknown as Record<string, number>)[key]}
                              onChange={(e) => {
                                const updated = { ...selectedScenario, [key]: parseFloat(e.target.value) || 0 };
                                setSelectedScenario(updated);
                              }}
                              onBlur={() => handleUpdate(selectedScenario)}
                            />
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Results Card */}
              {results && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      Calculated Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: 'Revenue', value: formatCurrency(results.revenue), base: baselineResults?.revenue },
                        { label: 'Gross Profit', value: formatCurrency(results.grossProfit), base: baselineResults?.grossProfit },
                        { label: 'Net Profit', value: formatCurrency(results.netProfit), base: baselineResults?.netProfit, highlight: true },
                        { label: 'Owner Take Home', value: formatCurrency(results.ownerTakeHome), base: baselineResults?.ownerTakeHome, highlight: true },
                        { label: 'Gross Margin', value: `${results.grossMarginPct.toFixed(1)}%` },
                        { label: 'Net Margin', value: `${results.netMarginPct.toFixed(1)}%` },
                        { label: 'CPL', value: formatCurrency(results.cpl), base: baselineResults?.cpl, invert: true },
                        { label: 'ROI', value: `${results.roi.toFixed(1)}:1`, base: baselineResults?.roi },
                      ].map((item) => {
                        const diff = item.base ? getDiff(
                          typeof item.value === 'string' && item.value.includes('$')
                            ? parseFloat(item.value.replace(/[$,]/g, ''))
                            : undefined,
                          item.base
                        ) : null;

                        return (
                          <div
                            key={item.label}
                            className={cn(
                              'p-3 rounded-lg',
                              item.highlight ? 'bg-green-50' : 'bg-slate-50'
                            )}
                          >
                            <p className="text-sm text-slate-500">{item.label}</p>
                            <p className={cn('text-xl font-bold', item.highlight && 'text-green-600')}>
                              {item.value}
                            </p>
                            {diff !== null && (
                              <p className={cn(
                                'text-xs flex items-center gap-1',
                                diff > 0 ? (item.invert ? 'text-red-500' : 'text-green-500') : (item.invert ? 'text-green-500' : 'text-red-500')
                              )}>
                                {diff > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                {Math.abs(diff).toFixed(1)}% vs baseline
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* P&L Summary */}
                    <div className="mt-6">
                      <h4 className="font-medium mb-3">Full P&L Breakdown</h4>
                      <Table>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">Revenue</TableCell>
                            <TableCell className="text-right">{formatCurrency(results.revenue)}</TableCell>
                            <TableCell className="text-right text-slate-500">100%</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="text-slate-500 pl-6">COGS (Labor)</TableCell>
                            <TableCell className="text-right text-red-600">({formatCurrency(results.cogsLabor)})</TableCell>
                            <TableCell className="text-right text-slate-500">{formatPct(selectedScenario.cogsLaborPct)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="text-slate-500 pl-6">COGS (Materials)</TableCell>
                            <TableCell className="text-right text-red-600">({formatCurrency(results.cogsMaterials)})</TableCell>
                            <TableCell className="text-right text-slate-500">{formatPct(selectedScenario.cogsMaterialsPct)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="text-slate-500 pl-6">COGS (Other)</TableCell>
                            <TableCell className="text-right text-red-600">({formatCurrency(results.cogsOther)})</TableCell>
                            <TableCell className="text-right text-slate-500">{formatPct(selectedScenario.cogsOtherPct)}</TableCell>
                          </TableRow>
                          <TableRow className="bg-green-50">
                            <TableCell className="font-medium">Gross Profit</TableCell>
                            <TableCell className="text-right font-medium text-green-600">{formatCurrency(results.grossProfit)}</TableCell>
                            <TableCell className="text-right text-green-600">{results.grossMarginPct.toFixed(1)}%</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="text-slate-500 pl-6">Sales Commissions</TableCell>
                            <TableCell className="text-right text-red-600">({formatCurrency(results.salesCommission)})</TableCell>
                            <TableCell className="text-right text-slate-500">{formatPct(selectedScenario.salesCommissionPct)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="text-slate-500 pl-6">PM Commissions</TableCell>
                            <TableCell className="text-right text-red-600">({formatCurrency(results.pmCommission)})</TableCell>
                            <TableCell className="text-right text-slate-500">{formatPct(selectedScenario.pmCommissionPct)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Contribution Profit</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(results.contributionProfit)}</TableCell>
                            <TableCell className="text-right text-slate-500">{results.revenue > 0 ? ((results.contributionProfit / results.revenue) * 100).toFixed(1) : 0}%</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="text-slate-500 pl-6">Marketing</TableCell>
                            <TableCell className="text-right text-red-600">({formatCurrency(selectedScenario.marketingSpend)})</TableCell>
                            <TableCell className="text-right text-slate-500">{results.revenue > 0 ? ((selectedScenario.marketingSpend / results.revenue) * 100).toFixed(1) : 0}%</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="text-slate-500 pl-6">Total Overhead</TableCell>
                            <TableCell className="text-right text-red-600">({formatCurrency(results.totalOverhead)})</TableCell>
                            <TableCell className="text-right text-slate-500">{results.revenue > 0 ? ((results.totalOverhead / results.revenue) * 100).toFixed(1) : 0}%</TableCell>
                          </TableRow>
                          <TableRow className="bg-purple-50 border-t-2">
                            <TableCell className="font-bold">Net Profit</TableCell>
                            <TableCell className={cn('text-right font-bold', results.netProfit >= 0 ? 'text-purple-600' : 'text-red-600')}>
                              {formatCurrency(results.netProfit)}
                            </TableCell>
                            <TableCell className="text-right font-medium">{results.netMarginPct.toFixed(1)}%</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card className="flex items-center justify-center h-96">
              <div className="text-center text-slate-500">
                <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select or create a scenario to get started</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
