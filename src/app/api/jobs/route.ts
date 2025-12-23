import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getOrganizationIdFromRequest } from '@/lib/supabase';

// Helper function to calculate job financials
async function calculateJobFinancials(jobValue: number, organizationId: string) {
  const supabase = createServerSupabaseClient();

  const { data: settings } = await supabase
    .from('BusinessSettings')
    .select('*')
    .eq('organizationId', organizationId)
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

// GET /api/jobs - Get all jobs with optional filtering
export async function GET(request: NextRequest) {
  try {
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const leadId = searchParams.get('leadId');
    const salesRepId = searchParams.get('salesRepId');
    const projectManagerId = searchParams.get('projectManagerId');
    const subcontractorId = searchParams.get('subcontractorId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('Job')
      .select('*, Lead(*), Estimate(*), salesRep:TeamMember!salesRepId(*), projectManager:TeamMember!projectManagerId(*), Subcontractor(*)', { count: 'exact' })
      .eq('organizationId', organizationId);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (leadId) {
      query = query.eq('leadId', leadId);
    }

    if (salesRepId) {
      query = query.eq('salesRepId', salesRepId);
    }

    if (projectManagerId) {
      query = query.eq('projectManagerId', projectManagerId);
    }

    if (subcontractorId) {
      query = query.eq('subcontractorId', subcontractorId);
    }

    // Search across multiple fields
    if (search) {
      query = query.or(`clientName.ilike.%${search}%,address.ilike.%${search}%,jobNumber.ilike.%${search}%`);
    }

    // Apply ordering, limit, and offset
    query = query
      .order('jobDate', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: jobs, count, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      jobs: jobs || [],
      total: count || 0,
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
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const body = await request.json();

    // Generate job number
    const { data: lastJob } = await supabase
      .from('Job')
      .select('jobNumber')
      .eq('organizationId', organizationId)
      .order('createdAt', { ascending: false })
      .limit(1)
      .single();

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
    const financials = await calculateJobFinancials(jobValue, organizationId);

    // Calculate commissions if team members are assigned
    let salesCommissionAmount = 0;
    let pmCommissionAmount = 0;

    if (body.salesRepId) {
      const { data: salesRep } = await supabase
        .from('TeamMember')
        .select('*')
        .eq('id', body.salesRepId)
        .single();

      const salesCommissionPct = body.salesCommissionPct ?? salesRep?.defaultCommissionPct ?? 5;
      salesCommissionAmount = jobValue * (salesCommissionPct / 100);
    }

    if (body.projectManagerId) {
      const { data: pm } = await supabase
        .from('TeamMember')
        .select('*')
        .eq('id', body.projectManagerId)
        .single();

      const pmCommissionPct = body.pmCommissionPct ?? pm?.defaultCommissionPct ?? 5;
      pmCommissionAmount = jobValue * (pmCommissionPct / 100);
    }

    const { data: job, error: jobError } = await supabase
      .from('Job')
      .insert({
        organizationId,
        jobNumber,
        clientName: body.clientName,
        address: body.address,
        city: body.city || '',
        projectType: body.projectType || 'interior',
        status: body.status || 'lead',
        jobDate: body.jobDate ? new Date(body.jobDate).toISOString() : new Date().toISOString(),
        scheduledStartDate: body.scheduledStartDate ? new Date(body.scheduledStartDate).toISOString() : null,
        scheduledEndDate: body.scheduledEndDate ? new Date(body.scheduledEndDate).toISOString() : null,
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
      })
      .select()
      .single();

    if (jobError) {
      throw jobError;
    }

    // Fetch the complete job with relations
    const { data: completeJob, error: fetchError } = await supabase
      .from('Job')
      .select('*, Lead(*), Estimate(*), salesRep:TeamMember!salesRepId(*), projectManager:TeamMember!projectManagerId(*), Subcontractor(*)')
      .eq('id', job.id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    return NextResponse.json(completeJob, { status: 201 });
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    );
  }
}
