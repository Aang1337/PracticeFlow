'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import { formatTime } from '@/utils/formatTime';

interface ControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  buffered: number;
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
  onTogglePlay,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleFullscreen,
  visible,
}: ControlsProps) {
  const progressRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState(0);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedProgress = duration > 0 ? (buffered / duration) * 100 : 0;

  const getTimeFromPosition = useCallback(
    (clientX: number) => {
      if (!progressRef.current || !duration) return 0;
      const rect = progressRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return ratio * duration;
    },
    [duration]
  );

  const handleProgressClick = useCallback(
    (e: React.MouseEvent) => {
      onSeek(getTimeFromPosition(e.clientX));
    },
    [getTimeFromPosition, onSeek]
  );

  const handleProgressMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      onSeek(getTimeFromPosition(e.clientX));
    },
    [getTimeFromPosition, onSeek]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!progressRef.current) return;
      const rect = progressRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      setHoverTime(ratio * duration);
      setHoverX(e.clientX - rect.left);
    },
    [duration]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      onSeek(getTimeFromPosition(e.clientX));
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, getTimeFromPosition, onSeek]);

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 z-30 transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

      <div className="relative px-4 pb-4 pt-12">
        <div
          ref={progressRef}
          className="relative h-1.5 group cursor-pointer mb-3 rounded-full"
          onClick={handleProgressClick}
          onMouseDown={handleProgressMouseDown}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverTime(null)}
        >
          <div className="absolute inset-0 bg-white/15 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-white/20 rounded-full"
              style={{ width: `${bufferedProgress}%` }}
            />
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-[width] duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div
            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg shadow-black/30
                       opacity-0 group-hover:opacity-100 transition-opacity scale-75 group-hover:scale-100"
            style={{ left: `calc(${progress}% - 7px)` }}
          />

          {hoverTime !== null && (
            <div
              className="absolute -top-8 -translate-x-1/2 px-2 py-1 rounded text-[10px] font-mono whitespace-nowrap pointer-events-none flex items-center gap-1 bg-black/80 text-white/90"
              style={{ left: hoverX }}
            >
              {formatTime(hoverTime)}
            </div>
          )}
          <div className="absolute -inset-y-2 inset-x-0" />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              id="play-pause-btn"
              onClick={onTogglePlay}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer"
            >
              {isPlaying ? (
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <div className="flex items-center gap-1.5 group/vol">
              <button
                onClick={onToggleMute}
                className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer"
              >
                {isMuted || volume === 0 ? (
                  <svg className="w-4 h-4 text-white/70" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-white/70" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  </svg>
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => onVolumeChange(Number(e.target.value))}
                className="w-0 group-hover/vol:w-20 transition-all duration-200 accent-violet-500 opacity-0 group-hover/vol:opacity-100 cursor-pointer"
              />
            </div>

            <span className="text-xs text-white/60 font-mono tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleFullscreen}
              className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer"
            >
              <svg className="w-4 h-4 text-white/70" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
