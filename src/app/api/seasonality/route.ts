// Seasonality API - Monthly distribution percentages
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import type { Seasonality, SeasonalityInsert, SeasonalityUpdate } from '@/types/database';

// Default equal distribution
const DEFAULT_SEASONALITY = {
  january: 8.33,
  february: 8.33,
  march: 8.33,
  april: 8.33,
  may: 8.33,
  june: 8.33,
  july: 8.33,
  august: 8.33,
  september: 8.33,
  october: 8.33,
  november: 8.33,
  december: 8.37, // Slightly higher to make 100%
};

// Typical painting business seasonality
const PAINTING_SEASONALITY = {
  january: 5.0,
  february: 6.0,
  march: 8.0,
  april: 10.0,
  may: 11.0,
  june: 12.0,
  july: 12.0,
  august: 11.0,
  september: 10.0,
  october: 8.0,
  november: 4.0,
  december: 3.0,
};

// GET /api/seasonality - Get seasonality for a tenant/year
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const year = searchParams.get('year');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from('Seasonality')
      .select('*')
      .eq('tenantId', tenantId);

    if (year) {
      query = query.eq('year', parseInt(year));
    }

    const { data, error } = await query.order('year', { ascending: false });

    if (error) {
      throw error;
    }

    // If no data and specific year requested, return default
    if ((!data || data.length === 0) && year) {
      return NextResponse.json({
        seasonality: {
          id: null,
          tenantId,
          year: parseInt(year),
          ...DEFAULT_SEASONALITY,
          isDefault: true,
        },
        templates: {
          equal: DEFAULT_SEASONALITY,
          painting: PAINTING_SEASONALITY,
        },
      });
    }

    return NextResponse.json({
      seasonality: data,
      templates: {
        equal: DEFAULT_SEASONALITY,
        painting: PAINTING_SEASONALITY,
      },
    });

  } catch (error) {
    console.error('[Seasonality] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch seasonality' },
      { status: 500 }
    );
  }
}

// POST /api/seasonality - Create or update seasonality
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      tenantId,
      year,
      template, // 'equal' | 'painting' | 'custom'
      january,
      february,
      march,
      april,
      may,
      june,
      july,
      august,
      september,
      october,
      november,
      december,
    } = body;

    if (!tenantId || !year) {
      return NextResponse.json(
        { error: 'tenantId and year are required' },
        { status: 400 }
      );
    }

    // Apply template if specified
    let monthlyValues;

    if (template === 'equal') {
      monthlyValues = DEFAULT_SEASONALITY;
    } else if (template === 'painting') {
      monthlyValues = PAINTING_SEASONALITY;
    } else {
      monthlyValues = {
        january: january ?? DEFAULT_SEASONALITY.january,
        february: february ?? DEFAULT_SEASONALITY.february,
        march: march ?? DEFAULT_SEASONALITY.march,
        april: april ?? DEFAULT_SEASONALITY.april,
        may: may ?? DEFAULT_SEASONALITY.may,
        june: june ?? DEFAULT_SEASONALITY.june,
        july: july ?? DEFAULT_SEASONALITY.july,
        august: august ?? DEFAULT_SEASONALITY.august,
        september: september ?? DEFAULT_SEASONALITY.september,
        october: october ?? DEFAULT_SEASONALITY.october,
        november: november ?? DEFAULT_SEASONALITY.november,
        december: december ?? DEFAULT_SEASONALITY.december,
      };
    }

    // Validate that percentages sum to ~100%
    const total = Object.values(monthlyValues).reduce((sum, val) => sum + val, 0);
    if (Math.abs(total - 100) > 1) {
      return NextResponse.json(
        { error: `Monthly percentages must sum to 100% (current: ${total.toFixed(2)}%)` },
        { status: 400 }
      );
    }

    const seasonalityData: SeasonalityInsert = {
      tenantId,
      year,
      ...monthlyValues,
    };

    const { data, error } = await supabaseAdmin
      .from('Seasonality')
      .upsert(seasonalityData, {
        onConflict: 'tenantId,year',
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ seasonality: data });

  } catch (error) {
    console.error('[Seasonality] Create error:', error);
    return NextResponse.json(
      { error: 'Failed to save seasonality' },
      { status: 500 }
    );
  }
}

// DELETE /api/seasonality - Delete seasonality (revert to default)
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Seasonality id is required' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('Seasonality')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[Seasonality] Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete seasonality' },
      { status: 500 }
    );
  }
}
