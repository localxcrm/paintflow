import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib/openai';

// POST /api/ai/transcribe - Transcribe audio to text using Whisper
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const language = formData.get('language') as string | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      );
    }

    // Transcribe the audio using OpenAI Whisper
    // Default language is Portuguese (pt) - can be overridden via form data
    const transcription = await transcribeAudio(audioFile, language || undefined);

    return NextResponse.json({
      text: transcription,
    });
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}
