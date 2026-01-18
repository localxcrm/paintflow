import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        // Verify admin access
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createServerSupabaseClient();

        // Fetch stats in parallel
        const [
            { count: userCount },
            { count: orgCount },
            { data: proOrgs, error: proError }
        ] = await Promise.all([
            supabase.from('User').select('*', { count: 'exact', head: true }),
            supabase.from('Organization').select('*', { count: 'exact', head: true }),
            supabase.from('Organization').select('plan').neq('plan', 'free')
        ]);

        if (proError) throw proError;

        const proOrgsList = (proOrgs as unknown as any[]) || [];
        const activeSubscriptions = proOrgsList.length;
        // Assuming $49/mo for pro plan
        const mrr = activeSubscriptions * 49;

        return NextResponse.json({
            totalUsers: userCount || 0,
            totalOrgs: orgCount || 0,
            activeSubscriptions,
            mrr
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
