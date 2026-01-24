import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getSubSessionToken, hashPassword, verifyPassword } from '@/lib/auth';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// Helper to get authenticated user and subcontractor
async function getAuthenticatedSubcontractor() {
  const sessionToken = await getSubSessionToken();

  if (!sessionToken) {
    return { error: 'Nao autenticado', status: 401 };
  }

  const supabase = createServerSupabaseClient();

  // Get session first
  const { data: session, error: sessionError } = await supabase
    .from('Session')
    .select('*')
    .eq('token', sessionToken)
    .single();

  if (sessionError || !session) {
    return { error: 'Sessao invalida', status: 401 };
  }

  // Check if session expired
  if (new Date(session.expiresAt) < new Date()) {
    return { error: 'Sessao expirada', status: 401 };
  }

  // Get user separately
  const { data: user, error: userError } = await supabase
    .from('User')
    .select('*')
    .eq('id', session.userId)
    .single();

  if (userError || !user) {
    return { error: 'Usuario nao encontrado', status: 401 };
  }

  if (user.role !== 'subcontractor') {
    return { error: 'Acesso nao autorizado', status: 403 };
  }

  // Get subcontractor data
  const { data: subcontractor } = await supabase
    .from('Subcontractor')
    .select('*')
    .eq('userId', user.id)
    .single();

  if (!subcontractor) {
    return { error: 'Subempreiteiro nao encontrado', status: 404 };
  }

  return { user, subcontractor, supabase };
}

// GET - Get full profile data
export async function GET() {
  try {
    const auth = await getAuthenticatedSubcontractor();

    if ('error' in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status, headers: corsHeaders }
      );
    }

    const { user, subcontractor } = auth;

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
      subcontractor: {
        id: subcontractor.id,
        companyName: subcontractor.companyName,
        address: subcontractor.address,
        city: subcontractor.city,
        state: subcontractor.state,
        zipCode: subcontractor.zipCode,
        profileImageUrl: subcontractor.profileImageUrl,
        phone: subcontractor.phone,
        // Compliance fields
        licenseNumber: subcontractor.licenseNumber,
        licenseExpirationDate: subcontractor.licenseExpirationDate,
        licenseImageUrl: subcontractor.licenseImageUrl,
        insuranceNumber: subcontractor.insuranceNumber,
        insuranceExpirationDate: subcontractor.insuranceExpirationDate,
        insuranceImageUrl: subcontractor.insuranceImageUrl,
        // Compliance tracking
        complianceUpdatedBy: subcontractor.complianceUpdatedBy,
        complianceUpdatedAt: subcontractor.complianceUpdatedAt,
      },
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// PATCH - Update profile
export async function PATCH(request: NextRequest) {
  try {
    const auth = await getAuthenticatedSubcontractor();

    if ('error' in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status, headers: corsHeaders }
      );
    }

    const { user, subcontractor, supabase } = auth;

    const body = await request.json();
    const { name, phone, companyName, address, city, state, zipCode, profileImageUrl } = body;

    // Compliance fields list for validation and tracking
    const complianceFields = [
      'licenseNumber', 'licenseExpirationDate', 'licenseImageUrl',
      'insuranceNumber', 'insuranceExpirationDate', 'insuranceImageUrl'
    ];

    // Validate no clearing of existing compliance values
    for (const field of complianceFields) {
      const fieldKey = field as keyof typeof body;
      const subKey = field as keyof typeof subcontractor;
      if (body[fieldKey] !== undefined && body[fieldKey] === '' && subcontractor[subKey]) {
        return NextResponse.json(
          { error: 'Campos de compliance nao podem ser apagados, apenas atualizados' },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    // Check if any compliance field is being updated
    const isUpdatingCompliance = complianceFields.some(field => body[field] !== undefined);

    // Update User name and phone
    if (name || phone !== undefined) {
      const userUpdate: Record<string, string | null> = {};
      if (name) userUpdate.name = name;
      if (phone !== undefined) userUpdate.phone = phone;

      await supabase
        .from('User')
        .update(userUpdate)
        .eq('id', user.id);
    }

    // Update Subcontractor fields
    const subUpdate: Record<string, string | null> = {};
    if (companyName !== undefined) subUpdate.companyName = companyName;
    if (address !== undefined) subUpdate.address = address;
    if (city !== undefined) subUpdate.city = city;
    if (state !== undefined) subUpdate.state = state;
    if (zipCode !== undefined) subUpdate.zipCode = zipCode;
    if (profileImageUrl !== undefined) subUpdate.profileImageUrl = profileImageUrl;
    if (phone !== undefined) subUpdate.phone = phone;
    // Compliance fields (sub can update their own license/insurance)
    if (body.licenseNumber !== undefined) subUpdate.licenseNumber = body.licenseNumber;
    if (body.licenseExpirationDate !== undefined) subUpdate.licenseExpirationDate = body.licenseExpirationDate;
    if (body.licenseImageUrl !== undefined) subUpdate.licenseImageUrl = body.licenseImageUrl;
    if (body.insuranceNumber !== undefined) subUpdate.insuranceNumber = body.insuranceNumber;
    if (body.insuranceExpirationDate !== undefined) subUpdate.insuranceExpirationDate = body.insuranceExpirationDate;
    if (body.insuranceImageUrl !== undefined) subUpdate.insuranceImageUrl = body.insuranceImageUrl;

    // Set tracking fields if compliance is being updated
    if (isUpdatingCompliance) {
      subUpdate.complianceUpdatedBy = 'sub';
      subUpdate.complianceUpdatedAt = new Date().toISOString();
    }

    if (Object.keys(subUpdate).length > 0) {
      await supabase
        .from('Subcontractor')
        .update(subUpdate)
        .eq('id', subcontractor.id);
    }

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST - Change password
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedSubcontractor();

    if ('error' in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status, headers: corsHeaders }
      );
    }

    const { user, supabase } = auth;

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Senha atual e nova senha sao obrigatorias' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Nova senha deve ter pelo menos 6 caracteres' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Verify current password
    const isValidPassword = verifyPassword(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Senha atual incorreta' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Hash new password
    const newPasswordHash = hashPassword(newPassword);

    // Update password
    await supabase
      .from('User')
      .update({ passwordHash: newPasswordHash })
      .eq('id', user.id);

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500, headers: corsHeaders }
    );
  }
}
