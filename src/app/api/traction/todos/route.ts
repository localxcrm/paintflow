import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// GET /api/traction/todos - Get all todos
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner');
    const status = searchParams.get('status');

    let query = supabase
      .from('Todo')
      .select('*')
      .order('status', { ascending: true })
      .order('dueDate', { ascending: true });

    if (owner) {
      query = query.eq('owner', owner);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: todos, error } = await query;

    if (error) throw error;

    return NextResponse.json(todos || []);
  } catch (error) {
    console.error('Error fetching todos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch todos' },
      { status: 500 }
    );
  }
}

// POST /api/traction/todos - Create a new todo
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const { data: todo, error } = await supabase
      .from('Todo')
      .insert({
        title: body.title,
        owner: body.owner,
        dueDate: new Date(body.dueDate).toISOString(),
        status: body.status || 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    console.error('Error creating todo:', error);
    return NextResponse.json(
      { error: 'Failed to create todo' },
      { status: 500 }
    );
  }
}
