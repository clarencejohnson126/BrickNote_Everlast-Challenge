'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRecording } from '@/components/recording/RecordingProvider';
import { MarkdownPreview } from '@/components/ui/MarkdownPreview';
import { CopyButton } from '@/components/ui/CopyButton';
import { Button } from '@/components/ui/Button';
import { SmartInsights } from '@/components/main/SmartInsights';
import { useSound } from '@/hooks/useSound';
import type { Language, DefectData, SmartInsights as SmartInsightsType } from '@/lib/types';

// Helper to check if we're in Electron
const isElectron = typeof window !== 'undefined' && !!window.electronAPI;

interface OutputTabsProps {
  onSave: (data: {
    transcript: string;
    diaryMarkdown: string;
    defectMarkdown: string;
    defectJson: DefectData | null;
    smartInsights: SmartInsightsType | null;
  }) => Promise<void>;
  language: Language;
  projectName: string;
  projectId: string | null;
  fetchPreviousEntries: (projectId: string | null, limit?: number) => Promise<{
    data: Array<{ created_at: string; diary_markdown: string; defect_markdown: string }>;
    error: Error | null;
  }>;
  onSaveSuccess?: () => void;
  className?: string;
}

export function OutputTabs({ onSave, language, projectName, projectId, fetchPreviousEntries, onSaveSuccess, className = '' }: OutputTabsProps) {
  const [activeTab, setActiveTab] = useState<'diary' | 'defect'>('diary');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [generatingPresentation, setGeneratingPresentation] = useState(false);
  const [presentationStatus, setPresentationStatus] = useState<string | null>(null);
  const [presentationError, setPresentationError] = useState<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { playClick } = useSound();

  const {
    transcript,
    diaryMarkdown,
    defectMarkdown,
    defectJson,
    isProcessing,
    regenerate,
    clearResults,
    smartInsights,
    isProcessingInsights,
    generateSmartInsights,
  } = useRecording();

  const hasContent = transcript && (diaryMarkdown || defectMarkdown);

  const handleSave = async () => {
    if (!hasContent) return;
    playClick();

    setSaving(true);
    await onSave({
      transcript,
      diaryMarkdown,
      defectMarkdown,
      defectJson,
      smartInsights,
    });
    setSaving(false);
    setSaved(true);
    onSaveSuccess?.();

    // Reset saved state after 3 seconds
    setTimeout(() => setSaved(false), 3000);
  };

  const handleGenerateInsights = useCallback(async () => {
    console.log('[SmartInsights] Button clicked, starting analysis...');
    playClick();
    console.log('[SmartInsights] Fetching previous entries for project:', projectId);
    const { data: previousEntries } = await fetchPreviousEntries(projectId, 10);
    console.log('[SmartInsights] Got previous entries:', previousEntries.length);
    console.log('[SmartInsights] Calling generateSmartInsights...');
    await generateSmartInsights(previousEntries, language);
    console.log('[SmartInsights] generateSmartInsights completed');
  }, [playClick, fetchPreviousEntries, projectId, generateSmartInsights, language]);

  const handleRegenerate = async () => {
    playClick();
    await regenerate(language, projectName);
  };

  const handleClear = () => {
    playClick();
    clearResults();
  };

  const currentContent = activeTab === 'diary' ? diaryMarkdown : defectMarkdown;

  // Download as styled PDF
  const handleDownloadPDF = useCallback(() => {
    if (!currentContent) return;
    playClick();

    const title = activeTab === 'diary'
      ? (language === 'de' ? `Tagesbericht - ${projectName || 'Baustelle'}` : `Daily Report - ${projectName || 'Construction Site'}`)
      : (language === 'de' ? 'Mängelbericht' : 'Defect Report');

    const date = new Date().toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Remove duplicate header from markdown (first H1 and date H2 since PDF template has them)
    const contentWithoutHeader = currentContent
      .replace(/^# .+\n?/m, '') // Remove first H1 (title)
      .replace(/^## (Datum|Date):.+\n?/m, '') // Remove date H2
      .trim();

    // Convert markdown to basic HTML
    const htmlContent = contentWithoutHeader
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');

    const styledHTML = `
<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #1a1a1a;
      padding: 40px 60px;
      max-width: 800px;
      margin: 0 auto;
    }
    h1, h2, h3 {
      font-family: 'Playfair Display', Georgia, serif;
      font-weight: 600;
      color: #0a0a0a;
      margin-top: 1.5em;
      margin-bottom: 0.5em;
    }
    h1 { font-size: 24pt; margin-top: 0; border-bottom: 2px solid #0a0a0a; padding-bottom: 10px; }
    h2 { font-size: 14pt; color: #404040; }
    h3 { font-size: 11pt; text-transform: uppercase; letter-spacing: 0.1em; color: #525252; }
    p { margin-bottom: 1em; }
    ul { margin: 0.5em 0 1em 1.5em; }
    li { margin-bottom: 0.3em; }
    strong { font-weight: 600; }
    .header { margin-bottom: 30px; }
    .date { font-size: 10pt; color: #737373; margin-top: 5px; }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e5e5;
      font-size: 9pt;
      color: #a3a3a3;
      text-align: center;
    }
    @media print {
      body { padding: 20px 40px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${title}</h1>
    <div class="date">${date}</div>
  </div>
  <div class="content">
    <p>${htmlContent}</p>
  </div>
  <div class="footer">
    BrickNote - ${language === 'de' ? 'Baustellendokumentation' : 'Construction Documentation'}
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

    // Open in new window for printing/saving as PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(styledHTML);
      printWindow.document.close();
    }
  }, [activeTab, currentContent, language, playClick, projectName]);

  // Cleanup poll interval on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const handleGeneratePresentation = useCallback(async () => {
    const electronAPI = window.electronAPI;
    if (!electronAPI || !currentContent) return;
    playClick();

    setGeneratingPresentation(true);
    setPresentationStatus(language === 'de' ? 'Starte...' : 'Starting...');
    setPresentationError(null);

    try {
      const title = activeTab === 'diary'
        ? (language === 'de' ? `Tagesbericht - ${projectName || 'Baustelle'}` : `Daily Report - ${projectName || 'Construction Site'}`)
        : (language === 'de' ? 'Mängelbericht' : 'Defect Report');

      const result = await electronAPI.generatePresentation(currentContent, title);

      if (!result.success || !result.generationId) {
        throw new Error(result.error || 'Failed to start presentation generation');
      }

      setPresentationStatus(language === 'de' ? 'Generiere Dokument...' : 'Generating document...');

      // Poll for completion
      const generationId = result.generationId;
      pollIntervalRef.current = setInterval(async () => {
        try {
          const statusResult = await electronAPI.checkPresentationStatus(generationId);

          if (!statusResult.success) {
            throw new Error(statusResult.error || 'Failed to check status');
          }

          console.log('Gamma status check:', statusResult);

          if (statusResult.status === 'completed') {
            // Stop polling
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }

            setGeneratingPresentation(false);
            setPresentationStatus(null);

            // Open the presentation in browser
            if (statusResult.url) {
              window.open(statusResult.url, '_blank');
            } else {
              setPresentationError(language === 'de' ? 'Dokument erstellt, aber URL fehlt' : 'Document created but URL missing');
            }
          } else if (statusResult.status === 'failed') {
            throw new Error(language === 'de' ? 'Dokumenterstellung fehlgeschlagen' : 'Document generation failed');
          } else if (statusResult.status === 'pending') {
            // Keep polling - update status message
            setPresentationStatus(language === 'de' ? 'Generiere Dokument...' : 'Generating document...');
          }
        } catch (pollError) {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          setGeneratingPresentation(false);
          setPresentationStatus(null);
          setPresentationError(pollError instanceof Error ? pollError.message : 'Unknown error');
        }
      }, 2000); // Poll every 2 seconds
    } catch (error) {
      setGeneratingPresentation(false);
      setPresentationStatus(null);
      setPresentationError(error instanceof Error ? error.message : 'Unknown error');
    }
  }, [activeTab, currentContent, language, playClick, projectName]);

  const handleTabChange = (tab: 'diary' | 'defect') => {
    playClick();
    setActiveTab(tab);
  };

  // Labels based on language
  const labels = {
    diary: language === 'de' ? 'Tagesbericht' : 'Daily Report',
    defect: language === 'de' ? 'Mängelbericht' : 'Defect Report',
    noDiary: language === 'de' ? 'Kein Tagesbericht' : 'No daily report yet',
    noDefect: language === 'de' ? 'Kein Mängelbericht' : 'No defect report yet',
    recordHint: language === 'de' ? 'Aufnahme starten mit' : 'Start recording with',
    regenerate: language === 'de' ? 'Neu generieren' : 'Regenerate',
    clear: language === 'de' ? 'Löschen' : 'Clear',
    save: language === 'de' ? 'Speichern' : 'Save',
    saving: language === 'de' ? 'Speichern...' : 'Saving...',
    saved: language === 'de' ? 'Gespeichert' : 'Saved',
    presentation: language === 'de' ? 'Gamma' : 'Gamma',
    downloadPdf: language === 'de' ? 'PDF' : 'PDF',
  };

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-neutral-900 ${className}`}>
      {/* Tab headers */}
      <div className="flex items-center justify-between px-6 border-b border-slate-200 dark:border-neutral-800">
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

        {currentContent && <CopyButton text={currentContent} />}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-6">
        {isProcessing ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <svg
                className="animate-spin h-6 w-6 text-slate-900 dark:text-white mx-auto mb-4"
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
              <p className="text-slate-500 dark:text-neutral-400 text-sm">
                {language === 'de' ? 'Generiere' : 'Generating'} {activeTab === 'diary' ? labels.diary : labels.defect}...
              </p>
            </div>
          </div>
        ) : currentContent ? (
          <MarkdownPreview content={currentContent} />
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
            <p className="text-slate-600 dark:text-neutral-300 font-medium">
              {activeTab === 'diary' ? labels.noDiary : labels.noDefect}
            </p>
            <p className="text-sm text-slate-400 dark:text-neutral-500 mt-1">
              {labels.recordHint}{' '}
              <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 font-mono text-xs">
                ⌘+Shift+Space
              </kbd>
            </p>
          </div>
        )}
      </div>

      {/* Smart Insights section */}
      {hasContent && isElectron && (
        <SmartInsights
          insights={smartInsights}
          isProcessing={isProcessingInsights}
          language={language}
          onGenerate={handleGenerateInsights}
        />
      )}

      {/* Presentation status/error banner */}
      {(presentationStatus || presentationError) && (
        <div className={`px-6 py-2 text-sm border-t ${presentationError ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'}`}>
          <div className="flex items-center gap-2">
            {generatingPresentation && (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            <span>{presentationStatus || presentationError}</span>
            {presentationError && (
              <button onClick={() => setPresentationError(null)} className="ml-auto text-red-500 hover:text-red-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Action buttons - only show when there's content */}
      {hasContent && (
      <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-neutral-800">
        <div className="flex gap-2">
          {hasContent && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRegenerate}
                disabled={isProcessing}
              >
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                {labels.regenerate}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleClear}>
                {labels.clear}
              </Button>
            </>
          )}
        </div>

        <div className="flex gap-2">
          {/* PDF Download button */}
          {hasContent && (
            <Button
              variant="secondary"
              onClick={handleDownloadPDF}
              disabled={!hasContent || isProcessing}
            >
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {labels.downloadPdf}
              </span>
            </Button>
          )}

          {/* Generate Gamma Document button - only in Electron */}
          {isElectron && hasContent && (
            <Button
              variant="secondary"
              onClick={handleGeneratePresentation}
              disabled={!hasContent || generatingPresentation || isProcessing}
            >
              {generatingPresentation ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {labels.presentation}...
                </span>
              ) : (
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                  {labels.presentation}
                </span>
              )}
            </Button>
          )}

          <Button
          onClick={handleSave}
          disabled={!hasContent || saving || isProcessing}
          className={saved ? 'bg-green-600 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-600' : ''}
        >
          {saving ? (
            <span className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {labels.saving}
            </span>
          ) : saved ? (
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {labels.saved}
            </span>
          ) : (
            <span className="flex items-center">
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
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                />
              </svg>
              {labels.save}
            </span>
          )}
        </Button>
        </div>
      </div>
      )}
    </div>
  );
}
