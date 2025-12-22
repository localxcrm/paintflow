import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// GET /api/overhead - Get overhead expenses with optional filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear();
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : null;
    const category = searchParams.get('category');

    let query = supabase
      .from('OverheadExpense')
      .select('*')
      .eq('year', year)
      .order('month', { ascending: true })
      .order('category', { ascending: true });

    if (month) {
      query = query.eq('month', month);
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data: expenses, error } = await query;
    if (error) throw error;

    // Calculate totals by category
    const totalByCategory = (expenses || []).reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.amount;
      return acc;
    }, {} as Record<string, number>);

    // Calculate totals by month
    const totalByMonth = (expenses || []).reduce((acc, item) => {
      acc[item.month] = (acc[item.month] || 0) + item.amount;
      return acc;
    }, {} as Record<number, number>);

    const grandTotal = (Object.values(totalByCategory) as number[]).reduce((sum, val) => sum + val, 0);

    return NextResponse.json({
      expenses: expenses || [],
      totalByCategory,
      totalByMonth,
      grandTotal,
      year,
    });
  } catch (error) {
    console.error('Error fetching overhead expenses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch overhead expenses' },
      { status: 500 }
    );
  }
}

// POST /api/overhead - Create overhead expense
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const { data: expense, error } = await supabase
      .from('OverheadExpense')
      .insert({
        category: body.category,
        name: body.name,
        amount: body.amount,
        month: body.month,
        year: body.year,
        isRecurring: body.isRecurring ?? true,
        notes: body.notes,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error('Error creating overhead expense:', error);
    return NextResponse.json(
      { error: 'Failed to create overhead expense' },
      { status: 500 }
    );
  }
}

// PUT /api/overhead - Update overhead expense
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const { data: expense, error } = await supabase
      .from('OverheadExpense')
      .update({
        category: body.category,
        name: body.name,
        amount: body.amount,
        month: body.month,
        year: body.year,
        isRecurring: body.isRecurring,
        notes: body.notes,
      })
      .eq('id', body.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(expense);
  } catch (error) {
    console.error('Error updating overhead expense:', error);
    return NextResponse.json(
      { error: 'Failed to update overhead expense' },
      { status: 500 }
    );
  }
}

// DELETE /api/overhead - Delete overhead expense
export async function DELETE(request: NextRequest) {
  try {
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
      .from('OverheadExpense')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting overhead expense:', error);
    return NextResponse.json(
      { error: 'Failed to delete overhead expense' },
      { status: 500 }
    );
  }
}
