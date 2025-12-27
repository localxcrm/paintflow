import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// GET /api/settings/estimate - Get company estimate settings
export async function GET() {
  try {
    const supabase = createServerSupabaseClient();

    // Get the single company estimate settings record or create default
    let { data: settings, error } = await supabase
      .from('CompanyEstimateSettings')
      .select('*')
      .limit(1)
      .single();

    if (error || !settings) {
      // Create default settings
      const { data: newSettings, error: createError } = await supabase
        .from('CompanyEstimateSettings')
        .insert({
          termsAndConditions: '',
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating estimate settings:', createError);
        return NextResponse.json(
          { error: 'Failed to create estimate settings' },
          { status: 500 }
        );
      }

      settings = newSettings;
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
    const supabase = createServerSupabaseClient();

    // Get existing settings
    let { data: settings } = await supabase
      .from('CompanyEstimateSettings')
      .select('*')
      .limit(1)
      .single();

    if (!settings) {
      // Create new settings
      const { data: newSettings, error: createError } = await supabase
        .from('CompanyEstimateSettings')
        .insert({
          insuranceCertificateUrl: body.insuranceCertificateUrl,
          insuranceCompany: body.insuranceCompany,
          insurancePolicyNumber: body.insurancePolicyNumber,
          insuranceCoverageAmount: body.insuranceCoverageAmount,
          insuranceExpirationDate: body.insuranceExpirationDate || null,
          licenseImageUrl: body.licenseImageUrl,
          licenseNumber: body.licenseNumber,
          licenseState: body.licenseState,
          licenseExpirationDate: body.licenseExpirationDate || null,
          termsAndConditions: body.termsAndConditions || '',
          paymentTerms: body.paymentTerms,
          warrantyTerms: body.warrantyTerms,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating estimate settings:', createError);
        return NextResponse.json(
          { error: 'Failed to create estimate settings' },
          { status: 500 }
        );
      }

      return NextResponse.json(newSettings);
    }

    // Update existing settings
    const updateData: Record<string, unknown> = {};
    if (body.insuranceCertificateUrl !== undefined) updateData.insuranceCertificateUrl = body.insuranceCertificateUrl;
    if (body.insuranceCompany !== undefined) updateData.insuranceCompany = body.insuranceCompany;
    if (body.insurancePolicyNumber !== undefined) updateData.insurancePolicyNumber = body.insurancePolicyNumber;
    if (body.insuranceCoverageAmount !== undefined) updateData.insuranceCoverageAmount = body.insuranceCoverageAmount;
    if (body.insuranceExpirationDate !== undefined) updateData.insuranceExpirationDate = body.insuranceExpirationDate || null;
    if (body.licenseImageUrl !== undefined) updateData.licenseImageUrl = body.licenseImageUrl;
    if (body.licenseNumber !== undefined) updateData.licenseNumber = body.licenseNumber;
    if (body.licenseState !== undefined) updateData.licenseState = body.licenseState;
    if (body.licenseExpirationDate !== undefined) updateData.licenseExpirationDate = body.licenseExpirationDate || null;
    if (body.termsAndConditions !== undefined) updateData.termsAndConditions = body.termsAndConditions;
    if (body.paymentTerms !== undefined) updateData.paymentTerms = body.paymentTerms;
    if (body.warrantyTerms !== undefined) updateData.warrantyTerms = body.warrantyTerms;

    const { data: updatedSettings, error: updateError } = await supabase
      .from('CompanyEstimateSettings')
      .update(updateData)
      .eq('id', settings.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating estimate settings:', updateError);
      return NextResponse.json(
        { error: 'Failed to update estimate settings' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Error updating estimate settings:', error);
    return NextResponse.json(
      { error: 'Failed to update estimate settings' },
      { status: 500 }
    );
  }
}
