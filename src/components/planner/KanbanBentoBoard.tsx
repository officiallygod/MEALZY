'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Clock,
  Trash2,
  ChevronRight,
  Sun,
  Utensils,
  Moon,
  Coffee,
  CalendarDays,
  ArrowLeftRight,
} from 'lucide-react';
import { MealItem, MealType } from '@/types/meal';
import { getMealAccent, getMealInitials, cleanMealTitle } from '@/lib/curated-foods';

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
  onAteOut?: (meal?: MealItem, dateString?: string, mealType?: MealType) => void;
  onFocusDay?: (dateString: string) => void;
}

const MEAL_SLOTS: {
  type: MealType;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  stripeColor: string;
  bgLight: string;
  bgDark: string;
  borderColor: string;
  headerPillBg: string;
  headerPillText: string;
}[] = [
  {
    type: 'breakfast',
    title: 'Breakfast',
    icon: Sun,
    accentColor: 'text-amber-700 dark:text-amber-300',
    stripeColor: 'border-l-[#FFE600]',
    bgLight: 'bg-[#FFFDF0]',
    bgDark: 'dark:bg-[#1A1813]',
    borderColor: 'border-amber-400/80 dark:border-amber-500/30',
    headerPillBg: 'bg-[#FFE600]',
    headerPillText: 'text-black',
  },
  {
    type: 'lunch',
    title: 'Lunch',
    icon: Utensils,
    accentColor: 'text-cyan-800 dark:text-cyan-300',
    stripeColor: 'border-l-[#00E5FF]',
    bgLight: 'bg-[#F0FAFD]',
    bgDark: 'dark:bg-[#10181E]',
    borderColor: 'border-cyan-400/80 dark:border-cyan-500/30',
    headerPillBg: 'bg-[#00E5FF]',
    headerPillText: 'text-black',
  },
  {
    type: 'dinner',
    title: 'Dinner',
    icon: Moon,
    accentColor: 'text-orange-800 dark:text-orange-300',
    stripeColor: 'border-l-[#FF5500]',
    bgLight: 'bg-[#FFF6F2]',
    bgDark: 'dark:bg-[#1C1311]',
    borderColor: 'border-orange-400/80 dark:border-orange-500/30',
    headerPillBg: 'bg-[#FF5500]',
    headerPillText: 'text-white',
  },
  {
    type: 'snack',
    title: 'Snacks',
    icon: Coffee,
    accentColor: 'text-lime-800 dark:text-lime-300',
    stripeColor: 'border-l-[#D4FF00]',
    bgLight: 'bg-[#F6FCF0]',
    bgDark: 'dark:bg-[#131911]',
    borderColor: 'border-lime-400/80 dark:border-lime-500/30',
    headerPillBg: 'bg-[#D4FF00]',
    headerPillText: 'text-black',
  },
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
  onAteOut,
  onFocusDay,
}: KanbanBentoBoardProps) {
  const [draggedMealId, setDraggedMealId] = useState<string | null>(null);
  const [activeDropZone, setActiveDropZone] = useState<string | null>(null);
  const [movingMealId, setMovingMealId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, mealId: string) => {
    e.dataTransfer.setData('text/plain', mealId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedMealId(mealId);
  };

  const handleDragEnd = () => {
    setDraggedMealId(null);
    setActiveDropZone(null);
  };

  const handleDragOver = (e: React.DragEvent, zoneKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (activeDropZone !== zoneKey) {
      setActiveDropZone(zoneKey);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.currentTarget && !e.currentTarget.contains(e.relatedTarget as Node)) {
      setActiveDropZone(null);
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
          {/* 4 BENTO COLUMNS WITH DISTINCT SHADES & ACCENTS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            {MEAL_SLOTS.map((slot) => {
              const SlotIcon = slot.icon;
              const rawSlotMeals = meals.filter(
                (m) => m.dateScheduled === activeDayObj.dateString && m.mealType === slot.type
              );

              // Consolidate duplicate dishes in the same slot into a single card with portion count
              // to prevent taking up vertical space with identical repetitive cards
              const slotMeals: MealItem[] = [];
              const seenTitles = new Map<string, MealItem>();

              for (const m of rawSlotMeals) {
                const clean = cleanMealTitle(m.title).toLowerCase();
                if (seenTitles.has(clean)) {
                  const existing = seenTitles.get(clean)!;
                  existing.portions = (existing.portions || 1) + (m.portions || 1);
                  existing.isLeftover = existing.isLeftover || m.isLeftover;
                } else {
                  const copy: MealItem = {
                    ...m,
                    title: cleanMealTitle(m.title),
                    portions: m.portions || 1,
                  };
                  seenTitles.set(clean, copy);
                  slotMeals.push(copy);
                }
              }

              const zoneKey = `${activeDayObj.dateString}_${slot.type}`;
              const isHovered = activeDropZone === zoneKey;

              return (
                <div
                  key={slot.type}
                  onDragOver={(e) => handleDragOver(e, zoneKey)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, activeDayObj.dateString, slot.type)}
                  className={`min-h-[300px] rounded-3xl p-4 transition-colors flex flex-col justify-between border-2 relative shadow-neo-lg ${slot.bgLight} ${slot.bgDark} ${slot.borderColor} ${
                    isHovered
                      ? 'ring-4 ring-[#D4FF00]/40 scale-[1.01]'
                      : ''
                  }`}
                >
                  <div>
                    {/* Slot Header with Distinct Pill */}
                    <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-black/10 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-xl ${slot.headerPillBg} border-2 border-black flex items-center justify-center shadow-neo-sm`}>
                          <SlotIcon className={`w-4 h-4 ${slot.headerPillText}`} />
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

                    {/* Non-shifting Drop Target Indicator */}
                    {isHovered && draggedMealId && (
                      <div className="pointer-events-none mb-3 py-2 text-center text-xs font-black text-black dark:text-[#D4FF00] border-2 border-dashed border-[#D4FF00] rounded-xl bg-[#D4FF00]/15">
                        ✦ Drop in {slot.title}
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
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              draggable
                              onDragStart={(e: any) => handleDragStart(e, meal.id)}
                              onDragEnd={handleDragEnd}
                              className={`group relative bg-white dark:bg-[#1E202B] hover:bg-white dark:hover:bg-[#252836] border-2 border-black dark:border-gray-700 rounded-2xl p-3.5 shadow-neo-sm hover:shadow-neo cursor-grab active:cursor-grabbing border-l-[6px] ${slot.stripeColor} transition-all ${
                                draggedMealId === meal.id ? 'opacity-30 border-dashed scale-[0.98]' : 'opacity-100'
                              }`}
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
                                        {cleanMealTitle(meal.title)}
                                      </h4>
                                      {meal.isLeftover && (
                                        <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-purple-100 text-purple-800 border border-purple-400">
                                          LEFTOVER
                                        </span>
                                      )}
                                      {meal.portions && meal.portions > 1 && (
                                        <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-amber-100 text-amber-900 border border-amber-400">
                                          {meal.portions}x PORTIONS
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
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {!meal.isLeftover && (
                                    <button
                                      onClick={() => onCookMeal(meal)}
                                      className="px-2 py-1 rounded-lg bg-[#D4FF00] hover:bg-[#c3ed00] text-black font-black border border-black shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 transition-all"
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
                                  <button
                                    onClick={() => setMovingMealId(movingMealId === meal.id ? null : meal.id)}
                                    className="px-2 py-1 rounded-lg bg-white dark:bg-[#20222E] hover:bg-[#00E5FF] hover:text-black dark:hover:bg-[#00E5FF] dark:hover:text-black text-gray-700 dark:text-gray-300 font-black border border-black shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1"
                                    title="Move to another meal slot"
                                  >
                                    <ArrowLeftRight className="w-2.5 h-2.5 stroke-[2.5]" />
                                    <span>Move</span>
                                  </button>
                                  {onAteOut && (
                                    <button
                                      onClick={() => onAteOut(meal, activeDayObj.dateString, slot.type)}
                                      className="px-2 py-1 rounded-lg bg-[#00E5FF] hover:bg-[#00cbe2] text-black font-black border border-black shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 transition-all"
                                      title="Ate out or had something else? Log meal and save leftovers."
                                    >
                                      Ate Out?
                                    </button>
                                  )}
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

                              {/* 1-Tap Quick Move Selector (Zero Jitter alternative) */}
                              {movingMealId === meal.id && (
                                <div className="mt-2 p-2 rounded-xl bg-white dark:bg-[#16171E] border-2 border-black dark:border-gray-700 shadow-neo-sm space-y-1.5">
                                  <div className="flex items-center justify-between text-[9px] font-black uppercase text-gray-500">
                                    <span>Move to Slot:</span>
                                    <button
                                      onClick={() => setMovingMealId(null)}
                                      className="text-gray-400 hover:text-black dark:hover:text-white font-bold px-1"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-3 gap-1">
                                    {MEAL_SLOTS.filter((s) => s.type !== meal.mealType).map((targetSlot) => (
                                      <button
                                        key={targetSlot.type}
                                        onClick={() => {
                                          onMoveMealSlot(meal.id, activeDayObj.dateString, targetSlot.type);
                                          setMovingMealId(null);
                                        }}
                                        className="py-1 text-center font-black text-[10px] uppercase rounded-lg border border-black bg-[#FAF8F5] dark:bg-[#20222E] hover:bg-[#FFE600] hover:text-black transition-all shadow-neo-sm"
                                      >
                                        {targetSlot.title}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>

                      {/* Empty Slot Call-To-Action (Dashed Neo-Brutalist Box) */}
                      {slotMeals.length === 0 && !isHovered && (
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={() => onQuickAddMeal(activeDayObj.dateString, slot.type)}
                            className="w-full py-5 text-center text-xs font-black text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white rounded-2xl border-2 border-dashed border-black/20 dark:border-white/20 hover:border-black dark:hover:border-white transition-all flex flex-col items-center justify-center gap-1.5 bg-white/60 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40"
                          >
                            <Plus className="w-4 h-4 stroke-[2.5]" />
                            <span>Plan {slot.title}</span>
                          </button>

                          {onAteOut && (
                            <button
                              type="button"
                              onClick={() => onAteOut(undefined, activeDayObj.dateString, slot.type)}
                              className="w-full py-2 px-3 text-center text-[10px] font-black text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-black rounded-xl border border-black/30 dark:border-gray-700 hover:border-black bg-white dark:bg-[#1E202B] hover:bg-[#00E5FF] dark:hover:bg-[#00E5FF] transition-all flex items-center justify-center gap-1.5 shadow-neo-sm"
                              title="Ate out or had something else for this slot?"
                            >
                              <Utensils className="w-3 h-3" />
                              <span>Ate Out / Other?</span>
                            </button>
                          )}
                        </div>
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
                  {(() => {
                    const scheduledSlots = new Set(dayMeals.map((m) => m.mealType));
                    const nextAvailableSlot: MealType =
                      (['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).find(
                        (s) => !scheduledSlots.has(s)
                      ) || 'dinner';

                    return (
                      <div className="mt-4 pt-3 border-t-2 border-black/10 dark:border-gray-800 flex items-center gap-2">
                        <button
                          onClick={() => onFocusDay && onFocusDay(day.dateString)}
                          className="flex-1 py-1.5 px-3 bg-[#FAF8F5] dark:bg-[#20222E] hover:bg-black hover:text-white dark:hover:bg-[#D4FF00] dark:hover:text-black text-gray-900 dark:text-white font-black text-xs rounded-xl border-2 border-black dark:border-gray-700 shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-1 transition-all"
                        >
                          <CalendarDays className="w-3.5 h-3.5" />
                          <span>Open Day</span>
                        </button>

                        <button
                          onClick={() => onQuickAddMeal(day.dateString, nextAvailableSlot)}
                          className="py-1.5 px-2.5 bg-[#D4FF00] hover:bg-[#c3ed00] text-black font-black text-xs rounded-xl border-2 border-black shadow-neo-sm flex items-center justify-center"
                          title={`Add meal to this day (${nextAvailableSlot})`}
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
