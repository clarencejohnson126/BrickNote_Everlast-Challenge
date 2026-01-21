import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GAMMA_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Gamma API key not configured' },
        { status: 500 }
      );
    }

    const { generationId } = await request.json();

    if (!generationId) {
      return NextResponse.json(
        { success: false, error: 'No generation ID provided' },
        { status: 400 }
      );
    }

    const response = await fetch(`https://public-api.gamma.app/v1.0/generations/${generationId}`, {
      method: 'GET',
      headers: {
        'X-API-KEY': apiKey,
      },
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
      status: result.status,
      url: result.gammaUrl,
    });
  } catch (error) {
    console.error('Gamma status check error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Status check failed' },
      { status: 500 }
    );
  }
}
