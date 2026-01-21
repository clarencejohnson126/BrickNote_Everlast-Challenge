export type Language = 'de' | 'en';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface VoiceEntry {
  id: string;
  user_id: string;
  project_id: string | null;
  created_at: string;
  language: Language;
  transcript_raw: string;
  diary_markdown: string;
  defect_markdown: string;
  defect_json: DefectData | null;
  meta: Record<string, unknown> | null;
}

export interface Defect {
  location: string;
  description: string;
  trade: string;
  priority: 'high' | 'medium' | 'low';
}

export interface DefectData {
  defects: Defect[];
}

export interface User {
  id: string;
  email: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

export interface RecordingState {
  isRecording: boolean;
  audioBlob: Blob | null;
  transcript: string;
  diaryMarkdown: string;
  defectMarkdown: string;
  defectJson: DefectData | null;
  isProcessing: boolean;
  error: string | null;
}

// Smart Insights Types

export interface ProblematicPhrase {
  original: string;
  issue: string;
  suggestedRewrite: string;
  legalReference?: string;
  riskContribution: number;
}

export interface ClaimSafetyResult {
  riskLevel: 'safe' | 'caution' | 'risky';
  riskPercentage: number;
  overallSafetyScore: number;
  problematicPhrases: ProblematicPhrase[];
  summary: string;
}

export interface CapturedElement {
  element: string;
  source: string;
  captured: boolean;
}

export interface MissingElement {
  element: string;
  reason: string;
  importance: 'critical' | 'important' | 'optional';
}

export interface ConfidenceMeterResult {
  completenessPercentage: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  capturedElements: CapturedElement[];
  missingElements: MissingElement[];
  summary: string;
}

export interface NewItem {
  item: string;
  category: 'work' | 'defect' | 'material' | 'personnel' | 'other';
  significance: 'major' | 'minor';
}

export interface ResolvedItem {
  item: string;
  previousMention: string;
  resolution: string;
}

export interface RecurringIssue {
  issue: string;
  occurrences: number;
  trend: 'improving' | 'stable' | 'worsening';
  firstMention: string;
}

export interface DeltaIntelligenceResult {
  newItems: NewItem[];
  resolvedItems: ResolvedItem[];
  recurringIssues: RecurringIssue[];
  progressSummary: string;
  comparisonPeriod: {
    currentDate: string;
    previousEntriesCount: number;
    dateRange: string;
  };
}

export interface SmartInsights {
  claimSafety: ClaimSafetyResult | null;
  confidenceMeter: ConfidenceMeterResult | null;
  deltaIntelligence: DeltaIntelligenceResult | null;
  generatedAt: string;
}
