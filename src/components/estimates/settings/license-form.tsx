'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CompanyEstimateSettings } from '@/types';
import { Award, Upload, Calendar, MapPin, Hash } from 'lucide-react';

interface LicenseFormProps {
  settings: CompanyEstimateSettings;
  onUpdate: (settings: Partial<CompanyEstimateSettings>) => void;
}

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export function LicenseForm({ settings, onUpdate }: LicenseFormProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(settings.licenseImageUrl || null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setPreviewUrl(dataUrl);
        onUpdate({ licenseImageUrl: dataUrl });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* License Image Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-green-600" />
            Contractor License
          </CardTitle>
          <CardDescription>
            Upload your contractor license to display on estimates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {previewUrl ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Contractor License"
                  className="max-w-md rounded-lg border shadow-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    setPreviewUrl(null);
                    onUpdate({ licenseImageUrl: undefined });
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

      {/* License Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-green-600" />
            License Details
          </CardTitle>
          <CardDescription>
            Enter your contractor license information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="licenseNumber">License Number</Label>
              <Input
                id="licenseNumber"
                placeholder="e.g., HIC-123456"
                value={settings.licenseNumber || ''}
                onChange={(e) => onUpdate({ licenseNumber: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="licenseState" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                State
              </Label>
              <Select
                value={settings.licenseState || ''}
                onValueChange={(value) => onUpdate({ licenseState: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="licenseExpiration" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Expiration Date
              </Label>
              <Input
                id="licenseExpiration"
                type="date"
                className="max-w-xs"
                value={settings.licenseExpirationDate || ''}
                onChange={(e) => onUpdate({ licenseExpirationDate: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
