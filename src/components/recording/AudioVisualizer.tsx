'use client';

import { useEffect, useState } from 'react';

interface AudioVisualizerProps {
  audioLevel: number;
  isRecording: boolean;
  barCount?: number;
}

export function AudioVisualizer({ audioLevel, isRecording, barCount = 5 }: AudioVisualizerProps) {
  const [bars, setBars] = useState<number[]>(Array(barCount).fill(0.1));

  useEffect(() => {
    if (!isRecording) {
      setBars(Array(barCount).fill(0.1));
      return;
    }

    // Create varied bar heights based on audio level with some randomness
    const newBars = Array(barCount).fill(0).map((_, i) => {
      const baseHeight = audioLevel;
      // Add variation between bars - middle bars tend to be taller
      const positionFactor = 1 - Math.abs(i - (barCount - 1) / 2) / ((barCount - 1) / 2) * 0.3;
      // Add random variation
      const randomFactor = 0.7 + Math.random() * 0.6;
      const height = Math.max(0.1, Math.min(1, baseHeight * positionFactor * randomFactor));
      return height;
    });

    setBars(newBars);
  }, [audioLevel, isRecording, barCount]);

  return (
    <div className="flex items-center justify-center gap-1 h-16">
      {bars.map((height, index) => (
        <div
          key={index}
          className="w-2 bg-red-500 rounded-full transition-all duration-75"
          style={{
            height: `${Math.max(8, height * 64)}px`,
            opacity: isRecording ? 0.8 + height * 0.2 : 0.3,
          }}
        />
      ))}
    </div>
  );
}
