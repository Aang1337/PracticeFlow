'use client';

import { MODE_OPTIONS, type PracticeMode } from '@/utils/constants';

interface ModeSelectorProps {
  value: PracticeMode;
  onChange: (value: PracticeMode) => void;
}

export default function ModeSelector({ value, onChange }: ModeSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-[10px] uppercase tracking-widest text-white/40 hidden sm:block">
        Mode
      </label>
      <div className="flex rounded-xl overflow-hidden border border-white/10 bg-white/5">
        {MODE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            title={opt.description}
            className={`
              px-3 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer
              ${
                value === opt.value
                  ? 'bg-violet-600/80 text-white shadow-inner'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }
            `}
          >
            <span className="mr-1">{opt.icon}</span>
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
