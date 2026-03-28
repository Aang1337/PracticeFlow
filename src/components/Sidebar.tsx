'use client';

import YouTubeInput from './YouTubeInput';
import type { VideoFile } from '@/hooks/useVideoPlayer';

interface SidebarProps {
  playlist: VideoFile[];
  currentIndex: number;
  onSelect: (index: number) => void;
  onRemove: (id: string) => void;
  youtubeApiKey: string;
  onApiKeyChange: (key: string) => void;
  onYouTubeLoad: (videos: any[]) => void;
}

export default function Sidebar({
  playlist,
  currentIndex,
  onSelect,
  onRemove,
  youtubeApiKey,
  onApiKeyChange,
  onYouTubeLoad,
}: SidebarProps) {
  const localVideos = playlist.filter((v) => v.source === 'local');
  const ytVideos = playlist.filter((v) => v.source === 'youtube');

  // Helper to render a list of videos
  const renderList = (videos: VideoFile[], title: string) => (
    <div className="mb-6">
      <h3 className="text-[10px] font-semibold uppercase tracking-widest text-white/40 px-5 mb-2">
        {title}
      </h3>
      {videos.length === 0 ? (
        <p className="text-xs text-white/20 px-5 italic">No videos</p>
      ) : (
        <ul className="flex flex-col">
          {videos.map((video) => {
            // Find its actual index in the main playlist array
            const actualIndex = playlist.findIndex((v) => v.id === video.id);
            const isPlaying = actualIndex === currentIndex;

            return (
              <li
                key={video.id}
                onClick={() => onSelect(actualIndex)}
                className={`
                  group flex items-center gap-3 px-5 py-2.5 cursor-pointer transition-all
                  ${isPlaying ? 'bg-violet-500/10 border-l-2 border-violet-500' : 'hover:bg-white/5 border-l-2 border-transparent'}
                `}
              >
                {/* Playing indicator */}
                <span className="w-4 text-center text-xs text-white/30 shrink-0">
                  {isPlaying ? <span className="text-violet-400">▶</span> : '•'}
                </span>

                {video.source === 'youtube' && video.thumbnail && (
                  <div className="w-10 h-6 rounded overflow-hidden shrink-0 bg-black/30">
                    <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <span className={`text-sm truncate block ${isPlaying ? 'text-white font-medium' : 'text-white/60'}`}>
                    {video.name}
                  </span>
                </div>

                {video.source === 'youtube' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(video.id);
                    }}
                    className="w-6 h-6 rounded-full hover:bg-red-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove Video"
                  >
                    <svg className="w-3 h-3 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                    </svg>
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );

  return (
    <aside className="hidden lg:flex flex-col w-80 border-l border-white/5 bg-zinc-900/50 backdrop-blur-xl h-full shadow-[-20px_0_40px_rgba(0,0,0,0.2)]">
      {/* Header */}
      <div className="p-5 border-b border-white/5 bg-black/20">
        <h2 className="text-sm font-bold gradient-text">Library</h2>
        <p className="text-[10px] text-white/40">Select a video to practice</p>
      </div>

      {/* Lists */}
      <div className="flex-1 overflow-y-auto scrollbar-thin py-4">
        {renderList(localVideos, 'Local Videos')}
        {renderList(ytVideos, 'YouTube Videos')}
      </div>

      {/* YouTube Input Area */}
      <div className="p-5 border-t border-white/5 bg-black/20">
        <h3 className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-3">
          Add from YouTube
        </h3>
        <YouTubeInput
          apiKey={youtubeApiKey}
          onApiKeyChange={onApiKeyChange}
          onVideosLoaded={onYouTubeLoad}
        />
      </div>
    </aside>
  );
}
