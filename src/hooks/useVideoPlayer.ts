'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { usePauseSound } from './usePauseSound';
import { useYouTubePlayer } from './useYouTubePlayer';
import { DEFAULT_INTERVAL, STRICT_COUNTDOWN } from '@/utils/constants';

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
  videoRef: React.RefObject<HTMLVideoElement | null>;
  youtubeContainerRef: React.RefObject<HTMLDivElement | null>;
  playerContainerRef: React.RefObject<HTMLDivElement | null>;

  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  buffered: number;

  isPaused: boolean;
  timeUntilPause: number;
  strictCountdown: number;
  maxWatchedTime: number;

  interval: number;
  setInterval: (val: number) => void;

  playlist: VideoFile[];
  currentVideoIndex: number;

  youtubeApiKey: string;
  setYoutubeApiKey: (key: string) => void;
  isYouTubeSource: boolean;
  youtubeReady: boolean;
  
  addYouTubeVideos: (videos: { id: string; title: string; thumbnail?: string }[]) => void;
  addLocalFiles: (files: FileList | null) => void;
  removeVideo: (id: string) => void;
  selectVideo: (index: number) => void;

  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  toggleFullscreen: () => void;
  resumeFromPause: () => void;
  controlsVisible: boolean;
  showControls: () => void;
}

export function useVideoPlayer(): UseVideoPlayerReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const intervalTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const strictTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [interval, setIntervalState] = useLocalStorage('pf-interval', DEFAULT_INTERVAL);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [maxWatchedTime, setMaxWatchedTime] = useState(0);

  const [isPaused, setIsPaused] = useState(false);
  const [timeUntilPause, setTimeUntilPause] = useState(DEFAULT_INTERVAL);
  const [strictCountdown, setStrictCountdown] = useState(0);

  const [controlsVisible, setControlsVisible] = useState(true);

  const [playlist, setPlaylist] = useState<VideoFile[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  const [youtubeApiKey, setYoutubeApiKeyState] = useLocalStorage('pf-yt-api-key', '');

  const currentVideo = playlist[currentVideoIndex];
  const isYouTubeSource = currentVideo?.source === 'youtube';

  const { playChime } = usePauseSound();

  useEffect(() => {
    setTimeUntilPause(interval);
  }, [interval]);

  const ytPlayer = useYouTubePlayer({
    onTimeUpdate: useCallback((time: number, dur: number) => {
      if (isYouTubeSource) {
        setCurrentTime(time);
        setDuration(dur);

        // Progressively lock forward limits natively
        setMaxWatchedTime((prevMax) => {
          const newMax = Math.max(prevMax, time);
          if (currentVideo && newMax > prevMax) {
            try { window.localStorage.setItem(`pf-max-time-${currentVideo.id}`, newMax.toString()); } catch {}
          }
          return newMax;
        });

        if (currentVideo) {
          try {
            window.localStorage.setItem(`pf-time-${currentVideo.id}`, time.toString());
          } catch {}
        }
      }
    }, [isYouTubeSource, currentVideo]),
    onBufferUpdate: useCallback((buf: number) => {
      if (isYouTubeSource) {
        setBuffered(buf);
      }
    }, [isYouTubeSource]),
    onStateChange: useCallback((state: number) => {
      if (!isYouTubeSource) return;
      if (state === 1) setIsPlaying(true);
      else if (state === 2) setIsPlaying(false);
      else if (state === 0) {
        setIsPlaying(false);
        if (currentVideoIndex < playlist.length - 1) {
          setCurrentVideoIndex((i) => i + 1);
        }
      }
    }, [isYouTubeSource, currentVideoIndex, playlist.length]),
  });

  const ytLoadVideo = ytPlayer.loadVideo;
  const ytIsReady = ytPlayer.isReady;
  const ytPlay = ytPlayer.play;
  const ytPause = ytPlayer.pause;
  const ytSeekTo = ytPlayer.seekTo;
  const ytSetVolume = ytPlayer.setVolume;
  const ytMute = ytPlayer.mute;
  const ytUnmute = ytPlayer.unmute;
  const ytIsMuted = ytPlayer.isMuted;

  const triggerPause = useCallback(() => {
    if (isYouTubeSource) ytPause();
    else {
      const video = videoRef.current;
      if (!video || video.paused) return;
      video.pause();
    }
    setIsPlaying(false);
    setIsPaused(true);
    playChime();
    setStrictCountdown(STRICT_COUNTDOWN); // Enforce Strict unconditionally
  }, [playChime, isYouTubeSource, ytPause]);

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

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (!isYouTubeSource) {
        const t = video.currentTime;
        setCurrentTime(t);

        // Progressively lock forward limits natively
        setMaxWatchedTime((prevMax) => {
            const newMax = Math.max(prevMax, t);
            if (currentVideo && newMax > prevMax) {
              try { window.localStorage.setItem(`pf-max-time-${currentVideo.id}`, newMax.toString()); } catch {}
            }
            return newMax;
        });

        if (currentVideo) {
          try {
            window.localStorage.setItem(`pf-time-${currentVideo.id}`, t.toString());
          } catch {}
        }
        if (video.buffered.length > 0) {
          setBuffered(video.buffered.end(video.buffered.length - 1));
        }
      }
    };

    const handleLoadedMetadata = () => {
      if (!isYouTubeSource) setDuration(video.duration);
    };

    const handleEnded = () => {
      if (!isYouTubeSource) {
        setIsPlaying(false);
        if (currentVideoIndex < playlist.length - 1) {
          setCurrentVideoIndex((i) => i + 1);
        }
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
    };
  }, [currentVideoIndex, playlist.length, isYouTubeSource, currentVideo]);

  // Handle Mount: Hydrate videos natively and scan for currently active video ID
  useEffect(() => {
    async function loadVideos() {
      let combined: VideoFile[] = [];

      try {
        const res = await fetch('/api/videos');
        if (res.ok) {
          const { videos: fileNames } = await res.json();
          const pVideos: VideoFile[] = fileNames.map((name: string) => ({
            id: `pub-${name}`,
            name: name.replace(/\.[^.]+$/, ''),
            url: `/videos/${name}`,
            source: 'local',
          }));
          combined = [...pVideos];
        }
      } catch (e) {
        console.warn('Could not fetch local videos', e);
      }

      try {
        if (typeof window !== 'undefined') {
          const storedYt = window.localStorage.getItem('pf-yt-playlist');
          if (storedYt) {
            const parsed = JSON.parse(storedYt);
            if (Array.isArray(parsed)) {
              combined = [...combined, ...parsed];
            }
          }
        }
      } catch (e) {}

      setPlaylist(combined);

      if (typeof window !== 'undefined') {
        const savedActiveId = window.localStorage.getItem('pf-current-video-id');
        if (savedActiveId) {
          const matchedIdx = combined.findIndex((v) => v.id === savedActiveId);
          if (matchedIdx > -1) {
            setCurrentVideoIndex(matchedIdx);
          }
        }
      }
    }
    loadVideos();
  }, []);

  useEffect(() => {
    const ytVideos = playlist.filter((v) => v.source === 'youtube');
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('pf-yt-playlist', JSON.stringify(ytVideos));
      } catch (e) {}
    }
  }, [playlist]);

  useEffect(() => {
    const vid = playlist[currentVideoIndex];
    if (!vid) return;

    if (typeof window !== 'undefined') {
       window.localStorage.setItem('pf-current-video-id', vid.id);
    }

    setTimeUntilPause(interval);
    setIsPlaying(false);
    setIsPaused(false);

    let savedTime = 0;
    try {
      const saved = window.localStorage.getItem(`pf-time-${vid.id}`);
      if (saved) savedTime = parseFloat(saved) || 0;
    } catch {}
    
    let savedMaxTime = 0;
    try {
      const sMax = window.localStorage.getItem(`pf-max-time-${vid.id}`);
      if (sMax) savedMaxTime = parseFloat(sMax) || 0;
    } catch {}

    setMaxWatchedTime(savedMaxTime);
    setCurrentTime(savedTime);

    // Hard-fix: Ensure saved time cannot accidentally circumvent max logic natively
    const initialSafeTime = Math.min(savedTime, savedMaxTime > 0 ? savedMaxTime : savedTime);

    if (vid.source === 'youtube' && vid.youtubeId) {
      if (ytIsReady) {
        ytLoadVideo(vid.youtubeId);
        ytSeekTo(initialSafeTime);
      }
    } else {
      const video = videoRef.current;
      if (video) {
        video.src = vid.url;
        video.currentTime = initialSafeTime;
        video.load();
      }
    }
  }, [currentVideoIndex, playlist, ytIsReady, ytLoadVideo, interval, ytSeekTo]);

  const togglePlay = useCallback(() => {
    if (isYouTubeSource) {
      if (isPlaying) { ytPause(); setIsPlaying(false); }
      else { ytPlay(); setIsPlaying(true); }
    } else {
      const video = videoRef.current;
      if (!video) return;
      if (video.paused) { video.play(); setIsPlaying(true); }
      else { video.pause(); setIsPlaying(false); }
    }
  }, [isYouTubeSource, isPlaying, ytPause, ytPlay]);

  const seek = useCallback((time: number) => {
    // CLAMP FORWARD PROGRESS STRICTLY
    const safeTime = Math.min(time, maxWatchedTime);

    if (isYouTubeSource) {
      ytSeekTo(safeTime);
      setCurrentTime(safeTime);
    } else {
      const video = videoRef.current;
      if (!video) return;
      video.currentTime = safeTime;
      setCurrentTime(safeTime);
    }
  }, [isYouTubeSource, ytSeekTo, maxWatchedTime]);

  const setVolume = useCallback((vol: number) => {
    if (isYouTubeSource) {
      ytSetVolume(vol);
      setVolumeState(vol);
      if (vol > 0) { ytUnmute(); setIsMuted(false); }
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
      if (ytIsMuted()) { ytUnmute(); setIsMuted(false); }
      else { ytMute(); setIsMuted(true); }
    } else {
      const video = videoRef.current;
      if (!video) return;
      video.muted = !video.muted;
      setIsMuted(video.muted);
    }
  }, [isYouTubeSource, ytIsMuted, ytUnmute, ytMute]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      if (playerContainerRef.current) {
        playerContainerRef.current.requestFullscreen().catch((err) => {
          console.warn('Error attempting to enable fullscreen:', err);
        });
      }
    } else {
      document.exitFullscreen();
    }
  }, []);

  // Sync state if user explicitly presses ESC
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const resumeFromPause = useCallback(() => {
    setIsPaused(false);
    setTimeUntilPause(interval);
    setStrictCountdown(0);

    // REWIND 8 SECONDS ON RESUME
    const rewindTime = Math.max(0, currentTime - 8);

    if (isYouTubeSource) {
      ytSeekTo(rewindTime);
      setCurrentTime(rewindTime);
      ytPlay();
      setIsPlaying(true);
    } else {
      const video = videoRef.current;
      if (!video) return;
      video.currentTime = rewindTime;
      setCurrentTime(rewindTime);
      video.play();
      setIsPlaying(true);
    }
  }, [interval, isYouTubeSource, ytPlay]);
  
  // Moved keyboard controls below function callbacks
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;

      if (e.key === ' ') {
        e.preventDefault();
        if (isPaused) return; // Disallow native bypass using Spacebar immediately if in PauseOverlay natively
        else togglePlay();
      } else if (e.key === 'r' || e.key === 'R') {
        if (isPaused) return; // Wait out strict lock natively 
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused, isPlaying, strictCountdown, isYouTubeSource, toggleFullscreen, toggleMute, togglePlay, resumeFromPause]);


  const addYouTubeVideos = useCallback((videos: { id: string; title: string; thumbnail?: string }[]) => {
    const newVideos: VideoFile[] = videos.map((v) => ({
      id: `yt-${v.id}`,
      name: v.title,
      url: '',
      source: 'youtube',
      youtubeId: v.id,
      thumbnail: v.thumbnail,
    }));
    setPlaylist((prev) => [...prev, ...newVideos]);
  }, []);

  const addLocalFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newVideos: VideoFile[] = Array.from(files)
      .filter((f) => f.type.startsWith('video/'))
      .map((f) => ({
        id: `upload-${Date.now()}-${f.name}`,
        name: f.name.replace(/\.[^.]+$/, ''),
        url: URL.createObjectURL(f),
        file: f,
        source: 'local' as const,
      }));

    setPlaylist((prev) => [...prev, ...newVideos]);
  }, []);

  const removeVideo = useCallback((id: string) => {
    setPlaylist((prev) => {
      const idx = prev.findIndex((v) => v.id === id);
      if (idx > -1 && prev[idx].file) {
        URL.revokeObjectURL(prev[idx].url); 
      }

      const updated = prev.filter((v) => v.id !== id);
      if (currentVideoIndex >= updated.length && updated.length > 0) {
        setCurrentVideoIndex(updated.length - 1);
      }
      return updated;
    });
  }, [currentVideoIndex]);

  const selectVideo = useCallback((index: number) => {
    setCurrentVideoIndex(index);
    setIsPaused(false);
  }, []);

  const setYoutubeApiKey = useCallback((key: string) => {
    setYoutubeApiKeyState(key);
  }, [setYoutubeApiKeyState]);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    if (isPlaying && !isPaused) {
      controlsTimerRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, 3000);
    }
  }, [isPlaying, isPaused]);

  return {
    videoRef,
    youtubeContainerRef: ytPlayer.containerRef,
    playerContainerRef,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isFullscreen,
    buffered,
    isPaused,
    timeUntilPause,
    strictCountdown,
    maxWatchedTime,
    interval,
    setInterval: setIntervalState,
    playlist,
    currentVideoIndex,
    youtubeApiKey,
    setYoutubeApiKey,
    isYouTubeSource,
    youtubeReady: ytPlayer.isReady,
    addYouTubeVideos,
    addLocalFiles,
    removeVideo,
    selectVideo,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    toggleFullscreen,
    resumeFromPause,
    controlsVisible,
    showControls,
  };
}
