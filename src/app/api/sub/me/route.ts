import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getSubSessionToken } from '@/lib/auth';
import { cookies } from 'next/headers';

const SUB_SESSION_COOKIE = 'paintpro_sub_session';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    const sessionToken = await getSubSessionToken();

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401, headers: corsHeaders }
      );
    }

    const supabase = createServerSupabaseClient();

    // Get session first
    const { data: session, error: sessionError } = await supabase
      .from('Session')
      .select('*')
      .eq('token', sessionToken)
      .single();

    if (sessionError || !session) {
      console.log('Session not found for token:', sessionToken?.substring(0, 10) + '...');
      return NextResponse.json(
        { error: 'Sessão inválida' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Check if session expired
    if (new Date(session.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'Sessão expirada' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Get user separately (more reliable than join)
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('*')
      .eq('id', session.userId)
      .single();

    if (userError || !user) {
      console.error('User not found for session:', { sessionId: session.id, userId: session.userId, error: userError });
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 401, headers: corsHeaders }
      );
    }

    if (user.role !== 'subcontractor') {
      return NextResponse.json(
        { error: 'Acesso não autorizado' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Get subcontractor data
    const { data: subcontractor } = await supabase
      .from('Subcontractor')
      .select('*, Organization(id, name, logoUrl)')
      .eq('userId', user.id)
      .single();

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      subcontractor: subcontractor || null,
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Get subcontractor me error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dados' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Logout
export async function DELETE() {
  try {
    const sessionToken = await getSubSessionToken();

    if (sessionToken) {
      const supabase = createServerSupabaseClient();

      // Delete session from database
      await supabase
        .from('Session')
        .delete()
        .eq('token', sessionToken);
    }

    // Clear cookie if it exists
    const cookieStore = await cookies();
    if (cookieStore.get(SUB_SESSION_COOKIE)) {
      cookieStore.delete(SUB_SESSION_COOKIE);
    }

    return NextResponse.json({ message: 'Logout realizado' }, { headers: corsHeaders });
  } catch (error) {
    console.error('Subcontractor logout error:', error);
    return NextResponse.json(
      { error: 'Erro ao fazer logout' },
      { status: 500, headers: corsHeaders }
    );
  }
}
