import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

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

    if (error && error.code === 'PGRST116') {
      // No settings found, create default
      const { data: newSettings, error: createError } = await supabase
        .from('CompanyEstimateSettings')
        .insert({
          termsAndConditions: '',
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      settings = newSettings;
    } else if (error) {
      throw error;
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
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    // Get existing settings
    let { data: settings, error: fetchError } = await supabase
      .from('CompanyEstimateSettings')
      .select('*')
      .limit(1)
      .single();

    if (fetchError && fetchError.code === 'PGRST116') {
      // No settings found, create one
      const { data: newSettings, error: createError } = await supabase
        .from('CompanyEstimateSettings')
        .insert({
          insuranceCertificateUrl: body.insuranceCertificateUrl,
          insuranceCompany: body.insuranceCompany,
          insurancePolicyNumber: body.insurancePolicyNumber,
          insuranceCoverageAmount: body.insuranceCoverageAmount,
          insuranceExpirationDate: body.insuranceExpirationDate ? new Date(body.insuranceExpirationDate).toISOString() : null,
          licenseImageUrl: body.licenseImageUrl,
          licenseNumber: body.licenseNumber,
          licenseState: body.licenseState,
          licenseExpirationDate: body.licenseExpirationDate ? new Date(body.licenseExpirationDate).toISOString() : null,
          termsAndConditions: body.termsAndConditions || '',
          paymentTerms: body.paymentTerms,
          warrantyTerms: body.warrantyTerms,
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      return NextResponse.json(newSettings);
    } else if (fetchError) {
      throw fetchError;
    }

    // Update existing settings
    const updateData: any = { updatedAt: new Date().toISOString() };

    if (body.insuranceCertificateUrl !== undefined) updateData.insuranceCertificateUrl = body.insuranceCertificateUrl;
    if (body.insuranceCompany !== undefined) updateData.insuranceCompany = body.insuranceCompany;
    if (body.insurancePolicyNumber !== undefined) updateData.insurancePolicyNumber = body.insurancePolicyNumber;
    if (body.insuranceCoverageAmount !== undefined) updateData.insuranceCoverageAmount = body.insuranceCoverageAmount;
    if (body.insuranceExpirationDate !== undefined) updateData.insuranceExpirationDate = body.insuranceExpirationDate ? new Date(body.insuranceExpirationDate).toISOString() : null;
    if (body.licenseImageUrl !== undefined) updateData.licenseImageUrl = body.licenseImageUrl;
    if (body.licenseNumber !== undefined) updateData.licenseNumber = body.licenseNumber;
    if (body.licenseState !== undefined) updateData.licenseState = body.licenseState;
    if (body.licenseExpirationDate !== undefined) updateData.licenseExpirationDate = body.licenseExpirationDate ? new Date(body.licenseExpirationDate).toISOString() : null;
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
      throw updateError;
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
