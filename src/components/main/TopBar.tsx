'use client';

import { useState } from 'react';
import { RecordingIndicator } from '@/components/recording/RecordingIndicator';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/hooks/useTheme';
import { useSound } from '@/hooks/useSound';
import type { Language, Project } from '@/lib/types';

interface TopBarProps {
  language: Language;
  onLanguageChange: (language: Language) => void;
  projects: Project[];
  selectedProjectId: string | null;
  onProjectChange: (projectId: string | null) => void;
  onCreateProject: (name: string) => Promise<void>;
  onSignOut: () => void;
  userEmail: string;
}

export function TopBar({
  language,
  onLanguageChange,
  projects,
  selectedProjectId,
  onProjectChange,
  onCreateProject,
  onSignOut,
  userEmail,
}: TopBarProps) {
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [creating, setCreating] = useState(false);
  const { theme, toggleTheme, isDark } = useTheme();
  const { soundEnabled, toggleSound, playClick } = useSound();

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;

    setCreating(true);
    await onCreateProject(newProjectName.trim());
    setNewProjectName('');
    setShowNewProject(false);
    setCreating(false);
  };

  const handleLanguageChange = (lang: Language) => {
    playClick();
    onLanguageChange(lang);
  };

  const handleThemeToggle = () => {
    playClick();
    toggleTheme();
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="drag-region flex items-center justify-between px-6 py-4 bg-white dark:bg-neutral-900 border-b border-slate-200 dark:border-neutral-800">
      {/* Left section - Add padding for macOS traffic lights */}
      <div className="no-drag flex items-center gap-6 pl-16">
        {/* Logo and brand name */}
        <div className="flex items-center gap-2">
          {/* Brick icon logo */}
          <div className="w-8 h-8 bg-slate-900 dark:bg-white flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white dark:text-neutral-900"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              {/* Stylized brick pattern */}
              <rect x="2" y="4" width="9" height="4" rx="0.5" />
              <rect x="13" y="4" width="9" height="4" rx="0.5" />
              <rect x="2" y="10" width="6" height="4" rx="0.5" />
              <rect x="10" y="10" width="6" height="4" rx="0.5" />
              <rect x="18" y="10" width="4" height="4" rx="0.5" />
              <rect x="2" y="16" width="9" height="4" rx="0.5" />
              <rect x="13" y="16" width="9" height="4" rx="0.5" />
            </svg>
          </div>
          <span className="font-display text-lg font-semibold text-slate-900 dark:text-white tracking-tight">
            BrickNote
          </span>
        </div>

        {/* Language toggle */}
        <div className="flex border border-slate-200 dark:border-neutral-700">
          <button
            onClick={() => handleLanguageChange('de')}
            className={`px-4 py-2 text-xs font-medium uppercase tracking-wider transition-all ${
              language === 'de'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-neutral-900'
                : 'bg-white dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            DE
          </button>
          <button
            onClick={() => handleLanguageChange('en')}
            className={`px-4 py-2 text-xs font-medium uppercase tracking-wider transition-all ${
              language === 'en'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-neutral-900'
                : 'bg-white dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            EN
          </button>
        </div>

        {/* Challenge text */}
        <div className="hidden md:block">
          <span className="text-[10px] font-medium text-slate-400 dark:text-neutral-500 uppercase tracking-[0.2em]">
            EVERLAST - KI DEVELOPER CHALLENGE
          </span>
        </div>
      </div>

      {/* Center section - Project selector */}
      <div className="no-drag flex items-center gap-3">
        <div className="relative">
          <select
            value={selectedProjectId || ''}
            onChange={(e) => {
              playClick();
              onProjectChange(e.target.value || null);
            }}
            className="appearance-none bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 px-4 py-2 pr-10 text-sm text-slate-900 dark:text-white cursor-pointer hover:border-slate-400 dark:hover:border-neutral-500 focus:outline-none focus:border-slate-900 dark:focus:border-white transition-colors min-w-[180px]"
          >
            <option value="">No Project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-neutral-500 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>

        {showNewProject ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project name"
              className="px-3 py-2 text-sm border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-white transition-colors"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateProject();
                if (e.key === 'Escape') setShowNewProject(false);
              }}
              autoFocus
            />
            <Button
              size="sm"
              onClick={() => {
                playClick();
                handleCreateProject();
              }}
              disabled={creating || !newProjectName.trim()}
            >
              Add
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                playClick();
                setShowNewProject(false);
              }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <button
            onClick={() => {
              playClick();
              setShowNewProject(true);
            }}
            className="w-8 h-8 flex items-center justify-center border border-slate-200 dark:border-neutral-700 text-slate-400 dark:text-neutral-500 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-neutral-500 transition-colors"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Right section - Theme toggle, Recording indicator and user */}
      <div className="no-drag flex items-center gap-4">
        {/* Sound toggle */}
        <button
          onClick={() => { playClick(); toggleSound(); }}
          className="w-8 h-8 flex items-center justify-center border border-slate-200 dark:border-neutral-700 text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-neutral-500 transition-colors"
          title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
        >
          {soundEnabled ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
              />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
              />
            </svg>
          )}
        </button>

        {/* Day/Night toggle */}
        <button
          onClick={handleThemeToggle}
          className="w-8 h-8 flex items-center justify-center border border-slate-200 dark:border-neutral-700 text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-neutral-500 transition-colors"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          )}
        </button>

        <RecordingIndicator />

        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500 dark:text-neutral-400">{userEmail}</span>
          <button
            onClick={() => {
              playClick();
              onSignOut();
            }}
            className="text-xs font-medium text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white uppercase tracking-wider transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
