'use client';

import { mockBusinessSettings } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Settings,
  Building,
  DollarSign,
  Percent,
  Bell,
  Shield,
  Palette,
  Save,
} from 'lucide-react';

export default function SettingsPage() {
  const settings = mockBusinessSettings;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500">Manage your business settings and preferences</p>
      </div>

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList>
          <TabsTrigger value="business" className="gap-2">
            <Building className="h-4 w-4" />
            Business
          </TabsTrigger>
          <TabsTrigger value="pricing" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Pricing
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* Business Settings */}
        <TabsContent value="business" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Basic information about your business</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input defaultValue="CMD Painting" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input defaultValue="(203) 555-0100" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input defaultValue="info@cmdpainting.com" type="email" />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input defaultValue="www.cmdpainting.com" />
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Address</Label>
                <Input defaultValue="123 Main Street, Greenwich, CT 06830" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing Settings */}
        <TabsContent value="pricing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subcontractor Model</CardTitle>
              <CardDescription>
                Configure how subcontractor costs are calculated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-slate-400" />
                    Sub Payout %
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      defaultValue={settings.subPayoutPct}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      %
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Total payout to subcontractor
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-slate-400" />
                    Sub Materials %
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      defaultValue={settings.subMaterialsPct}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      %
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Materials portion of sub payout
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-slate-400" />
                    Sub Labor %
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      defaultValue={settings.subLaborPct}
                      disabled
                      className="pr-8 bg-slate-50"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      %
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Auto-calculated (Payout - Materials)
                  </p>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Formula:</strong> Sub Labor = Sub Payout - Sub Materials ={' '}
                  {settings.subPayoutPct}% - {settings.subMaterialsPct}% ={' '}
                  <strong>{settings.subLaborPct}%</strong>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pricing Guardrails</CardTitle>
              <CardDescription>
                Set minimum thresholds to flag underpriced jobs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-slate-400" />
                    Min Gross Profit per Job
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      $
                    </span>
                    <Input
                      type="number"
                      defaultValue={settings.minGrossProfitPerJob}
                      className="pl-8"
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    Jobs below this GP will be flagged
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-slate-400" />
                    Target Gross Margin %
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      defaultValue={settings.targetGrossMarginPct}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      %
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Jobs below this GM% will be flagged
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cashflow Settings</CardTitle>
              <CardDescription>
                Configure deposit and payment collection settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-slate-400" />
                    Default Deposit %
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      defaultValue={settings.defaultDepositPct}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      %
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Default deposit required before work starts
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>AR Target Days</Label>
                  <Input type="number" defaultValue={settings.arTargetDays} />
                  <p className="text-xs text-slate-500">
                    Target days to collect payment after invoice
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Price Rounding</CardTitle>
              <CardDescription>
                Configure how prices are rounded in estimates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-w-xs">
                <Label>Round to Nearest</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    $
                  </span>
                  <Input
                    type="number"
                    defaultValue={settings.priceRoundingIncrement}
                    className="pl-8"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Prices will round to nearest ${settings.priceRoundingIncrement}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>Configure when you receive email alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'New lead received', description: 'When a new lead is submitted', enabled: true },
                { label: 'Estimate accepted', description: 'When a client accepts an estimate', enabled: true },
                { label: 'Payment received', description: 'When a payment is recorded', enabled: true },
                { label: 'Job status changes', description: 'When a job status is updated', enabled: false },
                { label: 'Weekly summary', description: 'Weekly business performance report', enabled: true },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-slate-500">{item.description}</p>
                  </div>
                  <Switch defaultChecked={item.enabled} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reminders</CardTitle>
              <CardDescription>Automatic follow-up reminders</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Lead follow-up', description: 'Remind to follow up on leads', enabled: true },
                { label: 'Estimate expiring', description: '3 days before estimate expires', enabled: true },
                { label: 'Payment due', description: 'When payment is due', enabled: true },
                { label: 'L10 meeting', description: 'Day before weekly L10', enabled: false },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-slate-500">{item.description}</p>
                  </div>
                  <Switch defaultChecked={item.enabled} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button className="gap-2">
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}
