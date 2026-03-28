'use client';

import { formatTime } from '@/utils/formatTime';

interface SessionTrackerProps {
  pauses: number;
  practiceTime: number;
}

export default function SessionTracker({ pauses, practiceTime }: SessionTrackerProps) {
  return (
    <div className="flex flex-col gap-3 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-white/50">
        Session
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {/* Practice Pauses */}
        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
          <div className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            {pauses}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-white/40 mt-1">
            Pauses
          </div>
        </div>

        {/* Practice Time */}
        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
          <div className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            {formatTime(practiceTime)}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-white/40 mt-1">
            Practice
          </div>
        </div>
      </div>

      {/* Progress visual */}
      {pauses > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap mt-1">
          {Array.from({ length: Math.min(pauses, 20) }).map((_, i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-sm shadow-violet-500/30"
              style={{
                animationDelay: `${i * 0.05}s`,
              }}
            />
          ))}
          {pauses > 20 && (
            <span className="text-[10px] text-white/30 ml-1">+{pauses - 20}</span>
          )}
        </div>
      )}
    </div>
  );
}
