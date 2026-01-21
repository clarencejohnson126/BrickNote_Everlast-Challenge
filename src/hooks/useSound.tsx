'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';

interface SoundContextType {
  soundEnabled: boolean;
  toggleSound: () => void;
  playClick: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export function SoundProvider({ children }: { children: ReactNode }) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Load saved preference
    try {
      const saved = localStorage.getItem('bricknote-sound');
      if (saved !== null) {
        setSoundEnabled(saved === 'true');
      }
    } catch (e) {
      console.error('Error reading sound preference:', e);
    }
  }, []);

  useEffect(() => {
    // Save preference
    try {
      localStorage.setItem('bricknote-sound', String(soundEnabled));
    } catch (e) {
      console.error('Error saving sound preference:', e);
    }
  }, [soundEnabled]);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => !prev);
  }, []);

  const playClick = useCallback(() => {
    if (!soundEnabled) return;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;

      // Resume context if suspended (browser autoplay policy)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Create oscillator for click sound
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Short, subtle click - higher frequency for crispness
      oscillator.frequency.setValueAtTime(1800, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.03);

      // Quick attack and decay for a snappy click
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.003);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.06);
    } catch (e) {
      // Audio might not be available
      console.error('Error playing click sound:', e);
    }
  }, [soundEnabled]);

  return (
    <SoundContext.Provider value={{ soundEnabled, toggleSound, playClick }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
}
