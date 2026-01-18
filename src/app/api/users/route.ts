import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getOrganizationIdFromRequest } from '@/lib/supabase-server';
import { hashPassword, getCurrentUser } from '@/lib/auth';
import type { User } from '@/types/database';

// GET /api/users - Get all users in organization
export async function GET(request: NextRequest) {
  try {
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Get all users linked to this organization
    const { data: userOrgs, error } = await supabase
      .from('UserOrganization')
      .select(`
        role,
        isDefault,
        User:userId (
          id,
          email,
          name,
          role,
          isActive,
          lastLoginAt,
          createdAt
        )
      `)
      .eq('organizationId', organizationId);

    if (error) {
      throw error;
    }

    // Transform data to flat structure
    const users = userOrgs?.map((uo: any) => ({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(uo.User as any),
      orgRole: uo.role,
      isDefault: uo.isDefault,
    })) || [];

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a new user (admin only)
export async function POST(request: NextRequest) {
  try {
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    // Check if current user is admin/owner
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();

    // Check user's role in organization
    const { data: userOrg } = await supabase
      .from('UserOrganization')
      .select('role')
      .eq('userId', currentUser.id)
      .eq('organizationId', organizationId)
      .single();

    if (!userOrg || (userOrg.role !== 'owner' && userOrg.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Only admins can create users' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, password, role = 'user' } = body;

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('User')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      );
    }

    // Create user
    const { data: newUser, error: createError } = await supabase
      .from('User')
      .insert({
        email: email.toLowerCase(),
        passwordHash: hashPassword(password),
        name,
        role: role as 'admin' | 'user' | 'viewer',
        isActive: true,
      })
      .select()
      .single();

    if (createError || !newUser) {
      console.error('Error creating user:', createError);
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Link user to organization
    const { error: linkError } = await supabase
      .from('UserOrganization')
      .insert({
        userId: newUser.id,
        organizationId,
        role: role === 'admin' ? 'admin' : 'member',
        isDefault: true,
      });

    if (linkError) {
      // Rollback user creation
      await supabase.from('User').delete().eq('id', newUser.id);
      console.error('Error linking user to organization:', linkError);
      return NextResponse.json(
        { error: 'Failed to add user to organization' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        isActive: newUser.isActive,
      },
      message: 'User created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

// PUT /api/users - Update a user
export async function PUT(request: NextRequest) {
  try {
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();

    // Check user's role in organization
    const { data: userOrg } = await supabase
      .from('UserOrganization')
      .select('role')
      .eq('userId', currentUser.id)
      .eq('organizationId', organizationId)
      .single();

    if (!userOrg || (userOrg.role !== 'owner' && userOrg.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Only admins can update users' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, name, role, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Verify user belongs to organization
    const { data: targetUserOrg } = await supabase
      .from('UserOrganization')
      .select('id')
      .eq('userId', id)
      .eq('organizationId', organizationId)
      .single();

    if (!targetUserOrg) {
      return NextResponse.json(
        { error: 'User not found in organization' },
        { status: 404 }
      );
    }

    // Update user
    const { data: updatedUser, error: updateError } = await supabase
      .from('User')
      .update({
        name,
        role,
        isActive,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      user: updatedUser,
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/users - Deactivate a user
export async function DELETE(request: NextRequest) {
  try {
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();

    // Check user's role in organization
    const { data: userOrg } = await supabase
      .from('UserOrganization')
      .select('role')
      .eq('userId', currentUser.id)
      .eq('organizationId', organizationId)
      .single();

    if (!userOrg || userOrg.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only owners can remove users' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Cannot delete yourself
    if (id === currentUser.id) {
      return NextResponse.json(
        { error: 'Cannot remove yourself' },
        { status: 400 }
      );
    }

    // Remove user from organization (soft delete - just remove link)
    const { error } = await supabase
      .from('UserOrganization')
      .delete()
      .eq('userId', id)
      .eq('organizationId', organizationId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing user:', error);
    return NextResponse.json(
      { error: 'Failed to remove user' },
      { status: 500 }
    );
  }
}
