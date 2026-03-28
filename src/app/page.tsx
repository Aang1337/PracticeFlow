'use client';

import { useVideoPlayer } from '@/hooks/useVideoPlayer';
import VideoPlayer from '@/components/VideoPlayer';
import Timer from '@/components/Timer';
import Sidebar from '@/components/Sidebar';

export default function Home() {
  const player = useVideoPlayer();

  return (
    <div className="flex flex-col lg:flex-row flex-1 min-h-screen bg-zinc-950">
      {/* ───── Main Content ───── */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Simple Top Bar inside the main area */}
        <header className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-600/20">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold gradient-text">PracticeFlow</h1>
              <p className="text-[11px] text-white/50 -mt-0.5 font-medium tracking-wide">
                Learn by doing
              </p>
            </div>
          </div>

          <div className="pointer-events-auto flex items-center bg-black/40 backdrop-blur-md rounded-2xl px-5 py-2 border border-white/10 shadow-xl">
            <Timer
              timeUntilPause={player.timeUntilPause}
              isPlaying={player.isPlaying}
            />
          </div>
        </header>

        {/* Video Player */}
        <div className="flex-1 flex flex-col p-6 pt-24 gap-4 min-w-0 justify-center items-center">
          <div className="w-full max-w-6xl mx-auto shadow-2xl rounded-3xl border border-white/10 overflow-hidden bg-black aspect-video relative">
            <VideoPlayer player={player} />
          </div>

          <div className="w-full max-w-6xl mx-auto flex items-center justify-between text-white/30 text-xs">
            {player.playlist.length > 0 && player.playlist[player.currentVideoIndex] && (
              <span className="truncate max-w-md">
                Playing: {player.playlist[player.currentVideoIndex].name}
              </span>
            )}
            <div className="hidden md:flex items-center gap-4 text-[10px] font-mono tracking-wider ml-auto">
              <span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/50 shadow-sm">
                  Space
                </kbd>{' '}
                Play/Pause
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/50 shadow-sm">
                  F
                </kbd>{' '}
                Fullscreen
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* ───── Sidebar ───── */}
      <Sidebar
        playlist={player.playlist}
        currentIndex={player.currentVideoIndex}
        onSelect={player.selectVideo}
        onRemove={player.removeVideo}
        youtubeApiKey={player.youtubeApiKey}
        onApiKeyChange={player.setYoutubeApiKey}
        onYouTubeLoad={player.addYouTubeVideos}
      />
    </div>
  );
}
