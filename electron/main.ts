import {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
} from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;

// Deep link protocol
const PROTOCOL = 'bricknote';

// Load environment variables from .env file
function loadEnv() {
  const envPath = path.join(app.getAppPath(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach((line) => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    });
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'hiddenInset',
    title: 'BrickNote',
  });

  // In development, load from Next.js dev server
  if (process.env.NODE_ENV !== 'production') {
    mainWindow.loadURL('http://localhost:3007');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load from exported static files
    mainWindow.loadFile(path.join(__dirname, '../out/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Handle deep link URL (for auth callback)
function handleDeepLink(url: string) {
  console.log('Deep link received:', url);

  if (!mainWindow) {
    createWindow();
  }

  // Extract the hash/query from the deep link
  // URL format: bricknote://auth/callback#access_token=xxx&refresh_token=xxx
  // or: bricknote://auth/callback?access_token=xxx&refresh_token=xxx
  try {
    const urlObj = new URL(url);
    const hash = urlObj.hash || '';
    const search = urlObj.search || '';

    // Forward the auth tokens to the renderer
    if (mainWindow) {
      // Navigate to the app with the tokens
      const baseUrl = process.env.NODE_ENV !== 'production'
        ? 'http://localhost:3007'
        : `file://${path.join(__dirname, '../out/index.html')}`;

      // Append the hash or search params
      const fullUrl = baseUrl + (hash || search);
      mainWindow.loadURL(fullUrl);
      mainWindow.focus();
    }
  } catch (error) {
    console.error('Failed to parse deep link:', error);
  }
}

// Register global hotkey for recording toggle
function registerGlobalShortcut() {
  const shortcut = 'CommandOrControl+Shift+Space';

  console.log('[Hotkey] Attempting to register global shortcut:', shortcut);

  const registered = globalShortcut.register(shortcut, () => {
    console.log('[Hotkey] Cmd+Shift+Space pressed! Sending recording:toggle event');
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('recording:toggle');
      console.log('[Hotkey] Event sent to renderer');
    } else {
      console.error('[Hotkey] mainWindow or webContents not available');
    }
  });

  if (!registered) {
    console.error('[Hotkey] Failed to register global shortcut:', shortcut);
  } else {
    console.log('[Hotkey] Successfully registered global shortcut:', shortcut);
  }
}

// IPC Handler: Transcribe audio using OpenAI Whisper
ipcMain.handle(
  'stt:transcribe',
  async (_event, audioBuffer: ArrayBuffer, language: string) => {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY not configured');
      }

      // Use Node.js native Blob and File APIs (available in Node 18+)
      const audioBlob = new Blob([Buffer.from(audioBuffer)], { type: 'audio/webm' });
      const audioFile = new File([audioBlob], 'audio.webm', { type: 'audio/webm' });

      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('model', 'whisper-1');
      formData.append('language', language === 'de' ? 'de' : 'en');

      const response = await fetch(
        'https://api.openai.com/v1/audio/transcriptions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Whisper API error: ${error}`);
      }

      const result = await response.json();
      return { success: true, text: result.text };
    } catch (error) {
      console.error('Transcription error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
);

// IPC Handler: Generate diary entry using GPT-4o
ipcMain.handle(
  'llm:generateDiary',
  async (_event, transcript: string, language: string, projectName: string) => {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY not configured');
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

      const systemPrompt =
        language === 'de'
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

      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
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
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${error}`);
      }

      const result = await response.json();
      return { success: true, markdown: result.choices[0].message.content };
    } catch (error) {
      console.error('Diary generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
);

// IPC Handler: Generate defect report using GPT-4o
ipcMain.handle(
  'llm:generateDefect',
  async (_event, transcript: string, language: string) => {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY not configured');
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

      const systemPrompt =
        language === 'de'
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

      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
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
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${error}`);
      }

      const result = await response.json();
      const content = result.choices[0].message.content;

      return { success: true, markdown: content, json: null };
    } catch (error) {
      console.error('Defect generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
);

// IPC Handler: Generate presentation using Gamma API
ipcMain.handle(
  'gamma:generatePresentation',
  async (_event, content: string, title: string) => {
    try {
      const apiKey = process.env.GAMMA_API_KEY;
      if (!apiKey) {
        throw new Error('GAMMA_API_KEY not configured');
      }

      // Create the presentation generation request
      const response = await fetch(
        'https://public-api.gamma.app/v1.0/generations',
        {
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
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Gamma API error: ${error}`);
      }

      const result = await response.json();
      return {
        success: true,
        generationId: result.generationId || result.id,
      };
    } catch (error) {
      console.error('Gamma presentation generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
);

// IPC Handler: Check Gamma generation status
ipcMain.handle(
  'gamma:checkStatus',
  async (_event, generationId: string) => {
    try {
      const apiKey = process.env.GAMMA_API_KEY;
      if (!apiKey) {
        throw new Error('GAMMA_API_KEY not configured');
      }

      const response = await fetch(
        `https://public-api.gamma.app/v1.0/generations/${generationId}`,
        {
          method: 'GET',
          headers: {
            'X-API-KEY': apiKey,
          },
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Gamma API error: ${error}`);
      }

      const result = await response.json();
      console.log('Gamma status response:', JSON.stringify(result));
      return {
        success: true,
        status: result.status,
        url: result.gammaUrl,
      };
    } catch (error) {
      console.error('Gamma status check error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
);

// IPC Handler: Generate Claim Safety analysis
ipcMain.handle(
  'llm:generateClaimSafety',
  async (_event, diaryMarkdown: string, defectMarkdown: string, language: string) => {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY not configured');
      }

      const systemPrompt =
        language === 'de'
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

      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
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
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${error}`);
      }

      const result = await response.json();
      const content = result.choices[0].message.content;
      const parsed = JSON.parse(content);

      return { success: true, data: parsed };
    } catch (error) {
      console.error('Claim Safety generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
);

// IPC Handler: Generate Confidence Meter analysis
ipcMain.handle(
  'llm:generateConfidenceMeter',
  async (_event, transcript: string, diaryMarkdown: string, defectMarkdown: string, language: string) => {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY not configured');
      }

      const systemPrompt =
        language === 'de'
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

      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
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
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${error}`);
      }

      const result = await response.json();
      const content = result.choices[0].message.content;
      const parsed = JSON.parse(content);

      return { success: true, data: parsed };
    } catch (error) {
      console.error('Confidence Meter generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
);

// IPC Handler: Generate Delta Intelligence analysis
ipcMain.handle(
  'llm:generateDeltaIntelligence',
  async (
    _event,
    currentTranscript: string,
    currentDiary: string,
    currentDefect: string,
    previousEntries: Array<{ created_at: string; diary_markdown: string; defect_markdown: string }>,
    language: string
  ) => {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY not configured');
      }

      // Format previous entries for the prompt
      const previousEntriesText = previousEntries
        .map(
          (entry, i) =>
            `--- Eintrag ${i + 1} (${entry.created_at}) ---\nTagesbericht:\n${entry.diary_markdown}\n\nMängelbericht:\n${entry.defect_markdown}`
        )
        .join('\n\n');

      const systemPrompt =
        language === 'de'
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

      const userContent =
        previousEntries.length === 0
          ? `Aktueller Eintrag / Current Entry:\nTranskript:\n${currentTranscript}\n\nTagesbericht:\n${currentDiary}\n\nMängelbericht:\n${currentDefect}\n\nKeine vorherigen Einträge verfügbar. / No previous entries available.`
          : `Aktueller Eintrag / Current Entry:\nTranskript:\n${currentTranscript}\n\nTagesbericht:\n${currentDiary}\n\nMängelbericht:\n${currentDefect}\n\n--- Vorherige Einträge / Previous Entries ---\n${previousEntriesText}`;

      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
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
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${error}`);
      }

      const result = await response.json();
      const content = result.choices[0].message.content;
      const parsed = JSON.parse(content);

      return { success: true, data: parsed };
    } catch (error) {
      console.error('Delta Intelligence generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
);

// Register as default protocol handler for 'bricknote://'
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient(PROTOCOL);
}

// Handle protocol on macOS
app.on('open-url', (event, url) => {
  event.preventDefault();
  handleDeepLink(url);
});

// Handle protocol on Windows/Linux (single instance)
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, commandLine) => {
    // Someone tried to run a second instance, focus our window
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }

    // Handle deep link from command line (Windows)
    const url = commandLine.find((arg) => arg.startsWith(`${PROTOCOL}://`));
    if (url) {
      handleDeepLink(url);
    }
  });
}

// App lifecycle
app.whenReady().then(() => {
  loadEnv();
  createWindow();
  registerGlobalShortcut();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
