'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MarkdownPreview } from '@/components/ui/MarkdownPreview';
import { CopyButton } from '@/components/ui/CopyButton';
import { useSound } from '@/hooks/useSound';
import type { VoiceEntry, Project, Language } from '@/lib/types';

interface HistoryPanelProps {
  entries: VoiceEntry[];
  projects: Project[];
  loading: boolean;
  onClose: () => void;
  onDelete: (entryId: string) => Promise<void>;
  language?: Language;
}

export function HistoryPanel({
  entries,
  projects,
  loading,
  onClose,
  onDelete,
  language = 'en',
}: HistoryPanelProps) {
  const [selectedEntry, setSelectedEntry] = useState<VoiceEntry | null>(null);
  const [activeTab, setActiveTab] = useState<'diary' | 'defect'>('diary');
  const [deleting, setDeleting] = useState<string | null>(null);
  const { playClick } = useSound();

  const labels = {
    title: language === 'de' ? 'Verlauf' : 'History',
    noEntries: language === 'de' ? 'Keine Einträge' : 'No entries yet',
    noEntriesHint: language === 'de' ? 'Ihre Sprachaufnahmen erscheinen hier' : 'Your voice recordings will appear here',
    selectEntry: language === 'de' ? 'Eintrag auswählen' : 'Select an entry to view details',
    diary: language === 'de' ? 'Tagesbericht' : 'Daily Report',
    defect: language === 'de' ? 'Mängelbericht' : 'Defect Report',
    transcript: language === 'de' ? 'Original Transkript' : 'Original Transcript',
    delete: language === 'de' ? 'Löschen' : 'Delete',
    deleting: language === 'de' ? 'Löschen...' : 'Deleting...',
    german: language === 'de' ? 'Deutsch' : 'German',
    english: language === 'de' ? 'Englisch' : 'English',
  };

  const getProjectName = (projectId: string | null) => {
    if (!projectId) return language === 'de' ? 'Kein Projekt' : 'No Project';
    const project = projects.find((p) => p.id === projectId);
    return project?.name || (language === 'de' ? 'Unbekannt' : 'Unknown');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDelete = async (entryId: string) => {
    playClick();
    setDeleting(entryId);
    await onDelete(entryId);
    if (selectedEntry?.id === entryId) {
      setSelectedEntry(null);
    }
    setDeleting(null);
  };

  const handleClose = () => {
    playClick();
    onClose();
  };

  const handleSelectEntry = (entry: VoiceEntry) => {
    playClick();
    setSelectedEntry(entry);
  };

  const handleTabChange = (tab: 'diary' | 'defect') => {
    playClick();
    setActiveTab(tab);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-2xl w-full max-w-5xl max-h-[80vh] flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-neutral-800">
          <h2 className="text-xs font-medium text-slate-900 dark:text-white uppercase tracking-wider">{labels.title}</h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <svg
              className="w-4 h-4 text-slate-500 dark:text-neutral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Entry list */}
          <div className="w-1/3 border-r border-slate-200 dark:border-neutral-800 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <svg
                  className="animate-spin h-5 w-5 text-slate-400 dark:text-neutral-500"
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
              </div>
            ) : entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <div className="w-12 h-12 border border-slate-200 dark:border-neutral-700 flex items-center justify-center mb-4">
                  <svg
                    className="w-5 h-5 text-slate-400 dark:text-neutral-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <p className="text-slate-600 dark:text-neutral-300 font-medium">{labels.noEntries}</p>
                <p className="text-sm text-slate-400 dark:text-neutral-500 mt-1">{labels.noEntriesHint}</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-neutral-800">
                {entries.map((entry) => (
                  <li key={entry.id}>
                    <button
                      onClick={() => handleSelectEntry(entry)}
                      className={`w-full text-left px-4 py-4 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors ${
                        selectedEntry?.id === entry.id ? 'bg-slate-100 dark:bg-neutral-800' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                          {entry.language === 'de' ? labels.german : labels.english}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-neutral-500">
                          {formatDate(entry.created_at)}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {getProjectName(entry.project_id)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-neutral-400 truncate mt-1">
                        {entry.transcript_raw.slice(0, 80)}...
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Entry detail */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedEntry ? (
              <>
                {/* Detail header */}
                <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-neutral-800">
                  <div className="flex">
                    <button
                      onClick={() => handleTabChange('diary')}
                      className={`px-4 py-2 text-xs font-medium uppercase tracking-wider transition-all border-b-2 -mb-[1px] ${
                        activeTab === 'diary'
                          ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
                          : 'border-transparent text-slate-400 dark:text-neutral-500 hover:text-slate-600 dark:hover:text-neutral-300'
                      }`}
                    >
                      {labels.diary}
                    </button>
                    <button
                      onClick={() => handleTabChange('defect')}
                      className={`px-4 py-2 text-xs font-medium uppercase tracking-wider transition-all border-b-2 -mb-[1px] ${
                        activeTab === 'defect'
                          ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
                          : 'border-transparent text-slate-400 dark:text-neutral-500 hover:text-slate-600 dark:hover:text-neutral-300'
                      }`}
                    >
                      {labels.defect}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <CopyButton
                      text={
                        activeTab === 'diary'
                          ? selectedEntry.diary_markdown
                          : selectedEntry.defect_markdown
                      }
                    />
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(selectedEntry.id)}
                      disabled={deleting === selectedEntry.id}
                    >
                      {deleting === selectedEntry.id ? labels.deleting : labels.delete}
                    </Button>
                  </div>
                </div>

                {/* Detail content */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="mb-6 p-4 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700">
                    <h4 className="text-xs font-medium text-slate-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                      {labels.transcript}
                    </h4>
                    <p className="text-sm text-slate-700 dark:text-neutral-300 leading-relaxed">
                      {selectedEntry.transcript_raw}
                    </p>
                  </div>

                  <MarkdownPreview
                    content={
                      activeTab === 'diary'
                        ? selectedEntry.diary_markdown
                        : selectedEntry.defect_markdown
                    }
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-12 h-12 border border-slate-200 dark:border-neutral-700 flex items-center justify-center mb-4">
                  <svg
                    className="w-5 h-5 text-slate-400 dark:text-neutral-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <p className="text-slate-500 dark:text-neutral-400">{labels.selectEntry}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
