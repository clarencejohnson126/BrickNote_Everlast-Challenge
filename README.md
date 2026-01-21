# BrickNote

Desktop voice intelligence app for construction site documentation. Record voice notes on-site, get AI-generated daily reports and defect documentation.

**Built for the EVERLAST KI Developer Challenge**

## Features

- **Global Hotkey Recording** - Press `Cmd+Shift+Space` (Mac) or `Ctrl+Shift+Space` (Windows) to start/stop recording
- **Speech-to-Text** - Transcription powered by OpenAI Whisper API
- **AI-Generated Reports** - GPT-4o generates structured daily reports and defect documentation
- **Bilingual Support** - Toggle between German (DE) and English (EN)
- **Project Management** - Organize recordings by construction project
- **History** - View, copy, and manage past entries
- **Magic Link Auth** - Passwordless authentication via Supabase
- **Smart Insights** - AI-powered analysis including:
  - **Claim Safety Layer** - Legal risk assessment with VOB/BGB references
  - **Confidence Meter** - Documentation completeness scoring
  - **Delta Intelligence** - Track changes across project entries

## Quick Start (for Reviewers)

```bash
# 1. Clone the repository
git clone https://github.com/clarencejohnson126/BrickNote_Everlast-Challenge.git
cd BrickNote_Everlast-Challenge

# 2. Install dependencies
npm install

# 3. Create .env file with API keys (see .env.example)
cp .env.example .env
# Edit .env with your Supabase and OpenAI credentials

# 4. Run the Electron app
npm run dev

# 5. Sign in with your email, click the magic link, and start recording!
```

**Test the app:**
- Press `Cmd+Shift+Space` to start/stop recording
- Speak in German or English about construction work
- Review the generated reports in the tabs

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Electron Main Process                     │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐ │
│  │ Global      │  │ IPC Handler │  │ OpenAI API Calls     │ │
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

## Setup

### Prerequisites

- Node.js 18+
- Supabase project
- OpenAI API key

### Environment Variables

Create a `.env` file in the project root:

```env
# Supabase (used in renderer)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OpenAI (used in Electron main process)
OPENAI_API_KEY=sk-your-openai-api-key
```

### Database Setup

The following tables are required in Supabase:

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

### Supabase Auth Configuration

In your Supabase project dashboard, go to **Authentication → URL Configuration** and add these redirect URLs:

```
http://localhost:3007/**
bricknote://auth/callback
```

The first one is for development, the second is for the packaged desktop app.

### Installation

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Package for distribution
npm run package
```

## Usage

1. **Sign In** - Enter your email to receive a magic link (click the link in your email to authenticate)
2. **Select Language** - Choose DE or EN for output language
3. **Create/Select Project** - Organize your recordings by project
4. **Record** - Press `Cmd+Shift+Space` (Mac) or `Ctrl+Shift+Space` (Windows) to start recording
5. **Stop Recording** - Press the hotkey again to stop and process, or click ✕ to abort
6. **Review Output** - Check the generated Tagesbericht (Diary) and Mängelbericht (Defect Report) tabs
7. **Smart Insights** - Click "Analysieren" for AI-powered risk analysis and documentation metrics
8. **Save** - Click Save to store the entry in your history

> **Note for reviewers:** The app runs on `localhost:3007` in development. Authentication magic links will redirect back to this URL automatically.

## Design Decisions

### IPC for API Calls
All external API calls (OpenAI Whisper, GPT-4o) happen in the Electron main process rather than the renderer. This keeps API keys secure and prevents exposure in client-side code.

### MediaRecorder in Renderer
Browser's MediaRecorder API works well in Electron's Chromium environment and is simpler than native audio libraries. Audio is captured as WebM/Opus.

### Parallel LLM Calls
Diary and Defect report generation run simultaneously using `Promise.all()` for faster results after transcription completes.

### No Real-Time Streaming
For MVP simplicity, we wait for full transcription before showing results rather than streaming partial text.

### Magic Link Auth
Simpler UX for construction workers - no password to remember, just click the link in email.

### Tailwind CSS
Fast to build, lightweight, no heavy UI library dependencies.

## Project Structure

```
/BrickNote
├── electron/
│   ├── main.ts           # Electron main process
│   ├── preload.ts        # Secure IPC bridge
│   └── tsconfig.json
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx      # Main app entry
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
│       ├── 001_create_projects.sql
│       └── 002_create_voice_entries.sql
├── .env.example
├── package.json
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

## License

MIT
