'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CompanyEstimateSettings } from '@/types';
import { Shield, Upload, Calendar, DollarSign, Building, FileText } from 'lucide-react';

interface InsuranceFormProps {
  settings: CompanyEstimateSettings;
  onUpdate: (settings: Partial<CompanyEstimateSettings>) => void;
}

export function InsuranceForm({ settings, onUpdate }: InsuranceFormProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(settings.insuranceCertificateUrl || null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setPreviewUrl(dataUrl);
        onUpdate({ insuranceCertificateUrl: dataUrl });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Certificate Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Insurance Certificate
          </CardTitle>
          <CardDescription>
            Upload your certificate of insurance to display on estimates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {previewUrl ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Insurance Certificate"
                  className="max-w-md rounded-lg border shadow-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    setPreviewUrl(null);
                    onUpdate({ insuranceCertificateUrl: undefined });
                  }}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="h-10 w-10 text-slate-400 mb-3" />
                  <p className="mb-2 text-sm text-slate-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-slate-400">PNG, JPG or PDF (MAX. 10MB)</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf"
                  onChange={handleImageUpload}
                />
              </label>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Insurance Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Insurance Details
          </CardTitle>
          <CardDescription>
            Enter your insurance policy information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="insuranceCompany" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Insurance Company
              </Label>
              <Input
                id="insuranceCompany"
                placeholder="e.g., State Farm, Allstate"
                value={settings.insuranceCompany || ''}
                onChange={(e) => onUpdate({ insuranceCompany: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="policyNumber">Policy Number</Label>
              <Input
                id="policyNumber"
                placeholder="e.g., POL-123456789"
                value={settings.insurancePolicyNumber || ''}
                onChange={(e) => onUpdate({ insurancePolicyNumber: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverageAmount" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Coverage Amount
              </Label>
              <Input
                id="coverageAmount"
                type="number"
                placeholder="e.g., 1000000"
                value={settings.insuranceCoverageAmount || ''}
                onChange={(e) => onUpdate({ insuranceCoverageAmount: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expirationDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Expiration Date
              </Label>
              <Input
                id="expirationDate"
                type="date"
                value={settings.insuranceExpirationDate || ''}
                onChange={(e) => onUpdate({ insuranceExpirationDate: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
