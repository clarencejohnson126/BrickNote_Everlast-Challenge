// Type declarations for Electron API exposed via preload
// This file allows the Next.js build to know about window.electronAPI

interface ElectronAPI {
  onRecordingToggle: (callback: () => void) => () => void;
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
        legalReference?: string;
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
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
