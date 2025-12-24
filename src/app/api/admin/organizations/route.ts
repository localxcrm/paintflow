import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // Verify admin access
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Use Service Role to bypass RLS
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Fetch organizations with counts
        // Note: This is a simplified fetch. For production, you might want pagination.
        const { data: orgs, error } = await supabaseAdmin
            .from('Organization')
            .select(`
        *,
        UserOrganization (count)
      `)
            .order('createdAt', { ascending: false })
            .limit(50);

        if (error) throw error;

        const formattedOrgs = orgs.map((org: any) => ({
            id: org.id,
            name: org.name,
            plan: org.plan,
            createdAt: org.createdAt,
            userCount: org.UserOrganization?.[0]?.count || 0,
            isActive: org.isActive ?? true
        }));

        return NextResponse.json(formattedOrgs);
    } catch (error) {
        console.error('Admin orgs error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
