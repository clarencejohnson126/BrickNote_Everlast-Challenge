'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ThemeProvider, useTheme } from '@/hooks/useTheme';
import { SoundProvider, useSound } from '@/hooks/useSound';

interface LoginFormProps {
  onSignIn: (email: string) => Promise<{ error: Error | null }>;
}

function LoginFormContent({ onSignIn }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { theme, toggleTheme, isDark } = useTheme();
  const { playClick } = useSound();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playClick();

    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Please enter your email address' });
      return;
    }

    setLoading(true);
    setMessage(null);

    const { error } = await onSignIn(email);

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({
        type: 'success',
        text: 'Check your email for the login link',
      });
      setEmail('');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-900 px-4">
      {/* Theme toggle in corner */}
      <button
        onClick={() => { playClick(); toggleTheme(); }}
        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center border border-slate-200 dark:border-neutral-700 text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-neutral-500 transition-colors"
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        )}
      </button>

      <div className="max-w-sm w-full">
        {/* Logo / Brand */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-slate-900 dark:bg-white mb-6">
            <svg
              className="w-8 h-8 text-white dark:text-neutral-900"
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
          <h1 className="font-display text-3xl font-medium text-slate-900 dark:text-white tracking-tight">
            BrickNote
          </h1>
          <p className="mt-3 text-slate-500 dark:text-neutral-400 text-sm">
            Voice intelligence for construction documentation
          </p>
        </div>

        {/* Login form */}
        <div className="border border-slate-200 dark:border-neutral-800 p-8 bg-white dark:bg-neutral-800/50">
          <h2 className="text-xs font-medium text-slate-900 dark:text-white uppercase tracking-wider mb-6">
            Sign In
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label
                htmlFor="email"
                className="block text-xs font-medium text-slate-500 dark:text-neutral-400 uppercase tracking-wider mb-2"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-700 border-0 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:bg-white dark:focus:bg-neutral-600 focus:ring-2 focus:ring-slate-900 dark:focus:ring-white outline-none transition-all text-sm"
                disabled={loading}
              />
            </div>

            {message && (
              <div
                className={`mb-6 p-4 text-sm ${
                  message.type === 'success'
                    ? 'bg-slate-50 dark:bg-neutral-700 text-slate-700 dark:text-neutral-200 border-l-2 border-slate-900 dark:border-white'
                    : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-l-2 border-red-600'
                }`}
              >
                {message.text}
              </div>
            )}

            <Button
              type="submit"
              className="w-full justify-center"
              size="lg"
              disabled={loading}
            >
              {loading ? (
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
                  Sending...
                </span>
              ) : (
                'Continue with Email'
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400 dark:text-neutral-500">
            We'll send you a secure link to sign in
          </p>
        </div>

        {/* Challenge branding */}
        <div className="mt-8 text-center">
          <p className="text-[10px] font-medium text-slate-400 dark:text-neutral-500 uppercase tracking-[0.2em]">
            EVERLAST - KI DEVELOPER CHALLENGE
          </p>
        </div>

        {/* Footer hint */}
        <div className="mt-4 text-center">
          <p className="text-xs text-slate-400 dark:text-neutral-500">
            Press{' '}
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 font-mono text-xs">
              ⌘+Shift+R
            </kbd>{' '}
            to start recording
          </p>
        </div>
      </div>
    </div>
  );
}

export function LoginForm({ onSignIn }: LoginFormProps) {
  return (
    <ThemeProvider>
      <SoundProvider>
        <LoginFormContent onSignIn={onSignIn} />
      </SoundProvider>
    </ThemeProvider>
  );
}
