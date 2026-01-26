import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import type { SendMessageRequest } from '@/types/client-portal';

// POST /api/client-portal/messages - Send a message as client
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json() as SendMessageRequest;

    if (!body.token || !body.message) {
      return NextResponse.json(
        { error: 'token and message are required' },
        { status: 400 }
      );
    }

    // Validate token
    const { data: accessToken, error: tokenError } = await supabase
      .from('ClientAccessToken')
      .select('id, jobId, organizationId, clientName, clientEmail')
      .eq('token', body.token)
      .eq('isActive', true)
      .gt('expiresAt', new Date().toISOString())
      .single();

    if (tokenError || !accessToken) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Create message
    const { data: message, error: messageError } = await supabase
      .from('ClientMessage')
      .insert({
        accessTokenId: accessToken.id,
        jobId: accessToken.jobId,
        organizationId: accessToken.organizationId,
        authorType: 'client',
        authorName: accessToken.clientName || accessToken.clientEmail,
        message: body.message,
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error creating message:', messageError);
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      );
    }

    // TODO: Send notification to admin

    return NextResponse.json({ message, success: true });
  } catch (error) {
    console.error('Error in messages endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/client-portal/messages - Get messages for a token
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'token is required' },
        { status: 400 }
      );
    }

    // Validate token
    const { data: accessToken, error: tokenError } = await supabase
      .from('ClientAccessToken')
      .select('id')
      .eq('token', token)
      .eq('isActive', true)
      .gt('expiresAt', new Date().toISOString())
      .single();

    if (tokenError || !accessToken) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Fetch messages
    const { data: messages, error } = await supabase
      .from('ClientMessage')
      .select('*')
      .eq('accessTokenId', accessToken.id)
      .order('createdAt', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (error) {
    console.error('Error in messages endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
