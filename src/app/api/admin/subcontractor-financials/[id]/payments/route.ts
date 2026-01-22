import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getOrganizationIdFromRequest } from '@/lib/supabase-server';
import type { SubcontractorPayment, PaymentStatus } from '@/types/database';

/**
 * PATCH /api/admin/subcontractor-financials/[id]/payments
 *
 * Updates payment status for a subcontractor payment
 * Used to mark payments as paid with paidDate (FIN-03)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerSupabaseClient();
    const orgId = getOrganizationIdFromRequest(request);
    const { id: subcontractorId } = await params;

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    // Parse request body
    const body = await request.json();
    const { paymentId, status, paidDate, notes } = body;

    if (!paymentId || !status) {
      return NextResponse.json(
        { error: 'paymentId and status are required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses: PaymentStatus[] = ['pending', 'paid'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "pending" or "paid"' },
        { status: 400 }
      );
    }

    // Verify payment belongs to this subcontractor and organization
    const { data: payment, error: fetchError } = await supabase
      .from('SubcontractorPayment')
      .select(
        `
        *,
        SubcontractorPayout (
          subcontractorId
        )
      `
      )
      .eq('id', paymentId)
      .eq('organizationId', orgId)
      .single();

    if (fetchError || !payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Type assertion
    type PaymentWithPayout = SubcontractorPayment & {
      SubcontractorPayout: { subcontractorId: string };
    };

    const paymentTyped = payment as PaymentWithPayout;

    // Verify subcontractor match
    if (paymentTyped.SubcontractorPayout.subcontractorId !== subcontractorId) {
      return NextResponse.json(
        { error: 'Payment does not belong to this subcontractor' },
        { status: 403 }
      );
    }

    // Build update data
    const updateData: Partial<SubcontractorPayment> = {
      status,
      updatedAt: new Date().toISOString(),
    };

    // If marking as paid, require paidDate
    if (status === 'paid') {
      if (!paidDate) {
        return NextResponse.json(
          { error: 'paidDate is required when status is "paid"' },
          { status: 400 }
        );
      }
      updateData.paidDate = paidDate;
    } else {
      // If marking as pending, clear paidDate
      updateData.paidDate = null;
    }

    // Add notes if provided
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    // Update payment
    const { data: updatedPayment, error: updateError } = await supabase
      .from('SubcontractorPayment')
      .update(updateData)
      .eq('id', paymentId)
      .eq('organizationId', orgId)
      .select()
      .single();

    if (updateError || !updatedPayment) {
      console.error('[PaymentUpdate] Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      payment: updatedPayment,
    });
  } catch (error) {
    console.error('[PaymentUpdate] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
