'use client';

import { useRecording } from '@/components/recording/RecordingProvider';
import { AudioVisualizer } from '@/components/recording/AudioVisualizer';
import { CopyButton } from '@/components/ui/CopyButton';
import { useSound } from '@/hooks/useSound';
import type { Language } from '@/lib/types';

interface TranscriptPanelProps {
  language: Language;
  className?: string;
}

export function TranscriptPanel({ language, className = '' }: TranscriptPanelProps) {
  const { transcript, isRecording, isProcessing, error, toggleRecording, abortRecording, audioLevel } = useRecording();
  const { playClick } = useSound();

  const handleToggleRecording = () => {
    playClick();
    toggleRecording();
  };

  const handleAbortRecording = () => {
    playClick();
    abortRecording();
  };

  // Labels based on language
  const labels = {
    transcript: language === 'de' ? 'Transkript' : 'Transcript',
    recording: language === 'de' ? 'Aufnahme läuft' : 'Recording',
    stopToProcess: language === 'de' ? 'Klicke Stopp zum Verarbeiten, oder' : 'Click stop to process, or',
    toCancel: language === 'de' ? 'zum Abbrechen' : 'to cancel',
    processing: language === 'de' ? 'Verarbeitung' : 'Processing',
    processingHint: language === 'de' ? 'Transkribiere und generiere Berichte' : 'Transcribing and generating reports',
    newRecording: language === 'de' ? 'Neue Aufnahme' : 'New Recording',
    readyToRecord: language === 'de' ? 'Aufnahmebereit' : 'Ready to Record',
    clickMic: language === 'de' ? 'Aufnahme starten mit' : 'Start recording with',
  };

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-neutral-900 ${className}`}>
      <div className="flex items-center justify-between px-6 border-b border-slate-200 dark:border-neutral-800">
        <div className="flex">
          <span className="px-4 py-2 text-xs font-medium text-slate-900 dark:text-white uppercase tracking-wider border-b-2 border-slate-900 dark:border-white -mb-[1px]">
            {labels.transcript}
          </span>
        </div>
        {transcript && <CopyButton text={transcript} />}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {error && (
          <div className="mb-4 p-4 border-l-2 border-red-500 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        {isRecording ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="flex items-center gap-3 mb-8">
              {/* Stop & Process button */}
              <button
                onClick={handleToggleRecording}
                className="relative cursor-pointer group"
                title="Stop and process recording"
              >
                <div className="flex items-center gap-4 px-6 py-4 border border-slate-900 dark:border-white bg-white dark:bg-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-700 transition-colors">
                  {/* Recording indicator */}
                  <div className="relative">
                    <div className="w-3 h-3 bg-red-500 recording-indicator" />
                  </div>

                  {/* Audio visualizer */}
                  <AudioVisualizer audioLevel={audioLevel} isRecording={isRecording} barCount={7} />

                  {/* Stop icon */}
                  <div className="w-8 h-8 bg-slate-900 dark:bg-white flex items-center justify-center group-hover:bg-slate-800 dark:group-hover:bg-neutral-200 transition-colors">
                    <svg className="w-4 h-4 text-white dark:text-neutral-900" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="6" y="6" width="12" height="12" />
                    </svg>
                  </div>
                </div>
              </button>

              {/* Abort button */}
              <button
                onClick={handleAbortRecording}
                className="px-4 py-4 border border-red-300 dark:border-red-700 bg-white dark:bg-neutral-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                title="Cancel recording without processing"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-slate-900 dark:text-white font-medium">{labels.recording}</p>
            <p className="text-sm text-slate-500 dark:text-neutral-400 mt-2">
              {labels.stopToProcess}{' '}
              <span className="text-red-500 dark:text-red-400">✕</span>
              {' '}{labels.toCancel}
            </p>
          </div>
        ) : isProcessing ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="relative mb-8">
              <div className="w-16 h-16 border border-slate-200 dark:border-neutral-700 flex items-center justify-center">
                <svg
                  className="animate-spin h-6 w-6 text-slate-900 dark:text-white"
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
            </div>
            <p className="text-slate-900 dark:text-white font-medium">{labels.processing}</p>
            <p className="text-sm text-slate-500 dark:text-neutral-400 mt-2">
              {labels.processingHint}
            </p>
          </div>
        ) : transcript ? (
          <div className="flex flex-col h-full">
            {/* New Recording button */}
            <div className="mb-6">
              <button
                onClick={handleToggleRecording}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-neutral-900 text-sm hover:bg-slate-800 dark:hover:bg-neutral-200 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
                {labels.newRecording}
              </button>
            </div>

            {/* Transcript content */}
            <div className="flex-1 overflow-y-auto">
              <p className="text-slate-600 dark:text-neutral-300 leading-relaxed">
                {transcript}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <button
              onClick={handleToggleRecording}
              className="group w-12 h-12 border border-slate-200 dark:border-neutral-700 flex items-center justify-center mb-4 cursor-pointer hover:border-slate-900 dark:hover:border-white hover:bg-slate-50 dark:hover:bg-neutral-800 transition-all"
              title={labels.readyToRecord}
            >
              <svg
                className="w-5 h-5 text-slate-400 dark:text-neutral-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </button>
            <p className="text-slate-600 dark:text-neutral-300 font-medium">{labels.readyToRecord}</p>
            <p className="text-sm text-slate-400 dark:text-neutral-500 mt-1">
              {labels.clickMic}{' '}
              <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 font-mono text-xs">
                ⌘+Shift+Space
              </kbd>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
