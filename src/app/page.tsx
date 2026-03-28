'use client';

import { useState, useRef } from 'react';
import { useVideoPlayer } from '@/hooks/useVideoPlayer';
import VideoPlayer from '@/components/VideoPlayer';
import Timer from '@/components/Timer';
import IntervalSelector from '@/components/IntervalSelector';
import ModeSelector from '@/components/ModeSelector';
import Playlist from '@/components/Playlist';
import Notes from '@/components/Notes';
import SessionTracker from '@/components/SessionTracker';
import YouTubeInput from '@/components/YouTubeInput';

type SidebarTab = 'playlist' | 'notes' | 'session';

export default function Home() {
  const player = useVideoPlayer();
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('playlist');
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col flex-1 min-h-screen">
      {/* ───── Header ───── */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-white/5 glass">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-600/20">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold gradient-text">PracticeFlow</h1>
            <p className="text-[10px] text-white/30 -mt-0.5">Learn by doing</p>
          </div>
        </div>

        {/* Header controls */}
        <div className="flex items-center gap-4">
          <Timer
            timeUntilPause={player.timeUntilPause}
            interval={player.interval}
            isPlaying={player.isPlaying}
          />
          <div className="w-px h-6 bg-white/10 hidden sm:block" />
          <IntervalSelector
            value={player.interval}
            onChange={player.setInterval}
          />
          <div className="w-px h-6 bg-white/10 hidden sm:block" />
          <ModeSelector value={player.mode} onChange={player.setMode} />
        </div>
      </header>

      {/* ───── Main Content ───── */}
      <main className="flex flex-1 overflow-hidden">
        {/* Video area */}
        <div className="flex-1 flex flex-col p-4 gap-4 min-w-0">
          <VideoPlayer player={player} />

          {/* Bottom bar: source toggle + actions */}
          <div className="flex flex-col gap-3">
            {/* Source toggle + add videos row */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {/* Source toggle */}
                <div className="flex rounded-xl overflow-hidden border border-white/10 bg-white/5">
                  <button
                    onClick={() => player.setYoutubeMode(false)}
                    className={`px-3 py-1.5 text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5
                      ${!player.youtubeMode
                        ? 'bg-violet-600/80 text-white'
                        : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                      }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    Local
                  </button>
                  <button
                    onClick={() => player.setYoutubeMode(true)}
                    className={`px-3 py-1.5 text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5
                      ${player.youtubeMode
                        ? 'bg-red-600/80 text-white'
                        : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                      }`}
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" />
                    </svg>
                    YouTube
                  </button>
                </div>

                {/* Select Folder button */}
                {player.folderNeedsPermission ? (
                  <button
                    onClick={player.restoreFolderAccess}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20
                               text-sm text-amber-500 hover:bg-amber-500/20 transition-all cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Restore Folder Access
                  </button>
                ) : (
                  <button
                    onClick={player.selectFolder}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10
                               text-sm text-white/60 hover:bg-white/10 hover:text-white/80 transition-all cursor-pointer"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    Select Folder
                  </button>
                )}

                {player.playlist.length > 0 && (
                  <span className="text-xs text-white/30">
                    {player.playlist.length} video{player.playlist.length !== 1 ? 's' : ''} loaded
                  </span>
                )}

                {/* Per-video practice skip toggle */}
                {player.playlist.length > 0 && (
                  <button
                    onClick={() => player.setPracticeDisabled(!player.practiceDisabled)}
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border
                      ${player.practiceDisabled
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                        : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60 hover:bg-white/10'
                      }
                    `}
                    title={player.practiceDisabled
                      ? 'Practice is skipped for this video. Click to re-enable.'
                      : 'Mark this video as "no practice needed"'}
                  >
                    {player.practiceDisabled ? (
                      <>
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                        No Practice
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        Skip Practice
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Keyboard hint for desktop */}
              <div className="hidden md:flex items-center gap-3 text-[10px] text-white/25">
                <span>
                  <kbd className="px-1.5 py-0.5 rounded bg-white/5 text-white/40 font-mono">Space</kbd> Play
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 rounded bg-white/5 text-white/40 font-mono">R</kbd> Resume
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 rounded bg-white/5 text-white/40 font-mono">F</kbd> Fullscreen
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 rounded bg-white/5 text-white/40 font-mono">M</kbd> Mute
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 rounded bg-white/5 text-white/40 font-mono">⌘1</kbd> Skip Practice
                </span>
              </div>
            </div>

            {/* YouTube input (conditionally shown) */}
            {player.youtubeMode && (
              <div className="glass-strong rounded-xl p-4">
                <YouTubeInput
                  apiKey={player.youtubeApiKey}
                  onApiKeyChange={player.setYoutubeApiKey}
                  onVideosLoaded={player.addYouTubeVideos}
                />
              </div>
            )}
          </div>
        </div>

        {/* ───── Sidebar ───── */}
        <aside className="hidden lg:flex flex-col w-72 xl:w-80 border-l border-white/5 bg-white/[0.01]">
          {/* Tab bar */}
          <div className="flex border-b border-white/5">
            {([
              { key: 'playlist', label: 'Playlist', icon: '📋' },
              { key: 'notes', label: 'Notes', icon: '📝' },
              { key: 'session', label: 'Session', icon: '📊' },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSidebarTab(tab.key)}
                className={`
                  flex-1 py-3 text-xs font-medium transition-all cursor-pointer
                  ${
                    sidebarTab === tab.key
                      ? 'text-violet-300 border-b-2 border-violet-500 bg-violet-500/5'
                      : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                  }
                `}
              >
                <span className="mr-1">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden">
            {sidebarTab === 'playlist' && (
              <Playlist
                videos={player.playlist}
                currentIndex={player.currentVideoIndex}
                onSelect={player.selectVideo}
                onRemove={player.removeVideo}
                onSelectFolder={player.selectFolder}
                onRestoreFolderAccess={player.restoreFolderAccess}
                folderNeedsPermission={player.folderNeedsPermission}
              />
            )}
            {sidebarTab === 'notes' && (
              <Notes
                notes={player.notes}
                onChange={player.setNotes}
                currentTime={player.currentTime}
              />
            )}
            {sidebarTab === 'session' && (
              <SessionTracker
                pauses={player.sessionPauses}
                practiceTime={player.sessionPracticeTime}
              />
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
