'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  InsuranceForm,
  LicenseForm,
  PortfolioManager,
  TermsEditor,
} from '@/components/estimates/settings';
import { CompanyEstimateSettings } from '@/types';
import { Settings, Shield, Award, Images, FileText, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Mock initial settings
const initialSettings: CompanyEstimateSettings = {
  insuranceCompany: 'State Farm',
  insurancePolicyNumber: 'POL-2024-123456',
  insuranceCoverageAmount: 2000000,
  insuranceExpirationDate: '2025-06-15',
  licenseNumber: 'HIC-0654321',
  licenseState: 'CT',
  licenseExpirationDate: '2025-12-31',
  portfolioImages: [],
  termsAndConditions: `1. SCOPE OF WORK: All work to be performed as specified in this estimate. Any additional work or changes will require a written change order.

2. PREPARATION: Price includes standard preparation such as light sanding, cleaning, and caulking. Extensive repairs will be quoted separately.

3. MATERIALS: We use premium quality paints and materials. Color selection is the client's responsibility.

4. ACCESS: Client agrees to provide clear access to work areas and remove or protect valuable items.

5. TIMELINE: Start and completion dates are estimates and may be affected by weather, material availability, or unforeseen conditions.`,
  paymentTerms: `PAYMENT SCHEDULE:
- 30% deposit required to schedule the project
- 40% due on the first day of work
- 30% balance due upon completion

ACCEPTED PAYMENT METHODS:
- Check, Credit Card, Zelle, or Bank Transfer
- A 3% processing fee applies to credit card payments`,
  warrantyTerms: `CMD PAINTING WARRANTY:

We stand behind our work with a comprehensive 2-year warranty covering:
- Peeling or flaking paint
- Cracking or bubbling
- Fading beyond normal weathering (exterior)
- Any defects in workmanship

This warranty does not cover:
- Damage from accidents, abuse, or neglect
- Structural movement or settling
- Moisture damage from leaks or flooding
- Normal wear and tear`,
};

export default function EstimateSettingsPage() {
  const [settings, setSettings] = useState<CompanyEstimateSettings>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdate = (updates: Partial<CompanyEstimateSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    // In real app, save to backend
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/estimates">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Estimates
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Settings className="h-6 w-6" />
              Estimate Settings
            </h1>
            <p className="text-slate-500">
              Configure company info displayed on estimates
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="insurance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="insurance" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Insurance</span>
          </TabsTrigger>
          <TabsTrigger value="license" className="gap-2">
            <Award className="h-4 w-4" />
            <span className="hidden sm:inline">License</span>
          </TabsTrigger>
          <TabsTrigger value="portfolio" className="gap-2">
            <Images className="h-4 w-4" />
            <span className="hidden sm:inline">Portfolio</span>
          </TabsTrigger>
          <TabsTrigger value="terms" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Terms</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="insurance">
          <InsuranceForm settings={settings} onUpdate={handleUpdate} />
        </TabsContent>

        <TabsContent value="license">
          <LicenseForm settings={settings} onUpdate={handleUpdate} />
        </TabsContent>

        <TabsContent value="portfolio">
          <PortfolioManager settings={settings} onUpdate={handleUpdate} />
        </TabsContent>

        <TabsContent value="terms">
          <TermsEditor settings={settings} onUpdate={handleUpdate} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
