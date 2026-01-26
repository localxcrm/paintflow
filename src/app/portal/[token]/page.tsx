import { createServerSupabaseClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import { ClientPortalView } from '@/components/client-portal/portal-view';
import type { ClientPortalData, ClientJobStatus, ClientPhoto, ClientInvoice } from '@/types/client-portal';

interface PortalPageProps {
  params: Promise<{ token: string }>;
}

async function getPortalData(token: string): Promise<ClientPortalData | null> {
  const supabase = createServerSupabaseClient();

  // Fetch and validate token
  const { data: accessToken, error: tokenError } = await supabase
    .from('ClientAccessToken')
    .select(`
      *,
      Job!inner (
        id,
        jobNumber,
        clientName,
        address,
        projectType,
        status,
        scheduledStartDate,
        scheduledEndDate,
        actualStartDate,
        actualEndDate,
        jobValue,
        depositRequired,
        depositPaid,
        balanceDue,
        jobPaid,
        updatedAt,
        Organization!inner (
          name,
          settings
        ),
        Estimate (
          id,
          estimateNumber,
          totalPrice,
          createdAt
        )
      )
    `)
    .eq('token', token)
    .eq('isActive', true)
    .gt('expiresAt', new Date().toISOString())
    .single();

  if (tokenError || !accessToken) {
    return null;
  }

  // Update access stats
  await supabase
    .from('ClientAccessToken')
    .update({
      lastAccessedAt: new Date().toISOString(),
      accessCount: (accessToken.accessCount || 0) + 1,
    })
    .eq('id', accessToken.id);

  // Fetch photos from work order if exists
  const { data: workOrder } = await supabase
    .from('WorkOrder')
    .select(`
      WorkOrderPhoto (
        id,
        url,
        caption,
        photoType,
        createdAt
      )
    `)
    .eq('jobId', accessToken.jobId)
    .single();

  // Fetch messages
  const { data: messages } = await supabase
    .from('ClientMessage')
    .select('*')
    .eq('accessTokenId', accessToken.id)
    .order('createdAt', { ascending: true });

  // Calculate completion percentage based on status
  const statusProgress: Record<string, number> = {
    lead: 10,
    got_the_job: 25,
    scheduled: 50,
    completed: 100,
  };

  const job = accessToken.Job;
  const estimate = job.Estimate?.[0];

  const jobStatus: ClientJobStatus = {
    jobId: job.id,
    jobNumber: job.jobNumber,
    clientName: job.clientName,
    address: job.address,
    projectType: job.projectType,
    status: job.status,
    scheduledStartDate: job.scheduledStartDate,
    scheduledEndDate: job.scheduledEndDate,
    actualStartDate: job.actualStartDate,
    actualEndDate: job.actualEndDate,
    completionPercentage: statusProgress[job.status] || 0,
    lastUpdated: job.updatedAt,
  };

  const photos: ClientPhoto[] = (workOrder?.WorkOrderPhoto || []).map((p: any) => ({
    id: p.id,
    url: p.url,
    caption: p.caption,
    type: p.photoType === 'before' ? 'before' : p.photoType === 'after' ? 'after' : 'progress',
    takenAt: p.createdAt,
  }));

  const invoice: ClientInvoice | null = estimate ? {
    id: estimate.id,
    estimateNumber: estimate.estimateNumber,
    totalPrice: job.jobValue || estimate.totalPrice,
    depositAmount: job.depositRequired || 0,
    depositPaid: job.depositPaid || false,
    balanceDue: job.balanceDue || 0,
    balancePaid: job.jobPaid || false,
    pdfUrl: null, // TODO: Generate PDF URL
    createdAt: estimate.createdAt,
  } : null;

  return {
    token,
    expiresAt: accessToken.expiresAt,
    job: jobStatus,
    photos,
    messages: messages || [],
    invoice,
    organization: {
      name: job.Organization.name,
      phone: job.Organization.settings?.phone || null,
      email: job.Organization.settings?.email || null,
    },
  };
}

export default async function PortalPage({ params }: PortalPageProps) {
  const { token } = await params;
  const data = await getPortalData(token);

  if (!data) {
    notFound();
  }

  return <ClientPortalView data={data} />;
}
