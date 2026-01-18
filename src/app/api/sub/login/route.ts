import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { verifyPassword, createSession } from '@/lib/auth';
import { cookies } from 'next/headers';

const SUB_SESSION_COOKIE = 'paintpro_sub_session';

// Restrict CORS to allowed origins
const getAllowedOrigin = (requestOrigin: string | null) => {
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    'capacitor://localhost', // iOS app
    'http://localhost',      // iOS app alternate
    'http://localhost:3000', // Development
  ].filter(Boolean);

  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }
  // Default to app URL or first allowed origin
  return process.env.NEXT_PUBLIC_APP_URL || allowedOrigins[0] || '';
};

const getCorsHeaders = (request: NextRequest) => ({
  'Access-Control-Allow-Origin': getAllowedOrigin(request.headers.get('origin')),
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
});

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: getCorsHeaders(request) });
}

export async function POST(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request);

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = createServerSupabaseClient();
    const normalizedEmail = email.toLowerCase().trim();

    // Find user by email (try both exact and lowercase)
    let { data: user, error: userError } = await supabase
      .from('User')
      .select('*')
      .eq('email', normalizedEmail)
      .single();

    // If not found, try with original email (case-sensitive)
    if (userError || !user) {
      const result = await supabase
        .from('User')
        .select('*')
        .ilike('email', normalizedEmail)
        .single();
      user = result.data;
      userError = result.error;
    }

    if (userError || !user) {
      console.log('User not found for email:', normalizedEmail);
      return NextResponse.json(
        { error: 'Email ou senha inválidos' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Check if user is a subcontractor
    if (user.role !== 'subcontractor') {
      console.log('User role is not subcontractor:', user.role);
      return NextResponse.json(
        { error: 'Acesso não autorizado. Use o login principal.' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Check if user is active
    if (user.isActive === false) {
      return NextResponse.json(
        { error: 'Conta desativada. Entre em contato com a empresa.' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Verify password
    console.log('Login attempt details:', {
      email: normalizedEmail,
      userId: user.id,
      role: user.role,
      hashFormat: user.passwordHash?.startsWith('sha256:') ? 'sha256' :
                  user.passwordHash?.startsWith('pp_') ? 'legacy' : 'unknown',
      hashLength: user.passwordHash?.length,
    });

    const passwordValid = verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      console.log('Password verification FAILED for:', normalizedEmail);
      console.log('Stored hash prefix:', user.passwordHash?.substring(0, 20) + '...');
      return NextResponse.json(
        { error: 'Email ou senha inválidos' },
        { status: 401, headers: corsHeaders }
      );
    }

    console.log('Password verification SUCCESS for:', normalizedEmail);

    // Get subcontractor data
    const { data: subcontractor } = await supabase
      .from('Subcontractor')
      .select('*')
      .eq('userId', user.id)
      .single();

    // Update last login
    await supabase
      .from('User')
      .update({ lastLoginAt: new Date().toISOString() })
      .eq('id', user.id);

    // Create session (subcontractors don't belong to organizations in the same way)
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
      session: { token: session.token },
      message: 'Login realizado com sucesso',
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Subcontractor login error:', error);
    return NextResponse.json(
      { error: 'Erro ao fazer login' },
      { status: 500, headers: corsHeaders }
    );
  }
}
