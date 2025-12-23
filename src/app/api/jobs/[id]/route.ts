import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { geocodeAddress } from '@/lib/geocoding';

// Helper function to calculate job financials
async function calculateJobFinancials(jobValue: number) {
  const supabase = createServerSupabaseClient();

  const { data: settings } = await supabase
    .from('BusinessSettings')
    .select('*')
    .limit(1)
    .single();

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
    const supabase = createServerSupabaseClient();
    const { id } = await params;

    const { data: job, error } = await supabase
      .from('Job')
      .select('*, Lead(*), Estimate(*, EstimateLineItem(*)), salesRep:TeamMember!salesRepId(*), projectManager:TeamMember!projectManagerId(*), Subcontractor(*)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        );
      }
      throw error;
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
    const supabase = createServerSupabaseClient();
    const { id } = await params;
    const body = await request.json();

    // Get current job
    const { data: currentJob, error: fetchError } = await supabase
      .from('Job')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !currentJob) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Recalculate financials if job value changes
    let financials: Partial<typeof currentJob> = {};
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
      balanceDue = body.depositPaid ? currentJob.jobValue - currentJob.depositRequired : currentJob.jobValue;
    }

    // Geocode address if address or city changed
    let latitude = currentJob.latitude;
    let longitude = currentJob.longitude;
    if (body.address !== undefined || body.city !== undefined) {
      const address = body.address ?? currentJob.address;
      const city = body.city ?? currentJob.city;
      const state = body.state ?? currentJob.state;

      if (address && city) {
        const coords = await geocodeAddress(address, city, state);
        if (coords) {
          latitude = coords.lat;
          longitude = coords.lng;
        }
      }
    }

    // Build update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = { updatedAt: new Date().toISOString() };

    if (body.clientName !== undefined) updateData.clientName = body.clientName;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.state !== undefined) updateData.state = body.state;
    // Update coordinates if address changed
    if (body.address !== undefined || body.city !== undefined) {
      updateData.latitude = latitude;
      updateData.longitude = longitude;
    }
    if (body.projectType !== undefined) updateData.projectType = body.projectType;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.jobDate !== undefined) updateData.jobDate = new Date(body.jobDate).toISOString();
    if (body.scheduledStartDate !== undefined) updateData.scheduledStartDate = body.scheduledStartDate ? new Date(body.scheduledStartDate).toISOString() : null;
    if (body.scheduledEndDate !== undefined) updateData.scheduledEndDate = body.scheduledEndDate ? new Date(body.scheduledEndDate).toISOString() : null;
    if (body.actualStartDate !== undefined) updateData.actualStartDate = body.actualStartDate ? new Date(body.actualStartDate).toISOString() : null;
    if (body.actualEndDate !== undefined) updateData.actualEndDate = body.actualEndDate ? new Date(body.actualEndDate).toISOString() : null;
    if (body.jobValue !== undefined) updateData.jobValue = body.jobValue;
    if (body.depositPaid !== undefined) {
      updateData.depositPaid = body.depositPaid;
      updateData.balanceDue = balanceDue;
    }
    if (body.jobPaid !== undefined) updateData.jobPaid = body.jobPaid;
    if (body.invoiceDate !== undefined) updateData.invoiceDate = body.invoiceDate ? new Date(body.invoiceDate).toISOString() : null;
    if (body.paymentReceivedDate !== undefined) {
      updateData.paymentReceivedDate = body.paymentReceivedDate ? new Date(body.paymentReceivedDate).toISOString() : null;
      updateData.daysToCollect = daysToCollect;
    }
    if (body.salesCommissionPct !== undefined) {
      updateData.salesCommissionPct = body.salesCommissionPct;
      updateData.salesCommissionAmount = salesCommissionAmount;
    }
    if (body.salesCommissionPaid !== undefined) updateData.salesCommissionPaid = body.salesCommissionPaid;
    if (body.pmCommissionPct !== undefined) {
      updateData.pmCommissionPct = body.pmCommissionPct;
      updateData.pmCommissionAmount = pmCommissionAmount;
    }
    if (body.pmCommissionPaid !== undefined) updateData.pmCommissionPaid = body.pmCommissionPaid;
    if (body.subcontractorPaid !== undefined) updateData.subcontractorPaid = body.subcontractorPaid;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.salesRepId !== undefined) updateData.salesRepId = body.salesRepId;
    if (body.projectManagerId !== undefined) updateData.projectManagerId = body.projectManagerId;
    if (body.subcontractorId !== undefined) updateData.subcontractorId = body.subcontractorId;

    // Merge calculated financials
    Object.assign(updateData, financials);

    const { data: job, error: updateError } = await supabase
      .from('Job')
      .update(updateData)
      .eq('id', id)
      .select('*, Lead(*), Estimate(*), salesRep:TeamMember!salesRepId(*), projectManager:TeamMember!projectManagerId(*), Subcontractor(*)')
      .single();

    if (updateError) {
      throw updateError;
    }

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
    const supabase = createServerSupabaseClient();
    const { id } = await params;

    const { error } = await supabase
      .from('Job')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting job:', error);
    return NextResponse.json(
      { error: 'Failed to delete job' },
      { status: 500 }
    );
  }
}
