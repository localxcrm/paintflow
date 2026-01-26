import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getOrganizationIdFromRequest } from '@/lib/supabase-server';
import { randomBytes } from 'crypto';
import type { CreateTokenRequest, CreateTokenResponse } from '@/types/client-portal';

// Generate a secure random token
function generateToken(): string {
  return randomBytes(32).toString('hex');
}

// POST /api/client-portal/tokens - Create a new access token
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const orgId = getOrganizationIdFromRequest(request);
    const body = await request.json() as CreateTokenRequest;

    if (!body.jobId || !body.clientEmail) {
      return NextResponse.json(
        { error: 'jobId and clientEmail are required' },
        { status: 400 }
      );
    }

    // Verify job exists and belongs to org
    const { data: job, error: jobError } = await supabase
      .from('Job')
      .select('id, jobNumber, clientName')
      .eq('id', body.jobId)
      .eq('organizationId', orgId)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Generate token and expiration
    const token = generateToken();
    const expiresInDays = body.expiresInDays || 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Create token record
    const { data: accessToken, error: tokenError } = await supabase
      .from('ClientAccessToken')
      .insert({
        jobId: body.jobId,
        organizationId: orgId,
        token,
        clientEmail: body.clientEmail,
        clientName: body.clientName || job.clientName,
        expiresAt: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (tokenError) {
      console.error('Error creating token:', tokenError);
      return NextResponse.json(
        { error: 'Failed to create token' },
        { status: 500 }
      );
    }

    // Generate magic link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.paintflow.com';
    const magicLink = `${baseUrl}/portal/${token}`;

    // TODO: Send email if requested
    if (body.sendEmail) {
      // Would use Resend here to send the magic link email
      console.log('Would send email to:', body.clientEmail, 'with link:', magicLink);
    }

    const response: CreateTokenResponse = {
      token: accessToken,
      magicLink,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in tokens endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/client-portal/tokens - List tokens for a job
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const orgId = getOrganizationIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    let query = supabase
      .from('ClientAccessToken')
      .select('*')
      .eq('organizationId', orgId)
      .order('createdAt', { ascending: false });

    if (jobId) {
      query = query.eq('jobId', jobId);
    }

    const { data: tokens, error } = await query;

    if (error) {
      console.error('Error fetching tokens:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tokens' },
        { status: 500 }
      );
    }

    return NextResponse.json({ tokens: tokens || [] });
  } catch (error) {
    console.error('Error in tokens endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
