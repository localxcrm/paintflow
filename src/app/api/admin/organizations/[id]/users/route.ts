import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getCurrentUser } from '@/lib/auth';

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

        const supabase = createServerSupabaseClient();

        // Fetch users for this org
        const { data: members, error } = await supabase
            .from('UserOrganization')
            .select(`
        role,
        isDefault,
        User:userId (
          id,
          name,
          email,
          avatar,
          lastLoginAt,
          isActive
        )
      `)
            .eq('organizationId', id);

        if (error) throw error;

        // Flatten structure
        const membersList = (members as unknown as any[]) || [];
        const users = membersList.map((member: any) => ({
            id: member.User.id,
            name: member.User.name,
            email: member.User.email,
            avatar: member.User.avatar,
            lastLoginAt: member.User.lastLoginAt,
            isActive: member.User.isActive,
            role: member.role,
            isDefault: member.isDefault
        }));

        return NextResponse.json(users);
    } catch (error) {
        console.error('Fetch org users error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
