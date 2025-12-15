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

// GET /api/jobs/[id] - Get a single job
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        lead: true,
        estimate: {
          include: {
            lineItems: true,
          },
        },
        salesRep: true,
        projectManager: true,
        subcontractor: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job' },
      { status: 500 }
    );
  }
}

// PATCH /api/jobs/[id] - Update a job
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Get current job
    const currentJob = await prisma.job.findUnique({
      where: { id },
    });

    if (!currentJob) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Recalculate financials if job value changes
    let financials = {};
    const jobValue = body.jobValue ?? currentJob.jobValue;

    if (body.jobValue !== undefined) {
      financials = await calculateJobFinancials(jobValue);
    }

    // Recalculate commissions if needed
    let salesCommissionAmount = currentJob.salesCommissionAmount;
    let pmCommissionAmount = currentJob.pmCommissionAmount;

    if (body.salesCommissionPct !== undefined || body.jobValue !== undefined) {
      const salesCommissionPct = body.salesCommissionPct ?? currentJob.salesCommissionPct;
      salesCommissionAmount = jobValue * (salesCommissionPct / 100);
    }

    if (body.pmCommissionPct !== undefined || body.jobValue !== undefined) {
      const pmCommissionPct = body.pmCommissionPct ?? currentJob.pmCommissionPct;
      pmCommissionAmount = jobValue * (pmCommissionPct / 100);
    }

    // Calculate days to collect if payment received
    let daysToCollect = currentJob.daysToCollect;
    if (body.paymentReceivedDate && currentJob.invoiceDate) {
      const invoiceDate = new Date(currentJob.invoiceDate);
      const paymentDate = new Date(body.paymentReceivedDate);
      daysToCollect = Math.floor((paymentDate.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    // Update balance due based on deposit status
    let balanceDue = currentJob.balanceDue;
    if (body.depositPaid !== undefined) {
      const depositRequired = body.depositPaid ? 0 : (financials as { depositRequired?: number }).depositRequired ?? currentJob.depositRequired;
      balanceDue = body.depositPaid ? currentJob.jobValue - currentJob.depositRequired : currentJob.jobValue;
    }

    const job = await prisma.job.update({
      where: { id },
      data: {
        ...(body.clientName !== undefined && { clientName: body.clientName }),
        ...(body.address !== undefined && { address: body.address }),
        ...(body.city !== undefined && { city: body.city }),
        ...(body.projectType !== undefined && { projectType: body.projectType }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.jobDate !== undefined && { jobDate: new Date(body.jobDate) }),
        ...(body.scheduledStartDate !== undefined && { scheduledStartDate: body.scheduledStartDate ? new Date(body.scheduledStartDate) : null }),
        ...(body.scheduledEndDate !== undefined && { scheduledEndDate: body.scheduledEndDate ? new Date(body.scheduledEndDate) : null }),
        ...(body.actualStartDate !== undefined && { actualStartDate: body.actualStartDate ? new Date(body.actualStartDate) : null }),
        ...(body.actualEndDate !== undefined && { actualEndDate: body.actualEndDate ? new Date(body.actualEndDate) : null }),
        ...(body.jobValue !== undefined && { jobValue: body.jobValue }),
        ...financials,
        ...(body.depositPaid !== undefined && { depositPaid: body.depositPaid, balanceDue }),
        ...(body.jobPaid !== undefined && { jobPaid: body.jobPaid }),
        ...(body.invoiceDate !== undefined && { invoiceDate: body.invoiceDate ? new Date(body.invoiceDate) : null }),
        ...(body.paymentReceivedDate !== undefined && { paymentReceivedDate: body.paymentReceivedDate ? new Date(body.paymentReceivedDate) : null, daysToCollect }),
        ...(body.salesCommissionPct !== undefined && { salesCommissionPct: body.salesCommissionPct, salesCommissionAmount }),
        ...(body.salesCommissionPaid !== undefined && { salesCommissionPaid: body.salesCommissionPaid }),
        ...(body.pmCommissionPct !== undefined && { pmCommissionPct: body.pmCommissionPct, pmCommissionAmount }),
        ...(body.pmCommissionPaid !== undefined && { pmCommissionPaid: body.pmCommissionPaid }),
        ...(body.subcontractorPaid !== undefined && { subcontractorPaid: body.subcontractorPaid }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.salesRepId !== undefined && { salesRepId: body.salesRepId }),
        ...(body.projectManagerId !== undefined && { projectManagerId: body.projectManagerId }),
        ...(body.subcontractorId !== undefined && { subcontractorId: body.subcontractorId }),
      },
      include: {
        lead: true,
        estimate: true,
        salesRep: true,
        projectManager: true,
        subcontractor: true,
      },
    });

    return NextResponse.json(job);
  } catch (error) {
    console.error('Error updating job:', error);
    return NextResponse.json(
      { error: 'Failed to update job' },
      { status: 500 }
    );
  }
}

// DELETE /api/jobs/[id] - Delete a job
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.job.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting job:', error);
    return NextResponse.json(
      { error: 'Failed to delete job' },
      { status: 500 }
    );
  }
}
