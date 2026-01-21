import { NextRequest, NextResponse } from 'next/server';

// Use Node.js runtime for consistent behavior
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GAMMA_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Gamma API key not configured' },
        { status: 500 }
      );
    }

    const { content, title } = await request.json();

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'No content provided' },
        { status: 400 }
      );
    }

    const response = await fetch('https://public-api.gamma.app/v1.0/generations', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputText: `${title}\n\n${content}`,
        textMode: 'condense',
        format: 'document',
        numCards: 2,
        cardOptions: {
          dimensions: 'a4',
        },
        textOptions: {
          tone: 'professional',
          language: 'de',
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { success: false, error: `Gamma API error: ${error}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json({
      success: true,
      generationId: result.generationId || result.id,
    });
  } catch (error) {
    console.error('Gamma generation error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    );
  }
}
