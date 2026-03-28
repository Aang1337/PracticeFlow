'use client';

import { useRef, useEffect, useCallback, useState } from 'react';

// YouTube IFrame API type declarations
declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

declare namespace YT {
  enum PlayerState {
    UNSTARTED = -1,
    ENDED = 0,
    PLAYING = 1,
    PAUSED = 2,
    BUFFERING = 3,
    CUED = 5,
  }

  interface PlayerOptions {
    width?: number | string;
    height?: number | string;
    videoId?: string;
    playerVars?: Record<string, unknown>;
    events?: {
      onReady?: (event: { target: Player }) => void;
      onStateChange?: (event: { data: number; target: Player }) => void;
      onPlaybackQualityChange?: (event: { data: string; target: Player }) => void;
      onError?: (event: { data: number }) => void;
    };
  }

  class Player {
    constructor(elementId: string | HTMLElement, options: PlayerOptions);
    playVideo(): void;
    pauseVideo(): void;
    seekTo(seconds: number, allowSeekAhead?: boolean): void;
    getCurrentTime(): number;
    getDuration(): number;
    getVolume(): number;
    setVolume(volume: number): void;
    mute(): void;
    unMute(): void;
    isMuted(): boolean;
    getPlayerState(): number;
    loadVideoById(videoId: string, startSeconds?: number): void;
    cueVideoById(videoId: string, startSeconds?: number): void;
    setPlaybackQuality(suggestedQuality: string): void;
    getPlaybackQuality(): string;
    getAvailableQualityLevels(): string[];
    destroy(): void;
    getVideoLoadedFraction(): number;
  }
}

let apiLoaded = false;
let apiLoading = false;
const apiReadyCallbacks: (() => void)[] = [];

function loadYouTubeIFrameAPI(): Promise<void> {
  return new Promise((resolve) => {
    if (apiLoaded && window.YT?.Player) {
      resolve();
      return;
    }

    apiReadyCallbacks.push(resolve);

    if (apiLoading) return;
    apiLoading = true;

    window.onYouTubeIframeAPIReady = () => {
      apiLoaded = true;
      apiLoading = false;
      apiReadyCallbacks.forEach((cb) => cb());
      apiReadyCallbacks.length = 0;
    };

    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    document.head.appendChild(script);
  });
}

export interface UseYouTubePlayerOptions {
  onStateChange?: (state: number) => void;
  onReady?: () => void;
  onError?: (code: number) => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onBufferUpdate?: (buffered: number) => void;
}

export interface UseYouTubePlayerReturn {
  containerRef: React.RefObject<HTMLDivElement | null>;
  isReady: boolean;
  loadVideo: (videoId: string) => void;
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  setVolume: (vol: number) => void;
  mute: () => void;
  unmute: () => void;
  isMuted: () => boolean;
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
}

export function useYouTubePlayer(
  options: UseYouTubePlayerOptions = {}
): UseYouTubePlayerReturn {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YT.Player | null>(null);
  const rafRef = useRef<number | null>(null);
  const [isReady, setIsReady] = useState(false);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Polling loop for time updates (YouTube has no native timeupdate event)
  const startPolling = useCallback(() => {
    const poll = () => {
      const player = playerRef.current;
      if (player) {
        try {
          const time = player.getCurrentTime();
          const dur = player.getDuration();
          const buffered = player.getVideoLoadedFraction() * dur;
          optionsRef.current.onTimeUpdate?.(time, dur);
          optionsRef.current.onBufferUpdate?.(buffered);
        } catch {
          // Player might be destroyed
        }
      }
      rafRef.current = requestAnimationFrame(poll);
    };
    rafRef.current = requestAnimationFrame(poll);
  }, []);

  const stopPolling = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  // Initialize player
  useEffect(() => {
    let destroyed = false;
    const container = containerRef.current;
    if (!container) return;

    // Create a target div inside container (YouTube replaces it with iframe)
    const targetDiv = document.createElement('div');
    targetDiv.id = `yt-player-${Date.now()}`;
    container.innerHTML = '';
    container.appendChild(targetDiv);

    loadYouTubeIFrameAPI().then(() => {
      if (destroyed) return;

      playerRef.current = new window.YT.Player(targetDiv.id, {
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 0,
          controls: 1, // Enforced native components
          enablejsapi: 1, // Expose internal API states
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3, 
          disablekb: 1, 
          playsinline: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            setIsReady(true);
            optionsRef.current.onReady?.();
            startPolling();
            // Aggressively attempt to lock resolution to highest baseline securely
            event.target.setPlaybackQuality('hd1080');
          },
          onStateChange: (event) => {
            optionsRef.current.onStateChange?.(event.data);
          },
          onPlaybackQualityChange: (event) => {
             const available = event.target.getAvailableQualityLevels() || [];
             let desired = 'hd1080';
             
             // Dynamic Fallback logic mapping physically to optimal resolution
             if (!available.includes('hd1080') && available.length > 0) {
                 desired = available[0]; 
             }
             
             if (event.data !== desired) {
                 event.target.setPlaybackQuality(desired);
             }
          },
          onError: (event) => {
            optionsRef.current.onError?.(event.data);
          },
        },
      });
    });

    return () => {
      destroyed = true;
      stopPolling();
      try {
        playerRef.current?.destroy();
      } catch {
        // ignore
      }
      playerRef.current = null;
      setIsReady(false);
    };
  }, [startPolling, stopPolling]);

  const loadVideo = useCallback((videoId: string) => {
    playerRef.current?.cueVideoById(videoId);
  }, []);

  const play = useCallback(() => {
    playerRef.current?.playVideo();
  }, []);

  const pause = useCallback(() => {
    playerRef.current?.pauseVideo();
  }, []);

  const seekTo = useCallback((seconds: number) => {
    playerRef.current?.seekTo(seconds, true);
  }, []);

  const setVolume = useCallback((vol: number) => {
    // normalize 0-1 to 0-100
    playerRef.current?.setVolume(Math.round(vol * 100));
  }, []);

  const mute = useCallback(() => {
    playerRef.current?.mute();
  }, []);

  const unmute = useCallback(() => {
    playerRef.current?.unMute();
  }, []);

  const isMutedFn = useCallback(() => {
    return playerRef.current?.isMuted() ?? false;
  }, []);

  const getCurrentTime = useCallback(() => {
    return playerRef.current?.getCurrentTime() ?? 0;
  }, []);

  const getDuration = useCallback(() => {
    return playerRef.current?.getDuration() ?? 0;
  }, []);

  const destroy = useCallback(() => {
    stopPolling();
    try {
      playerRef.current?.destroy();
    } catch {
      // ignore
    }
    playerRef.current = null;
    setIsReady(false);
  }, [stopPolling]);

  return {
    containerRef,
    isReady,
    loadVideo,
    play,
    pause,
    seekTo,
    setVolume,
    mute,
    unmute,
    isMuted: isMutedFn,
    getCurrentTime,
    getDuration,
    destroy,
  };
}
