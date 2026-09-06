'use client';

import React from 'react';
import { Heart, Database } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full mt-auto border-t-2 border-black/10 dark:border-gray-800 bg-[#FAF8F5]/80 dark:bg-[#0D0E12]/80 backdrop-blur-md py-3.5 pb-20 px-4 text-center transition-colors">
      <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 flex-wrap text-center">
        {/* Brand & Made with Love by Allen Benny */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-1.5 cursor-pointer group no-underline text-inherit"
          title="MEALZY - Back to top"
        >
          <div className="w-5 h-5 rounded-md bg-[#FF5500] border border-black flex items-center justify-center shadow-neo-sm group-hover:scale-105 transition-transform">
            <svg viewBox="0 0 32 32" className="w-3 h-3 fill-none">
              <path d="M7 23V9.5L13.5 17.5L20 9.5V23" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M25 5L25.8 7.2L28 8L25.8 8.8L25 11L24.2 8.8L22 8L24.2 7.2Z" fill="#D4FF00" stroke="#000000" strokeWidth="0.8" />
            </svg>
          </div>
          <span className="font-funky font-black text-xs tracking-tight text-gray-900 dark:text-white">
            MEAL<span className="text-[#FF5500]">ZY</span>
          </span>
        </a>
        <span className="text-gray-400 dark:text-gray-600 font-bold">•</span>
        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
          Made with <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 inline animate-pulse" /> by{' '}
          <span className="font-black text-black dark:text-[#FFE600] underline decoration-[#FF5500] decoration-2 underline-offset-2">
            Allen Benny
          </span>
        </span>
      </div>
    </footer>
  );
}
