import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// POST /api/estimates/[id]/signature - Add signature to estimate
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { id } = await params;
    const body = await request.json();

    // Check if estimate exists
    const { data: estimate, error: estimateError } = await supabase
      .from('Estimate')
      .select('*, EstimateSignature(*)')
      .eq('id', id)
      .single();

    if (estimateError || !estimate) {
      return NextResponse.json(
        { error: 'Estimate not found' },
        { status: 404 }
      );
    }

    const ipAddress = body.ipAddress || request.headers.get('x-forwarded-for') || 'unknown';

    // If signature already exists, update it
    if (estimate.EstimateSignature && estimate.EstimateSignature.length > 0) {
      const { data: signature, error: updateError } = await supabase
        .from('EstimateSignature')
        .update({
          clientName: body.clientName,
          signatureDataUrl: body.signatureDataUrl,
          signedAt: new Date().toISOString(),
          ipAddress,
        })
        .eq('estimateId', id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Update estimate status to accepted
      await supabase
        .from('Estimate')
        .update({ status: 'accepted', updatedAt: new Date().toISOString() })
        .eq('id', id);

      return NextResponse.json(signature);
    }

    // Create new signature
    const { data: signature, error: createError } = await supabase
      .from('EstimateSignature')
      .insert({
        estimateId: id,
        clientName: body.clientName,
        signatureDataUrl: body.signatureDataUrl,
        ipAddress,
      })
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    // Update estimate status to accepted
    await supabase
      .from('Estimate')
      .update({ status: 'accepted', updatedAt: new Date().toISOString() })
      .eq('id', id);

    return NextResponse.json(signature, { status: 201 });
  } catch (error) {
    console.error('Error adding signature:', error);
    return NextResponse.json(
      { error: 'Failed to add signature' },
      { status: 500 }
    );
  }
}

// GET /api/estimates/[id]/signature - Get signature for estimate
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { id } = await params;

    const { data: signature, error } = await supabase
      .from('EstimateSignature')
      .select('*')
      .eq('estimateId', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Signature not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json(signature);
  } catch (error) {
    console.error('Error fetching signature:', error);
    return NextResponse.json(
      { error: 'Failed to fetch signature' },
      { status: 500 }
    );
  }
}
