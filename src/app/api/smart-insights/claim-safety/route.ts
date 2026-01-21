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

    const { diaryMarkdown, defectMarkdown, language } = await request.json();

    const systemPrompt = language === 'de'
      ? `Du bist ein Experte für deutsches Baurecht, VOB, BGB und Haftungsrecht. Analysiere den Baustellenbericht auf rechtliche Risiken.

WICHTIG: Deine Umformulierungen müssen RECHTLICH FUNDIERT sein und sich deutlich vom Original unterscheiden.

Identifiziere problematische Formulierungen und liefere:
1. Eine rechtliche Begründung mit Verweis auf relevante Vorschriften (VOB/B, BGB, DIN-Normen, ArbSchG, etc.)
2. Eine rechtssichere Umformulierung, die Haftungsrisiken minimiert

Relevante Rechtsgrundlagen:
- VOB/B §4 (Ausführung), §13 (Mängelansprüche), §6 (Behinderung)
- BGB §631ff (Werkvertragsrecht), §823 (Deliktshaftung), §280 (Schadensersatz)
- DIN 1961 (VOB/B), DIN 18299ff (Allgemeine Technische Vertragsbedingungen)
- ArbSchG, BaustellV (Arbeitsschutz)

Beispiel für gute Umformulierung:
- Original: "Der Elektriker hat den Fehler gemacht"
- Schlecht: "Es gab einen Fehler beim Elektriker" (nur umformuliert, gleiche Haftungsimplikation)
- GUT: "Bei der Elektroinstallation wurde eine Abweichung von DIN VDE 0100-600 festgestellt. Die Ursachenklärung erfolgt gemäß VOB/B §4 Abs. 7." (rechtssicher, keine Schuldzuweisung, Normverweis)

Antworte NUR mit einem JSON-Objekt:
{
  "riskLevel": "safe" | "caution" | "risky",
  "riskPercentage": 0-100,
  "overallSafetyScore": 0-100,
  "problematicPhrases": [
    {
      "original": "Originaltext",
      "issue": "Rechtliches Problem mit Verweis auf Vorschrift (z.B. 'Kann als Schuldanerkenntnis nach BGB §781 gewertet werden')",
      "suggestedRewrite": "Rechtssichere Formulierung mit Normverweis",
      "legalReference": "z.B. VOB/B §13 Abs. 1, BGB §634",
      "riskContribution": 1-10
    }
  ],
  "summary": "Rechtliche Zusammenfassung mit Handlungsempfehlungen"
}`
      : `You are an expert in German construction law (VOB, BGB) and liability assessment. Analyze the construction report for legal risks.

IMPORTANT: Your rewrites must be LEGALLY SUBSTANTIVE and clearly different from the original.

Identify problematic phrases and provide:
1. Legal justification with reference to relevant regulations (VOB/B, BGB, DIN standards, etc.)
2. A legally safe reformulation that minimizes liability risks

Relevant legal frameworks:
- VOB/B §4 (Execution), §13 (Defect claims), §6 (Obstruction)
- BGB §631ff (Contract for work), §823 (Tort liability), §280 (Damages)
- DIN 1961 (VOB/B), DIN 18299ff (General Technical Contract Terms)
- ArbSchG, BaustellV (Occupational safety)

Example of good rewrite:
- Original: "The electrician made the mistake"
- BAD: "There was a mistake by the electrician" (just reworded, same liability implication)
- GOOD: "A deviation from DIN VDE 0100-600 was identified in the electrical installation. Root cause analysis to be conducted per VOB/B §4 Para. 7." (legally safe, no blame attribution, norm reference)

Respond ONLY with a JSON object:
{
  "riskLevel": "safe" | "caution" | "risky",
  "riskPercentage": 0-100,
  "overallSafetyScore": 0-100,
  "problematicPhrases": [
    {
      "original": "Original text",
      "issue": "Legal problem with regulation reference (e.g. 'Could be interpreted as admission of fault under BGB §781')",
      "suggestedRewrite": "Legally safe formulation with norm reference",
      "legalReference": "e.g. VOB/B §13 Para. 1, BGB §634",
      "riskContribution": 1-10
    }
  ],
  "summary": "Legal summary with action recommendations"
}`;

    const userContent = `Tagesbericht / Daily Report:\n${diaryMarkdown}\n\nMängelbericht / Defect Report:\n${defectMarkdown}`;

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
    console.error('Claim safety error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}
