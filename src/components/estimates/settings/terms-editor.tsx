'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CompanyEstimateSettings } from '@/types';
import { FileText, CreditCard, Shield } from 'lucide-react';

interface TermsEditorProps {
  settings: CompanyEstimateSettings;
  onUpdate: (settings: Partial<CompanyEstimateSettings>) => void;
}

export function TermsEditor({ settings, onUpdate }: TermsEditorProps) {
  return (
    <div className="space-y-6">
      {/* Terms & Conditions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-orange-600" />
            Terms & Conditions
          </CardTitle>
          <CardDescription>
            These terms will appear on all estimates sent to clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="terms">Contract Terms</Label>
            <Textarea
              id="terms"
              placeholder="Enter your terms and conditions..."
              className="min-h-[200px] font-mono text-sm"
              value={settings.termsAndConditions || ''}
              onChange={(e) => onUpdate({ termsAndConditions: e.target.value })}
            />
            <p className="text-xs text-slate-500">
              Tip: Include scope of work details, change order policies, and liability limitations
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Payment Terms */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-green-600" />
            Payment Terms
          </CardTitle>
          <CardDescription>
            Specify your payment schedule and accepted methods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="paymentTerms">Payment Policy</Label>
            <Textarea
              id="paymentTerms"
              placeholder="e.g., 30% deposit required to schedule. 40% due at start of work. 30% due upon completion..."
              className="min-h-[120px]"
              value={settings.paymentTerms || ''}
              onChange={(e) => onUpdate({ paymentTerms: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Warranty Terms */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Warranty Information
          </CardTitle>
          <CardDescription>
            Describe your warranty coverage and guarantees
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="warrantyTerms">Warranty Policy</Label>
            <Textarea
              id="warrantyTerms"
              placeholder="e.g., 2-year warranty on all workmanship. Covers peeling, cracking, and fading under normal conditions..."
              className="min-h-[120px]"
              value={settings.warrantyTerms || ''}
              onChange={(e) => onUpdate({ warrantyTerms: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Preview Section */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-slate-600">Preview</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          {settings.termsAndConditions || settings.paymentTerms || settings.warrantyTerms ? (
            <div className="space-y-4 text-slate-700">
              {settings.termsAndConditions && (
                <div>
                  <h4 className="font-semibold text-slate-900">Terms & Conditions</h4>
                  <p className="whitespace-pre-wrap">{settings.termsAndConditions}</p>
                </div>
              )}
              {settings.paymentTerms && (
                <div>
                  <h4 className="font-semibold text-slate-900">Payment Terms</h4>
                  <p className="whitespace-pre-wrap">{settings.paymentTerms}</p>
                </div>
              )}
              {settings.warrantyTerms && (
                <div>
                  <h4 className="font-semibold text-slate-900">Warranty</h4>
                  <p className="whitespace-pre-wrap">{settings.warrantyTerms}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-slate-400 italic">
              Your terms will appear here as you type...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
