import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/settings/estimate - Get company estimate settings
export async function GET() {
  try {
    // Get the single company estimate settings record or create default
    let settings = await prisma.companyEstimateSettings.findFirst();

    if (!settings) {
      settings = await prisma.companyEstimateSettings.create({
        data: {
          termsAndConditions: '',
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching estimate settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch estimate settings' },
      { status: 500 }
    );
  }
}

// PATCH /api/settings/estimate - Update company estimate settings
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    // Get existing settings or create one
    let settings = await prisma.companyEstimateSettings.findFirst();

    if (!settings) {
      settings = await prisma.companyEstimateSettings.create({
        data: {
          insuranceCertificateUrl: body.insuranceCertificateUrl,
          insuranceCompany: body.insuranceCompany,
          insurancePolicyNumber: body.insurancePolicyNumber,
          insuranceCoverageAmount: body.insuranceCoverageAmount,
          insuranceExpirationDate: body.insuranceExpirationDate ? new Date(body.insuranceExpirationDate) : null,
          licenseImageUrl: body.licenseImageUrl,
          licenseNumber: body.licenseNumber,
          licenseState: body.licenseState,
          licenseExpirationDate: body.licenseExpirationDate ? new Date(body.licenseExpirationDate) : null,
          termsAndConditions: body.termsAndConditions || '',
          paymentTerms: body.paymentTerms,
          warrantyTerms: body.warrantyTerms,
        },
      });
    } else {
      settings = await prisma.companyEstimateSettings.update({
        where: { id: settings.id },
        data: {
          ...(body.insuranceCertificateUrl !== undefined && { insuranceCertificateUrl: body.insuranceCertificateUrl }),
          ...(body.insuranceCompany !== undefined && { insuranceCompany: body.insuranceCompany }),
          ...(body.insurancePolicyNumber !== undefined && { insurancePolicyNumber: body.insurancePolicyNumber }),
          ...(body.insuranceCoverageAmount !== undefined && { insuranceCoverageAmount: body.insuranceCoverageAmount }),
          ...(body.insuranceExpirationDate !== undefined && { insuranceExpirationDate: body.insuranceExpirationDate ? new Date(body.insuranceExpirationDate) : null }),
          ...(body.licenseImageUrl !== undefined && { licenseImageUrl: body.licenseImageUrl }),
          ...(body.licenseNumber !== undefined && { licenseNumber: body.licenseNumber }),
          ...(body.licenseState !== undefined && { licenseState: body.licenseState }),
          ...(body.licenseExpirationDate !== undefined && { licenseExpirationDate: body.licenseExpirationDate ? new Date(body.licenseExpirationDate) : null }),
          ...(body.termsAndConditions !== undefined && { termsAndConditions: body.termsAndConditions }),
          ...(body.paymentTerms !== undefined && { paymentTerms: body.paymentTerms }),
          ...(body.warrantyTerms !== undefined && { warrantyTerms: body.warrantyTerms }),
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating estimate settings:', error);
    return NextResponse.json(
      { error: 'Failed to update estimate settings' },
      { status: 500 }
    );
  }
}
