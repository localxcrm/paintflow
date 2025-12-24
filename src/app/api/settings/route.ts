import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getOrganizationIdFromRequest } from '@/lib/supabase-server';

// Default settings
const DEFAULT_SETTINGS = {
  companyName: 'PaintPro',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  website: '',
  taxId: '',
  marketingChannels: [
    { id: 'meta', label: 'Meta Ads', color: '#1877F2' },
    { id: 'google', label: 'Google Ads', color: '#EA4335' },
    { id: 'indicacao', label: 'Indicação', color: '#10B981' },
    { id: 'organico', label: 'Orgânico', color: '#8B5CF6' },
  ],
};

// GET /api/settings - Get business settings for organization
export async function GET(request: NextRequest) {
  try {
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    const { data: settings, error } = await supabase
      .from('BusinessSettings')
      .select('*')
      .eq('organizationId', organizationId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // Return default settings if none exist
    if (!settings) {
      return NextResponse.json({
        id: null,
        organizationId,
        ...DEFAULT_SETTINGS,
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// POST /api/settings - Create or update settings for organization
export async function POST(request: NextRequest) {
  try {
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const body = await request.json();

    // Check if settings exist for this organization
    const { data: existingSettings } = await supabase
      .from('BusinessSettings')
      .select('id')
      .eq('organizationId', organizationId)
      .single();

    let result;

    if (existingSettings) {
      // Update existing settings
      const { data, error } = await supabase
        .from('BusinessSettings')
        .update({
          companyName: body.companyName,
          email: body.email,
          phone: body.phone,
          address: body.address,
          city: body.city,
          state: body.state,
          zipCode: body.zipCode,
          website: body.website,
          taxId: body.taxId,
          marketingChannels: body.marketingChannels,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', existingSettings.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new settings
      const { data, error } = await supabase
        .from('BusinessSettings')
        .insert({
          organizationId,
          ...DEFAULT_SETTINGS,
          ...body,
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
