import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/traction/todos - Get all todos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};

    if (owner) {
      where.owner = owner;
    }

    if (status) {
      where.status = status;
    }

    const todos = await prisma.todo.findMany({
      where,
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
    });

    return NextResponse.json(todos);
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
    const body = await request.json();

    const todo = await prisma.todo.create({
      data: {
        title: body.title,
        owner: body.owner,
        dueDate: new Date(body.dueDate),
        status: body.status || 'pending',
      },
    });

    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    console.error('Error creating todo:', error);
    return NextResponse.json(
      { error: 'Failed to create todo' },
      { status: 500 }
    );
  }
}
