import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getSubSessionToken } from '@/lib/auth';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const sessionToken = await getSubSessionToken();

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401, headers: corsHeaders }
      );
    }

    const supabase = createServerSupabaseClient();

    // Get session and verify subcontractor
    const { data: session } = await supabase
      .from('Session')
      .select('*, User(*)')
      .eq('token', sessionToken)
      .single();

    if (!session || !session.User || session.User.role !== 'subcontractor') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403, headers: corsHeaders }
      );
    }

    const { data: subcontractor } = await supabase
      .from('Subcontractor')
      .select('id, organizationId')
      .eq('userId', session.User.id)
      .single();

    if (!subcontractor) {
      return NextResponse.json(
        { error: 'Subempreiteiro não encontrado' },
        { status: 404, headers: corsHeaders }
      );
    }

    const { jobId } = await params;

    // Verify job belongs to this subcontractor
    const { data: payout } = await supabase
      .from('SubcontractorPayout')
      .select('id')
      .eq('jobId', jobId)
      .eq('subcontractorId', subcontractor.id)
      .single();

    if (!payout) {
      return NextResponse.json(
        { error: 'Job não pertence a este subempreiteiro' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Get material cost
    const { data: materialCost } = await supabase
      .from('JobMaterialCost')
      .select('*')
      .eq('jobId', jobId)
      .eq('subcontractorId', subcontractor.id)
      .single();

    return NextResponse.json(
      { materialCost: materialCost || null },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Get material cost error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar custo de materiais' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const sessionToken = await getSubSessionToken();

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401, headers: corsHeaders }
      );
    }

    const supabase = createServerSupabaseClient();

    // Get session and verify subcontractor
    const { data: session } = await supabase
      .from('Session')
      .select('*, User(*)')
      .eq('token', sessionToken)
      .single();

    if (!session || !session.User || session.User.role !== 'subcontractor') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403, headers: corsHeaders }
      );
    }

    const { data: subcontractor } = await supabase
      .from('Subcontractor')
      .select('id, organizationId')
      .eq('userId', session.User.id)
      .single();

    if (!subcontractor) {
      return NextResponse.json(
        { error: 'Subempreiteiro não encontrado' },
        { status: 404, headers: corsHeaders }
      );
    }

    const { jobId } = await params;

    // Verify job belongs to this subcontractor
    const { data: payout } = await supabase
      .from('SubcontractorPayout')
      .select('id')
      .eq('jobId', jobId)
      .eq('subcontractorId', subcontractor.id)
      .single();

    if (!payout) {
      return NextResponse.json(
        { error: 'Job não pertence a este subempreiteiro' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Parse request body
    const body = await request.json();
    const { totalCost, notes } = body;

    // Validate totalCost
    if (totalCost === undefined || typeof totalCost !== 'number' || totalCost < 0) {
      return NextResponse.json(
        { error: 'Custo total deve ser um número maior ou igual a zero' },
        { status: 400, headers: corsHeaders }
      );
    }

    // UPSERT material cost
    const { data: materialCost, error } = await supabase
      .from('JobMaterialCost')
      .upsert(
        {
          jobId,
          subcontractorId: subcontractor.id,
          organizationId: subcontractor.organizationId,
          totalCost,
          notes: notes || null,
        },
        {
          onConflict: 'jobId,subcontractorId',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error upserting material cost:', error);
      return NextResponse.json(
        { error: 'Erro ao salvar custo de materiais' },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { materialCost },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Update material cost error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar custo de materiais' },
      { status: 500, headers: corsHeaders }
    );
  }
}
