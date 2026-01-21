# BrickNote

Desktop-Anwendung zur Sprachdokumentation auf Baustellen. Nehmen Sie Sprachnotizen vor Ort auf und erhalten Sie KI-generierte Tagesberichte und Mängeldokumentationen.

**Entwickelt für die EVERLAST KI Developer Challenge**

## Inhaltsverzeichnis

1. [Funktionen](#funktionen)
2. [Schnellstart (für Reviewer)](#schnellstart-für-reviewer)
3. [Vollständiger Workflow](#vollständiger-workflow)
4. [Smart Insights (Analyse)](#smart-insights-analyse)
5. [Architektur](#architektur)
6. [Installation & Einrichtung](#installation--einrichtung)
7. [Projektstruktur](#projektstruktur)

---

## Funktionen

- **Globaler Hotkey** - `Cmd+Shift+Space` (Mac) oder `Ctrl+Shift+Space` (Windows) zum Starten/Stoppen der Aufnahme
- **Spracherkennung** - Transkription powered by OpenAI Whisper API
- **KI-generierte Berichte** - GPT-4o erstellt strukturierte Tagesberichte und Mängeldokumentationen
- **Zweisprachig** - Umschaltbar zwischen Deutsch (DE) und Englisch (EN)
- **Projektverwaltung** - Aufnahmen nach Bauprojekt organisieren
- **Historie** - Vergangene Einträge ansehen, kopieren und verwalten
- **Magic Link Auth** - Passwortlose Anmeldung über Supabase
- **Gamma-Integration** - Professionelle Präsentationen aus Berichten generieren
- **Smart Insights** - KI-gestützte Analysen:
  - **Haftungsrisiko-Analyse** - Rechtliche Risikobewertung mit VOB/BGB-Referenzen
  - **Confidence Meter** - Vollständigkeitsbewertung der Dokumentation
  - **Delta Intelligence** - Änderungsverfolgung über Projekteinträge hinweg

---

## Schnellstart (für Reviewer)

```bash
# 1. Repository klonen
git clone https://github.com/clarencejohnson126/BrickNote_Everlast-Challenge.git
cd BrickNote_Everlast-Challenge

# 2. Abhängigkeiten installieren
npm install

# 3. .env-Datei erstellen (siehe .env.example)
cp .env.example .env
# Bearbeiten Sie .env mit Ihren Supabase- und OpenAI-Zugangsdaten

# 4. Electron-App starten
npm run dev

# 5. Mit E-Mail anmelden, Magic Link klicken, und loslegen!
```

**App testen:**
- Drücken Sie `Cmd+Shift+Space` um die Aufnahme zu starten/stoppen
- Sprechen Sie auf Deutsch oder Englisch über Bauarbeiten
- Überprüfen Sie die generierten Berichte in den Tabs

> **Hinweis für Reviewer:** Die App läuft in der Entwicklung auf `localhost:3007`. Magic Links leiten automatisch dorthin zurück.

---

## Vollständiger Workflow

### Schritt 1: Anmeldung

1. Öffnen Sie die App mit `npm run dev`
2. Geben Sie Ihre E-Mail-Adresse ein
3. Klicken Sie auf den Magic Link in Ihrer E-Mail
4. Sie werden automatisch in die App eingeloggt

### Schritt 2: Projekt auswählen/erstellen

1. Wählen Sie ein bestehendes Projekt aus der Dropdown-Liste
2. Oder erstellen Sie ein neues Projekt (z.B. "Baustelle Musterstraße 5")
3. Wählen Sie die Sprache (DE/EN) für die Ausgabe

### Schritt 3: Aufnahme starten

1. Drücken Sie den globalen Hotkey: `Cmd+Shift+Space` (Mac) / `Ctrl+Shift+Space` (Windows)
2. Der Aufnahme-Indikator erscheint (pulsierender roter Punkt)
3. Sprechen Sie Ihre Beobachtungen, z.B.:
   - *"Heute haben wir die Betonarbeiten im Erdgeschoss abgeschlossen. Es gab Verzögerungen wegen Lieferproblemen beim Bewehrungsstahl. Im Bad wurden Risse in der Fliesen bemerkt, etwa 3 Stück betroffen..."*

### Schritt 4: Aufnahme beenden & Verarbeitung

1. Drücken Sie erneut `Cmd+Shift+Space` um die Aufnahme zu stoppen
2. Die App verarbeitet automatisch:
   - **Transkription** via OpenAI Whisper → Ihr gesprochenes Wort wird zu Text
   - **Tagesbericht-Generierung** via GPT-4o → Strukturierter Bericht
   - **Mängelbericht-Generierung** via GPT-4o → Defekt-Dokumentation

### Schritt 5: Ergebnisse prüfen

Nach der Verarbeitung sehen Sie drei Tabs:

| Tab | Inhalt |
|-----|--------|
| **Transkript** | Ihr ursprüngliches, wörtliches Transkript |
| **Tagesbericht** | Strukturierter Bericht mit Datum, Wetter, Personal, erledigte Arbeiten |
| **Mängelbericht** | Liste erkannter Mängel mit Beschreibung, Ort, Schweregrad |

### Schritt 6: Gamma-Dokument erstellen (Optional)

1. Klicken Sie auf "Gamma-Präsentation generieren"
2. Die App erstellt automatisch ein professionelles Dokument via Gamma API
3. Nach Fertigstellung erhalten Sie einen Link zur Präsentation
4. Ideal für Bauherren-Meetings oder Projektberichte

### Schritt 7: Smart Insights analysieren

1. Klicken Sie auf "Analysieren" (oder das Analyse-Icon)
2. Die KI analysiert Ihre Dokumentation auf:
   - Haftungsrisiken
   - Vollständigkeit
   - Änderungen gegenüber vorherigen Einträgen

### Schritt 8: Speichern

1. Klicken Sie auf "Speichern"
2. Der Eintrag wird in Ihrer Historie gespeichert
3. Zugriff jederzeit über das Historie-Panel

---

## Smart Insights (Analyse)

BrickNote bietet drei KI-gestützte Analysefunktionen:

### 1. Haftungsrisiko-Analyse (Claim Safety Layer)

**Zweck:** Identifiziert rechtlich problematische Formulierungen in Ihrer Dokumentation.

**Funktionsweise:**
- Analysiert Tagesbericht und Mängelbericht
- Prüft auf VOB/BGB-relevante Risiken
- Bewertet jede problematische Phrase

**Ausgabe:**
```
Risikolevel: VORSICHT (45%)

Problematische Formulierungen:
┌─────────────────────────────────────────────────────────┐
│ Original: "Der Mangel wurde vom Subunternehmer verursacht"
│ Problem: Schuldzuweisung ohne Beweissicherung
│ Empfehlung: "Ein Mangel wurde festgestellt. Ursache wird geprüft."
│ Risikobeitrag: 25%
└─────────────────────────────────────────────────────────┘
```

**Risikostufen:**
- 🟢 **Sicher** (0-30%): Dokumentation ist rechtlich unbedenklich
- 🟡 **Vorsicht** (31-60%): Einige Formulierungen sollten überarbeitet werden
- 🔴 **Riskant** (61-100%): Dringend überarbeiten vor Verwendung

### 2. Confidence Meter (Vollständigkeits-Score)

**Zweck:** Bewertet, wie vollständig Ihre Dokumentation ist.

**Prüft auf:**
- Datum und Uhrzeit
- Beteiligte Personen/Firmen
- Wetterbedingungen
- Ausgeführte Arbeiten
- Material-Dokumentation
- Mängelbeschreibungen mit Fotos/Ort

**Ausgabe:**
```
Vollständigkeit: 78%
Confidence Level: MITTEL

Erfasste Elemente:
✓ Datum/Uhrzeit     ✓ Wetterbedingungen    ✓ Ausgeführte Arbeiten
✗ Personal-Liste    ✗ Material-Mengen      ✓ Mängel dokumentiert

Fehlende Elemente:
• Personal-Liste (KRITISCH) - Wichtig für Nachweispflicht
• Material-Mengen (WICHTIG) - Relevant für Abrechnung
```

### 3. Delta Intelligence (Änderungsverfolgung)

**Zweck:** Vergleicht den aktuellen Eintrag mit vorherigen Einträgen desselben Projekts.

**Analysiert:**
- **Neue Einträge**: Was ist heute neu?
- **Gelöste Probleme**: Welche früheren Mängel wurden behoben?
- **Wiederkehrende Probleme**: Welche Issues tauchen immer wieder auf?

**Ausgabe:**
```
Delta Intelligence - Projekt "Baustelle Musterstraße"

NEUE EINTRÄGE:
• Betonarbeiten EG abgeschlossen (MAJOR - Kategorie: Arbeit)
• Lieferverzögerung Bewehrungsstahl (MINOR - Kategorie: Material)

GELÖSTE PROBLEME:
• "Wassereinbruch Keller" - Erstmals erwähnt: 15.01.2026
  → Heute gelöst: "Abdichtung abgeschlossen"

WIEDERKEHRENDE PROBLEME:
• Lieferverzögerungen (3 Vorkommen, Trend: STABIL)
  Erste Erwähnung: 10.01.2026
```

---

## Architektur

```
┌─────────────────────────────────────────────────────────────┐
│                    Electron Main Process                     │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐ │
│  │ Globale     │  │ IPC Handler │  │ OpenAI API Calls     │ │
│  │ Shortcuts   │  │ (Preload)   │  │ - Whisper STT        │ │
│  └─────────────┘  └─────────────┘  │ - GPT-4o LLM         │ │
│                                     └──────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │ IPC
┌─────────────────────────────────────────────────────────────┐
│                    Electron Renderer (Next.js)               │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐ │
│  │ React UI    │  │ MediaRecorder│  │ Supabase Client     │ │
│  │ Components  │  │ Audio API   │  │ - Auth              │ │
│  └─────────────┘  └─────────────┘  │ - Database          │ │
│                                     └──────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                         Supabase                             │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐ │
│  │ Auth        │  │ PostgreSQL  │  │ Row Level Security   │ │
│  │ (Magic Link)│  │ Database    │  │ (RLS)               │ │
│  └─────────────┘  └─────────────┘  └──────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Design-Entscheidungen

| Entscheidung | Begründung |
|--------------|------------|
| **API-Calls im Main Process** | API-Keys bleiben sicher, keine Exposure im Client-Code |
| **MediaRecorder im Renderer** | Browser-API funktioniert gut in Electron's Chromium |
| **Parallele LLM-Calls** | Tages- und Mängelbericht werden gleichzeitig generiert |
| **Magic Link Auth** | Einfache UX für Bauarbeiter - kein Passwort nötig |
| **Tailwind CSS** | Schnell zu entwickeln, leichtgewichtig |

---

## Installation & Einrichtung

### Voraussetzungen

- Node.js 18+
- Supabase Projekt
- OpenAI API Key
- (Optional) Gamma API Key für Präsentationen

### Umgebungsvariablen

Erstellen Sie eine `.env`-Datei im Projektroot:

```env
# Supabase (im Renderer verwendet)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OpenAI (im Electron Main Process verwendet)
OPENAI_API_KEY=sk-your-openai-api-key

# Gamma (optional, für Präsentationen)
GAMMA_API_KEY=your-gamma-api-key
```

### Datenbank-Setup

Die folgenden Tabellen werden in Supabase benötigt:

**bricknote_projects**
```sql
create table public.bricknote_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  created_at timestamptz default now()
);

alter table public.bricknote_projects enable row level security;

create policy "Users can CRUD own projects"
  on public.bricknote_projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

**bricknote_voice_entries**
```sql
create table public.bricknote_voice_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  project_id uuid references public.bricknote_projects on delete set null,
  created_at timestamptz default now(),
  language text check (language in ('de','en')) not null,
  transcript_raw text not null,
  diary_markdown text not null,
  defect_markdown text not null,
  defect_json jsonb,
  meta jsonb
);

alter table public.bricknote_voice_entries enable row level security;

create policy "Users can CRUD own entries"
  on public.bricknote_voice_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

### Supabase Auth Konfiguration

Im Supabase Dashboard unter **Authentication → URL Configuration** diese Redirect URLs hinzufügen:

```
http://localhost:3007/**
bricknote://auth/callback
```

Die erste ist für die Entwicklung, die zweite für die verpackte Desktop-App.

### Installation

```bash
# Abhängigkeiten installieren
npm install

# Entwicklungsmodus starten
npm run dev

# Für Produktion bauen
npm run build

# Für Distribution verpacken
npm run package
```

---

## Projektstruktur

```
/BrickNote
├── electron/
│   ├── main.ts           # Electron Main Process
│   ├── preload.ts        # Sichere IPC-Brücke
│   └── tsconfig.json
├── src/
│   ├── app/
│   │   ├── api/          # API Routes (für Browser/Vercel)
│   │   │   ├── generate-diary/
│   │   │   ├── generate-defect/
│   │   │   ├── transcribe/
│   │   │   ├── gamma/
│   │   │   └── smart-insights/
│   │   ├── layout.tsx
│   │   ├── page.tsx      # Haupt-App-Einstieg
│   │   └── globals.css
│   ├── components/
│   │   ├── auth/
│   │   │   └── LoginForm.tsx
│   │   ├── recording/
│   │   │   ├── RecordingProvider.tsx
│   │   │   └── RecordingIndicator.tsx
│   │   ├── main/
│   │   │   ├── TopBar.tsx
│   │   │   ├── TranscriptPanel.tsx
│   │   │   ├── OutputTabs.tsx
│   │   │   ├── SmartInsightsPanel.tsx
│   │   │   └── HistoryPanel.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── CopyButton.tsx
│   │       └── MarkdownPreview.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useProjects.ts
│   │   └── useVoiceEntries.ts
│   └── lib/
│       ├── supabase.ts
│       └── types.ts
├── supabase/
│   └── migrations/
├── .env.example
├── package.json
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

---

## Browser/Web-Version

BrickNote kann auch im Browser laufen (z.B. auf Vercel deployed):

- Alle API-Calls gehen über Next.js API Routes
- Aufnahme-Button statt globalem Hotkey
- Gleiche Funktionalität wie die Desktop-Version

---

## Lizenz

MIT

---

**Entwickelt für die EVERLAST KI Developer Challenge 2026**
