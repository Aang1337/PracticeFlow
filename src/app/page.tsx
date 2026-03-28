'use client';

import { useVideoPlayer } from '@/hooks/useVideoPlayer';
import VideoPlayer from '@/components/VideoPlayer';
import Timer from '@/components/Timer';
import Sidebar from '@/components/Sidebar';
import IntervalSelector from '@/components/IntervalSelector';
import ModeSelector from '@/components/ModeSelector';
import Notes from '@/components/Notes';

export default function Home() {
  const player = useVideoPlayer();

  // Current video key for Notes
  const currentVideoId = player.playlist[player.currentVideoIndex]?.id;

  return (
    <div className="flex flex-col lg:flex-row flex-1 min-h-screen bg-zinc-950">
      {/* ───── Main Content ───── */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto overflow-x-hidden relative scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        
        {/* Sticky Header with Controls */}
        <header className="sticky top-0 z-40 flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-zinc-950/80 backdrop-blur-md border-b border-white/5 shadow-xl">
          <div className="flex items-center gap-3 w-full sm:w-auto mb-4 sm:mb-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-600/20">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold gradient-text">PracticeFlow</h1>
              <p className="text-[11px] text-white/50 -mt-0.5 font-medium tracking-wide flex items-center gap-2">
                Learning by Doing
                {player.practiceDisabled && (
                  <span className="bg-emerald-500/20 text-emerald-400 px-1.5 rounded-[4px] text-[9px] uppercase tracking-wider">
                    Skip active
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 justify-center sm:justify-end w-full sm:w-auto">
            <ModeSelector value={player.mode} onChange={player.setMode} />
            <IntervalSelector value={player.interval} onChange={player.setInterval} />
            <div className="pl-4 ml-2 border-l border-white/10 hidden xl:flex">
                <Timer
                  timeUntilPause={player.timeUntilPause}
                  interval={player.interval}
                  isPlaying={player.isPlaying}
                />
            </div>
          </div>
        </header>

        {/* Video Player Block */}
        <div className="w-full flex-shrink-0 p-4 sm:p-6 lg:p-8 pt-6 flex flex-col items-center">
          <div className="w-full max-w-6xl shadow-2xl rounded-3xl border border-white/10 overflow-hidden bg-black aspect-video relative group">
            <VideoPlayer player={player} />
          </div>

          {/* Under-Video Sub-bar */}
          <div className="w-full max-w-6xl flex flex-col sm:flex-row items-start sm:items-center justify-between text-white/30 text-xs mt-3 px-2 gap-2">
            <div className="truncate max-w-md w-full font-medium text-white/60">
              {player.playlist.length > 0 && player.playlist[player.currentVideoIndex] ? (
                player.playlist[player.currentVideoIndex].name
              ) : (
                'Select a video...'
              )}
            </div>
            <div className="flex items-center gap-4 text-[10px] font-mono tracking-wider shrink-0 w-full sm:w-auto overflow-x-auto pb-1">
              <span>
                <kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10 text-white/50">Space</kbd> Play/Pause
              </span>
              <span>
                <kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10 text-white/50">Ctrl+1</kbd> Skip Practice
              </span>
            </div>
          </div>
          
          {/* Notes Full-width Block underneath video */}
          <div className="w-full max-w-6xl mt-6 lg:mt-8 pb-12">
            <Notes videoId={currentVideoId} />
          </div>
        </div>
      </main>

      {/* ───── Sidebar ───── */}
      <Sidebar
        playlist={player.playlist}
        currentIndex={player.currentVideoIndex}
        onSelect={player.selectVideo}
        onRemove={player.removeVideo}
        onUpload={player.addLocalFiles}
        youtubeApiKey={player.youtubeApiKey}
        onApiKeyChange={player.setYoutubeApiKey}
        onYouTubeLoad={player.addYouTubeVideos}
      />
    </div>
  );
}
