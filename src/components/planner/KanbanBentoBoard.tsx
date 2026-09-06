'use client';

import React, { useState, useEffect } from 'react';
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
  ChevronDown,
} from 'lucide-react';
import { MealItem, MealType } from '@/types/meal';
import { getMealAccent, getMealInitials, cleanMealTitle } from '@/lib/curated-foods';
import { scheduleBackgroundDriveSync } from '@/lib/sync/google-drive';

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
  onAteOutSlot?: (dateString: string, mealType: MealType, meals: MealItem[]) => void;
  onFocusDay?: (dateString: string) => void;
  onTriggerToast?: (action: { id: string; message: string; funSubtext?: string; badge?: string; onUndo?: () => Promise<void> | void }) => void;
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
  onAteOutSlot,
  onFocusDay,
  onTriggerToast,
}: KanbanBentoBoardProps) {
  const [draggedMealId, setDraggedMealId] = useState<string | null>(null);
  const [activeDropZone, setActiveDropZone] = useState<string | null>(null);
  const [movingMealId, setMovingMealId] = useState<string | null>(null);
  const [moveTargetDate, setMoveTargetDate] = useState<string>('');
  const [showMoveDayPicker, setShowMoveDayPicker] = useState<boolean>(false);

  const getTargetDayLabel = (dateStr: string) => {
    if (!dateStr) return 'Today';
    const foundIndex = days.findIndex((d) => d.dateString === dateStr);
    if (foundIndex === 0) return 'Today';
    if (foundIndex === 1) return 'Tomorrow';
    const found = days[foundIndex];
    if (found) return `${found.dayName} ${found.dayNumber}`;
    return dateStr;
  };

  const [isSnacksMinimized, setIsSnacksMinimized] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mealzy_snacks_minimized') === 'true';
    }
    return false;
  });

  const [showSnacksPrompt, setShowSnacksPrompt] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mealzy_snacks_prompted') === null;
    }
    return false;
  });

  // Keep snacks minimization in sync when cloud sync restores preferences from other devices
  useEffect(() => {
    const handleSyncApplied = () => {
      if (typeof window !== 'undefined') {
        setIsSnacksMinimized(localStorage.getItem('mealzy_snacks_minimized') === 'true');
        setShowSnacksPrompt(localStorage.getItem('mealzy_snacks_prompted') === null);
      }
    };
    window.addEventListener('mealzy_cloud_sync_applied', handleSyncApplied);
    return () => {
      window.removeEventListener('mealzy_cloud_sync_applied', handleSyncApplied);
    };
  }, []);

  const handleSetSnacksPreference = (minimized: boolean) => {
    setIsSnacksMinimized(minimized);
    setShowSnacksPrompt(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mealzy_snacks_minimized', String(minimized));
      localStorage.setItem('mealzy_snacks_prompted', 'true');
    }
    scheduleBackgroundDriveSync(1000);
    if (onTriggerToast) {
      onTriggerToast({
        id: `snacks-pref-${Date.now()}`,
        badge: '🍱',
        message: minimized ? 'Snacks Minimized' : 'Snacks Expanded',
        onUndo: () => {
          handleSetSnacksPreference(!minimized);
        },
      });
    }
  };

  const toggleSnacksMinimized = (val: boolean) => {
    setIsSnacksMinimized(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mealzy_snacks_minimized', String(val));
    }
    scheduleBackgroundDriveSync(1000);
    if (onTriggerToast) {
      onTriggerToast({
        id: `snacks-toggle-${Date.now()}`,
        badge: val ? '🍱' : '🍪',
        message: val ? 'Snacks Minimized' : 'Snacks Expanded',
        onUndo: () => {
          toggleSnacksMinimized(!val);
        },
      });
    }
  };

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

  const rawSnacksMeals = meals.filter(
    (m) => m.dateScheduled === activeDayObj.dateString && m.mealType === 'snack'
  );

  const renderSlotColumn = (slot: (typeof MEAL_SLOTS)[number]) => {
    const SlotIcon = slot.icon;
    const rawSlotMeals = meals.filter(
      (m) => m.dateScheduled === activeDayObj.dateString && m.mealType === slot.type
    );

    // Consolidate duplicate dishes in the same slot into a single card with portion count
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
          isHovered ? 'ring-4 ring-[#D4FF00]/40 scale-[1.01]' : ''
        }`}
      >
        <div>
          {/* Slot Header with Distinct Pill & Actions */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-black/10 dark:border-white/10">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-xl ${slot.headerPillBg} border-2 border-black flex items-center justify-center shadow-neo-sm flex-shrink-0`}>
                <SlotIcon className={`w-4 h-4 ${slot.headerPillText}`} />
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white">
                {slot.title}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* If slot is snacks, show minimize button */}
              {slot.type === 'snack' && (
                <button
                  type="button"
                  onClick={() => toggleSnacksMinimized(true)}
                  className="px-2 py-1 rounded-xl bg-white dark:bg-[#20222E] hover:bg-[#FFE600] hover:text-black dark:hover:bg-[#D4FF00] dark:hover:text-black border border-black dark:border-gray-700 shadow-neo-sm text-[10px] font-black transition-colors"
                  title="Minimize Snacks to side tab"
                >
                  Minimize
                </button>
              )}

              {/* Slot-level Ate Out action when meals are scheduled */}
              {slotMeals.length > 0 && onAteOutSlot && (
                <button
                  type="button"
                  onClick={() => onAteOutSlot(activeDayObj.dateString, slot.type, slotMeals)}
                  className="px-2 sm:px-2.5 py-1 rounded-xl bg-[#00E5FF] hover:bg-[#00cbe2] text-black font-black text-[10px] uppercase border border-black shadow-neo-sm active:scale-95 transition-colors flex items-center gap-1 flex-shrink-0"
                  title={`Ate out instead of ${slot.title}? Move or save planned meals.`}
                >
                  <Utensils className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Ate Out?</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onQuickAddMeal(activeDayObj.dateString, slot.type)}
                className="w-7 h-7 rounded-xl bg-[#FAF8F5] dark:bg-[#20222E] hover:bg-[#FFE600] hover:text-black dark:hover:bg-[#D4FF00] dark:hover:text-black text-gray-700 dark:text-gray-300 border-2 border-black dark:border-gray-700 flex items-center justify-center shadow-neo-sm active:scale-95 transition-colors text-xs"
                title={`Add to ${slot.title}`}
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
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

                                    <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-600 dark:text-gray-400 font-bold flex-wrap">
                                      {meal.calories && meal.calories > 0 ? (
                                        <span className="text-gray-900 dark:text-[#D4FF00] font-black">
                                          {meal.calories} kcal
                                        </span>
                                      ) : (
                                        <span className="px-1.5 py-0.5 rounded-md bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-[9px] font-black border border-black/20">
                                          Calories Not Given
                                        </span>
                                      )}
                                      {meal.protein ? (
                                        <>
                                          <span>•</span>
                                          <span>{meal.protein}g P</span>
                                        </>
                                      ) : null}
                                      {meal.prepTimeMinutes ? (
                                        <>
                                          <span>•</span>
                                          <span className="flex items-center gap-0.5">
                                            <Clock className="w-2.5 h-2.5" />
                                            {meal.prepTimeMinutes}m
                                          </span>
                                        </>
                                      ) : null}
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
                                      className="px-2 py-1 rounded-lg bg-[#D4FF00] hover:bg-[#c3ed00] text-black font-black border border-black shadow-neo-sm active:scale-95 transition-colors"
                                    >
                                      Cook
                                    </button>
                                  )}
                                  <button
                                    onClick={() => onMarkGoneEarly(meal.id, meal.title)}
                                    className="px-2 py-1 rounded-lg bg-[#FFE600] text-black font-black border border-black shadow-neo-sm hover:bg-yellow-400 active:scale-95 transition-colors"
                                    title="Finished earlier than expected? Clear and replan."
                                  >
                                    Gone?
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (movingMealId === meal.id) {
                                        setMovingMealId(null);
                                        setShowMoveDayPicker(false);
                                      } else {
                                        setMovingMealId(meal.id);
                                        setMoveTargetDate(meal.dateScheduled || activeDayObj.dateString);
                                        setShowMoveDayPicker(false);
                                      }
                                    }}
                                    className="px-2 py-1 rounded-lg bg-white dark:bg-[#20222E] hover:bg-[#00E5FF] hover:text-black dark:hover:bg-[#00E5FF] dark:hover:text-black text-gray-700 dark:text-gray-300 font-black border border-black shadow-neo-sm active:scale-95 transition-colors flex items-center gap-1"
                                    title="Move to another meal slot or day"
                                  >
                                    <ArrowLeftRight className="w-2.5 h-2.5 stroke-[2.5]" />
                                    <span>Move</span>
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

                              {/* 1-Tap Quick Move Selector with Day & Slot Selection */}
                              {movingMealId === meal.id && (
                                <div className="mt-2 p-2.5 rounded-xl bg-white dark:bg-[#16171E] border-2 border-black dark:border-gray-700 shadow-neo-sm space-y-2">
                                  <div className="flex items-center justify-between text-[10px] font-black uppercase text-gray-500">
                                    <div className="flex items-center gap-1.5">
                                      <span>Day:</span>
                                      <button
                                        type="button"
                                        onClick={() => setShowMoveDayPicker(!showMoveDayPicker)}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-black bg-[#FFE600] text-black font-black text-[10px] shadow-neo-sm hover:bg-yellow-300 active:scale-95 transition-all"
                                        title="Click to change destination day"
                                      >
                                        <span>{getTargetDayLabel(moveTargetDate || activeDayObj.dateString)}</span>
                                        <ChevronDown className={`w-2.5 h-2.5 transition-transform ${showMoveDayPicker ? 'rotate-180' : ''}`} />
                                      </button>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setMovingMealId(null);
                                        setShowMoveDayPicker(false);
                                      }}
                                      className="text-gray-400 hover:text-black dark:hover:text-white font-bold px-1"
                                    >
                                      ✕
                                    </button>
                                  </div>

                                  {/* Day Picker (hidden until user clicks to expand) */}
                                  {showMoveDayPicker && (
                                    <div className="p-1.5 rounded-xl bg-[#FAF8F5] dark:bg-[#1E202B] border border-black/30 dark:border-gray-700 space-y-1">
                                      <div className="text-[9px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Choose Day:
                                      </div>
                                      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                                        {days.map((d, idx) => {
                                          const isSelected = d.dateString === (moveTargetDate || activeDayObj.dateString);
                                          const dayLabel = idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : d.dayName;
                                          return (
                                            <button
                                              key={d.dateString}
                                              type="button"
                                              onClick={() => {
                                                setMoveTargetDate(d.dateString);
                                                setShowMoveDayPicker(false);
                                              }}
                                              className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase whitespace-nowrap border transition-all active:scale-95 flex items-center gap-0.5 ${
                                                isSelected
                                                  ? 'bg-black text-white border-black dark:bg-[#D4FF00] dark:text-black dark:border-black shadow-neo-sm'
                                                  : 'bg-white dark:bg-[#16171E] text-gray-700 dark:text-gray-300 border-black/20 dark:border-gray-700 hover:border-black'
                                              }`}
                                            >
                                              <span>{dayLabel}</span>
                                              <span className="opacity-70 text-[8px]">({d.dayNumber})</span>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {/* Slot buttons */}
                                  {(() => {
                                    const currentTargetDate = moveTargetDate || activeDayObj.dateString;
                                    const availableSlots = MEAL_SLOTS.filter(
                                      (s) => !(currentTargetDate === meal.dateScheduled && s.type === meal.mealType)
                                    );

                                    return (
                                      <div className={`grid gap-1 ${availableSlots.length === 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
                                        {availableSlots.map((targetSlot) => (
                                          <button
                                            key={targetSlot.type}
                                            type="button"
                                            onClick={() => {
                                              onMoveMealSlot(meal.id, currentTargetDate, targetSlot.type);
                                              setMovingMealId(null);
                                              setShowMoveDayPicker(false);
                                            }}
                                            className="py-1 px-1 text-center font-black text-[10px] uppercase rounded-lg border border-black bg-[#FAF8F5] dark:bg-[#20222E] hover:bg-[#FFE600] hover:text-black transition-colors shadow-neo-sm active:scale-95 truncate"
                                          >
                                            {targetSlot.title}
                                          </button>
                                        ))}
                                      </div>
                                    );
                                  })()}
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
                            className="w-full py-5 text-center text-xs font-black text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white rounded-2xl border-2 border-dashed border-black/20 dark:border-white/20 hover:border-black dark:hover:border-white transition-colors flex flex-col items-center justify-center gap-1.5 bg-white/60 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40"
                          >
                            <Plus className="w-4 h-4 stroke-[2.5]" />
                            <span>Plan {slot.title}</span>
                          </button>

                          {onAteOut && (
                            <button
                              type="button"
                              onClick={() => onAteOut(undefined, activeDayObj.dateString, slot.type)}
                              className="w-full py-2 px-3 text-center text-[10px] font-black text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-black rounded-xl border border-black/30 dark:border-gray-700 hover:border-black bg-white dark:bg-[#1E202B] hover:bg-[#00E5FF] dark:hover:bg-[#00E5FF] transition-colors flex items-center justify-center gap-1.5 shadow-neo-sm active:scale-95"
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
  };

  return (
    <div className="w-full">
      {/* ========================================================================= */}
      {/* MODE 1: DAY BENTO GRID (WITH COLLAPSIBLE SNACKS) */}
      {/* ========================================================================= */}
      {!isAllDaysView && (
        <div className="space-y-4">
          {/* First-time Onboarding Prompt for Snacks Column Layout */}
          {showSnacksPrompt && (
            <div className="p-3.5 rounded-2xl bg-[#F6FCF0] dark:bg-[#131911] border-2 border-lime-500 shadow-neo-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#D4FF00] border-2 border-black flex items-center justify-center text-black font-black text-xs shadow-neo-sm flex-shrink-0">
                  <Coffee className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
                    Snacks Layout Preference
                  </h4>
                  <p className="text-[11px] text-gray-600 dark:text-gray-300 font-bold">
                    Want Snacks minimized into a vertical tab next to Dinner to give meals more room? (You can toggle this anytime!)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleSetSnacksPreference(true)}
                  className="px-3 py-1.5 bg-[#D4FF00] hover:bg-[#c3ed00] text-black font-black text-xs rounded-xl border-2 border-black shadow-neo-sm active:scale-95 transition-colors"
                >
                  ✦ Minimize Snacks (Recommended)
                </button>
                <button
                  type="button"
                  onClick={() => handleSetSnacksPreference(false)}
                  className="px-3 py-1.5 bg-white dark:bg-[#20222E] hover:bg-gray-100 text-gray-800 dark:text-white font-black text-xs rounded-xl border-2 border-black dark:border-gray-700 shadow-neo-sm active:scale-95 transition-colors"
                >
                  Keep 4 Columns
                </button>
              </div>
            </div>
          )}

          {/* Render layout based on isSnacksMinimized */}
          {isSnacksMinimized ? (
            <div className="flex flex-col lg:flex-row gap-4 w-full items-stretch">
              {/* 3 Main Bento Columns: Breakfast, Lunch, Dinner */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 min-w-0">
                {MEAL_SLOTS.filter((s) => s.type !== 'snack').map(renderSlotColumn)}
              </div>

              {/* Minimized Snacks Tab next to Dinner */}
              <div
                onClick={() => toggleSnacksMinimized(false)}
                className="w-full lg:w-16 min-h-[64px] lg:min-h-[320px] rounded-3xl p-3 bg-[#F6FCF0] dark:bg-[#131911] border-2 border-lime-400/80 dark:border-lime-500/30 shadow-neo cursor-pointer hover:border-black flex lg:flex-col items-center justify-between transition-colors group select-none relative"
                title="Click to expand Snacks column"
              >
                <div className="w-8 h-8 rounded-xl bg-[#D4FF00] border-2 border-black flex items-center justify-center shadow-neo-sm flex-shrink-0">
                  <Coffee className="w-4 h-4 text-black stroke-[2.5]" />
                </div>

                <div className="hidden lg:flex flex-1 items-center justify-center py-6">
                  <span className="[writing-mode:vertical-rl] rotate-180 text-xs font-black uppercase tracking-widest text-lime-900 dark:text-lime-300 group-hover:text-black dark:group-hover:text-[#D4FF00] transition-colors">
                    SNACKS
                  </span>
                </div>

                <div className="lg:hidden flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-lime-900 dark:text-lime-300">
                    Snacks (Tap to expand)
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {rawSnacksMeals.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#D4FF00] text-black font-black text-[10px] border border-black shadow-neo-sm">
                      {rawSnacksMeals.length}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-lime-700 dark:text-lime-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
              {MEAL_SLOTS.map(renderSlotColumn)}
            </div>
          )}
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
                        {day.isToday ? (
                          <>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-[#D4FF00] text-black border border-black shadow-neo-sm leading-none uppercase">
                              TODAY
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-bold leading-none">
                              {day.dayNumber}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-sm font-black font-funky text-gray-900 dark:text-white uppercase leading-none">
                              {day.dayName}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-bold leading-none">
                              {day.dayNumber}
                            </span>
                          </>
                        )}
                      </div>

                      <span className="text-xs font-black text-lime-600 dark:text-[#D4FF00] leading-none">
                        {totalCalories > 0 ? `${totalCalories} kcal` : 'Empty'}
                      </span>
                    </div>

                    {/* Strictly Segregated Meal Slots (Breakfast -> Lunch -> Dinner -> Snacks) */}
                    <div className="space-y-2.5">
                      {MEAL_SLOTS.map((slot) => {
                        const SlotIcon = slot.icon;
                        const rawSlotMeals = dayMeals.filter((m) => m.mealType === slot.type);

                        // Deduplicate / consolidate duplicate dishes in this slot
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

                        const slotCalories = slotMeals.reduce((acc, m) => acc + (m.calories || 0), 0);
                        const hasMeals = slotMeals.length > 0;

                        if (hasMeals) {
                          return (
                            <div
                              key={slot.type}
                              className={`rounded-2xl p-2.5 border border-black/20 dark:border-gray-800 ${slot.bgLight} ${slot.bgDark} space-y-1.5 transition-colors`}
                            >
                              {/* Slot Sub-header */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border border-black shadow-neo-sm flex items-center gap-1 ${slot.headerPillBg} ${slot.headerPillText}`}
                                  >
                                    <SlotIcon className="w-2.5 h-2.5" />
                                    {slot.title}
                                  </span>
                                  {slotCalories > 0 && (
                                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                                      {slotCalories} kcal
                                    </span>
                                  )}
                                </div>

                                <button
                                  onClick={() => onQuickAddMeal(day.dateString, slot.type)}
                                  className="w-5 h-5 rounded-md bg-black/5 hover:bg-black hover:text-white dark:bg-white/5 dark:hover:bg-white dark:hover:text-black flex items-center justify-center text-gray-600 dark:text-gray-300 transition-colors"
                                  title={`Add another item to ${slot.title}`}
                                >
                                  <Plus className="w-3 h-3 stroke-[2.5]" />
                                </button>
                              </div>

                              {/* Slot Meals */}
                              <div className="space-y-1">
                                {slotMeals.map((meal) => (
                                  <div
                                    key={meal.id}
                                    onClick={() => onSelectMeal(meal)}
                                    className={`p-2 rounded-xl bg-white dark:bg-[#1E202B] hover:bg-white dark:hover:bg-[#252836] border-2 border-black/60 dark:border-gray-700 cursor-pointer flex items-center justify-between gap-2 transition-colors group shadow-neo-sm border-l-[4px] ${slot.stripeColor}`}
                                  >
                                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                      <span className="font-bold text-xs text-gray-900 dark:text-white truncate group-hover:underline">
                                        {cleanMealTitle(meal.title)}
                                      </span>
                                      {meal.isLeftover && (
                                        <span className="px-1 py-0.2 rounded text-[8px] font-black bg-purple-100 text-purple-800 border border-purple-400 flex-shrink-0">
                                          LEFT
                                        </span>
                                      )}
                                      {meal.portions && meal.portions > 1 && (
                                        <span className="px-1 py-0.2 rounded text-[8px] font-black bg-amber-100 text-amber-900 border border-amber-400 flex-shrink-0">
                                          {meal.portions}x
                                        </span>
                                      )}
                                    </div>
                                    {meal.calories && meal.calories > 0 ? (
                                      <span className="text-[10px] font-black text-gray-600 dark:text-gray-400 flex-shrink-0">
                                        {meal.calories} kcal
                                      </span>
                                    ) : (
                                      <span className="px-1 py-0.2 rounded text-[8px] font-black bg-gray-100 dark:bg-gray-800 text-gray-500 border border-black/20 flex-shrink-0">
                                        No Cals
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }

                        // Compact empty slot row
                        return (
                          <button
                            key={slot.type}
                            onClick={() => onQuickAddMeal(day.dateString, slot.type)}
                            className="w-full py-1.5 px-2.5 rounded-xl border border-dashed border-black/20 dark:border-gray-800 hover:border-black dark:hover:border-gray-500 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-[10px] font-bold text-gray-400 hover:text-black dark:hover:text-white flex items-center justify-between transition-colors group"
                            title={`Plan ${slot.title}`}
                          >
                            <span className="flex items-center gap-1.5">
                              <SlotIcon className={`w-3 h-3 opacity-60 group-hover:opacity-100 ${slot.accentColor}`} />
                              <span>+ Plan {slot.title}</span>
                            </span>
                            <Plus className="w-2.5 h-2.5 opacity-40 group-hover:opacity-100 stroke-[2.5]" />
                          </button>
                        );
                      })}
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
                          className="flex-1 py-1.5 px-3 bg-[#FAF8F5] dark:bg-[#20222E] hover:bg-black hover:text-white dark:hover:bg-[#D4FF00] dark:hover:text-black text-gray-900 dark:text-white font-black text-xs rounded-xl border-2 border-black dark:border-gray-700 shadow-neo-sm active:scale-95 flex items-center justify-center gap-1 transition-colors"
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
