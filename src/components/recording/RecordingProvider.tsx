'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import type {
  Language,
  DefectData,
  SmartInsights,
  ClaimSafetyResult,
  ConfidenceMeterResult,
  DeltaIntelligenceResult,
} from '@/lib/types';

interface PreviousEntry {
  created_at: string;
  diary_markdown: string;
  defect_markdown: string;
}

interface RecordingContextValue {
  isRecording: boolean;
  isProcessing: boolean;
  transcript: string;
  diaryMarkdown: string;
  defectMarkdown: string;
  defectJson: DefectData | null;
  error: string | null;
  audioLevel: number;
  smartInsights: SmartInsights | null;
  isProcessingInsights: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  abortRecording: () => void;
  toggleRecording: () => Promise<void>;
  clearResults: () => void;
  regenerate: (language: Language, projectName: string) => Promise<void>;
  generateSmartInsights: (previousEntries: PreviousEntry[], language: Language) => Promise<void>;
}

const RecordingContext = createContext<RecordingContextValue | null>(null);

export function useRecording() {
  const context = useContext(RecordingContext);
  if (!context) {
    throw new Error('useRecording must be used within a RecordingProvider');
  }
  return context;
}

interface RecordingProviderProps {
  children: ReactNode;
  language: Language;
  projectName: string;
}

// Direct API calls for browser mode
async function transcribeAudio(audioBlob: Blob, language: string): Promise<{ success: boolean; text?: string; error?: string }> {
  try {
    // Create a proper File object from the Blob
    const audioFile = new File([audioBlob], 'audio.webm', { type: 'audio/webm' });

    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('model', 'whisper-1');
    formData.append('language', language === 'de' ? 'de' : 'en');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Whisper API error: ${error}`);
    }

    const result = await response.json();
    return { success: true, text: result.text };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Transcription failed' };
  }
}

async function generateDiary(transcript: string, language: string, projectName: string): Promise<{ success: boolean; markdown?: string; error?: string }> {
  try {
    // Get actual current date and time
    const now = new Date();
    const currentDate = now.toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const currentTime = now.toLocaleTimeString(language === 'de' ? 'de-DE' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const systemPrompt = language === 'de'
      ? `Du bist ein Assistent für Baustellendokumentation. Erstelle aus der Sprachnotiz einen strukturierten Tagesbericht im Markdown-Format.

WICHTIG: Das aktuelle Datum ist ${currentDate}, Uhrzeit ${currentTime}. Verwende IMMER dieses Datum im Bericht, UNABHÄNGIG davon was der Benutzer im Transkript sagt.

Verwende folgende Struktur:
# Tagesbericht - ${projectName || 'Baustelle'}
## Datum: ${currentDate}

### Anwesende Gewerke
- [Liste der erwähnten Gewerke/Firmen]

### Durchgeführte Arbeiten
- [Detaillierte Auflistung]

### Materiallieferungen
- [Falls erwähnt]

### Besondere Vorkommnisse
- [Falls erwähnt]

### Nächste Schritte
- [Falls erwähnt]

WICHTIG: Erfinde KEINE Informationen. Nutze NUR das, was in der Sprachnotiz erwähnt wird. Wenn etwas nicht erwähnt wird, lasse den Abschnitt weg.`
      : `You are a construction site documentation assistant. Create a structured daily report in Markdown format from the voice note.

IMPORTANT: The current date is ${currentDate}, time ${currentTime}. ALWAYS use this date in the report, REGARDLESS of what the user says in the transcript.

Use this structure:
# Daily Report - ${projectName || 'Construction Site'}
## Date: ${currentDate}

### Present Trades/Contractors
- [List of mentioned trades/companies]

### Work Completed
- [Detailed list]

### Material Deliveries
- [If mentioned]

### Special Incidents
- [If mentioned]

### Next Steps
- [If mentioned]

IMPORTANT: Do NOT invent information. Only use what is mentioned in the voice note. If something is not mentioned, omit that section.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: transcript },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const result = await response.json();
    return { success: true, markdown: result.choices[0].message.content };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Diary generation failed' };
  }
}

async function generateDefect(transcript: string, language: string): Promise<{ success: boolean; markdown?: string; json?: DefectData | null; error?: string }> {
  try {
    // Get actual current date and time
    const now = new Date();
    const currentDate = now.toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const currentTime = now.toLocaleTimeString(language === 'de' ? 'de-DE' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const systemPrompt = language === 'de'
      ? `Du bist ein Assistent für Baustellendokumentation. Analysiere die Sprachnotiz auf Mängel oder Probleme.

WICHTIG: Das aktuelle Datum ist ${currentDate}, Uhrzeit ${currentTime}. Verwende IMMER dieses Datum im Bericht.

Wenn Mängel erwähnt werden, erstelle einen strukturierten Mängelbericht im Markdown-Format:
# Mängelbericht
## Datum: ${currentDate}

### Mangel 1
- **Ort:** [Wo wurde der Mangel festgestellt]
- **Beschreibung:** [Detaillierte Beschreibung]
- **Gewerk:** [Verantwortliches Gewerk, falls bekannt]
- **Priorität:** [Hoch/Mittel/Niedrig, basierend auf Kontext]

Wiederhole für jeden erwähnten Mangel.

Wenn KEINE Mängel erwähnt werden, antworte nur mit:
"Keine Mängel in dieser Aufnahme dokumentiert."

WICHTIG: Erfinde KEINE Mängel. Dokumentiere NUR das, was explizit als Problem oder Mangel erwähnt wird.`
      : `You are a construction site documentation assistant. Analyze the voice note for defects or issues.

IMPORTANT: The current date is ${currentDate}, time ${currentTime}. ALWAYS use this date in the report.

If defects are mentioned, create a structured defect report in Markdown format:
# Defect Report
## Date: ${currentDate}

### Defect 1
- **Location:** [Where the defect was found]
- **Description:** [Detailed description]
- **Trade:** [Responsible trade, if known]
- **Priority:** [High/Medium/Low, based on context]

Repeat for each mentioned defect.

If NO defects are mentioned, respond only with:
"No defects documented in this recording."

IMPORTANT: Do NOT invent defects. Only document what is explicitly mentioned as a problem or defect.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: transcript },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const result = await response.json();
    const content = result.choices[0].message.content;

    return { success: true, markdown: content, json: null };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Defect generation failed' };
  }
}

export function RecordingProvider({
  children,
  language,
  projectName,
}: RecordingProviderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [diaryMarkdown, setDiaryMarkdown] = useState('');
  const [defectMarkdown, setDefectMarkdown] = useState('');
  const [defectJson, setDefectJson] = useState<DefectData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [smartInsights, setSmartInsights] = useState<SmartInsights | null>(null);
  const [isProcessingInsights, setIsProcessingInsights] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Listen for global hotkey from Electron (if available)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      const cleanup = window.electronAPI.onRecordingToggle(() => {
        toggleRecording();
      });
      return cleanup;
    }
  }, []);

  // Audio level analysis
  const startAudioAnalysis = useCallback((stream: MediaStream) => {
    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateLevel = () => {
      if (!analyserRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);

      // Calculate average volume level
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      const normalizedLevel = Math.min(average / 128, 1); // Normalize to 0-1

      setAudioLevel(normalizedLevel);
      animationFrameRef.current = requestAnimationFrame(updateLevel);
    };

    updateLevel();
  }, []);

  const stopAudioAnalysis = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Start audio analysis for visualization
      startAudioAnalysis(stream);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setError('Microphone permission denied. Please allow microphone access.');
      } else {
        setError('Failed to start recording. Please check your microphone.');
      }
    }
  }, [startAudioAnalysis]);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
      return;
    }

    return new Promise<void>((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!;

      mediaRecorder.onstop = async () => {
        setIsRecording(false);
        stopAudioAnalysis();

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        // Create blob from chunks
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });

        if (audioBlob.size === 0) {
          setError('No audio recorded. Please try again.');
          resolve();
          return;
        }

        // Process the recording
        await processRecording(audioBlob, language, projectName);
        resolve();
      };

      mediaRecorder.stop();
    });
  }, [language, projectName, stopAudioAnalysis]);

  const abortRecording = useCallback(() => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
      return;
    }

    // Stop the media recorder without processing
    mediaRecorderRef.current.onstop = () => {
      // Just clean up, don't process
      setIsRecording(false);
      stopAudioAnalysis();

      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      // Clear chunks without processing
      chunksRef.current = [];
    };

    mediaRecorderRef.current.stop();
  }, [stopAudioAnalysis]);

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const processRecording = async (
    audioBlob: Blob,
    lang: Language,
    project: string
  ) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Check if Electron API is available
      const electronAPI = typeof window !== 'undefined' ? window.electronAPI : undefined;

      let transcriptResult;

      if (electronAPI) {
        // Use Electron IPC
        const arrayBuffer = await audioBlob.arrayBuffer();
        transcriptResult = await electronAPI.transcribe(arrayBuffer, lang);
      } else {
        // Use direct API call (browser mode)
        transcriptResult = await transcribeAudio(audioBlob, lang);
      }

      if (!transcriptResult.success) {
        throw new Error(transcriptResult.error || 'Transcription failed');
      }

      const transcriptText = transcriptResult.text || '';
      setTranscript(transcriptText);

      if (!transcriptText.trim()) {
        setError('No speech detected. Please try again.');
        setIsProcessing(false);
        return;
      }

      // Generate diary and defect reports in parallel
      let diaryResult, defectResult;

      if (electronAPI) {
        [diaryResult, defectResult] = await Promise.all([
          electronAPI.generateDiary(transcriptText, lang, project),
          electronAPI.generateDefect(transcriptText, lang),
        ]);
      } else {
        [diaryResult, defectResult] = await Promise.all([
          generateDiary(transcriptText, lang, project),
          generateDefect(transcriptText, lang),
        ]);
      }

      if (diaryResult.success) {
        setDiaryMarkdown(diaryResult.markdown || '');
      } else {
        console.error('Diary generation failed:', diaryResult.error);
      }

      if (defectResult.success) {
        setDefectMarkdown(defectResult.markdown || '');
        setDefectJson(defectResult.json as DefectData || null);
      } else {
        console.error('Defect generation failed:', defectResult.error);
      }
    } catch (err) {
      console.error('Processing error:', err);
      setError(err instanceof Error ? err.message : 'Processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const regenerate = useCallback(
    async (newLanguage: Language, newProjectName: string) => {
      if (!transcript) return;

      setIsProcessing(true);
      setError(null);

      try {
        const electronAPI = typeof window !== 'undefined' ? window.electronAPI : undefined;

        let diaryResult, defectResult;

        if (electronAPI) {
          [diaryResult, defectResult] = await Promise.all([
            electronAPI.generateDiary(transcript, newLanguage, newProjectName),
            electronAPI.generateDefect(transcript, newLanguage),
          ]);
        } else {
          [diaryResult, defectResult] = await Promise.all([
            generateDiary(transcript, newLanguage, newProjectName),
            generateDefect(transcript, newLanguage),
          ]);
        }

        if (diaryResult.success) {
          setDiaryMarkdown(diaryResult.markdown || '');
        }

        if (defectResult.success) {
          setDefectMarkdown(defectResult.markdown || '');
          setDefectJson(defectResult.json as DefectData || null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Regeneration failed');
      } finally {
        setIsProcessing(false);
      }
    },
    [transcript]
  );

  const clearResults = useCallback(() => {
    setTranscript('');
    setDiaryMarkdown('');
    setDefectMarkdown('');
    setDefectJson(null);
    setError(null);
    setSmartInsights(null);
  }, []);

  const generateSmartInsights = useCallback(
    async (previousEntries: PreviousEntry[], lang: Language) => {
      console.log('[generateSmartInsights] Called with:', {
        previousEntriesCount: previousEntries.length,
        lang,
        hasTranscript: !!transcript,
        transcriptLength: transcript?.length || 0,
        hasDiaryMarkdown: !!diaryMarkdown,
        diaryLength: diaryMarkdown?.length || 0,
      });

      if (!transcript || !diaryMarkdown) {
        console.warn('[generateSmartInsights] Early return - missing transcript or diary');
        return;
      }

      setIsProcessingInsights(true);
      console.log('[generateSmartInsights] Set isProcessingInsights to true');

      try {
        const electronAPI = typeof window !== 'undefined' ? window.electronAPI : undefined;
        console.log('[generateSmartInsights] electronAPI available:', !!electronAPI);

        if (!electronAPI) {
          console.warn('Smart Insights requires Electron API');
          setIsProcessingInsights(false);
          return;
        }

        console.log('[generateSmartInsights] Calling IPC handlers...');
        // Run all three analyses in parallel
        const [claimSafetyResult, confidenceMeterResult, deltaIntelligenceResult] =
          await Promise.all([
            electronAPI.generateClaimSafety(diaryMarkdown, defectMarkdown, lang),
            electronAPI.generateConfidenceMeter(
              transcript,
              diaryMarkdown,
              defectMarkdown,
              lang
            ),
            electronAPI.generateDeltaIntelligence(
              transcript,
              diaryMarkdown,
              defectMarkdown,
              previousEntries,
              lang
            ),
          ]);

        console.log('[generateSmartInsights] IPC results:', {
          claimSafety: claimSafetyResult.success,
          confidenceMeter: confidenceMeterResult.success,
          deltaIntelligence: deltaIntelligenceResult.success,
        });

        const insights: SmartInsights = {
          claimSafety: claimSafetyResult.success
            ? (claimSafetyResult.data as ClaimSafetyResult)
            : null,
          confidenceMeter: confidenceMeterResult.success
            ? (confidenceMeterResult.data as ConfidenceMeterResult)
            : null,
          deltaIntelligence: deltaIntelligenceResult.success
            ? (deltaIntelligenceResult.data as DeltaIntelligenceResult)
            : null,
          generatedAt: new Date().toISOString(),
        };

        setSmartInsights(insights);
      } catch (err) {
        console.error('Smart Insights generation error:', err);
      } finally {
        setIsProcessingInsights(false);
      }
    },
    [transcript, diaryMarkdown, defectMarkdown]
  );

  return (
    <RecordingContext.Provider
      value={{
        isRecording,
        isProcessing,
        transcript,
        diaryMarkdown,
        defectMarkdown,
        defectJson,
        error,
        audioLevel,
        smartInsights,
        isProcessingInsights,
        startRecording,
        stopRecording,
        abortRecording,
        toggleRecording,
        clearResults,
        regenerate,
        generateSmartInsights,
      }}
    >
      {children}
    </RecordingContext.Provider>
  );
}
