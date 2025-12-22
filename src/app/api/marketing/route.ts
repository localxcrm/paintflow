// Marketing / Campaign Spend API
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import type { CampaignSpend, CampaignSpendInsert, CampaignSpendUpdate } from '@/types/database';

// GET /api/marketing - List campaign spend
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const platform = searchParams.get('platform');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from('CampaignSpend')
      .select('*')
      .eq('tenantId', tenantId);

    if (startDate) {
      query = query.gte('date', startDate);
    }

    if (endDate) {
      query = query.lte('date', endDate);
    }

    if (platform) {
      query = query.eq('platform', platform);
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) {
      throw error;
    }

    // Calculate summary
    const spend = (data || []) as CampaignSpend[];
    const totalSpend = spend.reduce((sum: number, s: CampaignSpend) => sum + (s.spend || 0), 0);
    const totalLeads = spend.reduce((sum: number, s: CampaignSpend) => sum + (s.leads || 0), 0);
    const totalClicks = spend.reduce((sum: number, s: CampaignSpend) => sum + (s.clicks || 0), 0);
    const totalImpressions = spend.reduce((sum: number, s: CampaignSpend) => sum + (s.impressions || 0), 0);

    // Group by platform
    const byPlatform: Record<string, { spend: number; leads: number; clicks: number }> = {};
    spend.forEach((s: CampaignSpend) => {
      const p = s.platform;
      if (!byPlatform[p]) {
        byPlatform[p] = { spend: 0, leads: 0, clicks: 0 };
      }
      byPlatform[p].spend += s.spend || 0;
      byPlatform[p].leads += s.leads || 0;
      byPlatform[p].clicks += s.clicks || 0;
    });

    return NextResponse.json({
      campaigns: data,
      summary: {
        totalSpend,
        totalLeads,
        totalClicks,
        totalImpressions,
        avgCpl: totalLeads > 0 ? totalSpend / totalLeads : null,
        avgCpc: totalClicks > 0 ? totalSpend / totalClicks : null,
        avgCtr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : null,
      },
      byPlatform,
    });

  } catch (error) {
    console.error('[Marketing] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch marketing data' },
      { status: 500 }
    );
  }
}

// POST /api/marketing - Add campaign spend entry
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      tenantId,
      workspaceId,
      platform,
      campaignName,
      campaignId,
      date,
      spend = 0,
      impressions = 0,
      clicks = 0,
      leads = 0,
      notes,
    } = body;

    if (!tenantId || !platform || !campaignName || !date) {
      return NextResponse.json(
        { error: 'tenantId, platform, campaignName, and date are required' },
        { status: 400 }
      );
    }

    // Calculate metrics
    const cpc = clicks > 0 ? spend / clicks : null;
    const cpl = leads > 0 ? spend / leads : null;
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : null;

    const campaignData: CampaignSpendInsert = {
      tenantId,
      workspaceId: workspaceId || null,
      platform,
      campaignName,
      campaignId: campaignId || null,
      date,
      spend,
      impressions,
      clicks,
      leads,
      cpc,
      cpl,
      ctr,
      notes: notes || null,
    };

    const { data, error } = await supabaseAdmin
      .from('CampaignSpend')
      .insert(campaignData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ campaign: data });

  } catch (error) {
    console.error('[Marketing] Create error:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign entry' },
      { status: 500 }
    );
  }
}

// PATCH /api/marketing - Update campaign spend entry
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Campaign id is required' },
        { status: 400 }
      );
    }

    const safeUpdate: CampaignSpendUpdate = {};

    if (updateData.platform !== undefined) safeUpdate.platform = updateData.platform;
    if (updateData.campaignName !== undefined) safeUpdate.campaignName = updateData.campaignName;
    if (updateData.campaignId !== undefined) safeUpdate.campaignId = updateData.campaignId;
    if (updateData.date !== undefined) safeUpdate.date = updateData.date;
    if (updateData.spend !== undefined) safeUpdate.spend = updateData.spend;
    if (updateData.impressions !== undefined) safeUpdate.impressions = updateData.impressions;
    if (updateData.clicks !== undefined) safeUpdate.clicks = updateData.clicks;
    if (updateData.leads !== undefined) safeUpdate.leads = updateData.leads;
    if (updateData.notes !== undefined) safeUpdate.notes = updateData.notes;

    // Recalculate metrics if relevant fields changed
    if (updateData.spend !== undefined || updateData.clicks !== undefined || updateData.leads !== undefined || updateData.impressions !== undefined) {
      const spend = updateData.spend ?? 0;
      const clicks = updateData.clicks ?? 0;
      const leads = updateData.leads ?? 0;
      const impressions = updateData.impressions ?? 0;

      safeUpdate.cpc = clicks > 0 ? spend / clicks : null;
      safeUpdate.cpl = leads > 0 ? spend / leads : null;
      safeUpdate.ctr = impressions > 0 ? (clicks / impressions) * 100 : null;
    }

    const { data, error } = await supabaseAdmin
      .from('CampaignSpend')
      .update(safeUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ campaign: data });

  } catch (error) {
    console.error('[Marketing] Update error:', error);
    return NextResponse.json(
      { error: 'Failed to update campaign entry' },
      { status: 500 }
    );
  }
}

// DELETE /api/marketing - Delete campaign spend entry
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Campaign id is required' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('CampaignSpend')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[Marketing] Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete campaign entry' },
      { status: 500 }
    );
  }
}
