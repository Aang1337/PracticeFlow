'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface PauseOverlayProps {
  isPaused: boolean;
  onResume: () => void;
}

export default function PauseOverlay({
  isPaused,
  onResume,
}: PauseOverlayProps) {
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
            className="relative z-10 flex flex-col items-center gap-6 p-10 rounded-3xl backdrop-blur-xl max-w-md mx-4 bg-white/5 border border-white/10 shadow-[0_0_80px_rgba(167,139,250,0.15)]"
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Decorative ring */}
            <div className="relative">
              <motion.div
                className="w-20 h-20 rounded-full border-2 flex items-center justify-center border-violet-400/30"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              >
                <div className="w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20">
                  <motion.span
                    className="text-3xl"
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    ✋
                  </motion.span>
                </div>
              </motion.div>
            </div>

            {/* Title */}
            <div className="text-center">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
                Paused
              </h2>
              <p className="text-white/50 text-sm mt-2 max-w-xs">
                Take a moment to absorb what you just watched!
              </p>
            </div>

            {/* Resume button */}
            <motion.button
              onClick={onResume}
              className="px-8 py-3 rounded-2xl font-semibold text-sm uppercase tracking-wider transition-all duration-300 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-105 cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
            >
              Resume Video
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
