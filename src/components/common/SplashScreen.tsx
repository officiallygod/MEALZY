'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FUNKY_MESSAGES = [
  '✦ Loading 7-Day Bento Board...',
  '✦ Syncing Zero-Waste Fridge Radar...',
  '✦ Calibrating Macro Engine...',
  '✦ Ready to Feast!',
];

interface SplashScreenProps {
  isReady: boolean;
  onFinished?: () => void;
}

export default function SplashScreen({ isReady, onFinished }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    // Cycle through 4 messages across 3 seconds (~750ms each)
    const msgTimer = setInterval(() => {
      setMsgIndex((prev) => (prev < FUNKY_MESSAGES.length - 1 ? prev + 1 : prev));
    }, 750);

    // 3-second startup window for behind-the-scenes background sync & setup
    const exitTimer = setTimeout(() => {
      setIsVisible(false);
      if (onFinished) onFinished();
    }, 3000);

    return () => {
      clearInterval(msgTimer);
      clearTimeout(exitTimer);
    };
  }, [onFinished]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#FAF8F5] dark:bg-[#0D0E12] text-gray-900 dark:text-white select-none pointer-events-none"
        >
          {/* Animated Neo-Brutalist Logo */}
          <motion.div
            initial={{ scale: 0.8, rotate: -6 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 12, stiffness: 200 }}
            className="flex items-center gap-3 mb-6"
          >
            <div className="w-14 h-14 rounded-2xl bg-white dark:bg-[#16171E] border-2 border-black flex items-center justify-center shadow-neo p-1">
              <svg viewBox="0 0 100 100" className="w-full h-full fill-none">
                <defs>
                  <linearGradient id="splashMealzyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#00E5FF" />
                    <stop offset="70%" stopColor="#00E5FF" />
                    <stop offset="100%" stopColor="#D4FF00" />
                  </linearGradient>
                </defs>
                {/* Left Pillar */}
                <path d="M 18 29 L 34 29 L 34 50 L 39 59 L 32 79 L 18 79 Z" fill="url(#splashMealzyGrad)" stroke="#000000" strokeWidth="4" strokeLinejoin="round" />
                {/* Right Pillar */}
                <path d="M 64 29 L 80 29 L 80 79 L 66 79 L 59 59 L 64 50 Z" fill="url(#splashMealzyGrad)" stroke="#000000" strokeWidth="4" strokeLinejoin="round" />
                {/* Center Lime Fork */}
                <path d="M 40 28 L 44 28 L 44 45 L 47 45 L 47 28 L 50 28 L 50 45 L 53 45 L 53 28 L 57 28 L 57 49 C 57 56 53 58 53 64 L 53 80 L 44 80 L 44 64 C 44 58 40 56 40 49 Z" fill="#D4FF00" stroke="#000000" strokeWidth="4" strokeLinejoin="round" />
                {/* Sparkle Stars */}
                <path d="M 77 15 L 79.5 22.5 L 87 25 L 79.5 27.5 L 77 35 L 74.5 27.5 L 67 25 L 74.5 22.5 Z" fill="#D4FF00" stroke="#000000" strokeWidth="2.5" strokeLinejoin="round" />
                <path d="M 21 68 L 23.5 74.5 L 30 77 L 23.5 79.5 L 21 86 L 18.5 79.5 L 12 77 L 18.5 74.5 Z" fill="#D4FF00" stroke="#000000" strokeWidth="2.5" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="flex items-center tracking-tight">
              <span className="font-funky font-black text-4xl text-gray-900 dark:text-white">
                MEAL
              </span>
              <span className="font-funky font-black text-4xl text-[#FF5500] drop-shadow-[2px_2px_0px_#000000]">
                ZY
              </span>
              <span className="text-[#D4FF00] text-sm font-black -mt-3 ml-0.5 animate-pulse">
                ✦
              </span>
            </div>
          </motion.div>

          {/* Funky Loading Status Text */}
          <div className="px-4 py-2 rounded-xl bg-white dark:bg-[#16171E] border-2 border-black dark:border-gray-700 shadow-neo-sm">
            <motion.p
              key={msgIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs font-black uppercase tracking-wider text-black dark:text-[#FFE600]"
            >
              {FUNKY_MESSAGES[msgIndex]}
            </motion.p>
          </div>

          {/* Animated Progress Bar */}
          <div className="w-52 h-2.5 bg-gray-200 dark:bg-gray-800 rounded-full border-2 border-black dark:border-gray-700 mt-4 overflow-hidden shadow-neo-sm">
            <motion.div
              initial={{ width: '5%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2.9, ease: 'easeInOut' }}
              className="h-full bg-[#FF5500]"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
