'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Job, JobStatus, ProjectType, TeamMember, Subcontractor } from '@/types';
import { formatCurrency, getStatusColor, getProfitFlagColor } from '@/lib/utils/job-calculations';
import {
  User,
  Calendar,
  DollarSign,
  Users,
  CreditCard,
  Percent,
  MapPin,
  Building,
  Save,
  X
} from 'lucide-react';

interface JobDetailModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedJob: Job) => void;
  teamMembers: TeamMember[];
  subcontractors: Subcontractor[];
}

const statusLabels: Record<JobStatus, string> = {
  lead: 'Lead',
  got_the_job: 'Got the Job',
  scheduled: 'Scheduled',
  completed: 'Completed',
};

const projectTypeLabels: Record<ProjectType, string> = {
  interior: 'Interior',
  exterior: 'Exterior',
  both: 'Interior & Exterior',
};

export function JobDetailModal({
  job,
  isOpen,
  onClose,
  onSave,
  teamMembers,
  subcontractors,
}: JobDetailModalProps) {
  const [editedJob, setEditedJob] = useState<Job | null>(null);

  useEffect(() => {
    if (job) {
      setEditedJob({ ...job });
    }
  }, [job]);

  if (!editedJob) return null;

  const handleFieldChange = (field: keyof Job, value: unknown) => {
    setEditedJob(prev => {
      if (!prev) return prev;

      const updated = { ...prev, [field]: value };

      // Recalculate dependent fields
      if (field === 'jobValue') {
        const jobValue = value as number;
        updated.subMaterials = jobValue * 0.15;
        updated.subLabor = jobValue * 0.45;
        updated.subTotal = jobValue * 0.60;
        updated.grossProfit = jobValue * 0.40;
        updated.grossMarginPct = 40;
        updated.depositRequired = jobValue * 0.30;
        updated.salesCommissionAmount = jobValue * (updated.salesCommissionPct / 100);
        updated.pmCommissionAmount = jobValue * (updated.pmCommissionPct / 100);
        updated.subcontractorPrice = jobValue * 0.60;
        updated.balanceDue = jobValue - (updated.depositPaid ? updated.depositRequired : 0);
        updated.meetsMinGp = updated.grossProfit >= 900;
        updated.profitFlag = updated.grossProfit < 900 ? 'RAISE PRICE' : 'OK';
      }

      if (field === 'salesCommissionPct') {
        updated.salesCommissionAmount = updated.jobValue * ((value as number) / 100);
      }

      if (field === 'pmCommissionPct') {
        updated.pmCommissionAmount = updated.jobValue * ((value as number) / 100);
      }

      if (field === 'depositPaid') {
        updated.balanceDue = updated.jobPaid ? 0 : updated.jobValue - ((value as boolean) ? updated.depositRequired : 0);
      }

      if (field === 'jobPaid') {
        updated.balanceDue = (value as boolean) ? 0 : updated.jobValue - (updated.depositPaid ? updated.depositRequired : 0);
      }

      if (field === 'salesRepId') {
        const member = teamMembers.find(m => m.id === value);
        updated.salesRep = member;
        if (member) {
          updated.salesCommissionPct = member.defaultCommissionPct;
          updated.salesCommissionAmount = updated.jobValue * (member.defaultCommissionPct / 100);
        }
      }

      if (field === 'projectManagerId') {
        const member = teamMembers.find(m => m.id === value);
        updated.projectManager = member;
        if (member) {
          updated.pmCommissionPct = member.defaultCommissionPct;
          updated.pmCommissionAmount = updated.jobValue * (member.defaultCommissionPct / 100);
        }
      }

      if (field === 'subcontractorId') {
        const sub = subcontractors.find(s => s.id === value);
        updated.subcontractor = sub;
        if (sub) {
          updated.subcontractorPrice = updated.jobValue * (sub.defaultPayoutPct / 100);
        }
      }

      return updated;
    });
  };

  const handleSave = () => {
    if (editedJob) {
      onSave(editedJob);
      onClose();
    }
  };

  const salesReps = teamMembers.filter(m => m.role === 'sales' || m.role === 'both');
  const pms = teamMembers.filter(m => m.role === 'pm' || m.role === 'both');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold">
                {editedJob.clientName}
              </DialogTitle>
              <p className="text-sm text-slate-500 mt-1">{editedJob.jobNumber}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={getStatusColor(editedJob.status)}>
                {statusLabels[editedJob.status]}
              </Badge>
              <Badge variant="outline" className={getProfitFlagColor(editedJob.profitFlag)}>
                {editedJob.profitFlag}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Job Details</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="financials">Financials</TabsTrigger>
          </TabsList>

          {/* Job Details Tab */}
          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Client Name
                </Label>
                <Input
                  id="clientName"
                  value={editedJob.clientName}
                  onChange={(e) => handleFieldChange('clientName', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="flex items-center gap-2">
                  Status
                </Label>
                <Select
                  value={editedJob.status}
                  onValueChange={(value) => handleFieldChange('status', value as JobStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="got_the_job">Got the Job</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Address
                </Label>
                <Input
                  id="address"
                  value={editedJob.address}
                  onChange={(e) => handleFieldChange('address', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  City
                </Label>
                <Input
                  id="city"
                  value={editedJob.city}
                  onChange={(e) => handleFieldChange('city', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectType">Project Type</Label>
                <Select
                  value={editedJob.projectType}
                  onValueChange={(value) => handleFieldChange('projectType', value as ProjectType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interior">Interior</SelectItem>
                    <SelectItem value="exterior">Exterior</SelectItem>
                    <SelectItem value="both">Interior & Exterior</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobValue" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Job Value
                </Label>
                <Input
                  id="jobValue"
                  type="number"
                  value={editedJob.jobValue}
                  onChange={(e) => handleFieldChange('jobValue', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jobDate" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Job Date
                </Label>
                <Input
                  id="jobDate"
                  type="date"
                  value={editedJob.jobDate}
                  onChange={(e) => handleFieldChange('jobDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduledStartDate">Scheduled Start</Label>
                <Input
                  id="scheduledStartDate"
                  type="date"
                  value={editedJob.scheduledStartDate}
                  onChange={(e) => handleFieldChange('scheduledStartDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduledEndDate">Scheduled End</Label>
                <Input
                  id="scheduledEndDate"
                  type="date"
                  value={editedJob.scheduledEndDate}
                  onChange={(e) => handleFieldChange('scheduledEndDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="actualStartDate">Actual Start</Label>
                <Input
                  id="actualStartDate"
                  type="date"
                  value={editedJob.actualStartDate || ''}
                  onChange={(e) => handleFieldChange('actualStartDate', e.target.value)}
                />
              </div>
            </div>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Sales Rep
                </Label>
                <Select
                  value={editedJob.salesRepId || ''}
                  onValueChange={(value) => handleFieldChange('salesRepId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sales rep" />
                  </SelectTrigger>
                  <SelectContent>
                    {salesReps.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name} ({member.defaultCommissionPct}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="salesCommissionPct" className="text-sm text-slate-500">
                      Commission %
                    </Label>
                    <Input
                      id="salesCommissionPct"
                      type="number"
                      className="w-20"
                      value={editedJob.salesCommissionPct}
                      onChange={(e) => handleFieldChange('salesCommissionPct', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <span className="text-sm text-slate-600">
                    = {formatCurrency(editedJob.salesCommissionAmount)}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Project Manager
                </Label>
                <Select
                  value={editedJob.projectManagerId || ''}
                  onValueChange={(value) => handleFieldChange('projectManagerId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {pms.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name} ({member.defaultCommissionPct}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="pmCommissionPct" className="text-sm text-slate-500">
                      Commission %
                    </Label>
                    <Input
                      id="pmCommissionPct"
                      type="number"
                      className="w-20"
                      value={editedJob.pmCommissionPct}
                      onChange={(e) => handleFieldChange('pmCommissionPct', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <span className="text-sm text-slate-600">
                    = {formatCurrency(editedJob.pmCommissionAmount)}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Subcontractor
                </Label>
                <Select
                  value={editedJob.subcontractorId || ''}
                  onValueChange={(value) => handleFieldChange('subcontractorId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subcontractor" />
                  </SelectTrigger>
                  <SelectContent>
                    {subcontractors.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.name} - {sub.companyName} ({sub.defaultPayoutPct}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm text-slate-500">Payout:</span>
                  <span className="text-sm font-medium">
                    {formatCurrency(editedJob.subcontractorPrice)}
                  </span>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4 mt-4">
            <div className="space-y-6">
              {/* Client Payments */}
              <div className="bg-slate-50 p-4 rounded-lg space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Client Payments
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Deposit Required</Label>
                    <p className="text-lg font-semibold">{formatCurrency(editedJob.depositRequired)}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Balance Due</Label>
                    <p className="text-lg font-semibold text-orange-600">{formatCurrency(editedJob.balanceDue)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="depositPaid"
                      checked={editedJob.depositPaid}
                      onCheckedChange={(checked) => handleFieldChange('depositPaid', checked)}
                    />
                    <Label htmlFor="depositPaid">Deposit Paid</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="jobPaid"
                      checked={editedJob.jobPaid}
                      onCheckedChange={(checked) => handleFieldChange('jobPaid', checked)}
                    />
                    <Label htmlFor="jobPaid">Job Paid in Full</Label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoiceDate">Invoice Date</Label>
                    <Input
                      id="invoiceDate"
                      type="date"
                      value={editedJob.invoiceDate || ''}
                      onChange={(e) => handleFieldChange('invoiceDate', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentReceivedDate">Payment Received</Label>
                    <Input
                      id="paymentReceivedDate"
                      type="date"
                      value={editedJob.paymentReceivedDate || ''}
                      onChange={(e) => handleFieldChange('paymentReceivedDate', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Commission Payments */}
              <div className="bg-slate-50 p-4 rounded-lg space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  Commission Payments
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white rounded border">
                    <div>
                      <p className="font-medium">Sales Commission</p>
                      <p className="text-sm text-slate-500">
                        {editedJob.salesRep?.name || 'No sales rep'} - {editedJob.salesCommissionPct}%
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold">{formatCurrency(editedJob.salesCommissionAmount)}</span>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="salesCommissionPaid"
                          checked={editedJob.salesCommissionPaid}
                          onCheckedChange={(checked) => handleFieldChange('salesCommissionPaid', checked)}
                        />
                        <Label htmlFor="salesCommissionPaid">Paid</Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white rounded border">
                    <div>
                      <p className="font-medium">PM Commission</p>
                      <p className="text-sm text-slate-500">
                        {editedJob.projectManager?.name || 'No PM'} - {editedJob.pmCommissionPct}%
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold">{formatCurrency(editedJob.pmCommissionAmount)}</span>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="pmCommissionPaid"
                          checked={editedJob.pmCommissionPaid}
                          onCheckedChange={(checked) => handleFieldChange('pmCommissionPaid', checked)}
                        />
                        <Label htmlFor="pmCommissionPaid">Paid</Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white rounded border">
                    <div>
                      <p className="font-medium">Subcontractor Payment</p>
                      <p className="text-sm text-slate-500">
                        {editedJob.subcontractor?.name || 'No subcontractor'}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold">{formatCurrency(editedJob.subcontractorPrice)}</span>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="subcontractorPaid"
                          checked={editedJob.subcontractorPaid}
                          onCheckedChange={(checked) => handleFieldChange('subcontractorPaid', checked)}
                        />
                        <Label htmlFor="subcontractorPaid">Paid</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Financials Tab */}
          <TabsContent value="financials" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                <h3 className="font-semibold">Revenue</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Job Value</span>
                    <span className="font-semibold">{formatCurrency(editedJob.jobValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Deposit Required (30%)</span>
                    <span>{formatCurrency(editedJob.depositRequired)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                <h3 className="font-semibold">Costs</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Materials (15%)</span>
                    <span>{formatCurrency(editedJob.subMaterials)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Labor (45%)</span>
                    <span>{formatCurrency(editedJob.subLabor)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>Total Sub Cost (60%)</span>
                    <span>{formatCurrency(editedJob.subTotal)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg space-y-3 col-span-2">
                <h3 className="font-semibold text-green-800">Profit Analysis</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-green-600">Gross Profit</p>
                    <p className="text-2xl font-bold text-green-700">{formatCurrency(editedJob.grossProfit)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-green-600">Gross Margin</p>
                    <p className="text-2xl font-bold text-green-700">{editedJob.grossMarginPct}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-green-600">Status</p>
                    <Badge variant="outline" className={getProfitFlagColor(editedJob.profitFlag)}>
                      {editedJob.profitFlag}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-4 text-sm">
                  <span className={editedJob.meetsMinGp ? 'text-green-600' : 'text-red-600'}>
                    {editedJob.meetsMinGp ? '✓' : '✗'} Min GP ($900)
                  </span>
                  <span className={editedJob.meetsTargetGm ? 'text-green-600' : 'text-red-600'}>
                    {editedJob.meetsTargetGm ? '✓' : '✗'} Target GM (40%)
                  </span>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg space-y-3 col-span-2">
                <h3 className="font-semibold text-blue-800">Payment Summary</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-blue-600">Sales Commission</p>
                    <p className="font-semibold">{formatCurrency(editedJob.salesCommissionAmount)}</p>
                    <p className="text-xs text-blue-500">{editedJob.salesCommissionPaid ? 'Paid' : 'Pending'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">PM Commission</p>
                    <p className="font-semibold">{formatCurrency(editedJob.pmCommissionAmount)}</p>
                    <p className="text-xs text-blue-500">{editedJob.pmCommissionPaid ? 'Paid' : 'Pending'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Sub Payment</p>
                    <p className="font-semibold">{formatCurrency(editedJob.subcontractorPrice)}</p>
                    <p className="text-xs text-blue-500">{editedJob.subcontractorPaid ? 'Paid' : 'Pending'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Net After Payouts</p>
                    <p className="font-semibold">
                      {formatCurrency(
                        editedJob.grossProfit -
                        editedJob.salesCommissionAmount -
                        editedJob.pmCommissionAmount
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
