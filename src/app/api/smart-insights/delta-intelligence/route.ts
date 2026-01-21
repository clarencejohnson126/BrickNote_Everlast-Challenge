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

    const { currentTranscript, currentDiary, currentDefect, previousEntries, language } = await request.json();

    // Format previous entries for the prompt
    const previousEntriesText = (previousEntries || [])
      .map(
        (entry: { created_at: string; diary_markdown: string; defect_markdown: string }, i: number) =>
          `--- Eintrag ${i + 1} (${entry.created_at}) ---\nTagesbericht:\n${entry.diary_markdown}\n\nMängelbericht:\n${entry.defect_markdown}`
      )
      .join('\n\n');

    const systemPrompt = language === 'de'
      ? `Du bist ein Experte für Baustellenmanagement. Vergleiche den aktuellen Eintrag mit vorherigen Einträgen desselben Projekts.

Identifiziere:
1. Neue Elemente, die vorher nicht erwähnt wurden
2. Gelöste Probleme, die vorher offen waren
3. Wiederkehrende Themen oder Probleme

Antworte NUR mit einem JSON-Objekt im folgenden Format:
{
  "newItems": [
    {
      "item": "Beschreibung",
      "category": "work" | "defect" | "material" | "personnel" | "other",
      "significance": "major" | "minor"
    }
  ],
  "resolvedItems": [
    {
      "item": "Beschreibung",
      "previousMention": "Datum oder Referenz",
      "resolution": "Wie es gelöst wurde"
    }
  ],
  "recurringIssues": [
    {
      "issue": "Beschreibung",
      "occurrences": Anzahl,
      "trend": "improving" | "stable" | "worsening",
      "firstMention": "Datum"
    }
  ],
  "progressSummary": "Zusammenfassung des Fortschritts",
  "comparisonPeriod": {
    "currentDate": "Aktuelles Datum",
    "previousEntriesCount": Anzahl,
    "dateRange": "Zeitspanne"
  }
}`
      : `You are a construction site management expert. Compare the current entry with previous entries from the same project.

Identify:
1. New elements that weren't mentioned before
2. Resolved issues that were previously open
3. Recurring themes or problems

Respond ONLY with a JSON object in the following format:
{
  "newItems": [
    {
      "item": "Description",
      "category": "work" | "defect" | "material" | "personnel" | "other",
      "significance": "major" | "minor"
    }
  ],
  "resolvedItems": [
    {
      "item": "Description",
      "previousMention": "Date or reference",
      "resolution": "How it was resolved"
    }
  ],
  "recurringIssues": [
    {
      "issue": "Description",
      "occurrences": Number,
      "trend": "improving" | "stable" | "worsening",
      "firstMention": "Date"
    }
  ],
  "progressSummary": "Summary of progress",
  "comparisonPeriod": {
    "currentDate": "Current date",
    "previousEntriesCount": Number,
    "dateRange": "Date range"
  }
}`;

    const userContent = (!previousEntries || previousEntries.length === 0)
      ? `Aktueller Eintrag / Current Entry:\nTranskript:\n${currentTranscript}\n\nTagesbericht:\n${currentDiary}\n\nMängelbericht:\n${currentDefect}\n\nKeine vorherigen Einträge verfügbar. / No previous entries available.`
      : `Aktueller Eintrag / Current Entry:\nTranskript:\n${currentTranscript}\n\nTagesbericht:\n${currentDiary}\n\nMängelbericht:\n${currentDefect}\n\n--- Vorherige Einträge / Previous Entries ---\n${previousEntriesText}`;

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
    console.error('Delta intelligence error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}
