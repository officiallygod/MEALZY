'use client';

import React from 'react';
import { Flame, Plus, User, Sun, Moon, Zap } from 'lucide-react';

interface HeaderProps {
  onOpenAuth: () => void;
  onOpenAddMeal: () => void;
  userEmail?: string;
  todayCalories: number;
  calorieTarget: number;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export default function Header({
  onOpenAuth,
  onOpenAddMeal,
  userEmail,
  todayCalories,
  calorieTarget,
  theme,
  onToggleTheme,
}: HeaderProps) {
  const percent = Math.min(100, Math.round((todayCalories / (calorieTarget || 2200)) * 100));

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#0A0B0E]/90 backdrop-blur-xl border-b border-gray-200 dark:border-gray-900 px-4 sm:px-8 py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-black dark:bg-[#D4FF00] border-2 border-black dark:border-black flex items-center justify-center font-black text-white dark:text-black text-xl shadow-sm transform -rotate-1">
            M
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-funky font-black text-xl tracking-tight text-gray-900 dark:text-white">
                MEALZY
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-lime-400 dark:bg-[#D4FF00] text-black border border-black shadow-sm">
                BETA
              </span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium -mt-0.5 hidden xs:block">
              Plan, cook, prevent waste
            </p>
          </div>
        </div>

        {/* Center: Daily Kcal Pulse & Streak */}
        <div className="flex items-center gap-3 sm:gap-6">
          {/* Day Streak */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 dark:bg-[#181A24] border border-orange-200 dark:border-gray-800 text-xs font-bold text-orange-600 dark:text-orange-400 shadow-sm">
            <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
            <span>4 Days</span>
          </div>

          {/* Calorie Meter */}
          <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-[#181A24] border border-gray-200 dark:border-gray-800">
            <div className="w-2 h-2 rounded-full bg-lime-500 dark:bg-[#D4FF00]" />
            <div className="text-xs">
              <span className="font-black text-gray-900 dark:text-white">{todayCalories}</span>
              <span className="text-gray-500 dark:text-gray-400"> / {calorieTarget} kcal</span>
            </div>
            <span className="text-[10px] font-extrabold text-lime-700 dark:text-[#D4FF00] bg-lime-200 dark:bg-[#D4FF00]/10 px-1.5 py-0.5 rounded-md">
              {percent}%
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Light / Dark Mode Toggle */}
          <button
            onClick={onToggleTheme}
            aria-label="Toggle Theme"
            className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-[#181A24] border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* Add Meal Trigger Button */}
          <button
            onClick={onOpenAddMeal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-lime-400 dark:bg-[#D4FF00] hover:bg-lime-300 dark:hover:bg-[#c3ed00] text-black font-black text-xs rounded-xl shadow-sm transition-all active:translate-x-0.5 active:translate-y-0.5"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span className="hidden sm:inline">ADD MEAL</span>
          </button>

          {/* User Profile / Auth */}
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-xl bg-gray-100 dark:bg-[#181A24] hover:bg-gray-200 dark:hover:bg-[#202330] border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-all text-xs font-bold"
          >
            <div className="w-6 h-6 rounded-lg bg-gray-900 dark:bg-gray-800 text-white flex items-center justify-center text-[11px] font-black">
              {userEmail ? userEmail[0].toUpperCase() : <User className="w-3.5 h-3.5" />}
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
