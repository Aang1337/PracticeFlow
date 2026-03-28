'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatTime } from '@/utils/formatTime';

interface PauseOverlayProps {
  isPaused: boolean;
  strictCountdown: number;
  onResume: (forceSkip?: boolean) => void;
}

export default function PauseOverlay({
  isPaused,
  strictCountdown,
  onResume,
}: PauseOverlayProps) {
  const [isSkipping, setIsSkipping] = useState(false);
  const [skipCountdown, setSkipCountdown] = useState(3);

  // If paused state changes (e.g., resumes externally or new pause starts), reset our override state securely
  useEffect(() => {
    if (!isPaused) {
      setIsSkipping(false);
      setSkipCountdown(3);
    }
  }, [isPaused]);

  // Handle the custom 3-second override countdown locally natively
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isSkipping && skipCountdown > 0) {
      timer = setInterval(() => {
        setSkipCountdown((prev) => prev - 1);
      }, 1000);
    } else if (isSkipping && skipCountdown <= 0) {
      // Execute the actual continuation native to the external handler unconditionally
      onResume(true);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isSkipping, skipCountdown, onResume]);

  const handleSkipInitiation = () => {
    setIsSkipping(true);
    setSkipCountdown(3);
  };

  const canResume = strictCountdown <= 0;
  // Block the Skip button for the first 3 seconds of the pause (from 300s down to 297s natively)
  const isSkipDisabled = strictCountdown > 297; 

  return (
    <AnimatePresence>
      {isPaused && (
        <motion.div
          className="absolute inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

          <motion.div
            className="relative z-10 flex flex-col items-center justify-center gap-6 p-8 sm:p-12 rounded-3xl backdrop-blur-xl max-w-md w-full bg-white/5 border border-white/10 shadow-[0_0_80px_rgba(167,139,250,0.15)] min-h-[300px]"
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <AnimatePresence mode="wait">
              {!isSkipping ? (
                // ───── STANDARD STRICT STATE ─────
                <motion.div
                  key="strict-mode"
                  className="flex flex-col items-center text-center w-full"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
                    Strict Practice
                  </h2>
                  <p className="text-white/50 text-xs sm:text-sm mt-3 px-2">
                    Take your time to drill what you learned manually. Video unlock sequence is currently restricted.
                  </p>

                  <div className="flex flex-col items-center gap-2 mt-6 mb-4">
                    <div className="text-5xl font-bold text-violet-300 tabular-nums tracking-wider" key={strictCountdown}>
                      {formatTime(strictCountdown)}
                    </div>
                    <span className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-medium">
                      Mandatory Wait Time
                    </span>
                  </div>

                  {canResume ? (
                    <motion.button
                      onClick={() => onResume()}
                      className="mt-2 w-full sm:w-auto px-10 py-3.5 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all duration-300 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-[0_10px_30px_rgba(139,92,246,0.3)] hover:shadow-[0_10px_40px_rgba(139,92,246,0.4)] cursor-pointer"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Resume Video
                    </motion.button>
                  ) : (
                    <div className="mt-4 flex flex-col items-center gap-2">
                      <button
                        onClick={handleSkipInitiation}
                        disabled={isSkipDisabled}
                        className={`text-xs px-6 py-2 rounded-full border border-white/10 uppercase tracking-widest font-semibold transition-all duration-300 ${isSkipDisabled ? 'opacity-30 cursor-not-allowed bg-transparent text-white/30' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80 cursor-pointer'}`}
                        title={isSkipDisabled ? 'Wait a few seconds before skipping...' : 'Opt out of practice loop'}
                      >
                        Skip Practice
                      </button>
                    </div>
                  )}

                  {canResume && (
                    <p className="text-[11px] text-white/30 mt-3">
                      Or press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/50 font-mono text-[10px]">Space</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/50 font-mono text-[10px]">R</kbd>
                    </p>
                  )}
                </motion.div>
              ) : (
                // ───── SKIPPING ESCAPE ANIMATION STATE ─────
                <motion.div
                  key="skipping-mode"
                  className="flex flex-col items-center text-center w-full min-h-[220px] justify-center"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-xl font-bold text-white/70">
                    Bypassing Wait Time
                  </h2>
                  <p className="text-[11px] text-white/40 mt-2 uppercase tracking-widest">
                    Resuming video natively...
                  </p>

                  <div className="mt-6 flex items-center justify-center">
                    <motion.div
                      key={skipCountdown}
                      initial={{ opacity: 0, y: 15, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -15, scale: 0.8 }}
                      transition={{ duration: 0.4 }}
                      className="text-6xl font-bold bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent"
                    >
                      {skipCountdown}
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
