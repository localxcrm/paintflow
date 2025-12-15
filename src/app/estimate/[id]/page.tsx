'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SignaturePad, PortfolioGallery } from '@/components/estimates/public';
import { Estimate, CompanyEstimateSettings, PortfolioImage } from '@/types';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Shield,
  Award,
  FileText,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

// Mock data for demonstration
const mockEstimate: Estimate = {
  id: '1',
  estimateNumber: 'EST-2024-089',
  clientName: 'John Smith',
  address: '123 Oak Street, Greenwich, CT 06830',
  status: 'sent',
  estimateDate: '2024-12-12',
  validUntil: '2024-12-26',
  lineItems: [
    { id: '1', description: 'Master Bedroom - Walls + Trim + Ceiling', location: 'Master Bedroom', scope: 'walls_trim_ceiling', quantity: 1, unitPrice: 3000, lineTotal: 3000 },
    { id: '2', description: 'Bedroom 2 - Walls + Trim', location: 'Bedroom 2', scope: 'walls_trim', quantity: 1, unitPrice: 1200, lineTotal: 1200 },
    { id: '3', description: 'Bedroom 3 - Walls + Trim', location: 'Bedroom 3', scope: 'walls_trim', quantity: 1, unitPrice: 1200, lineTotal: 1200 },
    { id: '4', description: 'Hallway - Walls + Trim + Ceiling', location: 'Upstairs Hallway', scope: 'walls_trim_ceiling', quantity: 1, unitPrice: 1150, lineTotal: 1150 },
    { id: '5', description: 'Walk-in Closet - Walls + Trim', location: 'Master Closet', quantity: 1, unitPrice: 450, lineTotal: 450 },
    { id: '6', description: 'Interior Doors - Both Sides', location: 'Various', quantity: 8, unitPrice: 125, lineTotal: 1000 },
  ],
  subtotal: 8000,
  discountAmount: 0,
  totalPrice: 8000,
  subMaterialsCost: 1200,
  subLaborCost: 3600,
  subTotalCost: 4800,
  grossProfit: 3200,
  grossMarginPct: 40,
  meetsMinGp: true,
  meetsTargetGm: true,
};

const mockSettings: CompanyEstimateSettings = {
  insuranceCompany: 'State Farm Insurance',
  insurancePolicyNumber: 'POL-2024-123456',
  insuranceCoverageAmount: 2000000,
  insuranceExpirationDate: '2025-06-15',
  licenseNumber: 'HIC-0654321',
  licenseState: 'CT',
  licenseExpirationDate: '2025-12-31',
  portfolioImages: [
    {
      id: '1',
      beforeUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      afterUrl: 'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800',
      projectType: 'interior',
      description: 'Living Room Transformation - Greenwich',
    },
    {
      id: '2',
      beforeUrl: 'https://images.unsplash.com/photo-1560185127-6a8e5a4c2e56?w=800',
      afterUrl: 'https://images.unsplash.com/photo-1560448205-17d3a46c84de?w=800',
      projectType: 'interior',
      description: 'Kitchen Refresh - Stamford',
    },
  ],
  termsAndConditions: `1. SCOPE OF WORK: All work to be performed as specified in this estimate.

2. PREPARATION: Price includes standard preparation such as light sanding, cleaning, and caulking.

3. MATERIALS: We use premium quality paints and materials.

4. ACCESS: Client agrees to provide clear access to work areas.

5. TIMELINE: Start and completion dates are estimates and may be affected by weather or unforeseen conditions.`,
  paymentTerms: `PAYMENT SCHEDULE:
- 30% deposit required to schedule
- 40% due on first day of work
- 30% balance due upon completion`,
  warrantyTerms: `2-YEAR WARRANTY covering peeling, cracking, and fading under normal conditions.`,
};

export default function PublicEstimatePage() {
  const params = useParams();
  const [estimate, setEstimate] = useState(mockEstimate);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const [isInsuranceOpen, setIsInsuranceOpen] = useState(false);
  const [isLicenseOpen, setIsLicenseOpen] = useState(false);

  const handleSign = async (data: { clientName: string; signatureDataUrl: string }) => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setEstimate((prev) => ({ ...prev, status: 'accepted' }));
    setIsAccepted(true);
    setIsSubmitting(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-slate-900">CMD Painting</h1>
                <p className="text-xs text-slate-500">Premium Residential Painting</p>
              </div>
            </div>
            <div className="text-right text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="h-4 w-4" />
                (203) 555-0100
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="h-4 w-4" />
                info@cmdpainting.com
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Success Message */}
        {isAccepted && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <CheckCircle className="h-12 w-12 text-green-600" />
                <div>
                  <h2 className="text-xl font-bold text-green-800">Estimate Accepted!</h2>
                  <p className="text-green-700">
                    Thank you for choosing CMD Painting. We'll send a deposit invoice shortly.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estimate Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">Estimate #{estimate.estimateNumber}</CardTitle>
                <p className="text-slate-500 mt-1">
                  Prepared for <span className="font-medium text-slate-700">{estimate.clientName}</span>
                </p>
              </div>
              <Badge
                variant="outline"
                className={
                  estimate.status === 'accepted'
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : estimate.status === 'sent'
                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                    : 'bg-slate-100 text-slate-800'
                }
              >
                {estimate.status === 'accepted' ? 'Accepted' : 'Awaiting Approval'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-sm text-slate-500">Project Address</p>
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  {estimate.address}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-slate-500">Estimate Date</p>
                  <p className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    {formatDate(estimate.estimateDate)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-slate-500">Valid Until</p>
                  <p className="flex items-center gap-2 text-orange-600">
                    <Clock className="h-4 w-4" />
                    {formatDate(estimate.validUntil)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <CardTitle>Scope of Work</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {estimate.lineItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.description}</TableCell>
                    <TableCell className="text-slate-600">{item.location}</TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(item.lineTotal)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Separator className="my-4" />

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal</span>
                  <span>{formatCurrency(estimate.subtotal)}</span>
                </div>
                {estimate.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(estimate.discountAmount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-blue-600">{formatCurrency(estimate.totalPrice)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Credentials */}
        <div className="grid grid-cols-2 gap-6">
          <Collapsible open={isInsuranceOpen} onOpenChange={setIsInsuranceOpen}>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CollapsibleTrigger asChild>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Shield className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Fully Insured</h3>
                        <p className="text-sm text-slate-500">Click to view details</p>
                      </div>
                    </div>
                    {isInsuranceOpen ? (
                      <ChevronUp className="h-5 w-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 pb-6 border-t mt-4">
                  <div className="pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Insurance Company</span>
                      <span className="font-medium">{mockSettings.insuranceCompany}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Policy Number</span>
                      <span className="font-medium">{mockSettings.insurancePolicyNumber}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Coverage Amount</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(mockSettings.insuranceCoverageAmount || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Expiration Date</span>
                      <span className="font-medium">
                        {formatDate(mockSettings.insuranceExpirationDate || '')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          <Collapsible open={isLicenseOpen} onOpenChange={setIsLicenseOpen}>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CollapsibleTrigger asChild>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Award className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Licensed Contractor</h3>
                        <p className="text-sm text-slate-500">Click to view details</p>
                      </div>
                    </div>
                    {isLicenseOpen ? (
                      <ChevronUp className="h-5 w-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 pb-6 border-t mt-4">
                  <div className="pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">License State</span>
                      <span className="font-medium">{mockSettings.licenseState}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">License Number</span>
                      <span className="font-medium">{mockSettings.licenseNumber}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Valid Through</span>
                      <span className="font-medium text-green-600">
                        {formatDate(mockSettings.licenseExpirationDate || '')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>

        {/* Portfolio */}
        <PortfolioGallery images={mockSettings.portfolioImages} />

        {/* Terms & Conditions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-slate-600" />
              Terms & Conditions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold mb-2">General Terms</h4>
              <p className="text-sm text-slate-600 whitespace-pre-line">
                {mockSettings.termsAndConditions}
              </p>
            </div>
            <Separator />
            <div>
              <h4 className="font-semibold mb-2">Payment Terms</h4>
              <p className="text-sm text-slate-600 whitespace-pre-line">
                {mockSettings.paymentTerms}
              </p>
            </div>
            <Separator />
            <div>
              <h4 className="font-semibold mb-2">Warranty</h4>
              <p className="text-sm text-slate-600 whitespace-pre-line">
                {mockSettings.warrantyTerms}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Signature Section */}
        {!isAccepted && estimate.status !== 'accepted' && (
          <SignaturePad onSign={handleSign} isSubmitting={isSubmitting} />
        )}

        {/* Footer */}
        <footer className="text-center text-sm text-slate-500 py-8">
          <p>Questions? Call us at (203) 555-0100 or email info@cmdpainting.com</p>
          <p className="mt-2">CMD Painting - Fairfield County's Premier Painting Service</p>
        </footer>
      </main>
    </div>
  );
}
