'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Plus, Trash2, TrendingUp, TrendingDown, DollarSign, Users, MousePointerClick, Eye } from 'lucide-react';
import { toast } from 'sonner';
import type { CampaignSpend, CampaignPlatform } from '@/types/database';

// Temporary tenant ID - in production, this would come from auth context
const TEMP_TENANT_ID = 'tenant_demo';

const PLATFORMS: { value: CampaignPlatform; label: string; color: string }[] = [
  { value: 'meta', label: 'Meta Ads', color: 'bg-blue-500' },
  { value: 'google', label: 'Google Ads', color: 'bg-green-500' },
  { value: 'tiktok', label: 'TikTok Ads', color: 'bg-pink-500' },
  { value: 'bing', label: 'Bing Ads', color: 'bg-yellow-500' },
  { value: 'other', label: 'Other', color: 'bg-gray-500' },
];

interface MarketingSummary {
  totalSpend: number;
  totalLeads: number;
  totalClicks: number;
  totalImpressions: number;
  avgCpl: number | null;
  avgCpc: number | null;
  avgCtr: number | null;
}

interface ByPlatform {
  [key: string]: {
    spend: number;
    leads: number;
    clicks: number;
  };
}

export default function MarketingPage() {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<CampaignSpend[]>([]);
  const [summary, setSummary] = useState<MarketingSummary | null>(null);
  const [byPlatform, setByPlatform] = useState<ByPlatform>({});

  // Date filters
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1); // First day of current month
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Add form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    platform: 'meta' as CampaignPlatform,
    campaignName: '',
    date: new Date().toISOString().split('T')[0],
    spend: 0,
    impressions: 0,
    clicks: 0,
    leads: 0,
  });

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/marketing?tenantId=${TEMP_TENANT_ID}&startDate=${startDate}&endDate=${endDate}`
      );
      const data = await res.json();

      if (data.campaigns) {
        setCampaigns(data.campaigns);
        setSummary(data.summary);
        setByPlatform(data.byPlatform || {});
      }
    } catch (error) {
      console.error('Error fetching marketing data:', error);
      toast.error('Failed to load marketing data');
    } finally {
      setLoading(false);
    }
  };

  const addCampaign = async () => {
    if (!newCampaign.campaignName || !newCampaign.date) {
      toast.error('Campaign name and date are required');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: TEMP_TENANT_ID,
          ...newCampaign,
        }),
      });

      if (!res.ok) throw new Error('Failed to add campaign');

      toast.success('Campaign entry added');
      setShowAddForm(false);
      setNewCampaign({
        platform: 'meta',
        campaignName: '',
        date: new Date().toISOString().split('T')[0],
        spend: 0,
        impressions: 0,
        clicks: 0,
        leads: 0,
      });
      fetchData();
    } catch (error) {
      toast.error('Failed to add campaign entry');
    } finally {
      setSaving(false);
    }
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      const res = await fetch(`/api/marketing?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');

      toast.success('Entry deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete entry');
    }
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number | null) => {
    if (value === null) return '-';
    return new Intl.NumberFormat('en-US').format(value);
  };

  const getPlatformColor = (platform: string) => {
    return PLATFORMS.find(p => p.value === platform)?.color || 'bg-gray-500';
  };

  const getPlatformLabel = (platform: string) => {
    return PLATFORMS.find(p => p.value === platform)?.label || platform;
  };

  if (loading && campaigns.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Marketing Tracking</h1>
          <p className="text-muted-foreground">
            Track your marketing spend and performance metrics
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Spend Entry
        </Button>
      </div>

      {/* Date Filters */}
      <div className="flex gap-4 items-end">
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>End Date</Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={fetchData}>
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total Spend</span>
              </div>
              <p className="text-2xl font-bold mt-2">{formatCurrency(summary.totalSpend)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total Leads</span>
              </div>
              <p className="text-2xl font-bold mt-2">{formatNumber(summary.totalLeads)}</p>
              <p className="text-sm text-muted-foreground">
                CPL: {formatCurrency(summary.avgCpl)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <MousePointerClick className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total Clicks</span>
              </div>
              <p className="text-2xl font-bold mt-2">{formatNumber(summary.totalClicks)}</p>
              <p className="text-sm text-muted-foreground">
                CPC: {formatCurrency(summary.avgCpc)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Impressions</span>
              </div>
              <p className="text-2xl font-bold mt-2">{formatNumber(summary.totalImpressions)}</p>
              <p className="text-sm text-muted-foreground">
                CTR: {summary.avgCtr ? `${summary.avgCtr.toFixed(2)}%` : '-'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Marketing Spend</CardTitle>
            <CardDescription>
              Enter your campaign spend data manually
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Platform</Label>
                <Select
                  value={newCampaign.platform}
                  onValueChange={(value: CampaignPlatform) =>
                    setNewCampaign(prev => ({ ...prev, platform: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map(p => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Campaign Name</Label>
                <Input
                  value={newCampaign.campaignName}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, campaignName: e.target.value }))}
                  placeholder="e.g., Summer Promo"
                />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={newCampaign.date}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>Spend ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newCampaign.spend}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, spend: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Impressions</Label>
                <Input
                  type="number"
                  value={newCampaign.impressions}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, impressions: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Clicks</Label>
                <Input
                  type="number"
                  value={newCampaign.clicks}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, clicks: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Leads</Label>
                <Input
                  type="number"
                  value={newCampaign.leads}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, leads: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={addCampaign} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Add Entry
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="entries" className="space-y-4">
        <TabsList>
          <TabsTrigger value="entries">All Entries</TabsTrigger>
          <TabsTrigger value="by-platform">By Platform</TabsTrigger>
        </TabsList>

        {/* All Entries */}
        <TabsContent value="entries">
          <Card>
            <CardContent className="pt-6">
              {campaigns.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">No marketing spend entries yet</p>
                  <Button onClick={() => setShowAddForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Entry
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Campaign</TableHead>
                      <TableHead className="text-right">Spend</TableHead>
                      <TableHead className="text-right">Impressions</TableHead>
                      <TableHead className="text-right">Clicks</TableHead>
                      <TableHead className="text-right">Leads</TableHead>
                      <TableHead className="text-right">CPL</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell>{new Date(campaign.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge className={getPlatformColor(campaign.platform)}>
                            {getPlatformLabel(campaign.platform)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{campaign.campaignName}</TableCell>
                        <TableCell className="text-right">{formatCurrency(campaign.spend)}</TableCell>
                        <TableCell className="text-right">{formatNumber(campaign.impressions)}</TableCell>
                        <TableCell className="text-right">{formatNumber(campaign.clicks)}</TableCell>
                        <TableCell className="text-right">{formatNumber(campaign.leads)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(campaign.cpl)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteCampaign(campaign.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Platform */}
        <TabsContent value="by-platform">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(byPlatform).map(([platform, data]) => (
              <Card key={platform}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge className={getPlatformColor(platform)}>
                      {getPlatformLabel(platform)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Spend</span>
                      <span className="font-medium">{formatCurrency(data.spend)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Leads</span>
                      <span className="font-medium">{formatNumber(data.leads)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Clicks</span>
                      <span className="font-medium">{formatNumber(data.clicks)}</span>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">CPL</span>
                        <span className="font-medium">
                          {data.leads > 0 ? formatCurrency(data.spend / data.leads) : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">CPC</span>
                        <span className="font-medium">
                          {data.clicks > 0 ? formatCurrency(data.spend / data.clicks) : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {Object.keys(byPlatform).length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No platform data available
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
