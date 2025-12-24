import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client for AI tools (bypasses RLS)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Tool Definitions for OpenAI
 */
export const aiTools: any[] = [
    {
        type: 'function',
        function: {
            name: 'search_leads',
            description: 'Search for leads by name, email, or status.',
            parameters: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: 'Search term for name or email',
                    },
                    status: {
                        type: 'string',
                        enum: ['new', 'contacted', 'estimate_scheduled', 'estimated', 'proposal_sent', 'follow_up', 'won', 'lost'],
                        description: 'Filter leads by status',
                    },
                    limit: {
                        type: 'number',
                        description: 'Number of results to return (default 5)',
                    },
                },
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'get_lead_details',
            description: 'Get details for a specific lead by ID.',
            parameters: {
                type: 'object',
                properties: {
                    leadId: {
                        type: 'string',
                        description: 'The UUID of the lead',
                    },
                },
                required: ['leadId'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'search_jobs',
            description: 'Search for jobs/projects by status or date.',
            parameters: {
                type: 'object',
                properties: {
                    status: {
                        type: 'string',
                        enum: ['lead', 'got_the_job', 'scheduled', 'completed'],
                        description: 'Filter jobs by status',
                    },
                    limit: {
                        type: 'number',
                        description: 'Number of results to return (default 5)',
                    },
                },
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'get_business_stats',
            description: 'Get high-level business statistics (KPIs) like revenue, active jobs count, etc.',
            parameters: {
                type: 'object',
                properties: {},
            },
        },
    },
];

/**
 * Tool Implementations
 */
export async function searchLeads({ query, status, limit = 5 }: { query?: string; status?: string; limit?: number }) {
    let dbQuery = supabaseAdmin.from('Lead').select('id, firstName, lastName, email, status, leadDate');

    if (query) {
        dbQuery = dbQuery.or(`firstName.ilike.%${query}%,lastName.ilike.%${query}%,email.ilike.%${query}%`);
    }
    if (status) {
        dbQuery = dbQuery.eq('status', status);
    }

    const { data, error } = await dbQuery.limit(limit).order('leadDate', { ascending: false });

    if (error) {
        console.error('Error searching leads:', error);
        return { error: 'Failed to search leads' };
    }
    return data;
}

export async function getLeadDetails({ leadId }: { leadId: string }) {
    const { data, error } = await supabaseAdmin
        .from('Lead')
        .select('*')
        .eq('id', leadId)
        .single();

    if (error) {
        return { error: 'Lead not found' };
    }
    return data;
}

export async function searchJobs({ status, limit = 5 }: { status?: string; limit?: number }) {
    let dbQuery = supabaseAdmin.from('Job').select('id, jobNumber, clientName, status, jobValue, scheduledStartDate');

    if (status) {
        dbQuery = dbQuery.eq('status', status);
    }

    const { data, error } = await dbQuery.limit(limit).order('scheduledStartDate', { ascending: false });

    if (error) {
        return { error: 'Failed to search jobs' };
    }
    return data;
}

export async function getBusinessStats() {
    // Aggregate stats via separate queries for now (could be optimized with an RPC later)
    const [jobsRes, leadsRes, revenueRes] = await Promise.all([
        supabaseAdmin.from('Job').select('id', { count: 'exact', head: true }).eq('status', 'scheduled'),
        supabaseAdmin.from('Lead').select('id', { count: 'exact', head: true }).eq('status', 'new'),
        // Summing revenue is tricky without RPC, so we'll just fetch completed jobs limit 100
        supabaseAdmin.from('Job').select('jobValue').eq('status', 'completed').limit(100),
    ]);

    const activeJobs = jobsRes.count || 0;
    const newLeads = leadsRes.count || 0;
    const completedRevenue = revenueRes.data?.reduce((sum, job) => sum + (job.jobValue || 0), 0) || 0;

    return {
        activeJobs,
        newLeads,
        completedRevenueCheck: completedRevenue, // Labelled check as it's partial due to limit
        note: "Revenue calculation is based on recent jobs only.",
    };
}
