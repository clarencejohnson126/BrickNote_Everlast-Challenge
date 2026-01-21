'use client';

import { useEffect, useState, useRef } from 'react';

interface AudioVisualizerProps {
  audioLevel: number;
  isRecording: boolean;
  barCount?: number;
}

export function AudioVisualizer({ audioLevel, isRecording, barCount = 5 }: AudioVisualizerProps) {
  const [bars, setBars] = useState<number[]>(Array(barCount).fill(0.1));
  const animationRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    if (!isRecording) {
      setBars(Array(barCount).fill(0.1));
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    // Animation loop for smooth updates
    const animate = (timestamp: number) => {
      // Update every ~50ms for smooth animation
      if (timestamp - lastUpdateRef.current > 50) {
        lastUpdateRef.current = timestamp;

        // Scale up the audio level for better visibility (multiply by 5)
        const scaledLevel = Math.min(1, audioLevel * 5);

        // Ensure minimum animation when recording (at least 0.15)
        const effectiveLevel = Math.max(0.15, scaledLevel);

        const newBars = Array(barCount).fill(0).map((_, i) => {
          // Add variation between bars - middle bars tend to be taller
          const positionFactor = 1 - Math.abs(i - (barCount - 1) / 2) / ((barCount - 1) / 2) * 0.3;
          // Add random variation for organic movement
          const randomFactor = 0.6 + Math.random() * 0.8;
          const height = Math.max(0.1, Math.min(1, effectiveLevel * positionFactor * randomFactor));
          return height;
        });

        setBars(newBars);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioLevel, isRecording, barCount]);

  return (
    <div className="flex items-center justify-center gap-1 h-16">
      {bars.map((height, index) => (
        <div
          key={index}
          className="w-2 bg-red-500 rounded-full transition-all duration-75"
          style={{
            height: `${Math.max(8, height * 64)}px`,
            opacity: isRecording ? 0.7 + height * 0.3 : 0.3,
          }}
        />
      ))}
    </div>
  );
}
