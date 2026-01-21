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

// API calls for browser mode (using Next.js API routes)
async function transcribeAudio(audioBlob: Blob, language: string): Promise<{ success: boolean; text?: string; error?: string }> {
  try {
    const audioFile = new File([audioBlob], 'audio.webm', { type: 'audio/webm' });

    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('language', language);

    const response = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    return result;
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Transcription failed' };
  }
}

async function generateDiary(transcript: string, language: string, projectName: string): Promise<{ success: boolean; markdown?: string; error?: string }> {
  try {
    const response = await fetch('/api/generate-diary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript, language, projectName }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Diary generation failed' };
  }
}

async function generateDefect(transcript: string, language: string): Promise<{ success: boolean; markdown?: string; json?: DefectData | null; error?: string }> {
  try {
    const response = await fetch('/api/generate-defect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript, language }),
    });

    const result = await response.json();
    return result;
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


  // Audio level analysis
  const startAudioAnalysis = useCallback((stream: MediaStream) => {
    console.log('[Audio] Starting audio analysis...');
    console.log('[Audio] Stream tracks:', stream.getAudioTracks().map(t => ({ id: t.id, enabled: t.enabled, readyState: t.readyState })));

    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;
    console.log('[Audio] AudioContext state:', audioContext.state);

    // Resume AudioContext if suspended (required after user gesture)
    if (audioContext.state === 'suspended') {
      console.log('[Audio] Resuming suspended AudioContext...');
      audioContext.resume().then(() => {
        console.log('[Audio] AudioContext resumed, state:', audioContext.state);
      });
    }

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.3; // Faster response
    analyserRef.current = analyser;

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    console.log('[Audio] MediaStreamSource connected to analyser');

    const dataArray = new Uint8Array(analyser.fftSize);
    let frameCount = 0;

    const updateLevel = () => {
      if (!analyserRef.current) {
        console.log('[Audio] Analyser ref is null, stopping');
        return;
      }

      // Use time domain data for real-time volume visualization
      analyserRef.current.getByteTimeDomainData(dataArray);

      // Calculate RMS (root mean square) for volume level
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const value = (dataArray[i] - 128) / 128; // Normalize to -1 to 1
        sum += value * value;
      }
      const rms = Math.sqrt(sum / dataArray.length);
      const normalizedLevel = Math.min(rms * 3, 1); // Scale up and clamp to 0-1

      // Log every 30 frames (roughly every 0.5 seconds)
      frameCount++;
      if (frameCount % 30 === 0) {
        console.log('[Audio] Level update:', { rms: rms.toFixed(4), normalized: normalizedLevel.toFixed(3) });
      }

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

  // Use refs to avoid re-registering the hotkey listener on every state change
  const isRecordingRef = useRef(isRecording);
  const startRecordingRef = useRef(startRecording);
  const stopRecordingRef = useRef(stopRecording);

  useEffect(() => {
    isRecordingRef.current = isRecording;
    startRecordingRef.current = startRecording;
    stopRecordingRef.current = stopRecording;
  }, [isRecording, startRecording, stopRecording]);

  // Listen for global hotkey from Electron (if available) - only register ONCE
  useEffect(() => {
    const electronAPI = typeof window !== 'undefined' ? window.electronAPI : undefined;
    if (electronAPI) {
      console.log('[Hotkey] Setting up recording toggle listener (once)');
      const cleanup = electronAPI.onRecordingToggle(() => {
        console.log('[Hotkey] Received recording:toggle event, isRecording:', isRecordingRef.current);
        if (isRecordingRef.current) {
          stopRecordingRef.current();
        } else {
          startRecordingRef.current();
        }
      });
      return cleanup;
    }
  }, []); // Empty deps - only run once

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

        let claimSafetyResult, confidenceMeterResult, deltaIntelligenceResult;

        if (electronAPI) {
          // Use Electron IPC
          console.log('[generateSmartInsights] Calling IPC handlers...');
          [claimSafetyResult, confidenceMeterResult, deltaIntelligenceResult] =
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
        } else {
          // Use API routes (browser mode)
          console.log('[generateSmartInsights] Calling API routes...');
          const [safetyRes, confidenceRes, deltaRes] = await Promise.all([
            fetch('/api/smart-insights/claim-safety', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ diaryMarkdown, defectMarkdown, language: lang }),
            }),
            fetch('/api/smart-insights/confidence-meter', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ transcript, diaryMarkdown, defectMarkdown, language: lang }),
            }),
            fetch('/api/smart-insights/delta-intelligence', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                currentTranscript: transcript,
                currentDiary: diaryMarkdown,
                currentDefect: defectMarkdown,
                previousEntries,
                language: lang,
              }),
            }),
          ]);

          claimSafetyResult = await safetyRes.json();
          confidenceMeterResult = await confidenceRes.json();
          deltaIntelligenceResult = await deltaRes.json();
        }

        console.log('[generateSmartInsights] Results:', {
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
