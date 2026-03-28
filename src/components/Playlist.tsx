'use client';

import type { VideoFile } from '@/hooks/useVideoPlayer';

interface PlaylistProps {
  videos: VideoFile[];
  currentIndex: number;
  onSelect: (index: number) => void;
  onRemove: (id: string) => void;
  onSelectFolder: () => void;
  onRestoreFolderAccess: () => void;
  folderNeedsPermission: boolean;
}

export default function Playlist({
  videos,
  currentIndex,
  onSelect,
  onRemove,
  onSelectFolder,
  onRestoreFolderAccess,
  folderNeedsPermission,
}: PlaylistProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-white/50">
          Playlist
        </h3>
        {folderNeedsPermission ? (
          <button
            onClick={onRestoreFolderAccess}
            className="text-xs px-3 py-1 rounded-lg bg-amber-600/20 text-amber-300 hover:bg-amber-600/30
                       transition-colors cursor-pointer font-medium"
          >
            Restore
          </button>
        ) : (
          <button
            onClick={onSelectFolder}
            className="text-xs px-3 py-1 rounded-lg bg-violet-600/20 text-violet-300 hover:bg-violet-600/30
                       transition-colors cursor-pointer font-medium"
          >
            Select Folder
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/30 p-4 gap-2">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z"
              />
            </svg>
            <span className="text-xs text-center">No videos yet.<br />Select a video folder or add YouTube videos!</span>
          </div>
        ) : (
          <ul className="py-1">
            {videos.map((video, index) => (
              <li
                key={video.id}
                className={`
                  group flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all
                  ${
                    index === currentIndex
                      ? 'bg-violet-500/10 border-l-2 border-violet-500'
                      : 'hover:bg-white/5 border-l-2 border-transparent'
                  }
                `}
                onClick={() => onSelect(index)}
              >
                {/* Index/playing indicator */}
                <span className="w-5 text-center text-xs tabular-nums text-white/30 shrink-0">
                  {index === currentIndex ? (
                    <span className="text-violet-400">▶</span>
                  ) : (
                    index + 1
                  )}
                </span>

                {/* Thumbnail for YouTube videos */}
                {video.source === 'youtube' && video.thumbnail && (
                  <div className="w-10 h-6 rounded overflow-hidden shrink-0 bg-black/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={video.thumbnail}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Video name + source badge */}
                <div className="flex-1 min-w-0">
                  <span
                    className={`text-sm truncate block ${
                      index === currentIndex ? 'text-white font-medium' : 'text-white/60'
                    }`}
                  >
                    {video.name}
                  </span>
                  {video.source === 'youtube' && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] text-red-400/70 mt-0.5">
                      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" />
                      </svg>
                      YouTube
                    </span>
                  )}
                </div>

                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(video.id);
                  }}
                  className="w-6 h-6 rounded-full hover:bg-red-500/20 flex items-center justify-center
                             opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <svg
                    className="w-3 h-3 text-red-400"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
