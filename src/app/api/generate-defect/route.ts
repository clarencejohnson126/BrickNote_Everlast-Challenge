import { NextRequest, NextResponse } from 'next/server';

// Use Node.js runtime for consistent behavior in both dev and production
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const { transcript, language } = await request.json();

    if (!transcript) {
      return NextResponse.json(
        { success: false, error: 'No transcript provided' },
        { status: 400 }
      );
    }

    // Get actual current date and time
    const now = new Date();
    const currentDate = now.toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const currentTime = now.toLocaleTimeString(language === 'de' ? 'de-DE' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const systemPrompt = language === 'de'
      ? `Du bist ein Assistent für Baustellendokumentation. Analysiere die Sprachnotiz auf Mängel oder Probleme.

WICHTIG: Das aktuelle Datum ist ${currentDate}, Uhrzeit ${currentTime}. Verwende IMMER dieses Datum im Bericht.

Wenn Mängel erwähnt werden, erstelle einen strukturierten Mängelbericht im Markdown-Format:
# Mängelbericht
## Datum: ${currentDate}

### Mangel 1
- **Ort:** [Wo wurde der Mangel festgestellt]
- **Beschreibung:** [Detaillierte Beschreibung]
- **Gewerk:** [Verantwortliches Gewerk, falls bekannt]
- **Priorität:** [Hoch/Mittel/Niedrig, basierend auf Kontext]

Wiederhole für jeden erwähnten Mangel.

Wenn KEINE Mängel erwähnt werden, antworte nur mit:
"Keine Mängel in dieser Aufnahme dokumentiert."

WICHTIG: Erfinde KEINE Mängel. Dokumentiere NUR das, was explizit als Problem oder Mangel erwähnt wird.`
      : `You are a construction site documentation assistant. Analyze the voice note for defects or issues.

IMPORTANT: The current date is ${currentDate}, time ${currentTime}. ALWAYS use this date in the report.

If defects are mentioned, create a structured defect report in Markdown format:
# Defect Report
## Date: ${currentDate}

### Defect 1
- **Location:** [Where the defect was found]
- **Description:** [Detailed description]
- **Trade:** [Responsible trade, if known]
- **Priority:** [High/Medium/Low, based on context]

Repeat for each mentioned defect.

If NO defects are mentioned, respond only with:
"No defects documented in this recording."

IMPORTANT: Do NOT invent defects. Only document what is explicitly mentioned as a problem or defect.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: transcript },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { success: false, error: `OpenAI API error: ${error}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json({
      success: true,
      markdown: result.choices[0].message.content,
      json: null
    });
  } catch (error) {
    console.error('Defect generation error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Defect generation failed' },
      { status: 500 }
    );
  }
}
