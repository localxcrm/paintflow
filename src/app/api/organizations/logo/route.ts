import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getOrganizationIdFromRequest } from '@/lib/supabase-server';

// PATCH /api/organizations/logo - Update organization logo
export async function PATCH(request: NextRequest) {
  try {
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const body = await request.json();
    const { logo } = body;

    // Update organization logo
    const { data: organization, error } = await supabase
      .from('Organization')
      .update({
        logo: logo || null,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', organizationId)
      .select('id, name, logo')
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      organization,
      message: 'Logo updated successfully',
    });
  } catch (error) {
    console.error('Error updating logo:', error);
    return NextResponse.json(
      { error: 'Failed to update logo' },
      { status: 500 }
    );
  }
}
