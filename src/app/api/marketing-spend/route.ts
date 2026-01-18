import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getOrganizationIdFromRequest } from '@/lib/supabase-server';

// GET /api/marketing-spend - Get marketing spend with optional filtering
export async function GET(request: NextRequest) {
  try {
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear();
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : null;
    const source = searchParams.get('source');

    let query = supabase
      .from('MarketingSpend')
      .select('*')
      .eq('organizationId', organizationId)
      .eq('year', year)
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .order('source', { ascending: true });

    if (month) {
      query = query.eq('month', month);
    }

    if (source) {
      query = query.eq('source', source);
    }

    const { data: spends, error } = await query;
    if (error) throw error;

    // Calculate totals by source
    const totalBySource = (spends || []).reduce((acc: any, item: any) => {
      acc[item.source] = (acc[item.source] || 0) + item.amount;
      return acc;
    }, {} as Record<string, number>);

    const grandTotal = (Object.values(totalBySource) as number[]).reduce((sum: any, val: any) => sum + val, 0);

    return NextResponse.json({
      spends: spends || [],
      totalBySource,
      grandTotal,
      year,
    });
  } catch (error) {
    console.error('Error fetching marketing spend:', error);
    return NextResponse.json(
      { error: 'Failed to fetch marketing spend' },
      { status: 500 }
    );
  }
}

// POST /api/marketing-spend - Create or update marketing spend
export async function POST(request: NextRequest) {
  try {
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const body = await request.json();

    // Check if record exists for this organization
    const { data: existing } = await supabase
      .from('MarketingSpend')
      .select('id')
      .eq('organizationId', organizationId)
      .eq('month', body.month)
      .eq('year', body.year)
      .eq('source', body.source)
      .maybeSingle();

    let result;
    if (existing) {
      const { data, error } = await supabase
        .from('MarketingSpend')
        .update({
          amount: body.amount,
          leads: body.leads || 0,
          notes: body.notes,
        })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from('MarketingSpend')
        .insert({
          organizationId,
          source: body.source,
          amount: body.amount,
          leads: body.leads || 0,
          month: body.month,
          year: body.year,
          notes: body.notes,
        })
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error saving marketing spend:', error);
    return NextResponse.json(
      { error: 'Failed to save marketing spend' },
      { status: 500 }
    );
  }
}

// DELETE /api/marketing-spend - Delete marketing spend
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
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('MarketingSpend')
      .delete()
      .eq('id', id)
      .eq('organizationId', organizationId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting marketing spend:', error);
    return NextResponse.json(
      { error: 'Failed to delete marketing spend' },
      { status: 500 }
    );
  }
}
