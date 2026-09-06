'use client';

import React from 'react';
import { Flame, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import { MealItem } from '@/types/meal';

interface DailyNutritionMonitorProps {
  dayName: string;
  dayDateFormatted: string;
  isToday: boolean;
  meals: MealItem[];
  calorieTarget: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
  onAutoFillDay?: () => void;
  onQuickAddMeal: (slot: 'breakfast' | 'lunch' | 'dinner' | 'snack') => void;
}

export default function DailyNutritionMonitor({
  dayName,
  dayDateFormatted,
  isToday,
  meals,
  calorieTarget,
  proteinTarget,
  carbsTarget,
  fatTarget,
  onAutoFillDay,
}: DailyNutritionMonitorProps) {
  const totalCalories = meals.reduce((sum, m) => sum + (m.calories || 0), 0);
  const totalProtein = meals.reduce((sum, m) => sum + (m.protein || 0), 0);
  const totalCarbs = meals.reduce((sum, m) => sum + (m.carbs || 0), 0);
  const totalFat = meals.reduce((sum, m) => sum + (m.fat || 0), 0);

  const calPercent = Math.min(100, Math.round((totalCalories / (calorieTarget || 2200)) * 100));
  const proteinPercent = Math.min(100, Math.round((totalProtein / (proteinTarget || 140)) * 100));
  const carbsPercent = Math.min(100, Math.round((totalCarbs / (carbsTarget || 240)) * 100));
  const fatPercent = Math.min(100, Math.round((totalFat / (fatTarget || 65)) * 100));

  const hasEmptySlots = meals.length < 4;

  return (
    <div className="bg-white dark:bg-[#16171E] border-2 border-black dark:border-gray-800 rounded-3xl p-5 shadow-neo-lg transition-colors">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b-2 border-black/10 dark:border-gray-800">
        {/* Left: Tilted Sticker Badge (ABOUT ME style) & Metrics */}
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="rotate-[-2deg] bg-[#FFE600] text-black font-black text-sm sm:text-base uppercase tracking-tight px-4 py-1.5 rounded-xl border-2 border-black shadow-neo-sm">
              {dayName} NUTRITION MONITOR
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-bold">
              {dayDateFormatted}
            </span>
            {isToday && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#D4FF00] text-black border-2 border-black shadow-neo-sm">
                TODAY
              </span>
            )}
          </div>

          {/* User Engagement Sticker Pills */}
          <div className="flex items-center gap-2.5 mt-3 flex-wrap text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF8F5] dark:bg-[#1E202A] border-2 border-black dark:border-gray-700 text-orange-600 dark:text-orange-400 font-black text-[11px] shadow-neo-sm">
              <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
              <span>4-Day Consistency</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF8F5] dark:bg-[#1E202A] border-2 border-black dark:border-gray-700 text-emerald-700 dark:text-emerald-400 font-black text-[11px] shadow-neo-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Zero-Waste Tracked</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF8F5] dark:bg-[#1E202A] border-2 border-black dark:border-gray-700 text-purple-700 dark:text-purple-400 font-black text-[11px] shadow-neo-sm">
              <TrendingUp className="w-3.5 h-3.5 text-purple-500" />
              <span>{meals.length}/4 Slots Planned</span>
            </div>
          </div>
        </div>

        {/* Right: Smart Auto-Fill (Neon Tactile Button) */}
        {hasEmptySlots && onAutoFillDay && (
          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <button
              onClick={onAutoFillDay}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-[#D4FF00] hover:bg-[#c3ed00] text-black font-black text-xs rounded-xl border-2 border-black shadow-neo hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-neo-lg active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Auto-Fill Empty Slots</span>
            </button>
          </div>
        )}
      </div>

      {/* 4 Macro Progress Cards styled like the portfolio cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-4">
        {/* Total Energy */}
        <div className="bg-[#FAF8F5] dark:bg-[#1E202A] rounded-2xl p-3.5 border-2 border-black dark:border-gray-700 shadow-neo-sm border-l-[6px] border-l-[#D4FF00]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-600 dark:text-gray-400">
              Total Energy
            </span>
            <span className="text-xs font-black text-gray-900 dark:text-[#D4FF00]">
              {totalCalories} / {calorieTarget} kcal
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden border border-black/30">
            <div
              className="bg-[#D4FF00] h-full rounded-full transition-all duration-500"
              style={{ width: `${calPercent}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold block mt-1">
            {calPercent}% of daily target
          </span>
        </div>

        {/* Protein */}
        <div className="bg-[#FAF8F5] dark:bg-[#1E202A] rounded-2xl p-3.5 border-2 border-black dark:border-gray-700 shadow-neo-sm border-l-[6px] border-l-rose-500">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-600 dark:text-gray-400">
              Protein
            </span>
            <span className="text-xs font-black text-rose-600 dark:text-rose-400">
              {totalProtein}g / {proteinTarget}g
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden border border-black/30">
            <div
              className="bg-rose-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${proteinPercent}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold block mt-1">
            {proteinPercent}% target reached
          </span>
        </div>

        {/* Carbs */}
        <div className="bg-[#FAF8F5] dark:bg-[#1E202A] rounded-2xl p-3.5 border-2 border-black dark:border-gray-700 shadow-neo-sm border-l-[6px] border-l-[#00E5FF]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-600 dark:text-gray-400">
              Carbohydrates
            </span>
            <span className="text-xs font-black text-sky-600 dark:text-sky-400">
              {totalCarbs}g / {carbsTarget}g
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden border border-black/30">
            <div
              className="bg-[#00E5FF] h-full rounded-full transition-all duration-500"
              style={{ width: `${carbsPercent}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold block mt-1">
            {carbsPercent}% target reached
          </span>
        </div>

        {/* Fats */}
        <div className="bg-[#FAF8F5] dark:bg-[#1E202A] rounded-2xl p-3.5 border-2 border-black dark:border-gray-700 shadow-neo-sm border-l-[6px] border-l-purple-500">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-600 dark:text-gray-400">
              Healthy Fats
            </span>
            <span className="text-xs font-black text-purple-600 dark:text-purple-400">
              {totalFat}g / {fatTarget}g
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden border border-black/30">
            <div
              className="bg-purple-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${fatPercent}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold block mt-1">
            {fatPercent}% target reached
          </span>
        </div>
      </div>
    </div>
  );
}
