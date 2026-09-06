'use client';

import React, { useState, useEffect } from 'react';
import { Plus, User, Sun, Moon, Smartphone, Heart, RefreshCw, Check } from 'lucide-react';

interface HeaderProps {
  onOpenAuth: () => void;
  onOpenAddMeal: () => void;
  onExportWeekImage?: () => void;
  onLogoClick?: () => void;
  userEmail?: string;
  userName?: string;
  userAvatar?: string;
  todayCalories?: number;
  calorieTarget?: number;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export default function Header({
  onOpenAuth,
  onOpenAddMeal,
  onExportWeekImage,
  onLogoClick,
  userEmail,
  userName,
  userAvatar,
  todayCalories,
  calorieTarget,
  theme,
  onToggleTheme,
}: HeaderProps) {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved_locally' | 'synced'>('idle');

  useEffect(() => {
    const handleStatus = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.status) {
        setSaveStatus(detail.status);
      }
    };
    window.addEventListener('mealzy_save_status', handleStatus);
    return () => window.removeEventListener('mealzy_save_status', handleStatus);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 dark:bg-[#0D0E12]/95 backdrop-blur-xl border-b-2 border-black dark:border-gray-800 px-4 sm:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Logo & Brand Emblem */}
        <div
          onClick={(e) => {
            if (onLogoClick) {
              onLogoClick();
            } else {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (onLogoClick) onLogoClick();
              else window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          role="button"
          tabIndex={0}
          className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0 group cursor-pointer select-none text-inherit"
          title="MEALZY - Go to Homepage"
        >
          {/* Neo-Brutalist Brand Emblem (Matching Favicon) */}
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white dark:bg-[#16171E] border-2 border-black flex items-center justify-center shadow-neo-sm group-hover:shadow-neo transition-all flex-shrink-0 p-0.5">
            <svg viewBox="0 0 100 100" className="w-full h-full fill-none">
              <defs>
                <linearGradient id="headerMealzyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#00E5FF" />
                  <stop offset="70%" stopColor="#00E5FF" />
                  <stop offset="100%" stopColor="#D4FF00" />
                </linearGradient>
              </defs>
              {/* Left Pillar */}
              <path d="M 18 29 L 34 29 L 34 50 L 39 59 L 32 79 L 18 79 Z" fill="url(#headerMealzyGrad)" stroke="#000000" strokeWidth="4" strokeLinejoin="round" />
              {/* Right Pillar */}
              <path d="M 64 29 L 80 29 L 80 79 L 66 79 L 59 59 L 64 50 Z" fill="url(#headerMealzyGrad)" stroke="#000000" strokeWidth="4" strokeLinejoin="round" />
              {/* Center Lime Fork */}
              <path d="M 40 28 L 44 28 L 44 45 L 47 45 L 47 28 L 50 28 L 50 45 L 53 45 L 53 28 L 57 28 L 57 49 C 57 56 53 58 53 64 L 53 80 L 44 80 L 44 64 C 44 58 40 56 40 49 Z" fill="#D4FF00" stroke="#000000" strokeWidth="4" strokeLinejoin="round" />
              {/* Sparkle Stars */}
              <path d="M 77 15 L 79.5 22.5 L 87 25 L 79.5 27.5 L 77 35 L 74.5 27.5 L 67 25 L 74.5 22.5 Z" fill="#D4FF00" stroke="#000000" strokeWidth="2.5" strokeLinejoin="round" />
              <path d="M 21 68 L 23.5 74.5 L 30 77 L 23.5 79.5 L 21 86 L 18.5 79.5 L 12 77 L 18.5 74.5 Z" fill="#D4FF00" stroke="#000000" strokeWidth="2.5" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Typography & Author Subtitle: High Visibility below Logo */}
          <div className="flex flex-col">
            <div className="flex items-center tracking-tight leading-none">
              <span className="font-funky font-black text-2xl sm:text-3xl text-gray-900 dark:text-white">
                MEAL
              </span>
              <span className="font-funky font-black text-2xl sm:text-3xl text-[#FF5500] drop-shadow-[2px_2px_0px_#000000] tracking-tight">
                ZY
              </span>
              <span className="text-[#D4FF00] text-xs font-black self-start -ml-0.5 -mt-1 select-none animate-pulse">
                ✦
              </span>
            </div>
            <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 leading-tight mt-1 flex items-center gap-1 whitespace-nowrap">
              Made with <Heart className="w-3 h-3 fill-rose-500 text-rose-500 inline-block flex-shrink-0" /> by{' '}
              <a
                href="https://allenbenny.me/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="font-black text-black dark:text-[#FFE600] underline decoration-[#FF5500] decoration-2 underline-offset-2 hover:text-[#FF5500] dark:hover:text-white transition-colors cursor-pointer"
                title="Visit Allen Benny's Portfolio"
              >
                Allen Benny
              </a>
            </span>
          </div>

          {/* Rotated Neo-Brutalist Sticker Badges */}
          <div className="hidden lg:flex items-center gap-2 ml-1">
            <div className="rotate-[-3deg] bg-[#FFE600] text-black font-black text-[10px] uppercase px-2 py-0.5 rounded-full border-2 border-black shadow-neo-sm">
              7-Day Bento
            </div>
            <div className="rotate-[2deg] bg-[#00E5FF] text-black font-black text-[10px] uppercase px-2 py-0.5 rounded-full border-2 border-black shadow-neo-sm">
              EST. 2026
            </div>
            <div className="rotate-[-1deg] bg-[#D4FF00] text-black font-black text-[10px] uppercase px-2 py-0.5 rounded-full border-2 border-black shadow-neo-sm">
              Zero Waste
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
          {/* Gen Z Save & Sync Tick Indicator (Next to Dark toggle) */}
          <div
            className="flex items-center justify-center select-none flex-shrink-0"
            title={
              saveStatus === 'saving'
                ? 'Saving changes...'
                : saveStatus === 'synced'
                ? 'All changes saved locally & synced to Google Drive'
                : 'All changes saved locally'
            }
            aria-label={saveStatus === 'saving' ? 'Saving changes' : 'All changes saved'}
          >
            {saveStatus === 'saving' ? (
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#FFE600] text-black border-2 border-black shadow-neo-sm flex items-center justify-center">
                <RefreshCw className="w-3.5 h-3.5 stroke-[3] animate-spin text-black" />
              </div>
            ) : (
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#D4FF00] text-black border-2 border-black shadow-neo-sm flex items-center justify-center transition-transform hover:scale-105 active:scale-95">
                <Check className="w-4 h-4 stroke-[3.5] text-black" />
              </div>
            )}
          </div>

          {/* Neo-Brutalist Theme Toggle (Pill like Portfolio) */}
          <button
            onClick={onToggleTheme}
            aria-label="Toggle Theme"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-white dark:bg-[#16171E] hover:bg-gray-100 dark:hover:bg-[#20222D] border-2 border-black dark:border-gray-700 text-xs font-black text-gray-900 dark:text-white shadow-neo-sm active:scale-[0.98] transition-colors flex-shrink-0"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-yellow-400" />
                <span className="hidden sm:inline text-[11px] font-bold">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-slate-800" />
                <span className="hidden sm:inline text-[11px] font-bold">Dark</span>
              </>
            )}
          </button>

          {/* Save Week Plan Image */}
          {onExportWeekImage && (
            <button
              onClick={onExportWeekImage}
              aria-label="Save Week Image"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#FFE600] hover:bg-yellow-400 text-black font-black text-xs border-2 border-black shadow-neo-sm active:scale-[0.98] transition-colors flex-shrink-0"
              title="Generate & Save 7-Day Plan Image for Phone"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden md:inline">SAVE IMAGE</span>
            </button>
          )}

          {/* User Auth Pill */}
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white dark:bg-[#16171E] hover:bg-gray-100 dark:hover:bg-[#20222D] border-2 border-black dark:border-gray-700 text-gray-900 dark:text-white shadow-neo-sm active:scale-[0.98] transition-colors text-xs font-black flex-shrink-0"
          >
            <div className="w-5 h-5 rounded-md bg-black dark:bg-[#D4FF00] text-white dark:text-black flex items-center justify-center text-[10px] font-black uppercase overflow-hidden border border-black/20">
              {userAvatar ? (
                <img src={userAvatar} alt={userName || 'User'} className="w-full h-full object-cover" />
              ) : userName ? (
                userName[0]
              ) : userEmail ? (
                userEmail[0]
              ) : (
                <User className="w-3 h-3" />
              )}
            </div>
            <span className="hidden sm:inline">
              {userName || (userEmail ? userEmail.split('@')[0] : 'Sign In')}
            </span>
          </button>
        </div>
      </div>

    </header>
  );
}
