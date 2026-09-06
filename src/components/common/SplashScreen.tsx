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
            <div className="w-14 h-14 rounded-2xl bg-[#FF5500] border-2 border-black flex items-center justify-center shadow-neo">
              <svg viewBox="0 0 32 32" className="w-8 h-8 fill-none">
                <path d="M7 23V9.5L13.5 17.5L20 9.5V23" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M25 5L25.8 7.2L28 8L25.8 8.8L25 11L24.2 8.8L22 8L24.2 7.2Z" fill="#D4FF00" stroke="#000000" strokeWidth="0.8" />
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
