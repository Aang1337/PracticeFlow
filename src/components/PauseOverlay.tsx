'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { formatTime } from '@/utils/formatTime';
import type { PracticeMode } from '@/utils/constants';

interface PauseOverlayProps {
  isPaused: boolean;
  effectiveMode: PracticeMode;
  strictCountdown: number;
  practiceDisabled: boolean;
  onResume: () => void;
}

export default function PauseOverlay({
  isPaused,
  effectiveMode,
  strictCountdown,
  practiceDisabled,
  onResume,
}: PauseOverlayProps) {
  const canResume = effectiveMode === 'normal' || strictCountdown <= 0;

  return (
    <AnimatePresence>
      {isPaused && (
        <motion.div
          className="absolute inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Glassmorphism backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

          {/* Content card */}
          <motion.div
            className={`relative z-10 flex flex-col items-center gap-6 p-10 rounded-3xl
                       backdrop-blur-xl max-w-md mx-4
                       ${practiceDisabled
                         ? 'bg-emerald-500/5 border border-emerald-500/15 shadow-[0_0_80px_rgba(16,185,129,0.1)]'
                         : 'bg-white/5 border border-white/10 shadow-[0_0_80px_rgba(167,139,250,0.15)]'
                       }`}
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Decorative ring */}
            <div className="relative">
              <motion.div
                className={`w-20 h-20 rounded-full border-2 flex items-center justify-center
                  ${practiceDisabled ? 'border-emerald-400/30' : 'border-violet-400/30'}`}
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center
                  ${practiceDisabled
                    ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20'
                    : 'bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20'
                  }`}>
                  <motion.span
                    className="text-3xl"
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {practiceDisabled ? '⏭️' : '✋'}
                  </motion.span>
                </div>
              </motion.div>
            </div>

            {/* Title */}
            <div className="text-center">
              {practiceDisabled ? (
                <>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
                    Practice Skipped
                  </h2>
                  <p className="text-white/50 text-sm mt-2 max-w-xs">
                    Practice is disabled for this video. Resume whenever you&apos;re ready.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
                    Time to Practice
                  </h2>
                  <p className="text-white/50 text-sm mt-2 max-w-xs">
                    {effectiveMode === 'normal'
                      ? 'Apply what you just learned before continuing.'
                      : effectiveMode === 'strict'
                      ? 'Take a moment to practice — resume unlocks soon.'
                      : 'Complete your practice before continuing.'}
                  </p>
                </>
              )}
            </div>

            {/* Strict countdown */}
            {!practiceDisabled &&
              (effectiveMode === 'strict' || effectiveMode === 'always-strict') &&
              strictCountdown > 0 && (
                <div className="flex flex-col items-center gap-2">
                  <motion.div
                    className="text-4xl font-bold text-violet-300 tabular-nums"
                    key={strictCountdown}
                    initial={{ scale: 1.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  >
                    {formatTime(strictCountdown)}
                  </motion.div>
                  <span className="text-xs text-white/40 uppercase tracking-wider">
                    remaining
                  </span>
                </div>
              )}

            {/* Resume button */}
            <motion.button
              onClick={onResume}
              disabled={!canResume}
              className={`
                px-8 py-3 rounded-2xl font-semibold text-sm uppercase tracking-wider
                transition-all duration-300
                ${canResume
                  ? practiceDisabled
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-105 cursor-pointer'
                    : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-105 cursor-pointer'
                  : 'bg-white/5 text-white/30 cursor-not-allowed'
                }
              `}
              whileHover={canResume ? { scale: 1.05 } : {}}
              whileTap={canResume ? { scale: 0.97 } : {}}
            >
              {canResume ? 'Resume Video' : 'Please Wait...'}
            </motion.button>

            {/* Keyboard hint */}
            {canResume && (
              <p className="text-[11px] text-white/30">
                Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/50 font-mono text-[10px]">Space</kbd> or{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/50 font-mono text-[10px]">R</kbd> to resume
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
