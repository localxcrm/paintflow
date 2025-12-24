import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getOrganizationIdFromRequest } from '@/lib/supabase-server';

// GET /api/os-templates - List all templates for organization
export async function GET(request: NextRequest) {
  try {
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    const { data: templates, error } = await supabase
      .from('OSTemplate')
      .select('*')
      .eq('organizationId', organizationId)
      .order('isDefault', { ascending: false })
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({ templates: templates || [] });
  } catch (error) {
    console.error('Error fetching OS templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST /api/os-templates - Create a new template
export async function POST(request: NextRequest) {
  try {
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json({ error: 'Template name is required' }, { status: 400 });
    }

    // If this template is set as default, unset other defaults
    if (body.isDefault) {
      await supabase
        .from('OSTemplate')
        .update({ isDefault: false })
        .eq('organizationId', organizationId)
        .eq('isDefault', true);
    }

    const { data: template, error } = await supabase
      .from('OSTemplate')
      .insert({
        organizationId,
        name: body.name,
        description: body.description || null,
        rooms: body.rooms || [],
        tasks: body.tasks || [],
        materials: body.materials || [],
        estimatedDuration: body.estimatedDuration || null,
        isDefault: body.isDefault || false,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Template with this name already exists' },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Error creating OS template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
