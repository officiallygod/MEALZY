'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Clock, Trash2, ChevronRight, Sun, Utensils, Moon, Coffee, CalendarDays } from 'lucide-react';
import { MealItem, MealType } from '@/types/meal';
import { getMealAccent, getMealInitials } from '@/lib/curated-foods';

interface KanbanBentoBoardProps {
  days: {
    dateString: string;
    dayName: string;
    dayNumber: number;
    fullDateFormatted: string;
    isToday: boolean;
  }[];
  selectedDate: string;
  meals: MealItem[];
  isAllDaysView: boolean;
  onSelectMeal: (meal: MealItem) => void;
  onQuickAddMeal: (dateString: string, mealType: MealType) => void;
  onMoveMealSlot: (mealId: string, targetDate: string, targetType: MealType) => void;
  onCookMeal: (meal: MealItem) => void;
  onMarkGoneEarly: (mealId: string, mealTitle: string) => void;
  onDeleteMeal: (mealId: string) => void;
  onFocusDay?: (dateString: string) => void;
}

const MEAL_SLOTS: {
  type: MealType;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  stripeColor: string;
}[] = [
  { type: 'breakfast', title: 'Breakfast', icon: Sun, accentColor: 'text-amber-600', stripeColor: 'border-l-[#FFE600]' },
  { type: 'lunch', title: 'Lunch', icon: Utensils, accentColor: 'text-emerald-600', stripeColor: 'border-l-[#00E5FF]' },
  { type: 'dinner', title: 'Dinner', icon: Moon, accentColor: 'text-indigo-600', stripeColor: 'border-l-rose-500' },
  { type: 'snack', title: 'Snacks', icon: Coffee, accentColor: 'text-rose-600', stripeColor: 'border-l-[#D4FF00]' },
];

export default function KanbanBentoBoard({
  days,
  selectedDate,
  meals,
  isAllDaysView,
  onSelectMeal,
  onQuickAddMeal,
  onMoveMealSlot,
  onCookMeal,
  onMarkGoneEarly,
  onDeleteMeal,
  onFocusDay,
}: KanbanBentoBoardProps) {
  const [draggedMealId, setDraggedMealId] = useState<string | null>(null);
  const [activeDropZone, setActiveDropZone] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, mealId: string) => {
    e.dataTransfer.setData('text/plain', mealId);
    setDraggedMealId(mealId);
  };

  const handleDragOver = (e: React.DragEvent, zoneKey: string) => {
    e.preventDefault();
    if (activeDropZone !== zoneKey) {
      setActiveDropZone(zoneKey);
    }
  };

  const handleDrop = (e: React.DragEvent, targetDate: string, targetType: MealType) => {
    e.preventDefault();
    const mealId = e.dataTransfer.getData('text/plain') || draggedMealId;
    if (mealId) {
      onMoveMealSlot(mealId, targetDate, targetType);
    }
    setDraggedMealId(null);
    setActiveDropZone(null);
  };

  const activeDayObj = days.find((d) => d.dateString === selectedDate) || days[0];

  return (
    <div className="w-full">
      {/* ========================================================================= */}
      {/* MODE 1: DAY BENTO GRID (4 FULL-WIDTH NEO-BRUTALIST COLUMNS) */}
      {/* ========================================================================= */}
      {!isAllDaysView && (
        <div className="space-y-4">
          {/* Active Day Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#16171E] p-4 rounded-3xl border-2 border-black dark:border-gray-800 shadow-neo transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-xl font-black font-funky text-gray-900 dark:text-white uppercase tracking-tight">
                {activeDayObj.dayName}
              </span>
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                {activeDayObj.fullDateFormatted}
              </span>
              {activeDayObj.isToday && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#D4FF00] text-black border-2 border-black shadow-neo-sm">
                  TODAY
                </span>
              )}
            </div>

            {/* Quick Daily Macro Summary */}
            <div className="flex items-center gap-4 text-xs font-black">
              <div>
                <span className="text-gray-400 font-bold">Scheduled: </span>
                <span className="text-gray-900 dark:text-[#D4FF00]">
                  {meals
                    .filter((m) => m.dateScheduled === activeDayObj.dateString)
                    .reduce((sum, m) => sum + (m.calories || 0), 0)}{' '}
                  kcal
                </span>
              </div>
              <div className="hidden sm:block text-gray-300 dark:text-gray-700">•</div>
              <div className="hidden sm:block">
                <span className="text-gray-400 font-bold">Protein: </span>
                <span className="text-rose-600 dark:text-rose-400">
                  {meals
                    .filter((m) => m.dateScheduled === activeDayObj.dateString)
                    .reduce((sum, m) => sum + (m.protein || 0), 0)}g
                </span>
              </div>
            </div>
          </div>

          {/* 4 BENTO COLUMNS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            {MEAL_SLOTS.map((slot) => {
              const SlotIcon = slot.icon;
              const slotMeals = meals.filter(
                (m) => m.dateScheduled === activeDayObj.dateString && m.mealType === slot.type
              );
              const zoneKey = `${activeDayObj.dateString}_${slot.type}`;
              const isHovered = activeDropZone === zoneKey;

              return (
                <div
                  key={slot.type}
                  onDragOver={(e) => handleDragOver(e, zoneKey)}
                  onDragLeave={() => setActiveDropZone(null)}
                  onDrop={(e) => handleDrop(e, activeDayObj.dateString, slot.type)}
                  className={`min-h-[300px] rounded-3xl p-4 transition-all flex flex-col justify-between border-2 bg-white dark:bg-[#16171E] ${
                    isHovered
                      ? 'border-2 border-dashed border-[#D4FF00] bg-[#D4FF00]/10 scale-[1.01]'
                      : 'border-black dark:border-gray-800 shadow-neo-lg'
                  }`}
                >
                  <div>
                    {/* Slot Header */}
                    <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-black/10 dark:border-gray-800">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-[#FAF8F5] dark:bg-[#20222E] border-2 border-black dark:border-gray-700 flex items-center justify-center shadow-neo-sm">
                          <SlotIcon className={`w-4 h-4 ${slot.accentColor}`} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white">
                          {slot.title}
                        </span>
                      </div>

                      <button
                        onClick={() => onQuickAddMeal(activeDayObj.dateString, slot.type)}
                        className="w-7 h-7 rounded-xl bg-[#FAF8F5] dark:bg-[#20222E] hover:bg-[#FFE600] hover:text-black dark:hover:bg-[#D4FF00] dark:hover:text-black text-gray-700 dark:text-gray-300 border-2 border-black dark:border-gray-700 flex items-center justify-center shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 transition-all text-xs"
                        title={`Add to ${slot.title}`}
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </div>

                    {/* Drop Target Indicator */}
                    {isHovered && (
                      <div className="py-6 text-center text-xs font-black text-black dark:text-[#D4FF00] border-2 border-dashed border-black dark:border-[#D4FF00] rounded-2xl mb-3 bg-[#D4FF00]/20">
                        DROP DISH HERE
                      </div>
                    )}

                    {/* Scheduled Meals styled like the portfolio cards */}
                    <div className="space-y-3">
                      <AnimatePresence>
                        {slotMeals.map((meal) => {
                          const initials = getMealInitials(meal.title);
                          const accent = meal.accentColor || getMealAccent(meal.title);

                          return (
                            <motion.div
                              key={meal.id}
                              layout
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              draggable
                              onDragStart={(e: any) => handleDragStart(e, meal.id)}
                              className={`group relative bg-[#FAF8F5] dark:bg-[#1E202A] hover:bg-white dark:hover:bg-[#252834] border-2 border-black dark:border-gray-700 rounded-2xl p-3.5 shadow-neo-sm cursor-grab active:cursor-grabbing transition-all border-l-[6px] ${slot.stripeColor}`}
                            >
                              <div
                                onClick={() => onSelectMeal(meal)}
                                className="cursor-pointer"
                              >
                                <div className="flex items-start gap-3">
                                  {/* Initials Badge */}
                                  <div
                                    className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white flex-shrink-0 border-2 border-black shadow-neo-sm"
                                    style={{ backgroundColor: accent }}
                                  >
                                    {initials}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <h4 className="font-funky font-black text-xs text-gray-900 dark:text-white truncate group-hover:underline">
                                        {meal.title}
                                      </h4>
                                      {meal.isLeftover && (
                                        <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-purple-100 text-purple-800 border border-purple-400">
                                          LEFTOVER
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-600 dark:text-gray-400 font-bold">
                                      <span className="text-gray-900 dark:text-[#D4FF00] font-black">
                                        {meal.calories} kcal
                                      </span>
                                      <span>•</span>
                                      <span>{meal.protein}g P</span>
                                      {meal.prepTimeMinutes && (
                                        <>
                                          <span>•</span>
                                          <span className="flex items-center gap-0.5">
                                            <Clock className="w-2.5 h-2.5" />
                                            {meal.prepTimeMinutes}m
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Card Actions (Tactile Neo-Brutalist Buttons) */}
                              <div className="mt-2.5 pt-2 border-t-2 border-black/10 dark:border-gray-800 flex items-center justify-between text-[10px]">
                                <div className="flex items-center gap-1.5">
                                  {!meal.isLeftover && (
                                    <button
                                      onClick={() => onCookMeal(meal)}
                                      className="px-2.5 py-1 rounded-lg bg-[#D4FF00] hover:bg-[#c3ed00] text-black font-black border border-black shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 transition-all"
                                    >
                                      Cook
                                    </button>
                                  )}
                                  <button
                                    onClick={() => onMarkGoneEarly(meal.id, meal.title)}
                                    className="px-2 py-1 rounded-lg bg-[#FFE600] text-black font-black border border-black shadow-neo-sm hover:bg-yellow-400 active:translate-x-0.5 active:translate-y-0.5 transition-all"
                                    title="Finished earlier than expected? Clear and replan."
                                  >
                                    Gone?
                                  </button>
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => onSelectMeal(meal)}
                                    className="p-1 text-gray-400 hover:text-black dark:hover:text-white"
                                    title="View full details"
                                  >
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => onDeleteMeal(meal.id)}
                                    className="p-1 text-gray-400 hover:text-red-500"
                                    title="Remove from plan"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>

                      {/* Empty Slot Call-To-Action (Dashed Neo-Brutalist Box) */}
                      {slotMeals.length === 0 && !isHovered && (
                        <button
                          type="button"
                          onClick={() => onQuickAddMeal(activeDayObj.dateString, slot.type)}
                          className="w-full py-8 text-center text-xs font-black text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white rounded-2xl border-2 border-dashed border-black/20 dark:border-gray-800 hover:border-black dark:hover:border-white transition-all flex flex-col items-center justify-center gap-1.5 bg-[#FAF8F5]/50 dark:bg-[#1E202A]/40"
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                          <span>Plan {slot.title}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: BENTO WEEK GRID (7 NEO-BRUTALIST CARDS) */}
      {/* ========================================================================= */}
      {isAllDaysView && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-[#16171E] p-4 rounded-3xl border-2 border-black dark:border-gray-800 shadow-neo transition-colors">
            <span className="text-sm font-black font-funky text-gray-900 dark:text-white uppercase tracking-wider">
              Rolling 7-Day Overview
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-bold">
              Click any meal for details, or click &quot;Open Day&quot; to inspect full Bento
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
            {days.map((day) => {
              const dayMeals = meals.filter((m) => m.dateScheduled === day.dateString);
              const totalCalories = dayMeals.reduce((acc, m) => acc + (m.calories || 0), 0);

              return (
                <div
                  key={day.dateString}
                  className={`bg-white dark:bg-[#16171E] rounded-3xl p-5 border-2 transition-all flex flex-col justify-between ${
                    day.isToday
                      ? 'border-black dark:border-[#D4FF00] shadow-neo-lg'
                      : 'border-black/40 dark:border-gray-800 shadow-neo'
                  }`}
                >
                  <div>
                    {/* Day Header */}
                    <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-black/10 dark:border-gray-800">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black font-funky text-gray-900 dark:text-white uppercase">
                          {day.dayName}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-bold">
                          {day.dayNumber}
                        </span>
                        {day.isToday && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-[#D4FF00] text-black border border-black shadow-neo-sm">
                            TODAY
                          </span>
                        )}
                      </div>

                      <span className="text-xs font-black text-lime-600 dark:text-[#D4FF00]">
                        {totalCalories > 0 ? `${totalCalories} kcal` : 'Empty'}
                      </span>
                    </div>

                    {/* Scheduled Meals List */}
                    <div className="space-y-2">
                      {dayMeals.length > 0 ? (
                        dayMeals.map((meal) => {
                          const slotDef = MEAL_SLOTS.find((s) => s.type === meal.mealType) || MEAL_SLOTS[0];
                          const SlotIcon = slotDef.icon;

                          return (
                            <div
                              key={meal.id}
                              onClick={() => onSelectMeal(meal)}
                              className={`p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#1E202A] hover:bg-white dark:hover:bg-[#252834] border-2 border-black/50 dark:border-gray-700 cursor-pointer flex items-center justify-between gap-2 transition-colors group shadow-neo-sm border-l-[5px] ${slotDef.stripeColor}`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <SlotIcon className={`w-3.5 h-3.5 flex-shrink-0 ${slotDef.accentColor}`} />
                                <span className="font-bold text-xs text-gray-900 dark:text-white truncate group-hover:underline">
                                  {meal.title}
                                </span>
                              </div>
                              <span className="text-[10px] font-black text-gray-600 dark:text-gray-400 flex-shrink-0">
                                {meal.calories} kcal
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-6 text-center text-xs text-gray-400 dark:text-gray-600 font-bold">
                          No meals scheduled
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Day Footer Actions */}
                  <div className="mt-4 pt-3 border-t-2 border-black/10 dark:border-gray-800 flex items-center gap-2">
                    <button
                      onClick={() => onFocusDay && onFocusDay(day.dateString)}
                      className="flex-1 py-1.5 px-3 bg-[#FAF8F5] dark:bg-[#20222E] hover:bg-black hover:text-white dark:hover:bg-[#D4FF00] dark:hover:text-black text-gray-900 dark:text-white font-black text-xs rounded-xl border-2 border-black dark:border-gray-700 shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-1 transition-all"
                    >
                      <CalendarDays className="w-3.5 h-3.5" />
                      <span>Open Day</span>
                    </button>

                    <button
                      onClick={() => onQuickAddMeal(day.dateString, 'lunch')}
                      className="py-1.5 px-2.5 bg-[#D4FF00] hover:bg-[#c3ed00] text-black font-black text-xs rounded-xl border-2 border-black shadow-neo-sm flex items-center justify-center"
                      title="Add meal to this day"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
