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
        <div className="fixed bottom-20 sm:bottom-24 inset-x-0 z-50 flex justify-center pointer-events-none px-3">
          <motion.div
            key={action.id}
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="pointer-events-auto relative overflow-hidden bg-[#16171E] dark:bg-[#FFE600] text-white dark:text-black border-2 border-black rounded-2xl shadow-neo px-3 py-2 flex items-center gap-2.5 select-none max-w-[92vw] sm:max-w-sm"
          >
            {/* Quick Badge / Icon */}
            <div className="w-5 h-5 rounded-lg bg-[#FF5500] text-white border border-black flex items-center justify-center flex-shrink-0 font-black text-[11px] shadow-sm">
              {action.badge ? action.badge : <Sparkles className="w-2.5 h-2.5" />}
            </div>

            {/* Crisp, Concise Message */}
            <span className="text-xs font-black leading-tight text-white dark:text-black truncate min-w-0 flex-1">
              {action.message}
            </span>

            {/* Actions: UNDO + Close */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {action.onUndo && (
                <button
                  type="button"
                  onClick={() => {
                    if (action.onUndo) action.onUndo();
                    onDismiss();
                  }}
                  className="px-2.5 py-1 bg-[#D4FF00] dark:bg-black text-black dark:text-[#D4FF00] font-black text-[10px] rounded-lg border border-black shadow-neo-sm active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-2.5 h-2.5 stroke-[3]" />
                  <span>UNDO</span>
                </button>
              )}

              <button
                type="button"
                onClick={onDismiss}
                aria-label="Dismiss toast"
                className="w-5 h-5 rounded-lg border border-black/30 dark:border-black/50 flex items-center justify-center text-gray-400 hover:text-white dark:text-black/60 dark:hover:text-black active:scale-95 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* Integrated micro progress line */}
            <div className="absolute bottom-0 inset-x-0 h-0.5 bg-white/20 dark:bg-black/20">
              <div
                className="h-full bg-[#FF5500] dark:bg-black transition-all duration-75"
                style={{ width: `${progress}%` }}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
