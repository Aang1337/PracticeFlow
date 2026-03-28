'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { usePauseSound } from './usePauseSound';
import { useYouTubePlayer } from './useYouTubePlayer';

export type VideoSource = 'local' | 'youtube';

export interface VideoFile {
  id: string;
  name: string;
  url: string;
  source: VideoSource;
  youtubeId?: string;
  thumbnail?: string;
}

export interface UseVideoPlayerReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  youtubeContainerRef: React.RefObject<HTMLDivElement | null>;

  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  buffered: number;

  isPaused: boolean;
  timeUntilPause: number;

  playlist: VideoFile[];
  currentVideoIndex: number;

  youtubeMode: boolean;
  setYoutubeMode: (on: boolean) => void;
  youtubeApiKey: string;
  setYoutubeApiKey: (key: string) => void;
  isYouTubeSource: boolean;
  youtubeReady: boolean;
  addYouTubeVideos: (videos: { id: string; title: string; thumbnail?: string }[]) => void;
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

const FIXED_INTERVAL = 60; // 1 minute auto-pause interval

export function useVideoPlayer(): UseVideoPlayerReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const intervalTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Core video state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [buffered, setBuffered] = useState(0);

  // Practice state
  const [isPaused, setIsPaused] = useState(false);
  const [timeUntilPause, setTimeUntilPause] = useState(FIXED_INTERVAL);

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

  const { playChime } = usePauseSound();

  // YouTube player hook
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

  // Auto-pause logic
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
  }, [playChime, isYouTubeSource, ytPause]);

  // Countdown timer for 1-minute auto-pause
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
            return FIXED_INTERVAL;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalTimerRef.current) clearInterval(intervalTimerRef.current);
    };
  }, [isPlaying, isPaused, triggerPause]);

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

  // Local video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (!isYouTubeSource) {
        setCurrentTime(video.currentTime);
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
  }, [currentVideoIndex, playlist.length, isYouTubeSource]);

  // Load video when currentVideoIndex changes
  useEffect(() => {
    const vid = playlist[currentVideoIndex];
    if (!vid) return;

    setCurrentTime(0);
    setTimeUntilPause(FIXED_INTERVAL);
    setIsPlaying(false);
    setIsPaused(false);

    if (vid.source === 'youtube' && vid.youtubeId) {
      if (ytIsReady) ytLoadVideo(vid.youtubeId);
    } else {
      const video = videoRef.current;
      if (video) {
        video.src = vid.url;
        video.load();
      }
    }
  }, [currentVideoIndex, playlist, ytIsReady, ytLoadVideo]);

  // Read local videos securely from /public/videos/ and hydrate YouTube videos from localStorage
  useEffect(() => {
    async function loadVideos() {
      let combined: VideoFile[] = [];

      try {
        const res = await fetch('/api/videos');
        if (res.ok) {
          const { videos: fileNames } = await res.json();
          const localVideos: VideoFile[] = fileNames.map((name: string) => ({
            id: `local-${name}`,
            name: name.replace(/\.[^.]+$/, ''),
            url: `/videos/${name}`,
            source: 'local',
          }));
          combined = [...localVideos];
        }
      } catch (e) {
        console.warn('Could not fetch local videos', e);
      }

      try {
        if (typeof window !== 'undefined') {
          const storedYt = window.localStorage.getItem('pf-yt-playlist');
          if (storedYt) {
            const parsed = JSON.parse(storedYt);
            combined = [...combined, ...parsed];
          }
        }
      } catch (e) {
        console.warn('Could not read saved YT videos', e);
      }

      setPlaylist(combined);
    }
    loadVideos();
  }, []);

  // Save YouTube playlist changes
  useEffect(() => {
    const ytVideos = playlist.filter((v) => v.source === 'youtube');
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('pf-yt-playlist', JSON.stringify(ytVideos));
      } catch (e) {
        console.warn('Could not save yt playlist', e);
      }
    }
  }, [playlist]);

  // Actions
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
    if (isYouTubeSource) {
      ytSeekTo(time);
      setCurrentTime(time);
    } else {
      const video = videoRef.current;
      if (!video) return;
      video.currentTime = time;
      setCurrentTime(time);
    }
  }, [isYouTubeSource, ytSeekTo]);

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
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const resumeFromPause = useCallback(() => {
    setIsPaused(false);
    setTimeUntilPause(FIXED_INTERVAL);

    // Smart Resume: Start 5 seconds earlier than paused time
    const newTime = Math.max(0, currentTime - 5);

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
  }, [isYouTubeSource, ytPlay, ytSeekTo, currentTime]);

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

  const removeVideo = useCallback((id: string) => {
    setPlaylist((prev) => {
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
    isPaused,
    timeUntilPause,
    playlist,
    currentVideoIndex,
    youtubeMode,
    setYoutubeMode,
    youtubeApiKey,
    setYoutubeApiKey,
    isYouTubeSource,
    youtubeReady: ytPlayer.isReady,
    addYouTubeVideos,
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
