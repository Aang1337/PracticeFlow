'use client';

import { useEffect, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface NotesProps {
  videoId: string | undefined;
}

export default function Notes({ videoId }: NotesProps) {
  // Use a dynamic key based on the video ID so notes save individually per video
  const key = videoId ? `pf-notes-${videoId}` : 'pf-notes-default';
  
  // Custom hook to tie exactly to this video's notes
  const [notes, setNotes] = useLocalStorage(key, '');

  return (
    <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold gradient-text uppercase tracking-widest text-white/50">
          Practice Notes
        </h3>
        {videoId && (
            <span className="text-[10px] text-emerald-400/80 bg-emerald-400/10 px-2 py-0.5 rounded-full">
              Auto-saved
            </span>
        )}
      </div>
      <p className="text-xs text-white/40">
        Jot down takeaways or practice logs for this specific video. They will persist automatically in your browser.
      </p>
      
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        disabled={!videoId}
        placeholder={videoId ? "Write your practice notes here..." : "Select a video first..."}
        className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white/90 placeholder-white/20
                   focus:outline-none focus:ring-1 focus:ring-violet-500/50 resize-none font-mono"
      />
    </div>
  );
}
