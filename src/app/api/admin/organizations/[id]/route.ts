import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Verify admin access
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Use Service Role to bypass RLS for GET as well
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Fetch Full Org Details with counts
        const { data: org, error } = await supabaseAdmin
            .from('Organization')
            .select(`
        *,
        UserOrganization (count),
        Job (count),
        Estimate (count)
      `)
            .eq('id', id)
            .single();

        if (error) throw error;

        // Transform count arrays to numbers
        const transformedOrg = {
            ...org,
            isActive: org.isActive ?? true,
            userCount: org.UserOrganization?.[0]?.count || 0,
            jobCount: org.Job?.[0]?.count || 0,
            estimateCount: org.Estimate?.[0]?.count || 0,
        };

        return NextResponse.json(transformedOrg);
    } catch (error) {
        console.error('Fetch org details error:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown Error' }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Verify admin access
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const json = await request.json();

        // Allowed fields to update
        const allowedFields = [
            'name', 'slug', 'email', 'phone', 'address',
            'city', 'state', 'zipCode', 'plan', 'isActive',
            'settings', 'stripeCustomerId'
        ];

        const updates: Record<string, any> = {};

        for (const field of allowedFields) {
            if (field in json) {
                // Ensure correct types
                if (field === 'isActive') {
                    updates[field] = Boolean(json[field]);
                } else if (field === 'settings') {
                    updates[field] = json[field];
                } else {
                    updates[field] = json[field];
                }
            }
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
        }

        // Use Service Role to bypass RLS
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data, error } = await supabaseAdmin
            .from('Organization')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[PATCH] Error:', error);
            throw error;
        }

        console.log('[PATCH] Done:', data);

        return NextResponse.json(data);
    } catch (error) {
        console.error('Update org error:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown Error' }, { status: 500 });
    }
}
