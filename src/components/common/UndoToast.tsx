'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, X, Sparkles } from 'lucide-react';

export interface UndoAction {
  id: string;
  message: string;
  funSubtext?: string;
  badge?: string;
  onUndo?: () => Promise<void> | void;
}

interface UndoToastProps {
  action: UndoAction | null;
  onDismiss: () => void;
}

export default function UndoToast({ action, onDismiss }: UndoToastProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!action) return;

    setProgress(100);
    const startTime = Date.now();
    const duration = 5000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (elapsed >= duration) {
        clearInterval(interval);
        onDismiss();
      }
    }, 40);

    return () => clearInterval(interval);
  }, [action, onDismiss]);

  return (
    <AnimatePresence>
      {action && (
        <motion.div
          key={action.id}
          initial={{ opacity: 0, y: 35, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="fixed bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md bg-[#16171E] dark:bg-[#FFE600] text-white dark:text-black border-2 border-black rounded-2xl shadow-neo p-3.5 flex flex-col gap-2.5 select-none"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0 flex-1">
              <div className="w-7 h-7 rounded-xl bg-[#FF5500] text-white border-2 border-black flex items-center justify-center flex-shrink-0 font-black text-xs shadow-neo-sm mt-0.5">
                {action.badge ? action.badge : <Sparkles className="w-3.5 h-3.5" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black leading-tight text-white dark:text-black truncate">
                  {action.message}
                </p>
                {action.funSubtext && (
                  <p className="text-[11px] font-bold text-[#D4FF00] dark:text-gray-800 mt-0.5 leading-snug">
                    {action.funSubtext}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {action.onUndo && (
                <button
                  type="button"
                  onClick={() => {
                    if (action.onUndo) action.onUndo();
                    onDismiss();
                  }}
                  className="px-3 py-1 bg-[#D4FF00] dark:bg-black text-black dark:text-[#D4FF00] font-black text-xs rounded-xl border-2 border-black shadow-neo-sm active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>UNDO</span>
                </button>
              )}

              <button
                type="button"
                onClick={onDismiss}
                aria-label="Dismiss toast"
                className="w-6 h-6 rounded-lg border border-black/30 dark:border-black/50 flex items-center justify-center text-gray-400 hover:text-white dark:text-black/60 dark:hover:text-black active:scale-95"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 5-second animated countdown timer bar */}
          <div className="w-full h-1 bg-white/20 dark:bg-black/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#FF5500] dark:bg-black transition-all duration-75"
              style={{ width: `${progress}%` }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
