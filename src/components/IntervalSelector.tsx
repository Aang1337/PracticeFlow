'use client';

import { INTERVAL_OPTIONS } from '@/utils/constants';

interface IntervalSelectorProps {
  value: number;
  onChange: (value: number) => void;
}

export default function IntervalSelector({ value, onChange }: IntervalSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-[10px] uppercase tracking-widest text-white/40 hidden sm:block">
        Interval
      </label>
      <select
        id="interval-selector"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white/80
                   focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/50
                   cursor-pointer appearance-none hover:bg-white/10 transition-colors"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.4)' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 6px center',
          paddingRight: '24px',
        }}
      >
        {INTERVAL_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-zinc-900 text-white">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
