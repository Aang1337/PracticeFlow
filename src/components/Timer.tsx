'use client';

import { formatCompact } from '@/utils/formatTime';

interface TimerProps {
  timeUntilPause: number;
  isPlaying: boolean;
}

export default function Timer({ timeUntilPause, isPlaying }: TimerProps) {
  const FIXED_INTERVAL = 60;
  const progress = 1 - timeUntilPause / FIXED_INTERVAL;
  const circumference = 2 * Math.PI * 18;
  const isUrgent = timeUntilPause <= 5;

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-10 h-10">
        <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
          {/* Background ring */}
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="2.5"
          />
          {/* Progress ring */}
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke={isUrgent ? '#f87171' : '#a78bfa'}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        {/* Center text */}
        <div
          className={`absolute inset-0 flex items-center justify-center text-[10px] font-bold ${
            isUrgent ? 'text-red-400 animate-pulse' : 'text-white/80'
          }`}
        >
          {isPlaying ? formatCompact(timeUntilPause) : '—'}
        </div>
      </div>
      <div className="hidden sm:flex flex-col">
        <span className="text-[10px] uppercase tracking-widest text-white/40">
          Next pause
        </span>
        <span
          className={`text-xs font-semibold ${
            isUrgent ? 'text-red-400' : 'text-white/70'
          }`}
        >
          {isPlaying ? formatCompact(timeUntilPause) : 'Paused'}
        </span>
      </div>
    </div>
  );
}
