'use client';

import { formatCompact } from '@/utils/formatTime';
import { FIXED_INTERVAL } from '@/utils/constants';

interface TimerProps {
  timeUntilPause: number;
  isPlaying: boolean;
}

export default function Timer({ timeUntilPause, isPlaying }: TimerProps) {
  // Graceful clamp keeping visuals clean physically around the zero-bounds
  const safeTime = Math.max(0, timeUntilPause);
  
  const progress = 1 - safeTime / FIXED_INTERVAL;
  const circumference = 2 * Math.PI * 18;
  const isUrgent = safeTime <= 5;

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-10 h-10">
        <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" />
          <circle
            cx="20" cy="20" r="18" fill="none"
            stroke={isUrgent ? '#f87171' : '#a78bfa'}
            strokeWidth="2.5" strokeLinecap="round" strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            className="transition-all duration-300 ease-linear"
          />
        </svg>
        <div className={`absolute inset-0 flex items-center justify-center text-[10px] font-bold ${isUrgent ? 'text-red-400 animate-pulse' : 'text-white/80'}`}>
          {isPlaying ? formatCompact(safeTime) : '—'}
        </div>
      </div>
      <div className="hidden sm:flex flex-col">
        <span className="text-[10px] uppercase tracking-widest text-white/40">Next pause</span>
        <span className={`text-xs font-semibold ${isUrgent ? 'text-red-400' : 'text-white/70'}`}>
          {isPlaying ? formatCompact(safeTime) : 'Paused'}
        </span>
      </div>
    </div>
  );
}
