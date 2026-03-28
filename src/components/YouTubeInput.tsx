'use client';

import { useState, useCallback } from 'react';
import { parseYouTubeInput, fetchVideoDetails, fetchPlaylistItems } from '@/utils/youtube';

interface YouTubeInputProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  onVideosLoaded: (videos: { id: string; title: string; thumbnail?: string }[]) => void;
}

export default function YouTubeInput({
  apiKey,
  onApiKeyChange,
  onVideosLoaded,
}: YouTubeInputProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLoad = useCallback(async () => {
    setError(null);
    setSuccessMsg(null);

    if (!apiKey.trim()) {
      setError('Please enter your YouTube API key first.');
      setShowApiKey(true);
      return;
    }

    const parsed = parseYouTubeInput(url);
    if (!parsed) {
      setError('Could not parse YouTube URL or ID. Try pasting a full YouTube URL.');
      return;
    }

    setIsLoading(true);

    try {
      if (parsed.type === 'video') {
        const video = await fetchVideoDetails(apiKey, parsed.id);
        onVideosLoaded([video]);
        setSuccessMsg(`Loaded: ${video.title}`);
        setUrl('');
      } else {
        const items = await fetchPlaylistItems(apiKey, parsed.id);
        if (items.length === 0) {
          setError('Playlist is empty or not found.');
        } else {
          onVideosLoaded(items);
          setSuccessMsg(`Loaded ${items.length} video${items.length > 1 ? 's' : ''} from playlist`);
          setUrl('');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load YouTube content.');
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, url, onVideosLoaded]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLoad();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* API Key section */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowApiKey((v) => !v)}
          className="text-[10px] uppercase tracking-widest text-white/40 hover:text-white/60 transition-colors cursor-pointer flex items-center gap-1"
        >
          <svg
            className={`w-3 h-3 transition-transform ${showApiKey ? 'rotate-90' : ''}`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" />
          </svg>
          API Key
          {apiKey && (
            <span className="ml-1 w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
          )}
        </button>
      </div>

      {showApiKey && (
        <div className="flex items-center gap-2">
          <input
            type="password"
            placeholder="Paste your YouTube Data API v3 key"
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/80
                       placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-violet-500/50
                       focus:border-violet-500/50 font-mono"
          />
          {apiKey && (
            <span className="text-[10px] text-emerald-400/70">✓ Saved</span>
          )}
        </div>
      )}

      {/* URL input */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Paste YouTube video or playlist URL..."
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError(null);
              setSuccessMsg(null);
            }}
            onKeyDown={handleKeyDown}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white/80
                       placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-red-500/40
                       focus:border-red-500/40"
          />
          {/* YouTube icon */}
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500/60"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        </div>

        <button
          onClick={handleLoad}
          disabled={isLoading || !url.trim()}
          className={`
            px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all
            ${
              isLoading || !url.trim()
                ? 'bg-white/5 text-white/25 cursor-not-allowed'
                : 'bg-red-600/80 text-white hover:bg-red-600 cursor-pointer shadow-lg shadow-red-600/10'
            }
          `}
        >
          {isLoading ? (
            <span className="flex items-center gap-1.5">
              <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" />
              </svg>
              Loading
            </span>
          ) : (
            'Load'
          )}
        </button>
      </div>

      {/* Error / success */}
      {error && (
        <p className="text-xs text-red-400/80 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          {error}
        </p>
      )}
      {successMsg && (
        <p className="text-xs text-emerald-400/80 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
          {successMsg}
        </p>
      )}
    </div>
  );
}
