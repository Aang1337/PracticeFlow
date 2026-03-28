'use client';

import type { PracticeMode } from '@/utils/constants';

interface ModeSelectorProps {
  value: PracticeMode;
  onChange: (value: PracticeMode) => void;
}

const MODES: { value: PracticeMode; label: string; icon: string; tooltip: string }[] = [
  { 
    value: 'normal', 
    label: 'Normal', 
    icon: '🎯',
    tooltip: 'Resume anytime'
  },
  { 
    value: 'strict', 
    label: 'Strict', 
    icon: '⚡',
    tooltip: '5-minute mandatory practice (can be skipped globally via Ctrl+1)'
  },
  { 
    value: 'always-strict', 
    label: 'Always Strict', 
    icon: '🔒',
    tooltip: '5-minute mandatory practice (practice skip disabled)'
  },
];

export default function ModeSelector({ value, onChange }: ModeSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] uppercase tracking-widest text-white/40 font-semibold hidden md:inline">
        Mode
      </span>
      <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
        {MODES.map((mode) => (
          <button
            key={mode.value}
            onClick={() => onChange(mode.value)}
            title={mode.tooltip}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer
              ${
                value === mode.value
                  ? 'bg-emerald-600/90 shadow-md shadow-emerald-500/20 text-white'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }
            `}
          >
            <span className="text-[10px]">{mode.icon}</span>
            <span className="hidden sm:inline">{mode.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
