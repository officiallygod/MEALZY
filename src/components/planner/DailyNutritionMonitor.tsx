'use client';

import React, { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, ShieldCheck, Sparkles, TrendingUp, ChevronDown, Zap, Target, Utensils, Plus } from 'lucide-react';
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
  onUpdateCalorieTarget?: (newTarget: number) => void;
  onAutoFillDay?: () => void;
  onQuickAddMeal: (slot: 'breakfast' | 'lunch' | 'dinner' | 'snack') => void;
  onOpenAddMeal?: () => void;
  onAteOut?: () => void;
}

function DailyNutritionMonitor({
  dayName,
  dayDateFormatted,
  isToday,
  meals,
  calorieTarget,
  proteinTarget,
  carbsTarget,
  fatTarget,
  onUpdateCalorieTarget,
  onAutoFillDay,
  onQuickAddMeal,
  onOpenAddMeal,
  onAteOut,
}: DailyNutritionMonitorProps) {
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mealzy_macros_expanded') === 'true';
    }
    return false;
  });

  const toggleExpanded = () => {
    setIsExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('mealzy_macros_expanded', String(next));
      } catch (_) {}
      return next;
    });
  };

  const totalCalories = meals.reduce((sum, m) => sum + (m.calories || 0), 0);
  const totalProtein = meals.reduce((sum, m) => sum + (m.protein || 0), 0);
  const totalCarbs = meals.reduce((sum, m) => sum + (m.carbs || 0), 0);
  const totalFat = meals.reduce((sum, m) => sum + (m.fat || 0), 0);

  const calTargetSafe = calorieTarget || 2200;
  const proteinTargetSafe = proteinTarget || 140;
  const carbsTargetSafe = carbsTarget || 240;
  const fatTargetSafe = fatTarget || 65;

  const calPercent = Math.min(100, Math.round((totalCalories / calTargetSafe) * 100));
  const proteinPercent = Math.min(100, Math.round((totalProtein / proteinTargetSafe) * 100));
  const carbsPercent = Math.min(100, Math.round((totalCarbs / carbsTargetSafe) * 100));
  const fatPercent = Math.min(100, Math.round((totalFat / fatTargetSafe) * 100));

  const existingSlots = new Set(meals.map((m) => m.mealType));
  const emptySlots: ('breakfast' | 'lunch' | 'dinner' | 'snack')[] = (
    ['breakfast', 'lunch', 'dinner', 'snack'] as const
  ).filter((s) => !existingSlots.has(s));
  const hasEmptySlots = emptySlots.length > 0;

  const cleanDateFormatted = dayDateFormatted.replace(/^[A-Za-z]+,\s*/, '');

  return (
    <div className="bg-white dark:bg-[#16171E] border-2 border-black dark:border-gray-800 rounded-2xl sm:rounded-3xl p-3.5 sm:px-5 sm:py-3.5 shadow-neo-sm sm:shadow-neo transition-colors">
      {/* ========================================================================= */}
      {/* COMPACT RIBBON (DEFAULT VIEW - MINIMIZED ON PHONES & SLEEK ON DESKTOP)    */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Active Day Label & Date (Perfect Neo-Brutalist Segmented Badge) */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="inline-flex items-stretch border-2 border-black dark:border-gray-700 rounded-xl overflow-hidden shadow-neo-sm bg-[#FAF8F5] dark:bg-[#20222D]">
            <div className="px-3 py-1.5 bg-[#FFE600] text-black font-black text-xs uppercase tracking-wider border-r-2 border-black flex items-center justify-center leading-none">
              {isToday ? 'TODAY' : dayName}
            </div>
            <div className="px-3 py-1.5 font-bold text-xs text-gray-800 dark:text-gray-200 flex items-center justify-center leading-none">
              {isToday ? dayDateFormatted : cleanDateFormatted}
            </div>
          </div>

          {isToday && (
            <span className="px-2 py-1 rounded-lg text-[9px] font-black bg-[#D4FF00] text-black border border-black shadow-neo-sm leading-none flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
              ACTIVE
            </span>
          )}
        </div>

        {/* Right: Actions (AI Icon, Calories Capsule, Ate Out, Expand Toggle) */}
        <div className="flex items-center gap-2 self-end md:self-auto flex-shrink-0">
          {hasEmptySlots && onAutoFillDay && (
            <button
              onClick={onAutoFillDay}
              className="p-1.5 sm:px-3 sm:py-1.5 bg-[#D4FF00] hover:bg-[#c3ed00] text-black font-black text-[11px] rounded-xl border border-black shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5 leading-none cursor-pointer"
              title="Automatically schedule healthy meals in empty slots"
            >
              <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden lg:inline">Auto-Fill</span>
            </button>
          )}

          {/* Add Meal (+) Button (Brought down from header) */}
          {onOpenAddMeal && (
            <button
              type="button"
              onClick={onOpenAddMeal}
              className="w-8 h-8 rounded-xl bg-[#FF5500] hover:bg-[#ff681a] text-white font-black border-2 border-black shadow-neo-sm active:scale-95 transition-all flex items-center justify-center cursor-pointer flex-shrink-0"
              title="Add meal to this day"
              aria-label="Add meal"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
            </button>
          )}

          {/* Energy Capsule (Shifted after AI Icon, before Ate Out) */}
          <div
            onClick={toggleExpanded}
            className="bg-[#FAF8F5] dark:bg-[#20222D] border border-black/30 dark:border-gray-700 rounded-xl px-2.5 sm:px-3 py-1.5 flex items-center justify-between gap-1.5 sm:gap-2 border-l-4 border-l-[#D4FF00] shadow-neo-sm cursor-pointer hover:border-black dark:hover:border-white transition-all select-none flex-shrink-0"
            title={isExpanded ? 'Click to collapse details' : 'Click to show protein and nutrition details'}
          >
            <span className="text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase leading-none">Cals</span>
            <span className="text-xs font-black text-gray-950 dark:text-[#D4FF00] leading-none tabular-nums">
              {totalCalories}<span className="text-[10px] text-gray-600 dark:text-gray-400 font-black">/{calTargetSafe}</span>
            </span>
          </div>

          {onAteOut && (
            <button
              type="button"
              onClick={onAteOut}
              className="px-2.5 sm:px-3 py-1.5 bg-[#00E5FF] hover:bg-[#00cbe2] text-black font-black text-[11px] uppercase rounded-xl border border-black shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5 leading-none cursor-pointer"
              title="Ate out or plans changed for today? Reschedule meals."
            >
              <Utensils className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Ate Out?</span>
            </button>
          )}

          {/* Downward Arrow Button */}
          <button
            type="button"
            onClick={toggleExpanded}
            className="w-8 h-8 bg-[#FAF8F5] dark:bg-[#20222D] hover:bg-[#FFE600] hover:text-black dark:hover:bg-[#D4FF00] dark:hover:text-black text-gray-800 dark:text-gray-200 font-black rounded-xl border-2 border-black dark:border-gray-700 shadow-neo-sm active:scale-95 transition-all flex items-center justify-center cursor-pointer flex-shrink-0"
            title={isExpanded ? 'Collapse nutrition details' : 'Show protein and nutrition details'}
            aria-label={isExpanded ? 'Collapse nutrition details' : 'Show protein and nutrition details'}
          >
            <ChevronDown
              className={`w-4 h-4 stroke-[2.5] transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* EXPANDABLE SECTION (WHEN USER ASKS FOR FULL MACRO DETAIL & ENGAGEMENT)    */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden pt-3 mt-3 border-t border-black/10 dark:border-gray-800 space-y-3"
          >
            {/* User Engagement Sticker Pills */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAF8F5] dark:bg-[#1E202A] border border-black/40 dark:border-gray-700 text-orange-600 dark:text-orange-400 font-black text-[10px] shadow-neo-sm">
                <Flame className="w-3 h-3 fill-orange-500 text-orange-500" />
                <span>4-Day Consistency</span>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAF8F5] dark:bg-[#1E202A] border border-black/40 dark:border-gray-700 text-emerald-700 dark:text-emerald-400 font-black text-[10px] shadow-neo-sm">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                <span>Zero-Waste Tracked</span>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAF8F5] dark:bg-[#1E202A] border border-black/40 dark:border-gray-700 text-purple-700 dark:text-purple-400 font-black text-[10px] shadow-neo-sm">
                <TrendingUp className="w-3 h-3 text-purple-500" />
                <span>{meals.length}/4 Slots Planned</span>
              </div>

              {hasEmptySlots && onQuickAddMeal && (
                <div className="flex items-center gap-1 ml-auto flex-wrap">
                  <span className="text-[10px] font-black uppercase text-gray-400">+ Add:</span>
                  {emptySlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => onQuickAddMeal(slot)}
                      className="px-2 py-0.5 bg-white dark:bg-[#20222E] hover:bg-[#FFE600] hover:text-black dark:hover:bg-[#FFE600] dark:hover:text-black text-gray-800 dark:text-gray-200 font-black text-[9px] uppercase rounded-lg border border-black shadow-neo-sm"
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 4 Macro Progress Bars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
              {/* Total Energy */}
              <div className="bg-[#FAF8F5] dark:bg-[#1E202A] rounded-xl p-2.5 border border-black/40 dark:border-gray-700 shadow-neo-sm border-l-4 border-l-[#D4FF00]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Total Energy
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-black text-gray-900 dark:text-[#D4FF00]">
                      {totalCalories} / {calTargetSafe} kcal
                    </span>
                    {onUpdateCalorieTarget && (
                      <div className="flex items-center gap-0.5 ml-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateCalorieTarget(Math.max(1200, calTargetSafe - 100));
                          }}
                          className="w-4 h-4 rounded bg-black/10 dark:bg-white/10 flex items-center justify-center text-[9px] font-black hover:scale-110 active:scale-95 cursor-pointer"
                          title="Decrease 100 kcal target"
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateCalorieTarget(Math.min(5000, calTargetSafe + 100));
                          }}
                          className="w-4 h-4 rounded bg-black/10 dark:bg-white/10 flex items-center justify-center text-[9px] font-black hover:scale-110 active:scale-95 cursor-pointer"
                          title="Increase 100 kcal target"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden border border-black/20">
                  <div
                    className="bg-[#D4FF00] h-full rounded-full transition-all duration-500"
                    style={{ width: `${calPercent}%` }}
                  />
                </div>
                <span className="text-[9px] text-gray-500 dark:text-gray-400 font-bold block mt-0.5">
                  {calPercent}% of target
                </span>
              </div>

              {/* Protein */}
              <div className="bg-[#FAF8F5] dark:bg-[#1E202A] rounded-xl p-2.5 border border-black/40 dark:border-gray-700 shadow-neo-sm border-l-4 border-l-rose-500">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Protein
                  </span>
                  <span className="text-xs font-black text-rose-600 dark:text-rose-400">
                    {totalProtein}g / {proteinTargetSafe}g
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden border border-black/20">
                  <div
                    className="bg-rose-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${proteinPercent}%` }}
                  />
                </div>
                <span className="text-[9px] text-gray-500 dark:text-gray-400 font-bold block mt-0.5">
                  {proteinPercent}% of target
                </span>
              </div>

              {/* Carbs */}
              <div className="bg-[#FAF8F5] dark:bg-[#1E202A] rounded-xl p-2.5 border border-black/40 dark:border-gray-700 shadow-neo-sm border-l-4 border-l-[#00E5FF]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Carbohydrates
                  </span>
                  <span className="text-xs font-black text-sky-600 dark:text-[#00E5FF]">
                    {totalCarbs}g / {carbsTargetSafe}g
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden border border-black/20">
                  <div
                    className="bg-[#00E5FF] h-full rounded-full transition-all duration-500"
                    style={{ width: `${carbsPercent}%` }}
                  />
                </div>
                <span className="text-[9px] text-gray-500 dark:text-gray-400 font-bold block mt-0.5">
                  {carbsPercent}% of target
                </span>
              </div>

              {/* Fats */}
              <div className="bg-[#FAF8F5] dark:bg-[#1E202A] rounded-xl p-2.5 border border-black/40 dark:border-gray-700 shadow-neo-sm border-l-4 border-l-purple-500">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Healthy Fats
                  </span>
                  <span className="text-xs font-black text-purple-600 dark:text-purple-400">
                    {totalFat}g / {fatTargetSafe}g
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden border border-black/20">
                  <div
                    className="bg-purple-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${fatPercent}%` }}
                  />
                </div>
                <span className="text-[9px] text-gray-500 dark:text-gray-400 font-bold block mt-0.5">
                  {fatPercent}% of target
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default memo(DailyNutritionMonitor);
