'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { formatTime } from '@/utils/formatTime';

interface PauseOverlayProps {
  isPaused: boolean;
  strictCountdown: number;
  onResume: () => void;
}

export default function PauseOverlay({
  isPaused,
  strictCountdown,
  onResume,
}: PauseOverlayProps) {
  const canResume = strictCountdown <= 0;

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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

          <motion.div
            className="relative z-10 flex flex-col items-center gap-6 p-8 sm:p-12 rounded-3xl backdrop-blur-xl max-w-md w-full bg-white/5 border border-warning/10 border-white/10 shadow-[0_0_80px_rgba(167,139,250,0.15)]"
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
                Strict Practice
              </h2>
              <p className="text-white/50 text-xs sm:text-sm mt-3 px-2">
                Take exactly 5 minutes to drill what you learned manually. Video unlock sequence is currently restricted.
              </p>
            </div>

            {strictCountdown > 0 && (
              <div className="flex flex-col items-center gap-2 mt-2">
                <motion.div
                  className="text-5xl font-bold text-violet-300 tabular-nums tracking-wider"
                  key={strictCountdown}
                  initial={{ scale: 1.1, opacity: 0.8 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  {formatTime(strictCountdown)}
                </motion.div>
                <span className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-medium">
                  Mandatory Wait Time
                </span>
              </div>
            )}

            <motion.button
              onClick={onResume}
              disabled={!canResume}
              className={`
                mt-4 w-full sm:w-auto px-10 py-3.5 rounded-2xl font-bold text-sm uppercase tracking-widest
                transition-all duration-300
                ${canResume
                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-[0_10px_30px_rgba(139,92,246,0.3)] hover:shadow-[0_10px_40px_rgba(139,92,246,0.4)] cursor-pointer'
                  : 'bg-white/5 text-white/30 cursor-not-allowed border border-white/10'
                }
              `}
              whileHover={canResume ? { scale: 1.05 } : {}}
              whileTap={canResume ? { scale: 0.95 } : {}}
            >
              {canResume ? 'Resume Video' : 'Please Drill...'}
            </motion.button>

            {canResume && (
              <p className="text-[11px] text-white/30 mt-2">
                Or press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/50 font-mono text-[10px]">Space</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/50 font-mono text-[10px]">R</kbd>
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
