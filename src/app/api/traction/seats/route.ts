import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// GET /api/traction/seats - Get all seats (accountability chart)
export async function GET() {
  try {
    const supabase = createServerSupabaseClient();

    const { data: seats, error } = await supabase
      .from('Seat')
      .select('*')
      .order('seatName', { ascending: true });

    if (error) throw error;

    // For each seat, fetch related seats (reportsTo and directReports)
    const seatsWithRelations = await Promise.all(
      (seats || []).map(async (seat) => {
        let reportsTo = null;
        let directReports: typeof seats = [];

        // Fetch reportsTo seat
        if (seat.reportsToId) {
          const { data: reportsToSeat } = await supabase
            .from('Seat')
            .select('*')
            .eq('id', seat.reportsToId)
            .single();
          reportsTo = reportsToSeat;
        }

        // Fetch direct reports
        const { data: reports } = await supabase
          .from('Seat')
          .select('*')
          .eq('reportsToId', seat.id);
        directReports = reports || [];

        return {
          ...seat,
          reportsTo,
          directReports,
        };
      })
    );

    return NextResponse.json(seatsWithRelations);
  } catch (error) {
    console.error('Error fetching seats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch seats' },
      { status: 500 }
    );
  }
}

// POST /api/traction/seats - Create a new seat
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const { data: seat, error } = await supabase
      .from('Seat')
      .insert({
        seatName: body.seatName,
        roleDescription: body.roleDescription,
        responsibilities: body.responsibilities || [],
        personName: body.personName,
        personId: body.personId,
        reportsToId: body.reportsToId,
        gwcGetsIt: body.gwcGetsIt ?? true,
        gwcWantsIt: body.gwcWantsIt ?? true,
        gwcCapacity: body.gwcCapacity ?? true,
        isRightPersonRightSeat: body.isRightPersonRightSeat ?? true,
      })
      .select()
      .single();

    if (error) throw error;

    // Fetch related seats
    let reportsTo = null;
    if (seat.reportsToId) {
      const { data: reportsToSeat } = await supabase
        .from('Seat')
        .select('*')
        .eq('id', seat.reportsToId)
        .single();
      reportsTo = reportsToSeat;
    }

    const { data: directReports } = await supabase
      .from('Seat')
      .select('*')
      .eq('reportsToId', seat.id);

    return NextResponse.json(
      {
        ...seat,
        reportsTo,
        directReports: directReports || [],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating seat:', error);
    return NextResponse.json(
      { error: 'Failed to create seat' },
      { status: 500 }
    );
  }
}
