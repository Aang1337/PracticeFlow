'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  PracticeMode,
  DEFAULT_INTERVAL,
  DEFAULT_MODE,
  STRICT_COUNTDOWN,
  ALWAYS_STRICT_COUNTDOWN,
} from '@/utils/constants';
import { useLocalStorage } from './useLocalStorage';
import { usePauseSound } from './usePauseSound';
import { useYouTubePlayer } from './useYouTubePlayer';
import { getHandle, setHandle } from '@/utils/idb';

export type VideoSource = 'local' | 'youtube';

export interface VideoFile {
  id: string;
  name: string;
  url: string;
  file?: File;
  source: VideoSource;
  youtubeId?: string;
  thumbnail?: string;
}

export interface UseVideoPlayerReturn {
  // Video ref
  videoRef: React.RefObject<HTMLVideoElement | null>;
  youtubeContainerRef: React.RefObject<HTMLDivElement | null>;

  // Video state
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  buffered: number;
  maxWatchedTime: number;

  // Practice state
  isPaused: boolean;
  interval: number;
  mode: PracticeMode;
  timeUntilPause: number;
  strictCountdown: number;
  sessionPauses: number;
  sessionPracticeTime: number;

  // Per-video practice skip
  practiceDisabled: boolean;
  setPracticeDisabled: (disabled: boolean) => void;
  effectiveMode: PracticeMode; // actual mode applied (considering practiceDisabled)

  // Playlist
  playlist: VideoFile[];
  currentVideoIndex: number;

  // Notes
  notes: string;

  // YouTube
  youtubeMode: boolean;
  setYoutubeMode: (on: boolean) => void;
  youtubeApiKey: string;
  setYoutubeApiKey: (key: string) => void;
  isYouTubeSource: boolean;
  youtubeReady: boolean;
  addYouTubeVideos: (videos: { id: string; title: string; thumbnail?: string }[]) => void;

  // Actions
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  toggleFullscreen: () => void;
  setInterval: (interval: number) => void;
  setMode: (mode: PracticeMode) => void;
  resumeFromPause: () => void;
  addVideos: (files: FileList | File[]) => void;
  removeVideo: (id: string) => void;
  selectVideo: (index: number) => void;
  setNotes: (notes: string) => void;
  controlsVisible: boolean;
  showControls: () => void;

  // Folder Access
  folderNeedsPermission: boolean;
  selectFolder: () => Promise<void>;
  restoreFolderAccess: () => Promise<void>;
}

export function useVideoPlayer(): UseVideoPlayerReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const intervalTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const strictTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const practiceTimeRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Core video state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [buffered, setBuffered] = useState(0);

  // Progress-lock: tracks the furthest point the user has actually watched
  const [maxWatchedTime, setMaxWatchedTime] = useState(0);
  const maxWatchedRef = useRef(0); // ref for synchronous access in event handlers

  // Practice state
  const [isPaused, setIsPaused] = useState(false);
  const [interval, setIntervalState] = useLocalStorage('pf-interval', DEFAULT_INTERVAL);
  const [mode, setModeState] = useLocalStorage<PracticeMode>('pf-mode', DEFAULT_MODE);
  const [timeUntilPause, setTimeUntilPause] = useState(DEFAULT_INTERVAL);
  const [strictCountdown, setStrictCountdown] = useState(0);
  const [sessionPauses, setSessionPauses] = useState(0);
  const [sessionPracticeTime, setSessionPracticeTime] = useState(0);

  // Controls
  const [controlsVisible, setControlsVisible] = useState(true);

  // Playlist
  const [playlist, setPlaylist] = useState<VideoFile[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  // YouTube mode
  const [youtubeMode, setYoutubeMode] = useState(false);
  const [youtubeApiKey, setYoutubeApiKeyState] = useLocalStorage('pf-yt-api-key', '');

  // Derived: is the current video from YouTube?
  const currentVideo = playlist[currentVideoIndex];
  const isYouTubeSource = currentVideo?.source === 'youtube';

  // Per-video practice disabled
  const practiceDisabledKey = currentVideo ? `pf-skip-${currentVideo.id}` : 'pf-skip-default';
  const [practiceDisabled, setPracticeDisabledState] = useLocalStorage(practiceDisabledKey, false);

  // Effective mode: if practice is disabled for this video, override to 'normal'
  const effectiveMode = practiceDisabled ? 'normal' : mode;

  // Notes
  const notesKey = currentVideo ? `pf-notes-${currentVideo.id}` : 'pf-notes-default';
  const [notes, setNotes] = useLocalStorage(notesKey, '');

  // Folder Access State
  const [folderNeedsPermission, setFolderNeedsPermission] = useState(false);
  const folderHandleRef = useRef<any>(null);

  const { playChime } = usePauseSound();

  // YouTube player hook — receives time updates via callbacks
  const ytPlayer = useYouTubePlayer({
    onTimeUpdate: useCallback((time: number, dur: number) => {
      if (isYouTubeSource) {
        setCurrentTime(time);
        setDuration(dur);
      }
    }, [isYouTubeSource]),
    onBufferUpdate: useCallback((buf: number) => {
      if (isYouTubeSource) {
        setBuffered(buf);
      }
    }, [isYouTubeSource]),
    onStateChange: useCallback((state: number) => {
      if (!isYouTubeSource) return;
      if (state === 1) {
        setIsPlaying(true);
      } else if (state === 2) {
        setIsPlaying(false);
      } else if (state === 0) {
        setIsPlaying(false);
        if (currentVideoIndex < playlist.length - 1) {
          setCurrentVideoIndex((i) => i + 1);
        }
      }
    }, [isYouTubeSource, currentVideoIndex, playlist.length]),
  });

  // Stable references to ytPlayer methods (avoid object identity changes in effects)
  const ytLoadVideo = ytPlayer.loadVideo;
  const ytIsReady = ytPlayer.isReady;
  const ytPlay = ytPlayer.play;
  const ytPause = ytPlayer.pause;
  const ytSeekTo = ytPlayer.seekTo;
  const ytSetVolume = ytPlayer.setVolume;
  const ytMute = ytPlayer.mute;
  const ytUnmute = ytPlayer.unmute;
  const ytIsMuted = ytPlayer.isMuted;

  // Reset timer when interval changes
  useEffect(() => {
    setTimeUntilPause(interval);
  }, [interval]);

  // ─── Auto-pause logic (works for BOTH local and YouTube) ───
  const triggerPause = useCallback(() => {
    if (isYouTubeSource) {
      ytPause();
    } else {
      const video = videoRef.current;
      if (!video || video.paused) return;
      video.pause();
    }

    setIsPlaying(false);
    setIsPaused(true);
    setSessionPauses((p) => p + 1);

    // Only play chime if practice is NOT disabled
    if (!practiceDisabled) {
      playChime();
    }

    // Apply strict countdown based on effective mode
    if (effectiveMode === 'strict') {
      setStrictCountdown(STRICT_COUNTDOWN);
    } else if (effectiveMode === 'always-strict') {
      setStrictCountdown(ALWAYS_STRICT_COUNTDOWN);
    }
    // 'normal' (including practiceDisabled) → no countdown
  }, [effectiveMode, playChime, isYouTubeSource, ytPause, practiceDisabled]);

  // Countdown timer for auto-pause
  useEffect(() => {
    if (intervalTimerRef.current) {
      clearInterval(intervalTimerRef.current);
      intervalTimerRef.current = null;
    }

    if (isPlaying && !isPaused) {
      intervalTimerRef.current = setInterval(() => {
        setTimeUntilPause((prev) => {
          if (prev <= 1) {
            triggerPause();
            return interval;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalTimerRef.current) clearInterval(intervalTimerRef.current);
    };
  }, [isPlaying, isPaused, interval, triggerPause]);

  // Strict countdown timer
  useEffect(() => {
    if (strictTimerRef.current) {
      clearInterval(strictTimerRef.current);
      strictTimerRef.current = null;
    }

    if (isPaused && strictCountdown > 0) {
      strictTimerRef.current = setInterval(() => {
        setStrictCountdown((prev) => {
          if (prev <= 1) {
            if (strictTimerRef.current) clearInterval(strictTimerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (strictTimerRef.current) clearInterval(strictTimerRef.current);
    };
  }, [isPaused, strictCountdown]);

  // Practice time tracker (only counts when practice is NOT disabled)
  useEffect(() => {
    if (practiceTimeRef.current) {
      clearInterval(practiceTimeRef.current);
      practiceTimeRef.current = null;
    }

    if (isPaused && !practiceDisabled) {
      practiceTimeRef.current = setInterval(() => {
        setSessionPracticeTime((p) => p + 1);
      }, 1000);
    }

    return () => {
      if (practiceTimeRef.current) clearInterval(practiceTimeRef.current);
    };
  }, [isPaused, practiceDisabled]);

  // Controls auto-hide
  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    if (isPlaying && !isPaused) {
      controlsTimerRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, 3000);
    }
  }, [isPlaying, isPaused]);

  // ─── Local video event handlers ───
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (!isYouTubeSource) {
        const t = video.currentTime;
        setCurrentTime(t);

        // Update max watched time as the video plays naturally
        if (t > maxWatchedRef.current) {
          maxWatchedRef.current = t;
          setMaxWatchedTime(t);
        }

        if (video.buffered.length > 0) {
          setBuffered(video.buffered.end(video.buffered.length - 1));
        }
      }
    };

    // Progress-lock: if user seeks past maxWatchedTime, snap back
    const handleSeeked = () => {
      if (!isYouTubeSource && video.currentTime > maxWatchedRef.current + 0.5) {
        video.currentTime = maxWatchedRef.current;
        setCurrentTime(maxWatchedRef.current);
      }
    };

    const handleLoadedMetadata = () => {
      if (!isYouTubeSource) {
        setDuration(video.duration);
      }
    };

    const handleEnded = () => {
      if (!isYouTubeSource) {
        setIsPlaying(false);
        // Mark video as fully watched
        maxWatchedRef.current = video.duration;
        setMaxWatchedTime(video.duration);
        if (currentVideoIndex < playlist.length - 1) {
          setCurrentVideoIndex((i) => i + 1);
        }
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
    };
  }, [currentVideoIndex, playlist.length, isYouTubeSource]);

  // Load video when currentVideoIndex changes
  // Uses stable ytLoadVideo/ytIsReady refs to avoid infinite re-renders
  useEffect(() => {
    const vid = playlist[currentVideoIndex];
    if (!vid) return;

    setCurrentTime(0);
    setTimeUntilPause(interval);
    setIsPlaying(false);
    setIsPaused(false);

    // Reset progress-lock for new video
    maxWatchedRef.current = 0;
    setMaxWatchedTime(0);

    if (vid.source === 'youtube' && vid.youtubeId) {
      if (ytIsReady) {
        ytLoadVideo(vid.youtubeId);
      }
    } else {
      const video = videoRef.current;
      if (video) {
        video.src = vid.url;
        video.load();
      }
    }
  }, [currentVideoIndex, playlist, interval, ytIsReady, ytLoadVideo]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;

      if ((e.ctrlKey || e.metaKey) && e.key === '1') {
        e.preventDefault();
        setPracticeDisabledState(!practiceDisabled);
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          if (isPaused) {
            resumeFromPause();
          } else {
            togglePlay();
          }
          break;
        case 'r':
        case 'R':
          if (isPaused) resumeFromPause();
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 'm':
        case 'M':
          toggleMute();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused, isPlaying, strictCountdown, effectiveMode, isYouTubeSource, practiceDisabled, setPracticeDisabledState]);

  // ─── Actions (source-aware) ───
  const togglePlay = useCallback(() => {
    if (isYouTubeSource) {
      if (isPlaying) {
        ytPause();
        setIsPlaying(false);
      } else {
        ytPlay();
        setIsPlaying(true);
      }
    } else {
      const video = videoRef.current;
      if (!video || !video.src) return;
      if (video.paused) {
        video.play();
        setIsPlaying(true);
      } else {
        video.pause();
        setIsPlaying(false);
      }
    }
  }, [isYouTubeSource, isPlaying, ytPause, ytPlay]);

  const seek = useCallback((time: number) => {
    // Clamp forward seeks to maxWatchedTime (progress-lock)
    const clampedTime = Math.min(time, maxWatchedRef.current);

    if (isYouTubeSource) {
      ytSeekTo(clampedTime);
      setCurrentTime(clampedTime);
    } else {
      const video = videoRef.current;
      if (!video) return;
      video.currentTime = clampedTime;
      setCurrentTime(clampedTime);
    }
  }, [isYouTubeSource, ytSeekTo]);

  const setVolume = useCallback((vol: number) => {
    if (isYouTubeSource) {
      ytSetVolume(vol);
      setVolumeState(vol);
      if (vol > 0) {
        ytUnmute();
        setIsMuted(false);
      }
    } else {
      const video = videoRef.current;
      if (!video) return;
      video.volume = vol;
      setVolumeState(vol);
      if (vol > 0) setIsMuted(false);
    }
  }, [isYouTubeSource, ytSetVolume, ytUnmute]);

  const toggleMute = useCallback(() => {
    if (isYouTubeSource) {
      if (ytIsMuted()) {
        ytUnmute();
        setIsMuted(false);
      } else {
        ytMute();
        setIsMuted(true);
      }
    } else {
      const video = videoRef.current;
      if (!video) return;
      video.muted = !video.muted;
      setIsMuted(video.muted);
    }
  }, [isYouTubeSource, ytIsMuted, ytUnmute, ytMute]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const resumeFromPause = useCallback(() => {
    // Check effective mode for countdown enforcement
    if (effectiveMode === 'strict' && strictCountdown > 0) return;
    if (effectiveMode === 'always-strict' && strictCountdown > 0) return;

    setIsPaused(false);
    setTimeUntilPause(interval);
    setStrictCountdown(0);

    // Smart Resume: Start 8 seconds earlier than paused time
    const newTime = Math.max(0, currentTime - 8);

    if (isYouTubeSource) {
      ytSeekTo(newTime);
      ytPlay();
      setCurrentTime(newTime);
      setIsPlaying(true);
    } else {
      const video = videoRef.current;
      if (!video) return;
      video.currentTime = newTime;
      video.play();
      setCurrentTime(newTime);
      setIsPlaying(true);
    }
  }, [effectiveMode, strictCountdown, interval, isYouTubeSource, ytPlay, ytSeekTo, currentTime]);

  const addVideos = useCallback((files: FileList | File[]) => {
    const newVideos: VideoFile[] = Array.from(files)
      .filter((f) => f.type.startsWith('video/'))
      .map((f) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: f.name.replace(/\.[^.]+$/, ''),
        url: URL.createObjectURL(f),
        file: f,
        source: 'local' as const,
      }));

    setPlaylist((prev) => {
      const updated = [...prev, ...newVideos];
      if (prev.length === 0 && newVideos.length > 0) {
        setCurrentVideoIndex(0);
      }
      return updated;
    });
  }, []);

  // ─── File System Access API ───
  const loadVideosFromHandle = useCallback(async (dirHandle: any) => {
    try {
      const newVideos: VideoFile[] = [];
      // @ts-ignore
      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file') {
          if (/\.(mp4|webm|mkv|mov|m4v)$/i.test(entry.name)) {
            const file = await entry.getFile();
            newVideos.push({
              id: `folder-${entry.name}`,
              name: entry.name.replace(/\.[^.]+$/, ''),
              url: URL.createObjectURL(file), // create temporary URL
              file: file,
              source: 'local' as const,
            });
          }
        }
      }

      newVideos.sort((a, b) => a.name.localeCompare(b.name));

      setPlaylist((prev) => {
        const others = prev.filter((v) => v.source !== 'local');
        const updated = [...others, ...newVideos];
        if (updated.length > 0 && others.length === 0) {
          setCurrentVideoIndex(0);
        }
        return updated;
      });
    } catch (e) {
      console.error('Failed to read folder contents', e);
    }
  }, []);

  const selectFolder = useCallback(async () => {
    try {
      if (!('showDirectoryPicker' in window)) {
        alert('File System Access API is not supported in this browser.');
        return;
      }
      // @ts-ignore
      const dirHandle = await window.showDirectoryPicker();
      await setHandle('pf-video-folder', dirHandle);
      folderHandleRef.current = dirHandle;
      setFolderNeedsPermission(false);
      await loadVideosFromHandle(dirHandle);
    } catch (e) {
      console.error('User cancelled folder selection or error occurred', e);
    }
  }, [loadVideosFromHandle]);

  const restoreFolderAccess = useCallback(async () => {
    const handle = folderHandleRef.current;
    if (!handle) return;
    try {
      // @ts-ignore
      const permission = await handle.requestPermission({ mode: 'read' });
      if (permission === 'granted') {
        setFolderNeedsPermission(false);
        await loadVideosFromHandle(handle);
      }
    } catch (e) {
      console.error('Permission request failed', e);
    }
  }, [loadVideosFromHandle]);

  useEffect(() => {
    async function initFolder() {
      try {
        const handle = await getHandle('pf-video-folder');
        if (handle) {
          folderHandleRef.current = handle;
          // @ts-ignore
          const permission = await handle.queryPermission({ mode: 'read' });
          if (permission === 'granted') {
            setFolderNeedsPermission(false);
            await loadVideosFromHandle(handle);
          } else {
            setFolderNeedsPermission(true);
          }
        }
      } catch (e) {
        console.error('Error initializing folder from IDB', e);
      }
    }
    initFolder();
  }, [loadVideosFromHandle]);

  const addYouTubeVideos = useCallback((videos: { id: string; title: string; thumbnail?: string }[]) => {
    const newVideos: VideoFile[] = videos.map((v) => ({
      id: `yt-${v.id}`,
      name: v.title,
      url: '',
      source: 'youtube' as const,
      youtubeId: v.id,
      thumbnail: v.thumbnail,
    }));

    setPlaylist((prev) => {
      const updated = [...prev, ...newVideos];
      if (prev.length === 0 && newVideos.length > 0) {
        setCurrentVideoIndex(0);
      }
      return updated;
    });
  }, []);

  const removeVideo = useCallback(
    (id: string) => {
      setPlaylist((prev) => {
        const idx = prev.findIndex((v) => v.id === id);
        if (idx === -1) return prev;

        if (prev[idx].source === 'local') {
          URL.revokeObjectURL(prev[idx].url);
        }

        const updated = prev.filter((v) => v.id !== id);
        if (currentVideoIndex >= updated.length && updated.length > 0) {
          setCurrentVideoIndex(updated.length - 1);
        }
        return updated;
      });
    },
    [currentVideoIndex]
  );

  const selectVideo = useCallback((index: number) => {
    setCurrentVideoIndex(index);
    setIsPaused(false);
    setStrictCountdown(0);
  }, []);

  const setIntervalValue = useCallback(
    (val: number) => {
      setIntervalState(val);
      setTimeUntilPause(val);
    },
    [setIntervalState]
  );

  const setYoutubeApiKey = useCallback((key: string) => {
    setYoutubeApiKeyState(key);
  }, [setYoutubeApiKeyState]);

  const setPracticeDisabled = useCallback((disabled: boolean) => {
    setPracticeDisabledState(disabled);
  }, [setPracticeDisabledState]);

  return {
    videoRef,
    youtubeContainerRef: ytPlayer.containerRef,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isFullscreen,
    buffered,
    maxWatchedTime,
    isPaused,
    interval,
    mode,
    timeUntilPause,
    strictCountdown,
    sessionPauses,
    sessionPracticeTime,
    practiceDisabled,
    setPracticeDisabled,
    effectiveMode,
    playlist,
    currentVideoIndex,
    notes,
    youtubeMode,
    setYoutubeMode,
    youtubeApiKey,
    setYoutubeApiKey,
    isYouTubeSource,
    youtubeReady: ytPlayer.isReady,
    addYouTubeVideos,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    toggleFullscreen,
    setInterval: setIntervalValue,
    setMode: setModeState,
    resumeFromPause,
    addVideos,
    removeVideo,
    selectVideo,
    setNotes,
    controlsVisible,
    showControls,
    folderNeedsPermission,
    selectFolder,
    restoreFolderAccess,
  };
}
