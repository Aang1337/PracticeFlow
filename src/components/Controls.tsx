'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import { formatTime } from '@/utils/formatTime';

interface ControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  buffered: number;
  maxWatchedTime: number; // Natively lock dragging boundaries
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  visible: boolean;
}

export default function Controls({
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  buffered,
  maxWatchedTime,
  onTogglePlay,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleFullscreen,
  visible,
}: ControlsProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const [localTime, setLocalTime] = useState(currentTime);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Sync local time organically unless engaged in a slider drag
  useEffect(() => {
    if (!isDragging) {
      setLocalTime(currentTime);
    }
  }, [currentTime, isDragging]);

  const handleProgressAction = useCallback(
    (clientX: number, commit: boolean) => {
      if (!progressBarRef.current || duration === 0) return;
      const rect = progressBarRef.current.getBoundingClientRect();
      const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const targetTime = pos * duration;
      
      // Visually clamp drag boundary strictly to maxWatchedTime 
      const clampedTime = Math.min(targetTime, maxWatchedTime);

      setLocalTime(clampedTime);
      if (commit) {
        onSeek(clampedTime);
      }
    },
    [duration, maxWatchedTime, onSeek]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    handleProgressAction(e.clientX, false);
    
    // Attach document hooks cleanly allowing off-element releases
    const onMove = (moveEvent: PointerEvent) => handleProgressAction(moveEvent.clientX, false);
    const onUp = (upEvent: PointerEvent) => {
      handleProgressAction(upEvent.clientX, true);
      setIsDragging(false);
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging || !progressBarRef.current || duration === 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverPosition(pos);
  };

  const handlePointerLeave = () => {
    if (!isDragging) setHoverPosition(null);
  };

  const progressPercent = duration > 0 ? (localTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0;
  const maxPercent = duration > 0 ? (maxWatchedTime / duration) * 100 : 0;

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 p-4 pt-16
                  bg-gradient-to-t from-black/90 via-black/40 to-transparent
                  transition-all duration-300 ease-out z-30
                  ${visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'}`}
    >
      {/* ───── TIMELINE SCRUBBER ───── */}
      <div className="group relative h-4 cursor-pointer mb-2 touch-none"
           ref={progressBarRef}
           onPointerDown={handlePointerDown}
           onPointerMove={handlePointerMove}
           onPointerLeave={handlePointerLeave}>
        
        {/* Track Base */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1.5 bg-white/10 rounded-full overflow-hidden transition-all duration-200 group-hover:h-2 group-hover:bg-white/20">
          
          {/* Buffer Bar */}
          <div className="absolute top-0 bottom-0 left-0 bg-white/20 transition-all duration-200"
               style={{ width: `${bufferedPercent}%` }} />

          {/* Unlocked Zone Indicator (Grey area showing what you CAN seek back into) */}
          <div className="absolute top-0 bottom-0 left-0 bg-white/40 transition-all duration-200"
               style={{ width: `${maxPercent}%` }} />

          {/* Locked Zone Indicator (Red stripes ahead of progressed boundary) */}
          <div className="absolute top-0 bottom-0 right-0 bg-red-500/10 border-l border-red-500/30"
               style={{ 
                  left: `${maxPercent}%`, 
                  backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(239, 68, 68, 0.2) 10px, rgba(239, 68, 68, 0.2) 20px)'
               }}
               title="Progression locked: Must watch organically"
          />

          {/* Active Progress */}
          <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-200"
               style={{ width: `${progressPercent}%` }} />
        </div>

        {/* Hover Time Tooltip Clamp */}
        {hoverPosition !== null && duration > 0 && !isDragging && (
          <div
            className={`absolute bottom-full mb-2 -translate-x-1/2 rounded px-2 py-1 text-[11px] font-bold text-white shadow shadow-black/50 tabular-nums
                        ${hoverPosition * duration > maxWatchedTime ? 'bg-red-500/80' : 'bg-black/80'}`}
            style={{ left: `${hoverPosition * 100}%` }}
          >
            {formatTime(hoverPosition * duration)}
            {hoverPosition * duration > maxWatchedTime && ' (Locked)'}
          </div>
        )}

        {/* Scrubber Knob */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full 
                     shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-200 ease-out pointer-events-none"
          style={{
            left: `${progressPercent}%`,
            transform: `translate(-50%, -50%) scale(${isDragging || hoverPosition !== null ? 1 : 0})`,
          }}
        />
      </div>

      <div className="flex items-center justify-between mt-1 text-white">
        <div className="flex items-center gap-3">
          <button onClick={onTogglePlay} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors cursor-pointer text-white">
            {isPlaying ? (
               <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
            ) : (
               <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>

          <div className="flex items-center gap-2 group">
             <button onClick={onToggleMute} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors cursor-pointer text-white/80 hover:text-white">
                {isMuted || volume === 0 ? (
                  <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                )}
             </button>
             <input
               type="range" min="0" max="1" step="0.05"
               value={isMuted ? 0 : volume}
               onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
               className="w-0 opacity-0 group-hover:w-20 group-hover:opacity-100 transition-all duration-300 ease-in-out cursor-pointer accent-violet-500 h-1 rounded-full bg-white/20"
             />
          </div>

          <div className="text-xs font-medium tabular-nums text-white/80 border-l border-white/10 pl-4 ml-2">
            {formatTime(localTime)} <span className="text-white/30 mx-1">/</span> {formatTime(duration)}
          </div>
        </div>

        <button onClick={onToggleFullscreen} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors cursor-pointer text-white/80 hover:text-white">
           <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
        </button>
      </div>
    </div>
  );
}
