'use client';

import React from 'react';
import { Flame, Plus, User, Sun, Moon, Smartphone } from 'lucide-react';

interface HeaderProps {
  onOpenAuth: () => void;
  onOpenAddMeal: () => void;
  onExportWeekImage?: () => void;
  userEmail?: string;
  todayCalories: number;
  calorieTarget: number;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export default function Header({
  onOpenAuth,
  onOpenAddMeal,
  onExportWeekImage,
  userEmail,
  todayCalories,
  calorieTarget,
  theme,
  onToggleTheme,
}: HeaderProps) {
  const percent = Math.min(100, Math.round((todayCalories / (calorieTarget || 2200)) * 100));

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 dark:bg-[#0D0E12]/95 backdrop-blur-xl border-b-2 border-black dark:border-gray-800 px-4 sm:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo & Funky Stickers */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center tracking-tight">
            <span className="font-funky font-black text-2xl sm:text-3xl text-gray-900 dark:text-white">
              MEAL
            </span>
            <span className="font-funky font-black text-2xl sm:text-3xl text-stroke-orange tracking-tight">
              ZY
            </span>
          </div>

          {/* Rotated Neo-Brutalist Sticker Badges (from Allen Benny Portfolio) */}
          <div className="hidden md:flex items-center gap-2">
            <div className="rotate-[-3deg] bg-[#FFE600] text-black font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full border-2 border-black shadow-neo-sm">
              ✦ 7-Day Bento
            </div>
            <div className="rotate-[2deg] bg-[#D4FF00] text-black font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full border-2 border-black shadow-neo-sm">
              Zero Waste
            </div>
          </div>
        </div>

        {/* Center: Habit Streak & Daily Energy */}
        <div className="hidden lg:flex items-center gap-3">
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
        <div className="flex items-center gap-2.5">
          {/* Neo-Brutalist Theme Toggle (Pill like Portfolio) */}
          <button
            onClick={onToggleTheme}
            aria-label="Toggle Theme"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#16171E] border-2 border-black dark:border-gray-700 text-xs font-black text-gray-900 dark:text-white shadow-neo-sm hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-neo active:translate-x-0.5 active:translate-y-0.5 transition-all"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-[11px] font-bold">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-slate-800" />
                <span className="text-[11px] font-bold">Dark</span>
              </>
            )}
          </button>

          {/* Save Week Plan Image */}
          {onExportWeekImage && (
            <button
              onClick={onExportWeekImage}
              aria-label="Save Week Image"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFE600] hover:bg-yellow-400 text-black font-black text-xs border-2 border-black shadow-neo-sm hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-neo active:translate-x-0.5 active:translate-y-0.5 transition-all"
              title="Generate & Save 7-Day Plan Image for Phone"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden md:inline">SAVE IMAGE</span>
            </button>
          )}

          {/* Primary Action Button: Neon Orange "ADD MEAL" (Get in Touch Style) */}
          <button
            onClick={onOpenAddMeal}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#FF5500] hover:bg-[#ff681a] text-white font-black text-xs rounded-xl border-2 border-black shadow-neo hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-neo-lg active:translate-x-0.5 active:translate-y-0.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>ADD MEAL</span>
          </button>

          {/* User Auth Pill */}
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#16171E] hover:bg-gray-100 dark:hover:bg-[#20222D] border-2 border-black dark:border-gray-700 text-gray-900 dark:text-white shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 transition-all text-xs font-black"
          >
            <div className="w-5 h-5 rounded-md bg-black dark:bg-[#D4FF00] text-white dark:text-black flex items-center justify-center text-[10px] font-black">
              {userEmail ? userEmail[0].toUpperCase() : <User className="w-3 h-3" />}
            </div>
            <span className="hidden sm:inline">
              {userEmail ? userEmail.split('@')[0] : 'Sign In'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
