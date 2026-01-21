'use client';

import { useRecording } from './RecordingProvider';
import { useSound } from '@/hooks/useSound';

interface RecordingIndicatorProps {
  className?: string;
}

export function RecordingIndicator({ className = '' }: RecordingIndicatorProps) {
  const { isRecording, isProcessing, toggleRecording } = useRecording();
  const { playClick } = useSound();

  const handleClick = () => {
    playClick();
    toggleRecording();
  };

  return (
    <button
      onClick={handleClick}
      disabled={isProcessing}
      className={`flex items-center gap-2 px-3 py-1.5 border transition-all ${
        isRecording
          ? 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
          : isProcessing
          ? 'border-slate-300 dark:border-neutral-600 bg-slate-50 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400'
          : 'border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 hover:border-slate-400 dark:hover:border-neutral-500'
      } ${className}`}
    >
      {isRecording ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="recording-indicator absolute inline-flex h-full w-full bg-red-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 bg-red-600" />
          </span>
          <span className="text-xs font-medium uppercase tracking-wider">Recording</span>
        </>
      ) : isProcessing ? (
        <>
          <svg
            className="animate-spin h-3 w-3"
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
          <span className="text-xs font-medium uppercase tracking-wider">Processing</span>
        </>
      ) : (
        <>
          <span className="relative flex h-2 w-2">
            <span className="relative inline-flex h-2 w-2 bg-green-500" />
          </span>
          <span className="text-xs font-medium uppercase tracking-wider">Ready</span>
        </>
      )}
    </button>
  );
}
