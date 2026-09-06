'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Package,
  CalendarDays,
  ArrowRight,
  Flame,
  Plus,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Sun,
  Utensils,
  Moon,
  Coffee,
  Sparkles,
} from 'lucide-react';
import { MealItem, MealType } from '@/types/meal';

export interface AteOutConfirmData {
  dateScheduled: string;
  mealType: MealType;
  title: string;
  calories: number;
  notes?: string;
  hasLeftover: boolean;
  leftoverPortions: number;
  leftoverDestination: 'schedule' | 'fridge';
  leftoverScheduleDate: string;
  leftoverScheduleSlot: MealType;
  originalMealAction?: 'push_tomorrow' | 'save_fridge' | 'replace';
  originalMealPushDate?: string;
  originalMealPushSlot?: MealType;
  originalMeal?: MealItem;
  originalMeals?: MealItem[];
}

interface AteOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetMeal?: MealItem | null;
  targetMeals?: MealItem[];
  targetDate: string;
  targetSlot: MealType;
  rollingDays: {
    dateString: string;
    dayName: string;
    dayNumber: number;
    fullDateFormatted: string;
    isToday: boolean;
  }[];
  allMeals?: MealItem[];
  calorieTarget?: number;
  onUpdateCalorieTarget?: (newTarget: number) => void;
  onConfirmAteOut: (data: AteOutConfirmData) => void;
}

export default function AteOutModal({
  isOpen,
  onClose,
  targetMeal,
  targetMeals,
  targetDate,
  targetSlot = 'dinner',
  rollingDays,
  allMeals,
  calorieTarget = 2200,
  onUpdateCalorieTarget,
  onConfirmAteOut,
}: AteOutModalProps) {
  // Meal slot selection: user chooses which meal was or will be eaten out
  const [selectedSlot, setSelectedSlot] = useState<MealType>(targetSlot);

  // Main Hero: Leftover toggle & config
  const [hasLeftover, setHasLeftover] = useState<boolean>(false);
  const [leftoverPortions, setLeftoverPortions] = useState<number>(1);
  const [leftoverDestination, setLeftoverDestination] = useState<'schedule' | 'fridge'>('schedule');

  // Tomorrow by default
  const tomorrow = rollingDays[1]?.dateString || rollingDays[0]?.dateString || targetDate;
  const defaultLeftoverSlot: MealType = selectedSlot === 'dinner' ? 'lunch' : 'dinner';
  const [leftoverDate, setLeftoverDate] = useState<string>(tomorrow);
  const [leftoverSlot, setLeftoverSlot] = useState<MealType>(defaultLeftoverSlot);
  const [showAdvancedLeftoverDate, setShowAdvancedLeftoverDate] = useState<boolean>(false);

  // Original planned meal action (simplified 1-click default: push_tomorrow)
  const [originalMealAction, setOriginalMealAction] = useState<'push_tomorrow' | 'save_fridge' | 'replace'>('push_tomorrow');
  const [originalMealPushDate, setOriginalMealPushDate] = useState<string>(tomorrow);
  const [originalMealPushSlot, setOriginalMealPushSlot] = useState<MealType>(selectedSlot);
  const [showAdvancedPushPicker, setShowAdvancedPushPicker] = useState<boolean>(false);

  // Subtle optional calorie tracking
  const [trackCalories, setTrackCalories] = useState<boolean>(false);
  const [dishTitle, setDishTitle] = useState<string>('');
  const [caloriePreset, setCaloriePreset] = useState<number>(750);
  const [customCalories, setCustomCalories] = useState<string>('750');

  // Planned meals for the currently selected slot on targetDate
  const effectiveMeals = (targetMeals && targetMeals.length > 0) ? targetMeals : (targetMeal ? [targetMeal] : []);
  const activePlannedMeals = allMeals
    ? allMeals.filter((m) => m.dateScheduled === targetDate && m.mealType === selectedSlot)
    : (selectedSlot === targetSlot ? effectiveMeals : []);

  useEffect(() => {
    if (isOpen) {
      const initialSlot = targetSlot || 'dinner';
      setSelectedSlot(initialSlot);
      setHasLeftover(false);
      setLeftoverPortions(1);
      setLeftoverDestination('schedule');
      setLeftoverDate(tomorrow);
      setLeftoverSlot(initialSlot === 'dinner' ? 'lunch' : 'dinner');
      setShowAdvancedLeftoverDate(false);

      setOriginalMealAction('push_tomorrow');
      setOriginalMealPushDate(tomorrow);
      setOriginalMealPushSlot(initialSlot);
      setShowAdvancedPushPicker(false);

      setTrackCalories(false);
      const slotCap = initialSlot.charAt(0).toUpperCase() + initialSlot.slice(1);
      setDishTitle(`Ate Out (${slotCap})`);
      setCaloriePreset(750);
      setCustomCalories('750');
    }
  }, [isOpen, targetMeal, targetMeals, targetDate, targetSlot, tomorrow]);

  // When selectedSlot changes, update default push slot and title
  const handleSlotChange = (slot: MealType) => {
    setSelectedSlot(slot);
    setOriginalMealPushSlot(slot);
    const slotCap = slot.charAt(0).toUpperCase() + slot.slice(1);
    setDishTitle(`Ate Out (${slotCap})`);
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalCalories = trackCalories
      ? (parseInt(customCalories, 10) || caloriePreset || 750)
      : 0;

    const finalTitle = trackCalories && dishTitle.trim()
      ? dishTitle.trim()
      : `Ate Out (${selectedSlot.charAt(0).toUpperCase() + selectedSlot.slice(1)})`;

    onConfirmAteOut({
      dateScheduled: targetDate,
      mealType: selectedSlot,
      title: finalTitle,
      calories: finalCalories,
      hasLeftover,
      leftoverPortions,
      leftoverDestination,
      leftoverScheduleDate: leftoverDate,
      leftoverScheduleSlot: leftoverSlot,
      originalMealAction: activePlannedMeals.length > 0 ? originalMealAction : undefined,
      originalMealPushDate: activePlannedMeals.length > 0 && originalMealAction === 'push_tomorrow' ? originalMealPushDate : undefined,
      originalMealPushSlot: activePlannedMeals.length > 0 && originalMealAction === 'push_tomorrow' ? originalMealPushSlot : undefined,
      originalMeal: activePlannedMeals[0],
      originalMeals: activePlannedMeals,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto scrollbar-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative w-full max-w-lg bg-white dark:bg-[#16171E] border-2 border-black dark:border-gray-700 rounded-3xl p-5 sm:p-6 shadow-neo-xl text-gray-900 dark:text-white max-h-[94vh] overflow-y-auto custom-scrollbar"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-[#FAF8F5] dark:bg-[#20222E] border-2 border-black dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white shadow-neo-sm active:scale-95 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Header */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00E5FF] text-black font-black text-[11px] uppercase border-2 border-black shadow-neo-sm mb-1.5">
            <span>🍽️ ATE OUT / PLANS CHANGED</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-funky font-black tracking-tight text-gray-900 dark:text-white">
            PLANS CHANGED?
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-bold">
            Keep your schedule smooth and your kitchen zero-waste.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ========================================================================= */}
          {/* 0. WHICH MEAL WAS EATEN OUT?                                             */}
          {/* ========================================================================= */}
          <div className="p-4 sm:p-5 rounded-3xl bg-[#FAF8F5] dark:bg-[#1E202A] border-2 border-black dark:border-gray-700 shadow-neo space-y-3">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#00E5FF] text-black border-2 border-black flex items-center justify-center shadow-neo-sm flex-shrink-0 mt-0.5">
                <Utensils className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-funky font-black text-sm sm:text-base text-gray-900 dark:text-white leading-tight">
                  Which meal was eaten out or will be eaten out?
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                  Choose the meal slot to update for this day
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {[
                { type: 'breakfast', label: 'Breakfast', icon: Sun, bg: 'bg-[#FFE600]', text: 'text-black' },
                { type: 'lunch', label: 'Lunch', icon: Utensils, bg: 'bg-[#00E5FF]', text: 'text-black' },
                { type: 'dinner', label: 'Dinner', icon: Moon, bg: 'bg-[#FF5500]', text: 'text-white' },
                { type: 'snack', label: 'Snacks', icon: Coffee, bg: 'bg-[#D4FF00]', text: 'text-black' },
              ].map((slotOpt) => {
                const isSelected = selectedSlot === slotOpt.type;
                const SlotIcon = slotOpt.icon;
                const plannedCount = (allMeals || []).filter(
                  (m) => m.dateScheduled === targetDate && m.mealType === slotOpt.type
                ).length;

                return (
                  <button
                    key={slotOpt.type}
                    type="button"
                    onClick={() => handleSlotChange(slotOpt.type as MealType)}
                    className={`py-2.5 px-2 rounded-2xl border-2 font-black text-xs flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                      isSelected
                        ? 'bg-black text-white dark:bg-[#FFE600] dark:text-black border-black shadow-neo'
                        : 'bg-white dark:bg-[#16171E] border-black/20 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-black'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-lg ${slotOpt.bg} ${slotOpt.text} border border-black flex items-center justify-center shadow-neo-sm`}>
                      <SlotIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                    <span>{slotOpt.label}</span>
                    {plannedCount > 0 ? (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                        isSelected
                          ? 'bg-white/20 text-white dark:bg-black/20 dark:text-black'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                      }`}>
                        {plannedCount} planned
                      </span>
                    ) : (
                      <span className="text-[9px] opacity-40 font-bold">empty</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 1. MAIN HERO QUESTION: DO YOU HAVE LEFTOVERS?                             */}
          {/* ========================================================================= */}
          <div className="p-4 sm:p-5 rounded-3xl bg-[#FAF8F5] dark:bg-[#1E202A] border-2 border-black dark:border-gray-700 shadow-neo space-y-3">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#A855F7] text-white border-2 border-black flex items-center justify-center shadow-neo-sm flex-shrink-0 mt-0.5">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-funky font-black text-sm sm:text-base text-gray-900 dark:text-white leading-tight">
                  Do you have leftovers?
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                  Did you bring food home or have an extra portion to save?
                </p>
              </div>
            </div>

            {/* Big, Playful 2-Choice Cards */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setHasLeftover(true)}
                className={`py-3 px-3 rounded-2xl border-2 font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer ${
                  hasLeftover
                    ? 'bg-[#A855F7] text-white border-black shadow-neo'
                    : 'bg-white dark:bg-[#16171E] border-black/20 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-black'
                }`}
              >
                <span>🥡 Yes, have leftovers!</span>
              </button>

              <button
                type="button"
                onClick={() => setHasLeftover(false)}
                className={`py-3 px-3 rounded-2xl border-2 font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer ${
                  !hasLeftover
                    ? 'bg-black text-white dark:bg-[#FFE600] dark:text-black border-2 border-black shadow-neo'
                    : 'bg-white dark:bg-[#16171E] border-black/20 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-black'
                }`}
              >
                <span>🍽️ Nope, all eaten</span>
              </button>
            </div>

            {/* Smooth Leftover Configuration */}
            <AnimatePresence>
              {hasLeftover && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pt-3 border-t-2 border-black/10 dark:border-gray-800 space-y-3 overflow-hidden"
                >
                  {/* Portions */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-gray-800 dark:text-gray-200">
                      Portions brought home:
                    </span>
                    <div className="flex gap-1.5">
                      {[1, 2, 3].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setLeftoverPortions(num)}
                          className={`w-8 h-8 rounded-xl border-2 text-xs font-black transition-all cursor-pointer ${
                            leftoverPortions === num
                              ? 'bg-[#A855F7] text-white border-black shadow-neo-sm'
                              : 'bg-white dark:bg-[#16171E] border-black/20 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Destination */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setLeftoverDestination('schedule')}
                      className={`p-2.5 rounded-xl border-2 font-black text-left text-xs transition-all cursor-pointer ${
                        leftoverDestination === 'schedule'
                          ? 'bg-[#FFE600] text-black border-black shadow-neo-sm'
                          : 'bg-white dark:bg-[#16171E] border-black/20 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 uppercase text-[11px]">
                        <CalendarDays className="w-3.5 h-3.5" />
                        <span>Eat Tomorrow</span>
                      </div>
                      <p className="text-[10px] text-gray-700 dark:text-gray-800 font-bold mt-0.5">
                        Assigned to tomorrow&apos;s {defaultLeftoverSlot}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setLeftoverDestination('fridge')}
                      className={`p-2.5 rounded-xl border-2 font-black text-left text-xs transition-all cursor-pointer ${
                        leftoverDestination === 'fridge'
                          ? 'bg-[#00E5FF] text-black border-black shadow-neo-sm'
                          : 'bg-white dark:bg-[#16171E] border-black/20 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 uppercase text-[11px]">
                        <Package className="w-3.5 h-3.5" />
                        <span>Keep in Fridge</span>
                      </div>
                      <p className="text-[10px] text-gray-700 dark:text-gray-800 font-bold mt-0.5">
                        Track in Fridge Radar inventory
                      </p>
                    </button>
                  </div>

                  {/* Optional: Pick another day/slot for leftover */}
                  {leftoverDestination === 'schedule' && (
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowAdvancedLeftoverDate(!showAdvancedLeftoverDate)}
                        className="text-[10px] text-gray-500 hover:text-black dark:hover:text-white font-bold underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>{showAdvancedLeftoverDate ? 'Hide custom schedule' : 'Choose a different day or slot...'}</span>
                        {showAdvancedLeftoverDate ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      {showAdvancedLeftoverDate && (
                        <div className="mt-2 p-2.5 bg-white dark:bg-[#16171E] rounded-xl border-2 border-black dark:border-gray-700 space-y-2">
                          <div className="flex gap-1.5 overflow-x-auto custom-scrollbar pb-1">
                            {rollingDays.slice(0, 5).map((d) => (
                              <button
                                key={d.dateString}
                                type="button"
                                onClick={() => setLeftoverDate(d.dateString)}
                                className={`px-2.5 py-1 rounded-lg border-2 text-[10px] font-black whitespace-nowrap transition-all cursor-pointer ${
                                  leftoverDate === d.dateString
                                    ? 'bg-[#A855F7] text-white border-black shadow-neo-sm'
                                    : 'bg-[#FAF8F5] dark:bg-[#20222E] border-black/20 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                                }`}
                              >
                                {d.isToday ? 'Today' : d.dayName} {d.dayNumber}
                              </button>
                            ))}
                          </div>
                          <div className="grid grid-cols-4 gap-1 text-center">
                            {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((slot) => (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => setLeftoverSlot(slot)}
                                className={`py-1 rounded-lg border-2 text-[10px] font-black uppercase transition-all cursor-pointer ${
                                  leftoverSlot === slot
                                    ? 'bg-[#FFE600] text-black border-black shadow-neo-sm'
                                    : 'bg-[#FAF8F5] dark:bg-[#20222E] border-black/20 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                                }`}
                              >
                                {slot === 'breakfast' ? 'Bfast' : slot}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ========================================================================= */}
          {/* 2. SIMPLE PLANNED MEAL HANDLING (NO CRAMPING)                             */}
          {/* ========================================================================= */}
          {activePlannedMeals.length > 0 && (
            <div className="p-4 rounded-3xl bg-[#FAF8F5] dark:bg-[#1E202A] border-2 border-black dark:border-gray-700 shadow-neo space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-gray-500 dark:text-gray-400 tracking-wider">
                  Originally Scheduled ({selectedSlot}):
                </span>
                <span className="font-funky font-black text-xs text-gray-900 dark:text-[#D4FF00] truncate max-w-[200px]">
                  {activePlannedMeals.map((m) => m.title).join(', ')}
                </span>
              </div>

              <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                What should happen to {activePlannedMeals.length > 1 ? 'these planned dishes' : `"${activePlannedMeals[0].title}"`}?
              </p>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setOriginalMealAction('push_tomorrow')}
                  className={`p-2.5 rounded-2xl border-2 font-black text-xs flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer ${
                    originalMealAction === 'push_tomorrow'
                      ? 'bg-[#FFE600] text-black border-black shadow-neo-sm'
                      : 'bg-white dark:bg-[#16171E] border-black/20 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-black'
                  }`}
                >
                  <CalendarDays className="w-4 h-4" />
                  <span className="text-[10px] sm:text-[11px] uppercase leading-tight">Push Tomorrow</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOriginalMealAction('save_fridge')}
                  className={`p-2.5 rounded-2xl border-2 font-black text-xs flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer ${
                    originalMealAction === 'save_fridge'
                      ? 'bg-[#00E5FF] text-black border-black shadow-neo-sm'
                      : 'bg-white dark:bg-[#16171E] border-black/20 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-black'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span className="text-[10px] sm:text-[11px] uppercase leading-tight">Save in Fridge</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOriginalMealAction('replace')}
                  className={`p-2.5 rounded-2xl border-2 font-black text-xs flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer ${
                    originalMealAction === 'replace'
                      ? 'bg-rose-100 text-rose-900 border-black shadow-neo-sm'
                      : 'bg-white dark:bg-[#16171E] border-black/20 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-black'
                  }`}
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="text-[10px] sm:text-[11px] uppercase leading-tight">Skip Dish</span>
                </button>
              </div>

              {/* Clean Progressive Disclosure: Only show custom day picker if user explicitly opens it */}
              {originalMealAction === 'push_tomorrow' && (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowAdvancedPushPicker(!showAdvancedPushPicker)}
                    className="text-[10px] text-gray-500 hover:text-black dark:hover:text-white font-bold underline flex items-center gap-1 mt-1 cursor-pointer"
                  >
                    <span>{showAdvancedPushPicker ? 'Hide date selector' : `Move to different day than tomorrow (${originalMealPushDate})?`}</span>
                    {showAdvancedPushPicker ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {showAdvancedPushPicker && (
                    <div className="mt-2 p-2.5 bg-white dark:bg-[#16171E] rounded-xl border border-black/20 dark:border-gray-700 space-y-2">
                      <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
                        {rollingDays.map((d, dIdx) => (
                          <button
                            key={d.dateString}
                            type="button"
                            onClick={() => setOriginalMealPushDate(d.dateString)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black border transition-colors flex-shrink-0 cursor-pointer ${
                              originalMealPushDate === d.dateString
                                ? 'bg-[#FFE600] text-black border-black shadow-neo-sm'
                                : 'bg-[#FAF8F5] dark:bg-[#20222E] text-gray-700 dark:text-gray-300 border-black/20 dark:border-gray-700'
                            }`}
                          >
                            {dIdx === 0 ? 'Today' : dIdx === 1 ? 'Tomorrow' : d.dayName}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-4 gap-1">
                        {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setOriginalMealPushSlot(slot)}
                            className={`py-1 text-center text-[10px] font-black uppercase rounded-lg border transition-colors cursor-pointer ${
                              originalMealPushSlot === slot
                                ? 'bg-[#00E5FF] text-black border-black shadow-neo-sm'
                                : 'bg-[#FAF8F5] dark:bg-[#20222E] text-gray-700 dark:text-gray-300 border-black/20 dark:border-gray-700'
                            }`}
                          >
                            {slot === 'breakfast' ? 'Bfast' : slot}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activePlannedMeals.length === 0 && (
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1E202A] border-2 border-dashed border-black/20 dark:border-gray-700 flex items-center gap-2.5 text-xs font-bold text-gray-600 dark:text-gray-300">
              <Sparkles className="w-4 h-4 text-[#00E5FF] flex-shrink-0" />
              <span>
                No meals were scheduled for <strong className="text-black dark:text-white capitalize">{selectedSlot}</strong>. Logging your meal smoothly.
              </span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. SUBTLE & SMALL: TRACK CALORIES? (OPTIONAL)                             */}
          {/* ========================================================================= */}
          <div className="p-4 rounded-3xl bg-white dark:bg-[#16171E] border-2 border-black dark:border-gray-700 shadow-neo-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#FF5500]" />
                <span className="text-xs font-black text-gray-800 dark:text-gray-200">
                  Track calories for this meal?
                </span>
              </div>

              {/* Subtly small toggle */}
              <div className="flex bg-[#FAF8F5] dark:bg-[#20222E] p-0.5 rounded-xl border border-black/30 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setTrackCalories(false)}
                  className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                    !trackCalories
                      ? 'bg-black text-white dark:bg-white dark:text-black shadow-neo-sm'
                      : 'text-gray-500 hover:text-black dark:hover:text-white'
                  }`}
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={() => setTrackCalories(true)}
                  className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                    trackCalories
                      ? 'bg-[#D4FF00] text-black border border-black shadow-neo-sm'
                      : 'text-gray-500 hover:text-black dark:hover:text-white'
                  }`}
                >
                  Track
                </button>
              </div>
            </div>

            {/* If tracking: quick presets & dish name */}
            <AnimatePresence>
              {trackCalories && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pt-2 border-t border-black/10 dark:border-gray-800 space-y-2.5 overflow-hidden"
                >
                  <input
                    type="text"
                    value={dishTitle}
                    onChange={(e) => setDishTitle(e.target.value)}
                    placeholder="What did you have? (e.g. Sushi, Burgers, Thai Curry...)"
                    className="w-full bg-[#FAF8F5] dark:bg-[#20222E] border-2 border-black dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white font-bold focus:outline-none"
                  />

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { label: 'Light', cals: 450 },
                      { label: 'Standard', cals: 750 },
                      { label: 'Hearty', cals: 1100 },
                    ].map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => {
                          setCaloriePreset(p.cals);
                          setCustomCalories(String(p.cals));
                        }}
                        className={`px-2.5 py-1 rounded-lg border-2 text-[10px] font-black transition-all cursor-pointer ${
                          caloriePreset === p.cals
                            ? 'bg-[#D4FF00] text-black border-black shadow-neo-sm'
                            : 'bg-[#FAF8F5] dark:bg-[#20222E] border-black/20 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {p.label} (~{p.cals} kcal)
                      </button>
                    ))}

                    <div className="flex items-center gap-1 ml-auto">
                      <input
                        type="number"
                        value={customCalories}
                        onChange={(e) => {
                          setCustomCalories(e.target.value);
                          setCaloriePreset(parseInt(e.target.value, 10) || 0);
                        }}
                        placeholder="kcal"
                        className="w-16 bg-[#FAF8F5] dark:bg-[#20222E] border-2 border-black dark:border-gray-700 rounded-lg px-2 py-1 text-[11px] font-bold text-center"
                      />
                      <span className="text-[10px] text-gray-500 font-bold">kcal</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ========================================================================= */}
          {/* SUBMIT BUTTON                                                             */}
          {/* ========================================================================= */}
          <button
            type="submit"
            className="w-full py-3.5 bg-[#00E5FF] hover:bg-[#00cbe2] text-black font-black text-xs uppercase tracking-wider rounded-2xl border-2 border-black shadow-neo active:scale-[0.98] transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <span>Save &amp; Continue</span>
            {hasLeftover && <span>(Leftovers Saved)</span>}
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>
      </motion.div>
    </div>
  );
}
