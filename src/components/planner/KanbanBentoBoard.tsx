'use client';

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
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
  ArrowRight,
  Copy,
} from 'lucide-react';
import { MealItem, MealType } from '@/types/meal';
import { getMealAccent, getMealInitials, cleanMealTitle } from '@/lib/curated-foods';
import { scheduleBackgroundDriveSync } from '@/lib/sync/google-drive';
import { db } from '@/lib/db';

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
  onDuplicateMeal?: (meal: MealItem) => void;
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

// Interactive Quick Actions Nav Menu on Hovering Plus Icon in front of food item
function MealActionNavMenu({
  meal,
  dayDateString,
  slotType,
  onMoveClick,
  onDeleteClick,
  onAddClick,
  onDuplicateClick,
}: {
  meal: MealItem;
  dayDateString: string;
  slotType: MealType;
  onMoveClick: (meal: MealItem) => void;
  onDeleteClick: (mealId: string) => void;
  onAddClick: (dateString: string, slotType: MealType) => void;
  onDuplicateClick: (meal: MealItem) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = () => {
      setIsOpen(false);
    };
    window.addEventListener('click', handleOutside);
    window.addEventListener('touchstart', handleOutside);
    return () => {
      window.removeEventListener('click', handleOutside);
      window.removeEventListener('touchstart', handleOutside);
    };
  }, [isOpen]);

  return (
    <div
      className="relative inline-flex items-center flex-shrink-0 z-30"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className={`w-5 h-5 rounded-md border border-black flex items-center justify-center transition-all shadow-neo-sm cursor-pointer ${
          isOpen
            ? 'bg-black text-white dark:bg-[#D4FF00] dark:text-black scale-105'
            : 'bg-[#FFE600] text-black hover:scale-110'
        }`}
        title="Actions: Move, Delete, Add, Duplicate"
        aria-label="Actions: Move, Delete, Add, Duplicate"
      >
        <Plus className={`w-3 h-3 stroke-[3] transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 4 }}
            transition={{ type: 'spring', damping: 22, stiffness: 350 }}
            className="absolute left-0 sm:left-full top-full sm:top-1/2 mt-1 sm:mt-0 sm:ml-1.5 sm:-translate-y-1/2 flex items-center gap-1 bg-white dark:bg-[#16171E] border-2 border-black dark:border-gray-700 rounded-xl p-1 shadow-neo z-50 whitespace-nowrap"
          >
            {/* Move */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                onMoveClick(meal);
              }}
              className="flex items-center gap-1 px-1.5 py-1 rounded-lg bg-[#FAF8F5] dark:bg-[#20222E] hover:bg-[#FFE600] hover:text-black dark:hover:bg-[#FFE600] dark:hover:text-black text-gray-800 dark:text-gray-200 border border-black text-[9px] font-black uppercase transition-all shadow-neo-sm active:scale-95 cursor-pointer"
              title="Move to another slot or day"
            >
              <ArrowLeftRight className="w-2.5 h-2.5 stroke-[2.5]" />
              <span>Move</span>
            </button>

            {/* Delete */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                onDeleteClick(meal.id);
              }}
              className="flex items-center gap-1 px-1.5 py-1 rounded-lg bg-[#FAF8F5] dark:bg-[#20222E] hover:bg-rose-500 hover:text-white border border-black text-[9px] font-black uppercase transition-all shadow-neo-sm active:scale-95 text-rose-600 hover:text-white cursor-pointer"
              title="Remove meal"
            >
              <Trash2 className="w-2.5 h-2.5" />
              <span>Delete</span>
            </button>

            {/* Add */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                onAddClick(dayDateString, slotType);
              }}
              className="flex items-center gap-1 px-1.5 py-1 rounded-lg bg-[#00E5FF] hover:bg-[#00cbe2] text-black border border-black text-[9px] font-black uppercase transition-all shadow-neo-sm active:scale-95 cursor-pointer"
              title="Add dish to this slot"
            >
              <Plus className="w-2.5 h-2.5 stroke-[3]" />
              <span>Add</span>
            </button>

            {/* Duplicate */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                onDuplicateClick(meal);
              }}
              className="flex items-center gap-1 px-1.5 py-1 rounded-lg bg-[#D4FF00] hover:bg-[#c3ed00] text-black border border-black text-[9px] font-black uppercase transition-all shadow-neo-sm active:scale-95 cursor-pointer"
              title="Duplicate dish right next to original"
            >
              <Copy className="w-2.5 h-2.5" />
              <span>Duplicate</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function KanbanBentoBoard({
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
  onDuplicateMeal,
  onAteOut,
  onAteOutSlot,
  onFocusDay,
  onTriggerToast,
}: KanbanBentoBoardProps) {
  const handleDuplicateInternal = (meal: MealItem) => {
    if (onDuplicateMeal) {
      onDuplicateMeal(meal);
    } else {
      const id = `meal-dup-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      db.meals.add({
        ...meal,
        id,
      });
      scheduleBackgroundDriveSync(1000);
    }
  };

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

  // Slot-level minimization for any meal in day bento
  const [minimizedSlots, setMinimizedSlots] = useState<Record<MealType, boolean>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('mealzy_minimized_slots');
        if (saved) return JSON.parse(saved);
      } catch (_) {}
    }
    return { breakfast: false, lunch: false, dinner: false, snack: false };
  });

  const toggleSlotMinimized = useCallback((type: MealType) => {
    setMinimizedSlots((prev) => {
      const next = { ...prev, [type]: !prev[type] };
      try {
        localStorage.setItem('mealzy_minimized_slots', JSON.stringify(next));
      } catch (_) {}
      return next;
    });
  }, []);

  // Card-level minimization for any individual meal
  const [minimizedMealIds, setMinimizedMealIds] = useState<Set<string>>(new Set());

  const toggleMealMinimized = (mealId: string) => {
    setMinimizedMealIds((prev) => {
      const next = new Set(prev);
      if (next.has(mealId)) {
        next.delete(mealId);
      } else {
        next.add(mealId);
      }
      return next;
    });
  };

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

    // Keep every duplicate dish separate so duplicates appear right next to the original dish
    const slotMeals: MealItem[] = rawSlotMeals;

    const zoneKey = `${activeDayObj.dateString}_${slot.type}`;
    const isHovered = activeDropZone === zoneKey;
    const isSlotMinimized = minimizedSlots[slot.type];

    return (
      <div
        key={slot.type}
        onDragOver={(e) => handleDragOver(e, zoneKey)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, activeDayObj.dateString, slot.type)}
        className={`rounded-3xl p-4 transition-all flex flex-col justify-between border-2 relative shadow-neo-lg ${slot.bgLight} ${slot.bgDark} ${slot.borderColor} ${
          isSlotMinimized ? 'min-h-0' : 'min-h-[300px]'
        } ${isHovered ? 'ring-4 ring-[#D4FF00]/40 scale-[1.01]' : ''}`}
      >
        <div>
          {/* Slot Header with Distinct Pill & Actions */}
          <div className={`flex items-center justify-between ${isSlotMinimized ? 'pb-0 mb-0' : 'pb-3 mb-3 border-b-2 border-black/10 dark:border-white/10'}`}>
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-8 h-8 rounded-xl ${slot.headerPillBg} border-2 border-black flex items-center justify-center shadow-neo-sm flex-shrink-0`}>
                <SlotIcon className={`w-4 h-4 ${slot.headerPillText}`} />
              </div>
              <div className="flex items-center gap-2 min-w-0 truncate">
                <span className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white">
                  {slot.title}
                </span>
                {isSlotMinimized && (
                  <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 truncate">
                    {slotMeals.length > 0 ? `(${slotMeals.length} • ${slotMeals.reduce((s, m) => s + (m.calories || 0), 0)} kcal)` : '(Empty)'}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => onQuickAddMeal(activeDayObj.dateString, slot.type)}
                className="w-7 h-7 rounded-xl bg-[#FAF8F5] dark:bg-[#20222E] hover:bg-[#FFE600] hover:text-black dark:hover:bg-[#D4FF00] dark:hover:text-black text-gray-700 dark:text-gray-300 border-2 border-black dark:border-gray-700 flex items-center justify-center shadow-neo-sm active:scale-95 transition-colors text-xs cursor-pointer"
                title={`Add to ${slot.title}`}
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>

              <button
                type="button"
                onClick={() => toggleSlotMinimized(slot.type)}
                className="w-7 h-7 rounded-xl bg-white dark:bg-[#20222E] hover:bg-[#FFE600] hover:text-black dark:hover:bg-[#D4FF00] dark:hover:text-black text-gray-800 dark:text-gray-200 border-2 border-black dark:border-gray-700 flex items-center justify-center shadow-neo-sm active:scale-95 transition-all text-xs cursor-pointer"
                title={isSlotMinimized ? `Maximize ${slot.title}` : `Minimize ${slot.title}`}
              >
                {isSlotMinimized ? (
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                ) : (
                  <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                )}
              </button>
            </div>
          </div>

          {!isSlotMinimized && (
            <div>
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
                    const isMealMinimized = minimizedMealIds.has(meal.id);

                    if (isMealMinimized) {
                      return (
                        <motion.div
                          key={meal.id}
                          layout
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className={`p-2.5 rounded-2xl bg-white dark:bg-[#1E202B] border-2 border-black dark:border-gray-700 shadow-neo-sm border-l-[6px] ${slot.stripeColor} flex items-center justify-between gap-2`}
                        >
                          <div
                            onClick={() => onSelectMeal(meal)}
                            className="flex items-center gap-2 min-w-0 cursor-pointer flex-1"
                            title="Click to view details"
                          >
                            <MealActionNavMenu
                              meal={meal}
                              dayDateString={activeDayObj.dateString}
                              slotType={slot.type}
                              onMoveClick={(m) => {
                                setMovingMealId(m.id);
                                setMoveTargetDate(m.dateScheduled || activeDayObj.dateString);
                                setShowMoveDayPicker(false);
                              }}
                              onDeleteClick={onDeleteMeal}
                              onAddClick={onQuickAddMeal}
                              onDuplicateClick={handleDuplicateInternal}
                            />
                            <div
                              className="w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px] text-white flex-shrink-0 border border-black shadow-neo-sm"
                              style={{ backgroundColor: accent }}
                            >
                              {initials}
                            </div>
                            <span className="font-funky font-black text-xs text-gray-900 dark:text-white truncate">
                              {cleanMealTitle(meal.title)}
                            </span>
                            {meal.calories && meal.calories > 0 ? (
                              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 flex-shrink-0">
                                {meal.calories} kcal
                              </span>
                            ) : null}
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            {!meal.isLeftover && (
                              <button
                                onClick={() => onCookMeal(meal)}
                                className="px-1.5 py-0.5 rounded-md bg-[#D4FF00] hover:bg-[#c3ed00] text-black font-black text-[9px] border border-black shadow-neo-sm active:scale-95 transition-colors cursor-pointer"
                              >
                                Cook
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleMealMinimized(meal.id);
                              }}
                              className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-[#FFE600] hover:text-black dark:hover:bg-[#D4FF00] dark:hover:text-black border border-black flex items-center justify-center transition-colors cursor-pointer"
                              title="Maximize meal"
                            >
                              <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteMeal(meal.id);
                              }}
                              className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-rose-500 hover:text-white border border-black flex items-center justify-center transition-colors cursor-pointer text-gray-400 hover:text-white"
                              title="Remove from plan"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    }

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
                                  <div className="flex items-start gap-2.5">
                                    <div className="pt-0.5">
                                      <MealActionNavMenu
                                        meal={meal}
                                        dayDateString={activeDayObj.dateString}
                                        slotType={slot.type}
                                        onMoveClick={(m) => {
                                          setMovingMealId(m.id);
                                          setMoveTargetDate(m.dateScheduled || activeDayObj.dateString);
                                          setShowMoveDayPicker(false);
                                        }}
                                        onDeleteClick={onDeleteMeal}
                                        onAddClick={onQuickAddMeal}
                                        onDuplicateClick={handleDuplicateInternal}
                                      />
                                    </div>

                                    {/* Initials Badge */}
                                    <div
                                      className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white flex-shrink-0 border-2 border-black shadow-neo-sm"
                                      style={{ backgroundColor: accent }}
                                    >
                                      {initials}
                                    </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <h4 className="font-funky font-black text-xs text-gray-950 dark:text-white truncate group-hover:underline">
                                        {cleanMealTitle(meal.title)}
                                      </h4>
                                      {meal.isLeftover && (
                                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-purple-200 dark:bg-purple-900/60 text-purple-950 dark:text-purple-200 border border-purple-600/50 shadow-neo-sm">
                                          LEFTOVER
                                        </span>
                                      )}
                                      {meal.portions && meal.portions > 1 && (
                                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-amber-200 dark:bg-amber-900/60 text-amber-950 dark:text-amber-200 border border-amber-600/50 shadow-neo-sm">
                                          {meal.portions}x PORTIONS
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-700 dark:text-gray-300 font-bold flex-wrap">
                                      {meal.calories && meal.calories > 0 ? (
                                        <span className="text-gray-950 dark:text-[#D4FF00] font-black">
                                          {meal.calories} kcal
                                        </span>
                                      ) : (
                                        <span className="px-1.5 py-0.5 rounded-md bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-[9px] font-black border border-black/20">
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
                                  <button
                                    type="button"
                                    onClick={() => handleDuplicateInternal(meal)}
                                    className="px-2 py-1 rounded-lg bg-[#D4FF00] hover:bg-[#c3ed00] text-black font-black border border-black shadow-neo-sm active:scale-95 transition-colors flex items-center gap-1 cursor-pointer"
                                    title="Duplicate meal right next to original"
                                  >
                                    <Copy className="w-2.5 h-2.5" />
                                    <span>Copy</span>
                                  </button>
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleMealMinimized(meal.id);
                                    }}
                                    className="p-1 text-gray-500 hover:text-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 rounded-md transition-colors cursor-pointer"
                                    title="Minimize meal"
                                  >
                                    <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                                  </button>
                                  <button
                                    onClick={() => onSelectMeal(meal)}
                                    className="p-1 text-gray-400 hover:text-black dark:hover:text-white cursor-pointer"
                                    title="View full details"
                                  >
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => onDeleteMeal(meal.id)}
                                    className="p-1 text-gray-400 hover:text-red-500 cursor-pointer"
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
                        <button
                          type="button"
                          onClick={() => onQuickAddMeal(activeDayObj.dateString, slot.type)}
                          className="w-full py-5 text-center text-xs font-black text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white rounded-2xl border-2 border-dashed border-black/20 dark:border-white/20 hover:border-black dark:hover:border-white transition-colors flex flex-col items-center justify-center gap-1.5 bg-white/60 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40"
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                          <span>Plan {slot.title}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
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
                    Tip: Customize Your Snacks Column
                  </h4>
                  <p className="text-[11px] text-gray-600 dark:text-gray-300 font-medium">
                    You can collapse snacks into a slim side tab next to Dinner to give Breakfast, Lunch, and Dinner extra space!
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleSetSnacksPreference(true)}
                  className="px-3 py-1.5 bg-[#D4FF00] hover:bg-[#c2eb00] text-black font-black text-xs rounded-xl border-2 border-black shadow-neo-sm active:scale-95 transition-colors"
                >
                  Collapse Snacks Tab
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
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 min-w-0 items-start">
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
                  <div className="flex flex-col items-center justify-center gap-1.5 font-black text-xs uppercase tracking-widest text-lime-950 dark:text-lime-300 group-hover:text-black dark:group-hover:text-[#D4FF00] transition-colors select-none">
                    <span>S</span>
                    <span>N</span>
                    <span>A</span>
                    <span>C</span>
                    <span>K</span>
                    <span>S</span>
                  </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full items-start">
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
                        // Do not deduplicate/consolidate - show each duplicated dish right next to the original
                        const slotMeals: MealItem[] = rawSlotMeals;
                        const slotCalories = slotMeals.reduce((acc, m) => acc + (m.calories || 0), 0);
                        const hasMeals = slotMeals.length > 0;
                        const zoneKey = `${day.dateString}_${slot.type}`;
                        const isHovered = activeDropZone === zoneKey;

                        if (hasMeals) {
                          return (
                            <div
                              key={slot.type}
                              onDragOver={(e) => handleDragOver(e, zoneKey)}
                              onDragLeave={handleDragLeave}
                              onDrop={(e) => handleDrop(e, day.dateString, slot.type)}
                              className={`rounded-2xl p-2.5 border border-black/20 dark:border-gray-800 ${slot.bgLight} ${slot.bgDark} space-y-1.5 transition-all ${
                                isHovered ? 'ring-2 ring-[#D4FF00] bg-[#D4FF00]/15 scale-[1.01]' : ''
                              }`}
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

                              {/* Slot Meals (Draggable with Action Nav Menu in front of food item) */}
                              <div className="space-y-1">
                                {slotMeals.map((meal) => (
                                  <div key={meal.id} className="space-y-1">
                                    <div
                                      draggable
                                      onDragStart={(e) => handleDragStart(e, meal.id)}
                                      onDragEnd={handleDragEnd}
                                      className={`p-2 rounded-xl bg-white dark:bg-[#1E202B] hover:bg-white dark:hover:bg-[#252836] border-2 border-black/60 dark:border-gray-700 flex items-center justify-between gap-2 transition-all group shadow-neo-sm border-l-[4px] ${slot.stripeColor} cursor-grab active:cursor-grabbing relative ${
                                        draggedMealId === meal.id ? 'opacity-30 border-dashed scale-[0.98]' : 'opacity-100'
                                      }`}
                                    >
                                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                        {/* Plus icon in front of the food item with animated hover nav menu */}
                                        <MealActionNavMenu
                                          meal={meal}
                                          dayDateString={day.dateString}
                                          slotType={slot.type}
                                          onMoveClick={(m) => {
                                            setMovingMealId(m.id);
                                            setMoveTargetDate(m.dateScheduled || day.dateString);
                                            setShowMoveDayPicker(false);
                                          }}
                                          onDeleteClick={onDeleteMeal}
                                          onAddClick={onQuickAddMeal}
                                          onDuplicateClick={handleDuplicateInternal}
                                        />

                                        <div
                                          onClick={() => onSelectMeal(meal)}
                                          className="flex items-center gap-1.5 min-w-0 flex-1 cursor-pointer"
                                        >
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
                                      </div>

                                      {meal.calories && meal.calories > 0 ? (
                                        <span
                                          onClick={() => onSelectMeal(meal)}
                                          className="text-[10px] font-black text-gray-600 dark:text-gray-400 flex-shrink-0 cursor-pointer"
                                        >
                                          {meal.calories} kcal
                                        </span>
                                      ) : (
                                        <span
                                          onClick={() => onSelectMeal(meal)}
                                          className="px-1 py-0.2 rounded text-[8px] font-black bg-gray-100 dark:bg-gray-800 text-gray-500 border border-black/20 flex-shrink-0 cursor-pointer"
                                        >
                                          No Cals
                                        </span>
                                      )}
                                    </div>

                                    {/* 1-Tap Quick Move Selector in 7-Day View */}
                                    {movingMealId === meal.id && (
                                      <div className="p-2 rounded-xl bg-white dark:bg-[#16171E] border-2 border-black dark:border-gray-700 shadow-neo-sm space-y-1.5 text-[10px]">
                                        <div className="flex items-center justify-between font-black uppercase text-gray-500">
                                          <div className="flex items-center gap-1">
                                            <span>Target:</span>
                                            <button
                                              type="button"
                                              onClick={() => setShowMoveDayPicker(!showMoveDayPicker)}
                                              className="px-1.5 py-0.5 rounded border border-black bg-[#FFE600] text-black font-black text-[9px] shadow-neo-sm flex items-center gap-0.5"
                                            >
                                              <span>{getTargetDayLabel(moveTargetDate || day.dateString)}</span>
                                              <ChevronDown className="w-2.5 h-2.5" />
                                            </button>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => setMovingMealId(null)}
                                            className="text-gray-400 hover:text-black dark:hover:text-white"
                                          >
                                            ✕
                                          </button>
                                        </div>

                                        {showMoveDayPicker && (
                                          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                                            {days.map((d, idx) => (
                                              <button
                                                key={d.dateString}
                                                type="button"
                                                onClick={() => {
                                                  setMoveTargetDate(d.dateString);
                                                  setShowMoveDayPicker(false);
                                                }}
                                                className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase border ${
                                                  d.dateString === (moveTargetDate || day.dateString)
                                                    ? 'bg-black text-white dark:bg-[#D4FF00] dark:text-black'
                                                    : 'bg-white dark:bg-[#1E202B] text-gray-700 dark:text-gray-300'
                                                }`}
                                              >
                                                {idx === 0 ? 'Today' : idx === 1 ? 'Tmrw' : d.dayName.slice(0, 3)}
                                              </button>
                                            ))}
                                          </div>
                                        )}

                                        <div className="grid grid-cols-4 gap-1 pt-1">
                                          {MEAL_SLOTS.map((targetSlot) => (
                                            <button
                                              key={targetSlot.type}
                                              type="button"
                                              onClick={() => {
                                                onMoveMealSlot(meal.id, moveTargetDate || day.dateString, targetSlot.type);
                                                setMovingMealId(null);
                                              }}
                                              className="py-1 px-1 rounded-lg border border-black bg-[#FAF8F5] dark:bg-[#20222E] hover:bg-[#00E5FF] hover:text-black font-black text-[8px] uppercase flex items-center justify-center shadow-neo-sm"
                                            >
                                              {targetSlot.title.slice(0, 4)}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }

                        // Compact empty slot row with Drop zone
                        return (
                          <button
                            key={slot.type}
                            onDragOver={(e) => handleDragOver(e, zoneKey)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, day.dateString, slot.type)}
                            onClick={() => onQuickAddMeal(day.dateString, slot.type)}
                            className={`w-full py-1.5 px-2.5 rounded-xl border border-dashed border-black/20 dark:border-gray-800 hover:border-black dark:hover:border-gray-500 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-[10px] font-bold text-gray-400 hover:text-black dark:hover:text-white flex items-center justify-between transition-all group ${
                              isHovered ? 'border-[#D4FF00] bg-[#D4FF00]/15 ring-2 ring-[#D4FF00]' : ''
                            }`}
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

export default memo(KanbanBentoBoard);
