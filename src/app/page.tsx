'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import { useVoiceEntries } from '@/hooks/useVoiceEntries';
import { ThemeProvider } from '@/hooks/useTheme';
import { SoundProvider, useSound } from '@/hooks/useSound';
import { LoginForm } from '@/components/auth/LoginForm';
import { RecordingProvider, useRecording } from '@/components/recording/RecordingProvider';
import { TopBar } from '@/components/main/TopBar';
import { TranscriptPanel } from '@/components/main/TranscriptPanel';
import { OutputTabs } from '@/components/main/OutputTabs';
import { HistoryPanel } from '@/components/main/HistoryPanel';
import { Toast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import type { Language, DefectData, SmartInsights } from '@/lib/types';

// Inner component that uses useRecording
function MainContent({
  language,
  setLanguage,
  projects,
  selectedProjectId,
  setSelectedProjectId,
  handleCreateProject,
  handleSave,
  handleDeleteEntry,
  entries,
  entriesLoading,
  showHistory,
  setShowHistory,
  signOut,
  userEmail,
  projectName,
  toast,
  setToast,
  fetchPreviousEntriesForProject,
}: {
  language: Language;
  setLanguage: (lang: Language) => void;
  projects: any[];
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  handleCreateProject: (name: string) => Promise<void>;
  handleSave: (data: any) => Promise<void>;
  handleDeleteEntry: (id: string) => Promise<void>;
  entries: any[];
  entriesLoading: boolean;
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
  signOut: () => void;
  userEmail: string;
  projectName: string;
  toast: { message: string; type: 'success' | 'error' } | null;
  setToast: (toast: { message: string; type: 'success' | 'error' } | null) => void;
  fetchPreviousEntriesForProject: (projectId: string | null, limit?: number) => Promise<{
    data: Array<{ created_at: string; diary_markdown: string; defect_markdown: string }>;
    error: Error | null;
  }>;
}) {
  const { transcript, regenerate } = useRecording();
  const prevLanguageRef = useRef(language);

  // Auto-regenerate when language changes (if there's content)
  useEffect(() => {
    if (prevLanguageRef.current !== language && transcript) {
      regenerate(language, projectName);
    }
    prevLanguageRef.current = language;
  }, [language, transcript, projectName, regenerate]);

  const handleSaveSuccess = () => {
    setToast({ message: language === 'de' ? 'Erfolgreich gespeichert' : 'Saved successfully', type: 'success' });
  };

  const { playClick } = useSound();

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-neutral-900">
      <TopBar
        language={language}
        onLanguageChange={setLanguage}
        projects={projects}
        selectedProjectId={selectedProjectId}
        onProjectChange={setSelectedProjectId}
        onCreateProject={handleCreateProject}
        onSignOut={signOut}
        userEmail={userEmail}
      />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel - Transcript */}
        <div className="w-2/5 border-r border-slate-200 dark:border-neutral-800">
          <TranscriptPanel language={language} />
        </div>

        {/* Right panel - Output tabs */}
        <div className="flex-1">
          <OutputTabs
            onSave={handleSave}
            onSaveSuccess={handleSaveSuccess}
            language={language}
            projectName={projectName}
            projectId={selectedProjectId}
            fetchPreviousEntries={fetchPreviousEntriesForProject}
          />
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-neutral-800">
        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-neutral-500">
          <kbd className="px-2 py-1 bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 font-mono">
            ⌘+Shift+Space
          </kbd>
          <span>{language === 'de' ? 'zum Aufnehmen' : 'to record'}</span>
        </div>

        <Button variant="secondary" size="sm" onClick={() => { playClick(); setShowHistory(true); }}>
          <svg
            className="w-4 h-4 mr-1.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {language === 'de' ? 'Verlauf' : 'History'}
        </Button>
      </div>

      {/* History modal */}
      {showHistory && (
        <HistoryPanel
          entries={entries}
          projects={projects}
          loading={entriesLoading}
          onClose={() => setShowHistory(false)}
          onDelete={handleDeleteEntry}
          language={language}
        />
      )}

      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default function Home() {
  const { user, loading: authLoading, signIn, signOut } = useAuth();
  const { projects, loading: projectsLoading, createProject } = useProjects(user?.id);
  const {
    entries,
    loading: entriesLoading,
    createEntry,
    deleteEntry,
    fetchPreviousEntriesForProject,
  } = useVoiceEntries(user?.id);

  const [language, setLanguage] = useState<Language>('de');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const projectName = selectedProject?.name || '';

  const handleCreateProject = useCallback(
    async (name: string) => {
      const { data } = await createProject(name);
      if (data) {
        setSelectedProjectId(data.id);
      }
    },
    [createProject]
  );

  const handleSave = useCallback(
    async (data: {
      transcript: string;
      diaryMarkdown: string;
      defectMarkdown: string;
      defectJson: DefectData | null;
      smartInsights: SmartInsights | null;
    }) => {
      await createEntry({
        project_id: selectedProjectId,
        language,
        transcript_raw: data.transcript,
        diary_markdown: data.diaryMarkdown,
        defect_markdown: data.defectMarkdown,
        defect_json: data.defectJson,
        meta: data.smartInsights ? { smartInsights: data.smartInsights } : undefined,
      });
    },
    [createEntry, selectedProjectId, language]
  );

  const handleDeleteEntry = useCallback(
    async (entryId: string) => {
      await deleteEntry(entryId);
    },
    [deleteEntry]
  );

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <svg
            className="animate-spin h-6 w-6 text-slate-900 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!user) {
    return <LoginForm onSignIn={signIn} />;
  }

  // Main app
  return (
    <ThemeProvider>
      <SoundProvider>
        <RecordingProvider language={language} projectName={projectName}>
          <MainContent
            language={language}
            setLanguage={setLanguage}
            projects={projects}
            selectedProjectId={selectedProjectId}
            setSelectedProjectId={setSelectedProjectId}
            handleCreateProject={handleCreateProject}
            handleSave={handleSave}
            handleDeleteEntry={handleDeleteEntry}
            entries={entries}
            entriesLoading={entriesLoading}
            showHistory={showHistory}
            setShowHistory={setShowHistory}
            signOut={signOut}
            userEmail={user.email}
            projectName={projectName}
            toast={toast}
            setToast={setToast}
            fetchPreviousEntriesForProject={fetchPreviousEntriesForProject}
          />
        </RecordingProvider>
      </SoundProvider>
    </ThemeProvider>
  );
}
