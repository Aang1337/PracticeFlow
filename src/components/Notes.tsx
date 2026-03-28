'use client';

import { useRef, useCallback } from 'react';
import { formatTime } from '@/utils/formatTime';

interface NotesProps {
  notes: string;
  onChange: (notes: string) => void;
  currentTime: number;
}

export default function Notes({ notes, onChange, currentTime }: NotesProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertTimestamp = useCallback(() => {
    const timestamp = `[${formatTime(currentTime)}] `;
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const before = notes.slice(0, start);
      const after = notes.slice(start);
      const newNotes = before + timestamp + after;
      onChange(newNotes);
      // Set cursor after timestamp
      setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = start + timestamp.length;
      }, 0);
    } else {
      onChange(notes + timestamp);
    }
  }, [notes, currentTime, onChange]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-white/50">
          Notes
        </h3>
        <button
          onClick={insertTimestamp}
          title="Insert timestamp"
          className="text-xs px-3 py-1 rounded-lg bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70
                     transition-colors cursor-pointer font-mono"
        >
          ⏱ {formatTime(currentTime)}
        </button>
      </div>
      <div className="flex-1 p-3">
        <textarea
          ref={textareaRef}
          value={notes}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Take practice notes here... They auto-save per video."
          className="w-full h-full bg-transparent text-sm text-white/70 placeholder-white/20
                     resize-none focus:outline-none leading-relaxed"
        />
      </div>
      <div className="px-4 py-2 border-t border-white/5">
        <p className="text-[10px] text-white/25">Auto-saved · {notes.length} chars</p>
      </div>
    </div>
  );
}
