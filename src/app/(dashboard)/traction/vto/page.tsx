'use client';

import { useState } from 'react';
import { mockVTO } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Target,
  Heart,
  Crosshair,
  TrendingUp,
  Calendar,
  Mountain,
  AlertCircle,
  Megaphone,
  Shield,
  Edit,
  Download,
  Plus,
  Trash2,
  Save,
} from 'lucide-react';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

type VTOData = typeof mockVTO;

export default function VTOPage() {
  const [vto, setVto] = useState<VTOData>(mockVTO);
  const [editSection, setEditSection] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<VTOData>>({});

  const openEdit = (section: string) => {
    setEditSection(section);
    setEditForm({ ...vto });
  };

  const saveEdit = () => {
    setVto({ ...vto, ...editForm });
    setEditSection(null);
  };

  const addCoreValue = () => {
    const newValues = [...(editForm.coreValues || vto.coreValues), ''];
    setEditForm({ ...editForm, coreValues: newValues });
  };

  const removeCoreValue = (index: number) => {
    const newValues = (editForm.coreValues || vto.coreValues).filter((_, i) => i !== index);
    setEditForm({ ...editForm, coreValues: newValues });
  };

  const updateCoreValue = (index: number, value: string) => {
    const newValues = [...(editForm.coreValues || vto.coreValues)];
    newValues[index] = value;
    setEditForm({ ...editForm, coreValues: newValues });
  };

  const addUnique = () => {
    const newUniques = [...(editForm.threeUniques || vto.threeUniques), ''];
    setEditForm({ ...editForm, threeUniques: newUniques });
  };

  const removeUnique = (index: number) => {
    const newUniques = (editForm.threeUniques || vto.threeUniques).filter((_, i) => i !== index);
    setEditForm({ ...editForm, threeUniques: newUniques });
  };

  const updateUnique = (index: number, value: string) => {
    const newUniques = [...(editForm.threeUniques || vto.threeUniques)];
    newUniques[index] = value;
    setEditForm({ ...editForm, threeUniques: newUniques });
  };

  const addGoal = () => {
    const newGoals = [...(editForm.oneYearGoals || vto.oneYearGoals), ''];
    setEditForm({ ...editForm, oneYearGoals: newGoals });
  };

  const removeGoal = (index: number) => {
    const newGoals = (editForm.oneYearGoals || vto.oneYearGoals).filter((_, i) => i !== index);
    setEditForm({ ...editForm, oneYearGoals: newGoals });
  };

  const updateGoal = (index: number, value: string) => {
    const newGoals = [...(editForm.oneYearGoals || vto.oneYearGoals)];
    newGoals[index] = value;
    setEditForm({ ...editForm, oneYearGoals: newGoals });
  };

  const addIssue = () => {
    const newIssues = [...(editForm.longTermIssues || vto.longTermIssues), ''];
    setEditForm({ ...editForm, longTermIssues: newIssues });
  };

  const removeIssue = (index: number) => {
    const newIssues = (editForm.longTermIssues || vto.longTermIssues).filter((_, i) => i !== index);
    setEditForm({ ...editForm, longTermIssues: newIssues });
  };

  const updateIssue = (index: number, value: string) => {
    const newIssues = [...(editForm.longTermIssues || vto.longTermIssues)];
    newIssues[index] = value;
    setEditForm({ ...editForm, longTermIssues: newIssues });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vision/Traction Organizer</h1>
          <p className="text-slate-500">Your company&apos;s strategic foundation - The 8 Questions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* V/TO Content - 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Vision */}
        <div className="space-y-6">
          <div className="bg-blue-600 text-white p-4 rounded-lg">
            <h2 className="text-xl font-bold">VISION</h2>
            <p className="text-blue-100 text-sm">What we want to be</p>
          </div>

          {/* Core Values */}
          <Card className="group relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => openEdit('coreValues')}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Heart className="h-5 w-5 text-red-500" />
                Core Values
              </CardTitle>
              <CardDescription>Who we are and what we stand for</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {vto.coreValues.map((value, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Badge variant="outline" className="mt-0.5 shrink-0">
                      {index + 1}
                    </Badge>
                    <span className="text-slate-700">{value}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Core Focus */}
          <Card className="group relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => openEdit('coreFocus')}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Crosshair className="h-5 w-5 text-blue-500" />
                Core Focus
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Purpose/Cause/Passion</p>
                <p className="text-slate-900">{vto.coreFocusPurpose}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Our Niche</p>
                <p className="text-slate-900">{vto.coreFocusNiche}</p>
              </div>
            </CardContent>
          </Card>

          {/* 10-Year Target */}
          <Card className="border-amber-200 bg-amber-50 group relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => openEdit('tenYear')}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-amber-600" />
                10-Year Target (BHAG)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-medium text-amber-900">{vto.tenYearTarget}</p>
            </CardContent>
          </Card>

          {/* Marketing Strategy */}
          <Card className="group relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => openEdit('marketing')}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Megaphone className="h-5 w-5 text-purple-500" />
                Marketing Strategy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Target Market</p>
                <p className="text-slate-900">{vto.targetMarket}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-slate-500 mb-2">3 Uniques</p>
                <ul className="space-y-2">
                  {vto.threeUniques.map((unique, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Badge className="bg-purple-100 text-purple-700 shrink-0">
                        {index + 1}
                      </Badge>
                      <span className="text-slate-700">{unique}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Proven Process</p>
                <p className="text-slate-900 text-sm">{vto.provenProcess}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">
                  <Shield className="inline h-4 w-4 mr-1" />
                  Guarantee
                </p>
                <p className="text-slate-900">{vto.guarantee}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Traction */}
        <div className="space-y-6">
          <div className="bg-green-600 text-white p-4 rounded-lg">
            <h2 className="text-xl font-bold">TRACTION</h2>
            <p className="text-green-100 text-sm">How we get there</p>
          </div>

          {/* 3-Year Picture */}
          <Card className="border-green-200 group relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => openEdit('threeYear')}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
                3-Year Picture
              </CardTitle>
              <CardDescription>End of 2027</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-500">Revenue</p>
                  <p className="text-2xl font-bold text-green-700">
                    {formatCurrency(vto.threeYearRevenue)}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-500">Profit</p>
                  <p className="text-2xl font-bold text-green-700">
                    {formatCurrency(vto.threeYearProfit)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">What does it look like?</p>
                <p className="text-slate-900">{vto.threeYearPicture}</p>
              </div>
            </CardContent>
          </Card>

          {/* 1-Year Plan */}
          <Card className="border-blue-200 group relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => openEdit('oneYear')}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
                1-Year Plan
              </CardTitle>
              <CardDescription>End of 2025</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-500">Revenue Goal</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {formatCurrency(vto.oneYearRevenue)}
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-500">Profit Goal</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {formatCurrency(vto.oneYearProfit)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-2">Goals for the Year</p>
                <ul className="space-y-2">
                  {vto.oneYearGoals.map((goal, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-2 p-2 bg-slate-50 rounded"
                    >
                      <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      <span className="text-slate-700">{goal}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Quarterly Rocks Preview */}
          <Card className="border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Mountain className="h-5 w-5 text-purple-600" />
                Q4 2024 Rocks
              </CardTitle>
              <CardDescription>Current quarter priorities</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-500 text-sm mb-2">
                See the <a href="/traction/rocks" className="text-blue-600 hover:underline">Rocks page</a> for details
              </p>
              <Badge variant="outline">3 Company Rocks</Badge>
            </CardContent>
          </Card>

          {/* Long-Term Issues */}
          <Card className="group relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => openEdit('issues')}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                Issues List (Long-Term)
              </CardTitle>
              <CardDescription>Parking lot for future consideration</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {vto.longTermIssues.map((issue, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 p-2 bg-amber-50 rounded border border-amber-100"
                  >
                    <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    <span className="text-slate-700 text-sm">{issue}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Core Values Dialog */}
      <Dialog open={editSection === 'coreValues'} onOpenChange={() => setEditSection(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Core Values</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {(editForm.coreValues || vto.coreValues).map((value, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={value}
                  onChange={(e) => updateCoreValue(index, e.target.value)}
                  placeholder={`Core Value ${index + 1}`}
                />
                <Button variant="ghost" size="icon" onClick={() => removeCoreValue(index)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
            <Button variant="outline" onClick={addCoreValue} className="w-full gap-2">
              <Plus className="h-4 w-4" /> Add Core Value
            </Button>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditSection(null)}>Cancel</Button>
              <Button onClick={saveEdit} className="gap-2"><Save className="h-4 w-4" /> Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Core Focus Dialog */}
      <Dialog open={editSection === 'coreFocus'} onOpenChange={() => setEditSection(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Core Focus</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Purpose/Cause/Passion</Label>
              <Textarea
                value={editForm.coreFocusPurpose || vto.coreFocusPurpose}
                onChange={(e) => setEditForm({ ...editForm, coreFocusPurpose: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Our Niche</Label>
              <Textarea
                value={editForm.coreFocusNiche || vto.coreFocusNiche}
                onChange={(e) => setEditForm({ ...editForm, coreFocusNiche: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditSection(null)}>Cancel</Button>
              <Button onClick={saveEdit} className="gap-2"><Save className="h-4 w-4" /> Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit 10-Year Target Dialog */}
      <Dialog open={editSection === 'tenYear'} onOpenChange={() => setEditSection(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit 10-Year Target (BHAG)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Big Hairy Audacious Goal</Label>
              <Textarea
                value={editForm.tenYearTarget || vto.tenYearTarget}
                onChange={(e) => setEditForm({ ...editForm, tenYearTarget: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditSection(null)}>Cancel</Button>
              <Button onClick={saveEdit} className="gap-2"><Save className="h-4 w-4" /> Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Marketing Strategy Dialog */}
      <Dialog open={editSection === 'marketing'} onOpenChange={() => setEditSection(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Marketing Strategy</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Target Market</Label>
              <Textarea
                value={editForm.targetMarket || vto.targetMarket}
                onChange={(e) => setEditForm({ ...editForm, targetMarket: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>3 Uniques</Label>
              {(editForm.threeUniques || vto.threeUniques).map((unique, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={unique}
                    onChange={(e) => updateUnique(index, e.target.value)}
                    placeholder={`Unique ${index + 1}`}
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeUnique(index)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" onClick={addUnique} size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> Add Unique
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Proven Process</Label>
              <Textarea
                value={editForm.provenProcess || vto.provenProcess}
                onChange={(e) => setEditForm({ ...editForm, provenProcess: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Guarantee</Label>
              <Textarea
                value={editForm.guarantee || vto.guarantee}
                onChange={(e) => setEditForm({ ...editForm, guarantee: e.target.value })}
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditSection(null)}>Cancel</Button>
              <Button onClick={saveEdit} className="gap-2"><Save className="h-4 w-4" /> Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit 3-Year Picture Dialog */}
      <Dialog open={editSection === 'threeYear'} onOpenChange={() => setEditSection(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit 3-Year Picture</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Revenue Goal</Label>
                <Input
                  type="number"
                  value={editForm.threeYearRevenue || vto.threeYearRevenue}
                  onChange={(e) => setEditForm({ ...editForm, threeYearRevenue: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Profit Goal</Label>
                <Input
                  type="number"
                  value={editForm.threeYearProfit || vto.threeYearProfit}
                  onChange={(e) => setEditForm({ ...editForm, threeYearProfit: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>What does it look like?</Label>
              <Textarea
                value={editForm.threeYearPicture || vto.threeYearPicture}
                onChange={(e) => setEditForm({ ...editForm, threeYearPicture: e.target.value })}
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditSection(null)}>Cancel</Button>
              <Button onClick={saveEdit} className="gap-2"><Save className="h-4 w-4" /> Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit 1-Year Plan Dialog */}
      <Dialog open={editSection === 'oneYear'} onOpenChange={() => setEditSection(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit 1-Year Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Revenue Goal</Label>
                <Input
                  type="number"
                  value={editForm.oneYearRevenue || vto.oneYearRevenue}
                  onChange={(e) => setEditForm({ ...editForm, oneYearRevenue: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Profit Goal</Label>
                <Input
                  type="number"
                  value={editForm.oneYearProfit || vto.oneYearProfit}
                  onChange={(e) => setEditForm({ ...editForm, oneYearProfit: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Goals for the Year</Label>
              {(editForm.oneYearGoals || vto.oneYearGoals).map((goal, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={goal}
                    onChange={(e) => updateGoal(index, e.target.value)}
                    placeholder={`Goal ${index + 1}`}
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeGoal(index)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" onClick={addGoal} size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> Add Goal
              </Button>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditSection(null)}>Cancel</Button>
              <Button onClick={saveEdit} className="gap-2"><Save className="h-4 w-4" /> Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Issues Dialog */}
      <Dialog open={editSection === 'issues'} onOpenChange={() => setEditSection(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Long-Term Issues</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {(editForm.longTermIssues || vto.longTermIssues).map((issue, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={issue}
                  onChange={(e) => updateIssue(index, e.target.value)}
                  placeholder={`Issue ${index + 1}`}
                />
                <Button variant="ghost" size="icon" onClick={() => removeIssue(index)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
            <Button variant="outline" onClick={addIssue} className="w-full gap-2">
              <Plus className="h-4 w-4" /> Add Issue
            </Button>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditSection(null)}>Cancel</Button>
              <Button onClick={saveEdit} className="gap-2"><Save className="h-4 w-4" /> Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
