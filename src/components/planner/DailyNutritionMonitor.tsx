'use client';

import React from 'react';
import { Flame, ShieldCheck, Sparkles, TrendingUp, Plus } from 'lucide-react';
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
  onQuickAddMeal,
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
    <div className="bg-white dark:bg-[#12141B] border border-gray-200 dark:border-gray-800 rounded-3xl p-5 shadow-sm transition-colors">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
        {/* Left: Day Header & Habit Metrics */}
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="font-funky font-black text-lg text-gray-900 dark:text-white uppercase tracking-wider">
              {dayName} Monitor
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-bold">
              {dayDateFormatted}
            </span>
            {isToday && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-lime-400 dark:bg-[#D4FF00] text-black border border-black">
                TODAY
              </span>
            )}
          </div>

          {/* User Engagement Indicators */}
          <div className="flex items-center gap-3 mt-2 flex-wrap text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-[#181A24] border border-orange-200 dark:border-gray-800 text-orange-600 dark:text-orange-400 font-bold text-[11px]">
              <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
              <span>4-Day Consistency</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-[#181A24] border border-emerald-200 dark:border-gray-800 text-emerald-700 dark:text-emerald-400 font-bold text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Zero-Waste Tracked</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-[#181A24] border border-purple-200 dark:border-gray-800 text-purple-700 dark:text-purple-400 font-bold text-[11px]">
              <TrendingUp className="w-3.5 h-3.5 text-purple-500" />
              <span>{meals.length}/4 Slots Planned</span>
            </div>
          </div>
        </div>

        {/* Right: Smart Auto-Fill & Quick Actions */}
        {hasEmptySlots && onAutoFillDay && (
          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <button
              onClick={onAutoFillDay}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-black hover:bg-gray-800 text-white dark:bg-[#D4FF00] dark:hover:bg-[#c3ed00] dark:text-black font-black text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Auto-Fill Empty Slots</span>
            </button>
          </div>
        )}
      </div>

      {/* Primary Nutritional Progress Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
        {/* Total Calories Bar */}
        <div className="bg-gray-50 dark:bg-[#181A24] rounded-2xl p-3 border border-gray-100 dark:border-gray-800/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-black uppercase text-gray-500 dark:text-gray-400">
              Total Energy
            </span>
            <span className="text-xs font-black text-gray-900 dark:text-[#D4FF00]">
              {totalCalories} / {calorieTarget} kcal
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
            <div
              className="bg-lime-500 dark:bg-[#D4FF00] h-full rounded-full transition-all duration-500"
              style={{ width: `${calPercent}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-400 font-bold block mt-1">
            {calPercent}% of daily target
          </span>
        </div>

        {/* Protein Macro */}
        <div className="bg-gray-50 dark:bg-[#181A24] rounded-2xl p-3 border border-gray-100 dark:border-gray-800/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-black uppercase text-gray-500 dark:text-gray-400">
              Protein
            </span>
            <span className="text-xs font-black text-rose-600 dark:text-rose-400">
              {totalProtein}g / {proteinTarget}g
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
            <div
              className="bg-rose-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${proteinPercent}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-400 font-bold block mt-1">
            {proteinPercent}% target reached
          </span>
        </div>

        {/* Carbs Macro */}
        <div className="bg-gray-50 dark:bg-[#181A24] rounded-2xl p-3 border border-gray-100 dark:border-gray-800/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-black uppercase text-gray-500 dark:text-gray-400">
              Carbohydrates
            </span>
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
              {totalCarbs}g / {carbsTarget}g
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${carbsPercent}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-400 font-bold block mt-1">
            {carbsPercent}% target reached
          </span>
        </div>

        {/* Fats Macro */}
        <div className="bg-gray-50 dark:bg-[#181A24] rounded-2xl p-3 border border-gray-100 dark:border-gray-800/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-black uppercase text-gray-500 dark:text-gray-400">
              Healthy Fats
            </span>
            <span className="text-xs font-black text-purple-600 dark:text-purple-400">
              {totalFat}g / {fatTarget}g
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
            <div
              className="bg-purple-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${fatPercent}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-400 font-bold block mt-1">
            {fatPercent}% target reached
          </span>
        </div>
      </div>
    </div>
  );
}
