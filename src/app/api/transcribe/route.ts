import { NextRequest, NextResponse } from 'next/server';

// Use Node.js runtime for better FormData/file handling
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    console.log('[Transcribe API] API key configured:', !!apiKey);

    if (!apiKey) {
      console.error('[Transcribe API] No API key found');
      return NextResponse.json(
        { success: false, error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const audioFile = formData.get('file') as File;
    const language = formData.get('language') as string || 'en';

    console.log('[Transcribe API] File received:', audioFile?.name, audioFile?.size, audioFile?.type);

    if (!audioFile) {
      console.error('[Transcribe API] No audio file in request');
      return NextResponse.json(
        { success: false, error: 'No audio file provided' },
        { status: 400 }
      );
    }

    if (audioFile.size === 0) {
      console.error('[Transcribe API] Empty audio file');
      return NextResponse.json(
        { success: false, error: 'Audio file is empty' },
        { status: 400 }
      );
    }

    // Forward to OpenAI Whisper API
    const openaiFormData = new FormData();
    openaiFormData.append('file', audioFile);
    openaiFormData.append('model', 'whisper-1');
    openaiFormData.append('language', language === 'de' ? 'de' : 'en');

    console.log('[Transcribe API] Calling OpenAI Whisper API...');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: openaiFormData,
    });

    console.log('[Transcribe API] OpenAI response status:', response.status);

    if (!response.ok) {
      const error = await response.text();
      console.error('[Transcribe API] OpenAI error:', error);
      return NextResponse.json(
        { success: false, error: `Whisper API error: ${error}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('[Transcribe API] Transcription success, text length:', result.text?.length);
    return NextResponse.json({ success: true, text: result.text });
  } catch (error) {
    console.error('[Transcribe API] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Transcription failed' },
      { status: 500 }
    );
  }
}
