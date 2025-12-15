import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// POST /api/estimates/[id]/signature - Add signature to estimate
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if estimate exists
    const estimate = await prisma.estimate.findUnique({
      where: { id },
      include: { signature: true },
    });

    if (!estimate) {
      return NextResponse.json(
        { error: 'Estimate not found' },
        { status: 404 }
      );
    }

    // If signature already exists, update it
    if (estimate.signature) {
      const signature = await prisma.estimateSignature.update({
        where: { estimateId: id },
        data: {
          clientName: body.clientName,
          signatureDataUrl: body.signatureDataUrl,
          signedAt: new Date(),
          ipAddress: body.ipAddress || request.headers.get('x-forwarded-for') || 'unknown',
        },
      });

      // Update estimate status to accepted
      await prisma.estimate.update({
        where: { id },
        data: { status: 'accepted' },
      });

      return NextResponse.json(signature);
    }

    // Create new signature
    const signature = await prisma.estimateSignature.create({
      data: {
        estimateId: id,
        clientName: body.clientName,
        signatureDataUrl: body.signatureDataUrl,
        ipAddress: body.ipAddress || request.headers.get('x-forwarded-for') || 'unknown',
      },
    });

    // Update estimate status to accepted
    await prisma.estimate.update({
      where: { id },
      data: { status: 'accepted' },
    });

    return NextResponse.json(signature, { status: 201 });
  } catch (error) {
    console.error('Error adding signature:', error);
    return NextResponse.json(
      { error: 'Failed to add signature' },
      { status: 500 }
    );
  }
}

// GET /api/estimates/[id]/signature - Get signature for estimate
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const signature = await prisma.estimateSignature.findUnique({
      where: { estimateId: id },
    });

    if (!signature) {
      return NextResponse.json(
        { error: 'Signature not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(signature);
  } catch (error) {
    console.error('Error fetching signature:', error);
    return NextResponse.json(
      { error: 'Failed to fetch signature' },
      { status: 500 }
    );
  }
}
