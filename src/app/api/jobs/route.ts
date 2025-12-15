import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Helper function to calculate job financials
async function calculateJobFinancials(jobValue: number) {
  const settings = await prisma.businessSettings.findFirst();

  const subPayoutPct = settings?.subPayoutPct || 60;
  const subMaterialsPct = settings?.subMaterialsPct || 15;
  const subLaborPct = settings?.subLaborPct || 45;
  const minGrossProfit = settings?.minGrossProfitPerJob || 900;
  const targetGrossMargin = settings?.targetGrossMarginPct || 40;
  const defaultDepositPct = settings?.defaultDepositPct || 30;

  const subMaterials = jobValue * (subMaterialsPct / 100);
  const subLabor = jobValue * (subLaborPct / 100);
  const subTotal = subMaterials + subLabor;
  const grossProfit = jobValue - subTotal;
  const grossMarginPct = jobValue > 0 ? (grossProfit / jobValue) * 100 : 0;
  const depositRequired = jobValue * (defaultDepositPct / 100);
  const subcontractorPrice = jobValue * (subPayoutPct / 100);

  let profitFlag: 'OK' | 'RAISE_PRICE' | 'FIX_SCOPE' = 'OK';
  if (grossProfit < minGrossProfit) {
    profitFlag = 'RAISE_PRICE';
  } else if (grossMarginPct < targetGrossMargin) {
    profitFlag = 'FIX_SCOPE';
  }

  return {
    subMaterials,
    subLabor,
    subTotal,
    grossProfit,
    grossMarginPct,
    depositRequired,
    balanceDue: jobValue - depositRequired,
    subcontractorPrice,
    meetsMinGp: grossProfit >= minGrossProfit,
    meetsTargetGm: grossMarginPct >= targetGrossMargin,
    profitFlag,
  };
}

// GET /api/jobs - Get all jobs with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const leadId = searchParams.get('leadId');
    const salesRepId = searchParams.get('salesRepId');
    const projectManagerId = searchParams.get('projectManagerId');
    const subcontractorId = searchParams.get('subcontractorId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (leadId) {
      where.leadId = leadId;
    }

    if (salesRepId) {
      where.salesRepId = salesRepId;
    }

    if (projectManagerId) {
      where.projectManagerId = projectManagerId;
    }

    if (subcontractorId) {
      where.subcontractorId = subcontractorId;
    }

    if (search) {
      where.OR = [
        { clientName: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { jobNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          lead: true,
          estimate: true,
          salesRep: true,
          projectManager: true,
          subcontractor: true,
        },
        orderBy: { jobDate: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.job.count({ where }),
    ]);

    return NextResponse.json({
      jobs,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

// POST /api/jobs - Create a new job
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Generate job number
    const lastJob = await prisma.job.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { jobNumber: true },
    });

    let nextNumber = 1001;
    if (lastJob?.jobNumber) {
      const match = lastJob.jobNumber.match(/JOB-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }
    const jobNumber = `JOB-${nextNumber}`;

    // Calculate financials
    const jobValue = body.jobValue || 0;
    const financials = await calculateJobFinancials(jobValue);

    // Calculate commissions if team members are assigned
    let salesCommissionAmount = 0;
    let pmCommissionAmount = 0;

    if (body.salesRepId) {
      const salesRep = await prisma.teamMember.findUnique({
        where: { id: body.salesRepId },
      });
      const salesCommissionPct = body.salesCommissionPct ?? salesRep?.defaultCommissionPct ?? 5;
      salesCommissionAmount = jobValue * (salesCommissionPct / 100);
    }

    if (body.projectManagerId) {
      const pm = await prisma.teamMember.findUnique({
        where: { id: body.projectManagerId },
      });
      const pmCommissionPct = body.pmCommissionPct ?? pm?.defaultCommissionPct ?? 5;
      pmCommissionAmount = jobValue * (pmCommissionPct / 100);
    }

    const job = await prisma.job.create({
      data: {
        jobNumber,
        clientName: body.clientName,
        address: body.address,
        city: body.city || '',
        projectType: body.projectType || 'interior',
        status: body.status || 'lead',
        jobDate: body.jobDate ? new Date(body.jobDate) : new Date(),
        scheduledStartDate: body.scheduledStartDate ? new Date(body.scheduledStartDate) : null,
        scheduledEndDate: body.scheduledEndDate ? new Date(body.scheduledEndDate) : null,
        jobValue,
        ...financials,
        salesCommissionPct: body.salesCommissionPct || 0,
        salesCommissionAmount,
        pmCommissionPct: body.pmCommissionPct || 0,
        pmCommissionAmount,
        notes: body.notes,
        leadId: body.leadId,
        estimateId: body.estimateId,
        salesRepId: body.salesRepId,
        projectManagerId: body.projectManagerId,
        subcontractorId: body.subcontractorId,
      },
      include: {
        lead: true,
        estimate: true,
        salesRep: true,
        projectManager: true,
        subcontractor: true,
      },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    );
  }
}
