import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/overhead - Get overhead expenses with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear();
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : null;
    const category = searchParams.get('category');

    const where: Record<string, unknown> = { year };

    if (month) {
      where.month = month;
    }

    if (category) {
      where.category = category;
    }

    const [expenses, categoryTotals, monthlyTotals] = await Promise.all([
      prisma.overheadExpense.findMany({
        where,
        orderBy: [{ month: 'asc' }, { category: 'asc' }],
      }),
      prisma.overheadExpense.groupBy({
        by: ['category'],
        where: { year },
        _sum: { amount: true },
      }),
      prisma.overheadExpense.groupBy({
        by: ['month'],
        where: { year },
        _sum: { amount: true },
      }),
    ]);

    const totalByCategory = categoryTotals.reduce((acc, item) => {
      acc[item.category] = item._sum.amount || 0;
      return acc;
    }, {} as Record<string, number>);

    const totalByMonth = monthlyTotals.reduce((acc, item) => {
      acc[item.month] = item._sum.amount || 0;
      return acc;
    }, {} as Record<number, number>);

    const grandTotal = Object.values(totalByCategory).reduce((sum, val) => sum + val, 0);

    return NextResponse.json({
      expenses,
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
    const body = await request.json();

    const expense = await prisma.overheadExpense.create({
      data: {
        category: body.category,
        name: body.name,
        amount: body.amount,
        month: body.month,
        year: body.year,
        isRecurring: body.isRecurring ?? true,
        notes: body.notes,
      },
    });

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
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const expense = await prisma.overheadExpense.update({
      where: { id: body.id },
      data: {
        category: body.category,
        name: body.name,
        amount: body.amount,
        month: body.month,
        year: body.year,
        isRecurring: body.isRecurring,
        notes: body.notes,
      },
    });

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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    await prisma.overheadExpense.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting overhead expense:', error);
    return NextResponse.json(
      { error: 'Failed to delete overhead expense' },
      { status: 500 }
    );
  }
}
