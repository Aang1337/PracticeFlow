'use client';

import { useRef } from 'react';
import Controls from './Controls';
import PauseOverlay from './PauseOverlay';
import YouTubePlayerWrapper from './YouTubePlayerWrapper';
import type { UseVideoPlayerReturn } from '@/hooks/useVideoPlayer';

interface VideoPlayerProps {
  player: UseVideoPlayerReturn;
}

export default function VideoPlayer({ player }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasVideos = player.playlist.length > 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-zinc-950 rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/5"
      onMouseMove={player.showControls}
    >
      <video
        ref={player.videoRef}
        className={`w-full h-full object-contain bg-black ${
          player.isYouTubeSource ? 'hidden' : ''
        }`}
        playsInline
        onClick={player.togglePlay}
      />

      <YouTubePlayerWrapper
        containerRef={player.youtubeContainerRef}
        visible={player.isYouTubeSource}
      />

      {player.isYouTubeSource && !player.isPaused && (
        <div
          className="absolute inset-0 z-20 cursor-pointer"
          onClick={player.togglePlay}
          onMouseMove={player.showControls}
        />
      )}

      {!hasVideos && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white/50 z-20">
          <div className="text-center mt-2">
            <p className="text-sm font-medium text-white/60">No video selected</p>
            <p className="text-xs text-white/30 mt-1">Select a video from the sidebar</p>
          </div>
        </div>
      )}

      <PauseOverlay
        isPaused={player.isPaused}
        strictCountdown={player.strictCountdown}
        onResume={player.resumeFromPause}
      />

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
