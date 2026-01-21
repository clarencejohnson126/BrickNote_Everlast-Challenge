import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Recording toggle listener
  onRecordingToggle: (callback: () => void) => {
    ipcRenderer.on('recording:toggle', callback);
    return () => {
      ipcRenderer.removeListener('recording:toggle', callback);
    };
  },

  // Auth tokens listener (for deep link auth callback)
  onAuthTokens: (callback: (tokens: { access_token: string; refresh_token: string }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, tokens: { access_token: string; refresh_token: string }) => {
      callback(tokens);
    };
    ipcRenderer.on('auth:tokens', handler);
    return () => {
      ipcRenderer.removeListener('auth:tokens', handler);
    };
  },

  // Speech-to-text transcription
  transcribe: (audioBuffer: ArrayBuffer, language: string) =>
    ipcRenderer.invoke('stt:transcribe', audioBuffer, language),

  // LLM diary generation
  generateDiary: (transcript: string, language: string, projectName: string) =>
    ipcRenderer.invoke('llm:generateDiary', transcript, language, projectName),

  // LLM defect report generation
  generateDefect: (transcript: string, language: string) =>
    ipcRenderer.invoke('llm:generateDefect', transcript, language),

  // Gamma presentation generation
  generatePresentation: (content: string, title: string) =>
    ipcRenderer.invoke('gamma:generatePresentation', content, title),

  // Gamma generation status check
  checkPresentationStatus: (generationId: string) =>
    ipcRenderer.invoke('gamma:checkStatus', generationId),

  // Smart Insights: Claim Safety analysis
  generateClaimSafety: (diaryMarkdown: string, defectMarkdown: string, language: string) =>
    ipcRenderer.invoke('llm:generateClaimSafety', diaryMarkdown, defectMarkdown, language),

  // Smart Insights: Confidence Meter analysis
  generateConfidenceMeter: (
    transcript: string,
    diaryMarkdown: string,
    defectMarkdown: string,
    language: string
  ) =>
    ipcRenderer.invoke('llm:generateConfidenceMeter', transcript, diaryMarkdown, defectMarkdown, language),

  // Smart Insights: Delta Intelligence analysis
  generateDeltaIntelligence: (
    currentTranscript: string,
    currentDiary: string,
    currentDefect: string,
    previousEntries: Array<{ created_at: string; diary_markdown: string; defect_markdown: string }>,
    language: string
  ) =>
    ipcRenderer.invoke(
      'llm:generateDeltaIntelligence',
      currentTranscript,
      currentDiary,
      currentDefect,
      previousEntries,
      language
    ),
});

// TypeScript declaration for the exposed API
declare global {
  interface Window {
    electronAPI: {
      onRecordingToggle: (callback: () => void) => () => void;
      onAuthTokens: (callback: (tokens: { access_token: string; refresh_token: string }) => void) => () => void;
      transcribe: (
        audioBuffer: ArrayBuffer,
        language: string
      ) => Promise<{ success: boolean; text?: string; error?: string }>;
      generateDiary: (
        transcript: string,
        language: string,
        projectName: string
      ) => Promise<{ success: boolean; markdown?: string; error?: string }>;
      generateDefect: (
        transcript: string,
        language: string
      ) => Promise<{
        success: boolean;
        markdown?: string;
        json?: unknown;
        error?: string;
      }>;
      generatePresentation: (
        content: string,
        title: string
      ) => Promise<{
        success: boolean;
        generationId?: string;
        error?: string;
      }>;
      checkPresentationStatus: (
        generationId: string
      ) => Promise<{
        success: boolean;
        status?: string;
        url?: string;
        error?: string;
      }>;
      generateClaimSafety: (
        diaryMarkdown: string,
        defectMarkdown: string,
        language: string
      ) => Promise<{
        success: boolean;
        data?: {
          riskLevel: 'safe' | 'caution' | 'risky';
          riskPercentage: number;
          overallSafetyScore: number;
          problematicPhrases: Array<{
            original: string;
            issue: string;
            suggestedRewrite: string;
            riskContribution: number;
          }>;
          summary: string;
        };
        error?: string;
      }>;
      generateConfidenceMeter: (
        transcript: string,
        diaryMarkdown: string,
        defectMarkdown: string,
        language: string
      ) => Promise<{
        success: boolean;
        data?: {
          completenessPercentage: number;
          confidenceLevel: 'high' | 'medium' | 'low';
          capturedElements: Array<{
            element: string;
            source: string;
            captured: boolean;
          }>;
          missingElements: Array<{
            element: string;
            reason: string;
            importance: 'critical' | 'important' | 'optional';
          }>;
          summary: string;
        };
        error?: string;
      }>;
      generateDeltaIntelligence: (
        currentTranscript: string,
        currentDiary: string,
        currentDefect: string,
        previousEntries: Array<{
          created_at: string;
          diary_markdown: string;
          defect_markdown: string;
        }>,
        language: string
      ) => Promise<{
        success: boolean;
        data?: {
          newItems: Array<{
            item: string;
            category: 'work' | 'defect' | 'material' | 'personnel' | 'other';
            significance: 'major' | 'minor';
          }>;
          resolvedItems: Array<{
            item: string;
            previousMention: string;
            resolution: string;
          }>;
          recurringIssues: Array<{
            issue: string;
            occurrences: number;
            trend: 'improving' | 'stable' | 'worsening';
            firstMention: string;
          }>;
          progressSummary: string;
          comparisonPeriod: {
            currentDate: string;
            previousEntriesCount: number;
            dateRange: string;
          };
        };
        error?: string;
      }>;
    };
  }
}
