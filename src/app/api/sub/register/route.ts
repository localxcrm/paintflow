import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { hashPassword, createSession } from '@/lib/auth';
import { cookies } from 'next/headers';

const SUB_SESSION_COOKIE = 'paintpro_sub_session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, phone, organizationId } = body;

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Nome, email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('User')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está cadastrado' },
        { status: 409 }
      );
    }

    // Check if there's an existing subcontractor with this email (invited but not registered)
    const { data: existingSub } = await supabase
      .from('Subcontractor')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    // Create user with subcontractor role
    const { data: user, error: userError } = await supabase
      .from('User')
      .insert({
        email: email.toLowerCase(),
        name,
        passwordHash: hashPassword(password),
        role: 'subcontractor',
        isActive: true,
      })
      .select()
      .single();

    if (userError || !user) {
      console.error('Error creating user:', userError);
      return NextResponse.json(
        { error: 'Erro ao criar usuário' },
        { status: 500 }
      );
    }

    // If subcontractor already exists (was invited), link to user
    // Otherwise create new subcontractor
    let subcontractor;

    if (existingSub) {
      // Update existing subcontractor with userId
      const { data: updatedSub, error: updateError } = await supabase
        .from('Subcontractor')
        .update({
          userId: user.id,
          name: name, // Update name if different
          phone: phone || existingSub.phone,
        })
        .eq('id', existingSub.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating subcontractor:', updateError);
      }
      subcontractor = updatedSub;
    } else if (organizationId) {
      // Create new subcontractor linked to organization
      const { data: newSub, error: subError } = await supabase
        .from('Subcontractor')
        .insert({
          organizationId,
          userId: user.id,
          name,
          email: email.toLowerCase(),
          phone: phone || null,
          specialty: 'both',
          defaultPayoutPct: 60,
          isActive: true,
        })
        .select()
        .single();

      if (subError) {
        console.error('Error creating subcontractor:', subError);
      }
      subcontractor = newSub;
    }

    // Create session
    const session = await createSession(user.id);

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set(SUB_SESSION_COOKIE, session.token, {
      httpOnly: true,
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
        role: user.role,
      },
      subcontractor: subcontractor || null,
      message: 'Cadastro realizado com sucesso',
    }, { status: 201 });
  } catch (error) {
    console.error('Subcontractor register error:', error);
    return NextResponse.json(
      { error: 'Erro ao cadastrar' },
      { status: 500 }
    );
  }
}
