'use client';

import { useRef, useCallback, useState } from 'react';
import Controls from './Controls';
import PauseOverlay from './PauseOverlay';
import YouTubePlayerWrapper from './YouTubePlayerWrapper';
import type { UseVideoPlayerReturn } from '@/hooks/useVideoPlayer';

interface VideoPlayerProps {
  player: UseVideoPlayerReturn;
}

export default function VideoPlayer({ player }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        player.addVideos(e.dataTransfer.files);
      }
    },
    [player]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const hasVideos = player.playlist.length > 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-zinc-950 rounded-2xl overflow-hidden shadow-2xl shadow-black/50
                 border border-white/5"
      onMouseMove={player.showControls}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Native video element (hidden when YouTube is active) */}
      <video
        ref={player.videoRef}
        className={`w-full h-full object-contain bg-black ${
          player.isYouTubeSource ? 'hidden' : ''
        }`}
        playsInline
        onClick={player.togglePlay}
      />

      {/* YouTube player (hidden when local is active) */}
      <YouTubePlayerWrapper
        containerRef={player.youtubeContainerRef}
        visible={player.isYouTubeSource}
      />

      {/* Click overlay for YouTube (since iframe captures clicks) */}
      {player.isYouTubeSource && !player.isPaused && (
        <div
          className="absolute inset-0 z-20 cursor-pointer"
          onClick={player.togglePlay}
          onMouseMove={player.showControls}
        />
      )}

      {/* Drop zone overlay */}
      {!hasVideos && !isDragOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white/50 z-20">
          <div className="w-20 h-20 rounded-2xl bg-white/5 border-2 border-dashed border-white/15 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white/30"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-white/60">Drop video files here</p>
            <p className="text-xs text-white/30 mt-1">or use the options below</p>
          </div>
        </div>
      )}

      {/* Drag over highlight */}
      {isDragOver && (
        <div className="absolute inset-0 bg-violet-500/10 border-2 border-dashed border-violet-500/50 rounded-2xl flex items-center justify-center z-40">
          <div className="text-violet-300 text-lg font-semibold flex items-center gap-2">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Drop to add
          </div>
        </div>
      )}

      {/* Pause Overlay */}
      <PauseOverlay
        isPaused={player.isPaused}
        effectiveMode={player.effectiveMode}
        strictCountdown={player.strictCountdown}
        practiceDisabled={player.practiceDisabled}
        onResume={player.resumeFromPause}
      />

      {/* Controls */}
      {hasVideos && (
        <Controls
          isPlaying={player.isPlaying}
          currentTime={player.currentTime}
          duration={player.duration}
          volume={player.volume}
          isMuted={player.isMuted}
          buffered={player.buffered}
          maxWatchedTime={player.maxWatchedTime}
          onTogglePlay={player.togglePlay}
          onSeek={player.seek}
          onVolumeChange={player.setVolume}
          onToggleMute={player.toggleMute}
          onToggleFullscreen={player.toggleFullscreen}
          visible={player.controlsVisible}
        />
      )}
    </div>
  );
}
