import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// GET /api/calendar/[token] - Get iCal feed for subcontractor
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return new NextResponse('Token required', { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Find subcontractor by calendar token
    const { data: subcontractor, error: subError } = await supabase
      .from('Subcontractor')
      .select('id, name, organizationId')
      .eq('calendarToken', token)
      .eq('isActive', true)
      .single();

    if (subError || !subcontractor) {
      return new NextResponse('Invalid calendar token', { status: 404 });
    }

    // Get all jobs assigned to this subcontractor
    const { data: jobs, error: jobsError } = await supabase
      .from('Job')
      .select('*')
      .eq('subcontractorId', subcontractor.id)
      .eq('organizationId', subcontractor.organizationId)
      .in('status', ['got_the_job', 'scheduled', 'completed'])
      .order('scheduledStartDate', { ascending: true });

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError);
      return new NextResponse('Error fetching jobs', { status: 500 });
    }

    // Get work orders for these jobs
    const jobIds = (jobs || []).map((j: any) => j.id);
    const { data: workOrders } = await supabase
      .from('WorkOrder')
      .select('id, jobId, publicToken, osNumber')
      .in('jobId', jobIds.length > 0 ? jobIds : ['no-jobs']);

    // Create a map of jobId -> workOrder
    const workOrderMap = new Map<string, { publicToken: string; osNumber: string }>();
    for (const wo of workOrders || []) {
      workOrderMap.set(wo.jobId, { publicToken: wo.publicToken, osNumber: wo.osNumber });
    }

    // Get the base URL from request
    const baseUrl = request.headers.get('x-forwarded-proto')
      ? `${request.headers.get('x-forwarded-proto')}://${request.headers.get('host')}`
      : `https://${request.headers.get('host')}`;

    // Generate iCal content
    const icalContent = generateICalFeed(subcontractor.name, jobs || [], workOrderMap, baseUrl);

    // Return as iCal file
    return new NextResponse(icalContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${subcontractor.name.replace(/[^a-zA-Z0-9]/g, '_')}_calendar.ics"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Calendar feed error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

interface Job {
  id: string;
  jobNumber: string;
  clientName: string;
  address: string;
  city: string;
  state: string | null;
  zipCode: string | null;
  projectType: string;
  status: string;
  scheduledStartDate: string | null;
  scheduledEndDate: string | null;
  jobValue: number;
  subcontractorPrice: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

function generateICalFeed(
  subcontractorName: string,
  jobs: Job[],
  workOrderMap: Map<string, { publicToken: string; osNumber: string }>,
  baseUrl: string
): string {
  const now = new Date();
  const timestamp = formatICalDate(now);

  const ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PaintPro//Calendar Feed//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:Jobs - ${subcontractorName}`,
    'X-WR-TIMEZONE:America/Sao_Paulo',
  ];

  for (const job of jobs) {
    // Skip jobs without scheduled dates
    if (!job.scheduledStartDate) continue;

    const startDate = new Date(job.scheduledStartDate);
    const endDate = job.scheduledEndDate
      ? new Date(job.scheduledEndDate)
      : new Date(startDate.getTime() + 8 * 60 * 60 * 1000); // Default 8 hours

    const statusLabels: Record<string, string> = {
      got_the_job: 'Confirmado',
      scheduled: 'Agendado',
      completed: 'Concluído',
    };

    const projectTypeLabels: Record<string, string> = {
      interior: 'Interior',
      exterior: 'Exterior',
      both: 'Interior + Exterior',
    };

    const location = [job.address, job.city, job.state, job.zipCode]
      .filter(Boolean)
      .join(', ');

    // Check if there's a work order for this job
    const workOrder = workOrderMap.get(job.id);
    const osLink = workOrder ? `${baseUrl}/os/${workOrder.publicToken}` : null;

    const description = [
      `═══════════════════════════`,
      `TRABALHO #${job.jobNumber}`,
      workOrder ? `ORDEM DE SERVIÇO: ${workOrder.osNumber}` : '',
      `═══════════════════════════`,
      ``,
      `📍 ENDEREÇO:`,
      `${job.address}`,
      `${job.city}${job.state ? ', ' + job.state : ''}${job.zipCode ? ' - ' + job.zipCode : ''}`,
      ``,
      `👤 CLIENTE: ${job.clientName}`,
      ``,
      `🎨 TIPO: ${projectTypeLabels[job.projectType] || job.projectType}`,
      `📋 STATUS: ${statusLabels[job.status] || job.status}`,
      ``,
      `💰 SEU PAGAMENTO: R$ ${(job.subcontractorPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      ``,
      job.notes ? `📝 INSTRUÇÕES/MATERIAIS:` : '',
      job.notes ? `${job.notes}` : '',
      ``,
      osLink ? `🔗 ORDEM DE SERVIÇO:` : '',
      osLink ? `${osLink}` : '',
      ``,
      `═══════════════════════════`,
    ].filter(Boolean).join('\\n');

    ical.push(
      'BEGIN:VEVENT',
      `UID:${job.id}@paintpro`,
      `DTSTAMP:${timestamp}`,
      `DTSTART:${formatICalDate(startDate)}`,
      `DTEND:${formatICalDate(endDate)}`,
      `SUMMARY:${escapeICalText(`[${job.jobNumber}] ${job.clientName} - ${projectTypeLabels[job.projectType] || job.projectType}`)}`,
      `DESCRIPTION:${escapeICalText(description)}`,
      `LOCATION:${escapeICalText(location)}`,
      `STATUS:${job.status === 'completed' ? 'COMPLETED' : 'CONFIRMED'}`,
      `LAST-MODIFIED:${formatICalDate(new Date(job.updatedAt))}`,
      osLink ? `URL:${osLink}` : '',
      'END:VEVENT'
    );
  }

  ical.push('END:VCALENDAR');

  return ical.filter((line: any) => line !== '').join('\r\n');
}

function formatICalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}
