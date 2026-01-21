import { NextRequest, NextResponse } from 'next/server';

// Use Node.js runtime for consistent behavior
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

    const { transcript, diaryMarkdown, defectMarkdown, language } = await request.json();

    const systemPrompt = language === 'de'
      ? `Du bist ein Dokumentationsexperte. Vergleiche das Transkript mit den generierten Berichten und bewerte die Vollständigkeit.

Prüfe, ob alle wichtigen Elemente aus dem Transkript erfasst wurden:
- Datum und Uhrzeit
- Ort/Baustelleninformationen
- Anwesende Personen/Gewerke
- Durchgeführte Arbeiten
- Materialien
- Wetterbedingungen (falls erwähnt)
- Sicherheitsvorfälle (falls erwähnt)

Antworte NUR mit einem JSON-Objekt im folgenden Format:
{
  "completenessPercentage": 0-100,
  "confidenceLevel": "high" | "medium" | "low",
  "capturedElements": [
    {
      "element": "Elementname",
      "source": "Zitat aus Transkript",
      "captured": true/false
    }
  ],
  "missingElements": [
    {
      "element": "Elementname",
      "reason": "Warum es fehlt",
      "importance": "critical" | "important" | "optional"
    }
  ],
  "summary": "Zusammenfassung der Vollständigkeit"
}`
      : `You are a documentation expert. Compare the transcript with the generated reports and evaluate completeness.

Check if all important elements from the transcript were captured:
- Date and time
- Location/site information
- Personnel present
- Work performed
- Materials
- Weather conditions (if mentioned)
- Safety incidents (if mentioned)

Respond ONLY with a JSON object in the following format:
{
  "completenessPercentage": 0-100,
  "confidenceLevel": "high" | "medium" | "low",
  "capturedElements": [
    {
      "element": "Element name",
      "source": "Quote from transcript",
      "captured": true/false
    }
  ],
  "missingElements": [
    {
      "element": "Element name",
      "reason": "Why it's missing",
      "importance": "critical" | "important" | "optional"
    }
  ],
  "summary": "Summary of completeness"
}`;

    const userContent = `Transkript / Transcript:\n${transcript}\n\nGenerierter Tagesbericht / Generated Daily Report:\n${diaryMarkdown}\n\nGenerierter Mängelbericht / Generated Defect Report:\n${defectMarkdown}`;

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
          { role: 'user', content: userContent },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
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
    const content = result.choices[0].message.content;
    const parsed = JSON.parse(content);

    return NextResponse.json({ success: true, data: parsed });
  } catch (error) {
    console.error('Confidence meter error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}
