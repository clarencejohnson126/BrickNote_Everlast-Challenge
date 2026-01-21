import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const { transcript, language, projectName } = await request.json();

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
      ? `Du bist ein Assistent für Baustellendokumentation. Erstelle aus der Sprachnotiz einen strukturierten Tagesbericht im Markdown-Format.

WICHTIG: Das aktuelle Datum ist ${currentDate}, Uhrzeit ${currentTime}. Verwende IMMER dieses Datum im Bericht, UNABHÄNGIG davon was der Benutzer im Transkript sagt.

Verwende folgende Struktur:
# Tagesbericht - ${projectName || 'Baustelle'}
## Datum: ${currentDate}

### Anwesende Gewerke
- [Liste der erwähnten Gewerke/Firmen]

### Durchgeführte Arbeiten
- [Detaillierte Auflistung]

### Materiallieferungen
- [Falls erwähnt]

### Besondere Vorkommnisse
- [Falls erwähnt]

### Nächste Schritte
- [Falls erwähnt]

WICHTIG: Erfinde KEINE Informationen. Nutze NUR das, was in der Sprachnotiz erwähnt wird. Wenn etwas nicht erwähnt wird, lasse den Abschnitt weg.`
      : `You are a construction site documentation assistant. Create a structured daily report in Markdown format from the voice note.

IMPORTANT: The current date is ${currentDate}, time ${currentTime}. ALWAYS use this date in the report, REGARDLESS of what the user says in the transcript.

Use this structure:
# Daily Report - ${projectName || 'Construction Site'}
## Date: ${currentDate}

### Present Trades/Contractors
- [List of mentioned trades/companies]

### Work Completed
- [Detailed list]

### Material Deliveries
- [If mentioned]

### Special Incidents
- [If mentioned]

### Next Steps
- [If mentioned]

IMPORTANT: Do NOT invent information. Only use what is mentioned in the voice note. If something is not mentioned, omit that section.`;

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
    return NextResponse.json({ success: true, markdown: result.choices[0].message.content });
  } catch (error) {
    console.error('Diary generation error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Diary generation failed' },
      { status: 500 }
    );
  }
}
