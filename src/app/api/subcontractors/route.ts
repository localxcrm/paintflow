import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getOrganizationIdFromRequest } from '@/lib/supabase-server';
import { randomBytes } from 'crypto';
import { hashPassword } from '@/lib/auth';

// Generate a unique calendar token
function generateCalendarToken(): string {
  return randomBytes(16).toString('hex');
}

// GET /api/subcontractors - Get all subcontractors
export async function GET(request: NextRequest) {
  try {
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') !== 'false';

    let query = supabase
      .from('Subcontractor')
      .select('*')
      .eq('organizationId', organizationId)
      .order('name', { ascending: true });

    if (activeOnly) {
      query = query.eq('isActive', true);
    }

    const { data: subcontractors, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ subcontractors: subcontractors || [] });
  } catch (error) {
    console.error('Error fetching subcontractors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subcontractors' },
      { status: 500 }
    );
  }
}

// POST /api/subcontractors - Create a new subcontractor
export async function POST(request: NextRequest) {
  try {
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const body = await request.json();

    let userId = null;

    // If app access is enabled, create a User account
    if (body.enableAppAccess && body.email && body.password) {
      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('User')
        .select('id')
        .eq('email', body.email)
        .single();

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email já está em uso' },
          { status: 400 }
        );
      }

      // Create User with subcontractor role
      const { data: newUser, error: userError } = await supabase
        .from('User')
        .insert({
          email: body.email,
          name: body.name,
          passwordHash: hashPassword(body.password),
          role: 'subcontractor',
        })
        .select('id')
        .single();

      if (userError) {
        console.error('Error creating user:', userError);
        return NextResponse.json(
          { error: 'Erro ao criar usuário para o app' },
          { status: 500 }
        );
      }

      userId = newUser.id;
      console.log('Created user for subcontractor:', {
        userId: newUser.id,
        email: body.email,
        hashFormat: 'sha256',
      });
    } else {
      console.log('Subcontractor created without app access:', {
        enableAppAccess: body.enableAppAccess,
        hasEmail: !!body.email,
        hasPassword: !!body.password,
      });
    }

    const { data: subcontractor, error } = await supabase
      .from('Subcontractor')
      .insert({
        organizationId,
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        specialty: body.specialty || 'both',
        defaultPayoutPct: body.defaultPayoutPct || 60,
        color: body.color || '#10B981',
        isActive: body.isActive !== false,
        calendarToken: generateCalendarToken(),
        userId: userId,
      })
      .select()
      .single();

    if (error) {
      // If subcontractor creation fails, delete the user we just created
      if (userId) {
        await supabase.from('User').delete().eq('id', userId);
      }
      throw error;
    }

    return NextResponse.json(subcontractor, { status: 201 });
  } catch (error) {
    console.error('Error creating subcontractor:', error);
    return NextResponse.json(
      { error: 'Failed to create subcontractor' },
      { status: 500 }
    );
  }
}

// PUT /api/subcontractors - Update a subcontractor
export async function PUT(request: NextRequest) {
  try {
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: 'Subcontractor ID is required' },
        { status: 400 }
      );
    }

    // Get current subcontractor
    const { data: currentSub } = await supabase
      .from('Subcontractor')
      .select('userId')
      .eq('id', body.id)
      .eq('organizationId', organizationId)
      .single();

    let userId = currentSub?.userId;

    // Handle app access changes
    if (body.enableAppAccess && body.email) {
      if (!userId && body.password) {
        // Create new user for app access
        const { data: existingUser } = await supabase
          .from('User')
          .select('id')
          .eq('email', body.email)
          .single();

        if (existingUser) {
          return NextResponse.json(
            { error: 'Email já está em uso por outro usuário' },
            { status: 400 }
          );
        }

        const { data: newUser, error: userError } = await supabase
          .from('User')
          .insert({
            email: body.email,
            name: body.name,
            passwordHash: hashPassword(body.password),
            role: 'subcontractor',
          })
          .select('id')
          .single();

        if (userError) {
          console.error('Error creating user:', userError);
          return NextResponse.json(
            { error: 'Erro ao criar usuário para o app' },
            { status: 500 }
          );
        }

        userId = newUser.id;
      } else if (userId && body.password) {
        // Update password for existing user
        await supabase
          .from('User')
          .update({
            passwordHash: hashPassword(body.password),
            updatedAt: new Date().toISOString(),
          })
          .eq('id', userId);
      }

      // Update user email/name if changed
      if (userId) {
        await supabase
          .from('User')
          .update({
            email: body.email,
            name: body.name,
            updatedAt: new Date().toISOString(),
          })
          .eq('id', userId);
      }
    }

    const { data: subcontractor, error } = await supabase
      .from('Subcontractor')
      .update({
        name: body.name,
        email: body.email,
        phone: body.phone,
        specialty: body.specialty,
        defaultPayoutPct: body.defaultPayoutPct,
        color: body.color,
        isActive: body.isActive,
        userId: userId,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', body.id)
      .eq('organizationId', organizationId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(subcontractor);
  } catch (error) {
    console.error('Error updating subcontractor:', error);
    return NextResponse.json(
      { error: 'Failed to update subcontractor' },
      { status: 500 }
    );
  }
}

// DELETE /api/subcontractors - Delete a subcontractor
export async function DELETE(request: NextRequest) {
  try {
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Subcontractor ID is required' },
        { status: 400 }
      );
    }

    // Get the subcontractor to check if it has a linked user
    const { data: sub } = await supabase
      .from('Subcontractor')
      .select('userId')
      .eq('id', id)
      .eq('organizationId', organizationId)
      .single();

    const { error } = await supabase
      .from('Subcontractor')
      .delete()
      .eq('id', id)
      .eq('organizationId', organizationId);

    if (error) {
      throw error;
    }

    // Also delete the linked user if exists
    if (sub?.userId) {
      await supabase.from('User').delete().eq('id', sub.userId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting subcontractor:', error);
    return NextResponse.json(
      { error: 'Failed to delete subcontractor' },
      { status: 500 }
    );
  }
}
