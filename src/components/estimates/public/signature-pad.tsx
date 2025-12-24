'use client';

import { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { PenTool, RotateCcw, Check } from 'lucide-react';

interface SignaturePadProps {
  onSign: (data: { clientName: string; signatureDataUrl: string }) => void;
  isSubmitting?: boolean;
}

export function SignaturePad({ onSign, isSubmitting }: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [clientName, setClientName] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const handleClear = () => {
    sigCanvas.current?.clear();
    setHasSignature(false);
  };

  const handleEnd = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      setHasSignature(true);
    }
  };

  const handleSubmit = () => {
    if (sigCanvas.current && clientName && agreedToTerms && hasSignature) {
      const signatureDataUrl = sigCanvas.current.toDataURL('image/png');
      onSign({ clientName, signatureDataUrl });
    }
  };

  const canSubmit = clientName && agreedToTerms && hasSignature && !isSubmitting;

  return (
    <Card className="border-2 border-green-200 bg-green-50/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-800">
          <PenTool className="h-5 w-5" />
          Accept This Estimate
        </CardTitle>
        <CardDescription>
          Sign below to accept this estimate and schedule your project
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Client Name */}
        <div className="space-y-2">
          <Label htmlFor="clientName">Your Full Name</Label>
          <Input
            id="clientName"
            placeholder="Enter your full legal name"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="bg-white"
          />
        </div>

        {/* Signature Canvas */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Your Signature</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-slate-500 hover:text-slate-700"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
          <div className="border-2 border-slate-300 rounded-lg bg-white overflow-hidden">
            <SignatureCanvas
              ref={sigCanvas}
              penColor="black"
              canvasProps={{
                className: 'w-full h-40',
                style: { width: '100%', height: '160px' },
              }}
              onEnd={handleEnd}
            />
          </div>
          <p className="text-xs text-slate-500">
            Use your mouse or finger to sign above
          </p>
        </div>

        {/* Terms Agreement */}
        <div className="flex items-start space-x-3">
          <Checkbox
            id="terms"
            checked={agreedToTerms}
            onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
          />
          <label
            htmlFor="terms"
            className="text-sm text-slate-600 leading-relaxed cursor-pointer"
          >
            I have read and agree to the terms and conditions outlined in this estimate.
            I understand that this signature constitutes a legally binding agreement.
          </label>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full h-12 text-lg gap-2 bg-green-600 hover:bg-green-700"
        >
          <Check className="h-5 w-5" />
          {isSubmitting ? 'Processing...' : 'Accept Estimate'}
        </Button>

        <p className="text-xs text-center text-slate-500">
          By signing, you agree to proceed with this project at the quoted price.
          A deposit invoice will be sent to your email.
        </p>
      </CardContent>
    </Card>
  );
}
