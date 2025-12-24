import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Convert File to Buffer for OpenAI
        const buffer = Buffer.from(await file.arrayBuffer());

        // Transcription using Whisper
        const transcription = await openai.audio.transcriptions.create({
            file: file, // Node.js OpenAI client handles File objects in some environments or we might need to handle stream
            model: 'whisper-1',
            language: 'pt', // Assuming Portuguese as per user context
        });

        return NextResponse.json({ text: transcription.text });

    } catch (error) {
        console.error('Transcription Error:', error);
        return NextResponse.json(
            { error: 'Failed to transcribe audio', details: error instanceof Error ? error.message : 'Unknown' },
            { status: 500 }
        );
    }
}
