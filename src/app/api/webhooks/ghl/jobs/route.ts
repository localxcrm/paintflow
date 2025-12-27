import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { geocodeAddress } from '@/lib/geocoding';

/**
 * POST /api/webhooks/ghl/jobs
 *
 * Webhook endpoint to create a Job from GoHighLevel.
 * Called when an opportunity is marked as "Won" in GHL.
 *
 * Payload fields used:
 * - full_name: Client name
 * - address1: Street address
 * - city: City
 * - country: Country (used as state since GHL doesn't send state)
 * - phone: Phone number (saved in notes)
 * - email: Email (saved in notes)
 * - location.id: GHL location ID to identify organization
 * - [Estimate] Total Price: Job value (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Handle array payload (GHL sometimes sends array)
    const payload = Array.isArray(body) ? body[0]?.body || body[0] : body;

    console.log('GHL Jobs Webhook received:', {
      full_name: payload.full_name,
      location_id: payload.location?.id,
      hasBody: !!payload,
    });

    // 1. Extract location_id
    const locationId = payload.location?.id;
    if (!locationId) {
      console.error('GHL Jobs Webhook: Missing location.id');
      return NextResponse.json(
        { error: 'Missing location.id in payload' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // 2. Find organization by GHL location
    const { data: ghlLocation, error: locationError } = await supabase
      .from('GhlLocation')
      .select('organizationId')
      .eq('ghlLocationId', locationId)
      .single();

    if (locationError || !ghlLocation) {
      console.error('GHL Jobs Webhook: Location not found:', locationId);
      return NextResponse.json(
        { error: `GHL Location not found: ${locationId}` },
        { status: 404 }
      );
    }

    const organizationId = ghlLocation.organizationId;

    // 3. Generate job number
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

    // 4. Extract job value from various possible fields
    const jobValueRaw =
      payload['[Estimate] Total Price'] ||
      payload['[Estimate] Sub-total'] ||
      payload['Services Sold - Enter the value below:'] ||
      '0';
    const jobValue = parseFloat(String(jobValueRaw).replace(/[^0-9.-]/g, '')) || 0;

    // 5. Calculate financials
    const financials = await calculateJobFinancials(jobValue, organizationId, supabase);

    // 6. Extract client info
    const clientName = payload.full_name || payload.first_name || 'Cliente GHL';
    const address = payload.address1 || payload.full_address || '';
    const city = payload.city || '';
    const state = payload.state || payload.country || '';

    // 7. Geocode address
    let latitude: number | null = null;
    let longitude: number | null = null;
    if (address && city) {
      const coords = await geocodeAddress(address, city, state);
      if (coords) {
        latitude = coords.lat;
        longitude = coords.lng;
      }
    }

    // 8. Build notes with contact info
    const notes = [
      payload.phone ? `Tel: ${payload.phone}` : '',
      payload.email ? `Email: ${payload.email}` : '',
      payload.contact_source ? `Fonte: ${payload.contact_source}` : '',
    ].filter(Boolean).join('\n');

    // 9. Create the job
    const { data: job, error: jobError } = await supabase
      .from('Job')
      .insert({
        organizationId,
        jobNumber,
        clientName,
        address,
        city,
        state,
        latitude,
        longitude,
        projectType: 'interior', // Default
        status: 'got_the_job', // Marked as won
        jobDate: new Date().toISOString(),
        jobValue,
        ...financials,
        notes,
      })
      .select('id, jobNumber')
      .single();

    if (jobError) {
      console.error('GHL Jobs Webhook: Failed to create job:', jobError);
      throw jobError;
    }

    console.log('GHL Jobs Webhook: Job created successfully:', job);

    return NextResponse.json({
      success: true,
      jobId: job.id,
      jobNumber: job.jobNumber,
      message: `Job ${job.jobNumber} created successfully`,
    }, { status: 201 });

  } catch (error) {
    console.error('GHL Jobs Webhook error:', error);
    return NextResponse.json(
      { error: 'Failed to create job from webhook' },
      { status: 500 }
    );
  }
}

/**
 * Calculate job financials based on business settings
 */
async function calculateJobFinancials(
  jobValue: number,
  organizationId: string,
  supabase: ReturnType<typeof createServerSupabaseClient>
) {
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
  if (jobValue > 0) {
    if (grossProfit < minGrossProfit) {
      profitFlag = 'RAISE_PRICE';
    } else if (grossMarginPct < targetGrossMargin) {
      profitFlag = 'FIX_SCOPE';
    }
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
