'use client';

import { INTERVALS } from '@/utils/constants';

interface IntervalSelectorProps {
  value: number;
  onChange: (value: number) => void;
}

export default function IntervalSelector({ value, onChange }: IntervalSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">
        Interval
      </span>
      <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
        {INTERVALS.map((int) => (
          <button
            key={int}
            onClick={() => onChange(int)}
            className={`
              px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer
              ${
                value === int
                  ? 'bg-violet-600 shadow-md shadow-violet-500/20 text-white'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }
            `}
          >
            {int}s
          </button>
        ))}
      </div>
    </div>
  );
}
