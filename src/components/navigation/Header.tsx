'use client';

import React from 'react';
import { Flame, Plus, User, Sun, Moon, Smartphone } from 'lucide-react';

interface HeaderProps {
  onOpenAuth: () => void;
  onOpenAddMeal: () => void;
  onExportWeekImage?: () => void;
  onLogoClick?: () => void;
  userEmail?: string;
  userName?: string;
  userAvatar?: string;
  todayCalories: number;
  calorieTarget: number;
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
  const percent = Math.min(100, Math.round((todayCalories / (calorieTarget || 2200)) * 100));

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 dark:bg-[#0D0E12]/95 backdrop-blur-xl border-b-2 border-black dark:border-gray-800 px-4 sm:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Logo & Brand Emblem */}
        <a
          href="/"
          onClick={(e) => {
            if (onLogoClick) {
              e.preventDefault();
              onLogoClick();
            } else {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0 group cursor-pointer select-none no-underline text-inherit"
          title="MEALZY - Go to Homepage"
        >
          {/* Neo-Brutalist Brand Emblem (Matching Favicon) */}
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#FF5500] border-2 border-black flex items-center justify-center shadow-neo-sm group-hover:shadow-neo transition-all flex-shrink-0">
            <svg viewBox="0 0 32 32" className="w-5 h-5 sm:w-5.5 sm:h-5.5 fill-none">
              <path d="M7 23V9.5L13.5 17.5L20 9.5V23" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M25 5L25.8 7.2L28 8L25.8 8.8L25 11L24.2 8.8L22 8L24.2 7.2Z" fill="#D4FF00" stroke="#000000" strokeWidth="0.8" />
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
            <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 leading-tight mt-0.5 flex items-center gap-1 whitespace-nowrap">
              Made with <span className="text-rose-500">❤️</span> by{' '}
              <strong className="font-black text-black dark:text-[#FFE600] underline decoration-[#FF5500] decoration-2 underline-offset-1">
                Allen Benny
              </strong>
            </span>
          </div>

          {/* Rotated Neo-Brutalist Sticker Badges */}
          <div className="hidden lg:flex items-center gap-2 ml-1">
            <div className="rotate-[-3deg] bg-[#FFE600] text-black font-black text-[10px] uppercase px-2 py-0.5 rounded-full border-2 border-black shadow-neo-sm">
              7-Day Bento
            </div>
            <div className="rotate-[2deg] bg-[#D4FF00] text-black font-black text-[10px] uppercase px-2 py-0.5 rounded-full border-2 border-black shadow-neo-sm">
              Zero Waste
            </div>
          </div>
        </a>

        {/* Center: Habit Streak & Daily Energy */}
        <div className="hidden xl:flex items-center gap-3 flex-shrink-0">
          {/* Consistency Streak */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-[#16171E] border-2 border-black dark:border-gray-700 text-xs font-black text-orange-600 dark:text-orange-400 shadow-neo-sm">
            <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
            <span>4-Day Consistency</span>
          </div>

          {/* Calorie Attainment */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-[#16171E] border-2 border-black dark:border-gray-700 text-xs shadow-neo-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-[#D4FF00] border border-black" />
            <span className="font-black text-gray-900 dark:text-white">{todayCalories}</span>
            <span className="text-gray-400">/ {calorieTarget} kcal</span>
            <span className="text-[10px] font-black bg-[#D4FF00] text-black px-1.5 py-0.2 rounded border border-black">
              {percent}%
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
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

          {/* Primary Action Button: Neon Orange "ADD MEAL" */}
          <button
            onClick={onOpenAddMeal}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 bg-[#FF5500] hover:bg-[#ff681a] text-white font-black text-xs rounded-xl border-2 border-black shadow-neo active:scale-[0.98] transition-colors flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span className="hidden xs:inline">ADD MEAL</span>
          </button>

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
