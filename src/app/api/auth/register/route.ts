import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { hashPassword, createSession, createOrganization } from '@/lib/auth';
import { cookies } from 'next/headers';
import type { User } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, companyName } = body;

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('User')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Create user
    const { data: user, error: createError } = await supabase
      .from('User')
      .insert({
        email: email.toLowerCase(),
        passwordHash: hashPassword(password),
        name,
      })
      .select()
      .single<User>();

    if (createError || !user) {
      console.error('Supabase create user error:', createError);
      return NextResponse.json(
        { error: createError?.message || 'Failed to create user', details: createError },
        { status: 500 }
      );
    }

    // Create organization for user (auto-create on registration)
    const orgName = companyName || `${name}'s Company`;
    const org = await createOrganization(orgName, user.id, email);

    // Create session with organization
    const session = await createSession(user.id, org.id);

    // Set cookies
    const cookieStore = await cookies();

    // Session cookie
    cookieStore.set('paintpro_session', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(session.expiresAt),
      path: '/',
    });

    // Organization cookie
    cookieStore.set('paintpro_org_id', org.id, {
      httpOnly: false, // Allow client-side access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(session.expiresAt),
      path: '/',
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      organization: {
        id: org.id,
        name: orgName,
        slug: org.slug,
        plan: 'free',
        role: 'owner',
      },
      message: 'Account created successfully',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
