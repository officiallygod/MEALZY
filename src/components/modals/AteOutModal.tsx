'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Utensils,
  ShoppingBag,
  Sparkles,
  Package,
  CalendarDays,
  ArrowRight,
  Clock,
  RotateCcw,
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
  onConfirmAteOut: (data: AteOutConfirmData) => void;
}

const EAT_OUT_TYPES = [
  { id: 'restaurant', label: 'Restaurant / Dining Out', icon: Utensils, defaultTitle: 'Dining Out', defaultCals: 850 },
  { id: 'takeout', label: 'Takeout / Delivery', icon: ShoppingBag, defaultTitle: 'Takeout', defaultCals: 780 },
  { id: 'cooked_other', label: 'Cooked Something Else', icon: Sparkles, defaultTitle: 'Quick Home Meal', defaultCals: 600 },
  { id: 'social', label: 'Social Event / Dinner', icon: Utensils, defaultTitle: 'Dinner with Friends', defaultCals: 900 },
];

const CALORIE_PRESETS = [
  { label: 'Light', calories: 450, desc: '~450 kcal' },
  { label: 'Standard', calories: 750, desc: '~750 kcal' },
  { label: 'Hearty', calories: 1100, desc: '~1100 kcal' },
  { label: 'Skip / Rough', calories: 0, desc: 'Skip' },
];

export default function AteOutModal({
  isOpen,
  onClose,
  targetMeal,
  targetMeals,
  targetDate,
  targetSlot,
  rollingDays,
  onConfirmAteOut,
}: AteOutModalProps) {
  const [eatType, setEatType] = useState<string>('restaurant');
  const [dishTitle, setDishTitle] = useState('');
  const [caloriePreset, setCaloriePreset] = useState<number>(750);
  const [customCalories, setCustomCalories] = useState('750');

  // Leftover toggle and configuration
  const [hasLeftover, setHasLeftover] = useState(false);
  const [leftoverPortions, setLeftoverPortions] = useState(1);
  const [leftoverDestination, setLeftoverDestination] = useState<'schedule' | 'fridge'>('schedule');

  // Tomorrow by default for leftover schedule
  const tomorrow = rollingDays[1]?.dateString || rollingDays[0]?.dateString || targetDate;
  const [leftoverDate, setLeftoverDate] = useState(tomorrow);
  // Default leftover slot: if dinner out -> lunch tomorrow! Otherwise dinner
  const defaultLeftoverSlot: MealType = targetSlot === 'dinner' ? 'lunch' : 'dinner';
  const [leftoverSlot, setLeftoverSlot] = useState<MealType>(defaultLeftoverSlot);

  // Original planned meal disposition
  const [originalMealAction, setOriginalMealAction] = useState<'push_tomorrow' | 'save_fridge' | 'replace'>('push_tomorrow');

  const effectiveMeals = (targetMeals && targetMeals.length > 0) ? targetMeals : (targetMeal ? [targetMeal] : []);

  useEffect(() => {
    if (isOpen) {
      const typeObj = EAT_OUT_TYPES.find((t) => t.id === eatType) || EAT_OUT_TYPES[0];
      const slotCap = targetSlot.charAt(0).toUpperCase() + targetSlot.slice(1);
      setDishTitle(`${typeObj.defaultTitle} (${slotCap})`);
      setCaloriePreset(typeObj.defaultCals);
      setCustomCalories(String(typeObj.defaultCals));
      setHasLeftover(false);
      setLeftoverPortions(1);
      setLeftoverDestination('schedule');
      setLeftoverDate(tomorrow);
      setLeftoverSlot(defaultLeftoverSlot);
      setOriginalMealAction('push_tomorrow');
    }
  }, [isOpen, targetMeal, targetMeals, targetDate, targetSlot]);

  if (!isOpen) return null;

  const handleSelectType = (typeId: string) => {
    setEatType(typeId);
    const typeObj = EAT_OUT_TYPES.find((t) => t.id === typeId);
    if (typeObj) {
      const slotCap = targetSlot.charAt(0).toUpperCase() + targetSlot.slice(1);
      setDishTitle(`${typeObj.defaultTitle} (${slotCap})`);
      setCaloriePreset(typeObj.defaultCals);
      setCustomCalories(String(typeObj.defaultCals));
    }
  };

  const handleSelectCaloriePreset = (cals: number) => {
    setCaloriePreset(cals);
    setCustomCalories(cals > 0 ? String(cals) : '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCalories = parseInt(customCalories, 10) || caloriePreset || 700;

    onConfirmAteOut({
      dateScheduled: targetDate,
      mealType: targetSlot,
      title: dishTitle.trim() || 'Ate Out',
      calories: finalCalories,
      hasLeftover,
      leftoverPortions,
      leftoverDestination,
      leftoverScheduleDate: leftoverDate,
      leftoverScheduleSlot: leftoverSlot,
      originalMealAction: effectiveMeals.length > 0 ? originalMealAction : undefined,
      originalMeal: effectiveMeals[0],
      originalMeals: effectiveMeals,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto scrollbar-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative w-full max-w-lg bg-white dark:bg-[#16171E] border-2 border-black dark:border-gray-700 rounded-3xl p-6 sm:p-7 shadow-neo-xl text-gray-900 dark:text-white max-h-[92vh] overflow-y-auto scrollbar-none"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-[#FAF8F5] dark:bg-[#20222E] border-2 border-black dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white shadow-neo-sm active:scale-95 transition-colors"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Header Strip */}
        <div className="mb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00E5FF] text-black font-black text-xs uppercase border-2 border-black shadow-neo-sm mb-2">
            <Utensils className="w-3.5 h-3.5" />
            <span>Ate Out / Something Else</span>
          </div>
          <h2 className="text-2xl font-funky font-black tracking-tight text-gray-900 dark:text-white">
            PLANS CHANGED?
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-bold">
            Log your meal outside the plan and handle any leftovers with zero food waste.
          </p>
        </div>

        {/* If original planned meal(s) exist in this slot, show disposition choices */}
        {effectiveMeals.length > 0 && (
          <div className="mb-5 p-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#1E202A] border-2 border-black dark:border-gray-700 shadow-neo-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase text-gray-500 dark:text-gray-400 tracking-wider">
                Originally Scheduled:
              </span>
              <span className="font-funky font-black text-xs text-gray-900 dark:text-[#D4FF00] truncate max-w-[200px]" title={effectiveMeals.map((m) => m.title).join(', ')}>
                {effectiveMeals.map((m) => m.title).join(', ')}
              </span>
            </div>

            <p className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
              {effectiveMeals.length > 1
                ? `What should happen to these ${effectiveMeals.length} planned dishes?`
                : `What should happen to "${effectiveMeals[0].title}"?`}
            </p>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <button
                type="button"
                onClick={() => setOriginalMealAction('push_tomorrow')}
                className={`p-2 rounded-xl border-2 font-black transition-colors flex flex-col items-center justify-center gap-1 active:scale-95 ${
                  originalMealAction === 'push_tomorrow'
                    ? 'bg-[#FFE600] text-black border-black shadow-neo-sm'
                    : 'bg-white dark:bg-[#16171E] border-black/20 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-black'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase leading-tight">Push to Tomorrow</span>
              </button>

              <button
                type="button"
                onClick={() => setOriginalMealAction('save_fridge')}
                className={`p-2 rounded-xl border-2 font-black transition-colors flex flex-col items-center justify-center gap-1 active:scale-95 ${
                  originalMealAction === 'save_fridge'
                    ? 'bg-[#00E5FF] text-black border-black shadow-neo-sm'
                    : 'bg-white dark:bg-[#16171E] border-black/20 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-black'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase leading-tight">Save in Fridge</span>
              </button>

              <button
                type="button"
                onClick={() => setOriginalMealAction('replace')}
                className={`p-2 rounded-xl border-2 font-black transition-colors flex flex-col items-center justify-center gap-1 active:scale-95 ${
                  originalMealAction === 'replace'
                    ? 'bg-rose-100 text-rose-900 border-black shadow-neo-sm'
                    : 'bg-white dark:bg-[#16171E] border-black/20 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-black'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase leading-tight">Cancel Dish</span>
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Eating Out Category */}
          <div>
            <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-2">
              What did you have?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {EAT_OUT_TYPES.map((t) => {
                const Icon = t.icon;
                const isSelected = eatType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelectType(t.id)}
                    className={`p-2.5 rounded-xl border-2 font-black text-xs flex items-center gap-2 transition-all ${
                      isSelected
                        ? 'bg-[#FFE600] text-black border-black shadow-neo-sm'
                        : 'bg-[#FAF8F5] dark:bg-[#1E202A] border-black/20 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-black'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-[11px] truncate">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Meal Title / Description */}
          <div>
            <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1">
              Dish or Place Name (Optional)
            </label>
            <input
              type="text"
              value={dishTitle}
              onChange={(e) => setDishTitle(e.target.value)}
              placeholder="e.g. Thai Green Curry, Chipotle Bowl, Sushi..."
              className="w-full bg-[#FAF8F5] dark:bg-[#20222E] border-2 border-black dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 dark:text-white font-bold focus:outline-none"
            />
          </div>

          {/* Rough Calorie Estimation */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-black text-gray-500 uppercase tracking-wider">
                Rough Calorie Estimate (Optional)
              </label>
              <span className="text-[10px] font-bold text-gray-400">
                {customCalories ? `${customCalories} kcal` : 'Skipped'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {CALORIE_PRESETS.map((p) => {
                const active = caloriePreset === p.calories;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handleSelectCaloriePreset(p.calories)}
                    className={`px-3 py-1.5 rounded-xl border-2 text-[10px] font-black transition-all ${
                      active
                        ? 'bg-[#D4FF00] text-black border-black shadow-neo-sm'
                        : 'bg-[#FAF8F5] dark:bg-[#1E202A] border-black/20 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-black'
                    }`}
                  >
                    {p.label} ({p.desc})
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION: WERE THERE LEFTOVERS? (PRIMARY USER REQUIREMENT) */}
          <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#1E202A] border-2 border-black dark:border-gray-700 shadow-neo-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-funky font-black text-xs uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Were There Leftovers?</span>
                </h4>
                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mt-0.5">
                  Did you bring food home in a box or save an extra portion?
                </p>
              </div>

              {/* Toggle Switch */}
              <div className="flex bg-white dark:bg-[#16171E] p-1 rounded-xl border-2 border-black dark:border-gray-700 shadow-neo-sm">
                <button
                  type="button"
                  onClick={() => setHasLeftover(false)}
                  className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-all ${
                    !hasLeftover
                      ? 'bg-gray-200 dark:bg-gray-700 text-black dark:text-white'
                      : 'text-gray-400 hover:text-black dark:hover:text-white'
                  }`}
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={() => setHasLeftover(true)}
                  className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-all ${
                    hasLeftover
                      ? 'bg-[#A855F7] text-white border border-black shadow-neo-sm'
                      : 'text-gray-400 hover:text-black dark:hover:text-white'
                  }`}
                >
                  Yes!
                </button>
              </div>
            </div>

            {/* Expanded Leftover Options */}
            {hasLeftover && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="pt-3 border-t-2 border-black/10 dark:border-gray-800 space-y-3"
              >
                {/* Portions Count */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-gray-700 dark:text-gray-300">
                    Portions Brought Home:
                  </span>
                  <div className="flex gap-1.5">
                    {[1, 2, 3].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setLeftoverPortions(num)}
                        className={`w-7 h-7 rounded-lg border-2 text-xs font-black transition-all ${
                          leftoverPortions === num
                            ? 'bg-[#A855F7] text-white border-black shadow-neo-sm'
                            : 'bg-white dark:bg-[#16171E] border-black/30 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Leftover Action: Schedule on Board OR Store in Fridge */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLeftoverDestination('schedule')}
                    className={`p-2.5 rounded-xl border-2 text-left font-black transition-all ${
                      leftoverDestination === 'schedule'
                        ? 'bg-[#FFE600] text-black border-black shadow-neo-sm'
                        : 'bg-white dark:bg-[#16171E] border-black/20 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-black'
                    }`}
                  >
                    <div className="flex items-center gap-1 text-[11px] uppercase">
                      <CalendarDays className="w-3.5 h-3.5" />
                      <span>Schedule for Meal</span>
                    </div>
                    <p className="text-[9px] font-bold text-gray-700 mt-1">
                      Eat for tomorrow&apos;s lunch/dinner
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLeftoverDestination('fridge')}
                    className={`p-2.5 rounded-xl border-2 text-left font-black transition-all ${
                      leftoverDestination === 'fridge'
                        ? 'bg-[#00E5FF] text-black border-black shadow-neo-sm'
                        : 'bg-white dark:bg-[#16171E] border-black/20 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-black'
                    }`}
                  >
                    <div className="flex items-center gap-1 text-[11px] uppercase">
                      <Package className="w-3.5 h-3.5" />
                      <span>Keep in Fridge</span>
                    </div>
                    <p className="text-[9px] font-bold text-gray-700 mt-1">
                      Track on Fridge Radar inventory
                    </p>
                  </button>
                </div>

                {/* If Scheduled: Pick Day & Slot */}
                {leftoverDestination === 'schedule' && (
                  <div className="p-3 bg-white dark:bg-[#16171E] rounded-xl border-2 border-black dark:border-gray-700 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase text-gray-500">
                      <span>Schedule Leftover When?</span>
                    </div>

                    {/* Day Picker */}
                    <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
                      {rollingDays.slice(0, 5).map((d) => (
                        <button
                          key={d.dateString}
                          type="button"
                          onClick={() => setLeftoverDate(d.dateString)}
                          className={`px-2.5 py-1 rounded-lg border-2 text-[10px] font-black whitespace-nowrap transition-all ${
                            leftoverDate === d.dateString
                              ? 'bg-[#A855F7] text-white border-black shadow-neo-sm'
                              : 'bg-[#FAF8F5] dark:bg-[#20222E] border-black/20 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {d.isToday ? 'Today' : d.dayName} {d.dayNumber}
                        </button>
                      ))}
                    </div>

                    {/* Slot Picker */}
                    <div className="grid grid-cols-4 gap-1.5 text-center">
                      {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setLeftoverSlot(slot)}
                          className={`py-1 rounded-lg border-2 text-[10px] font-black uppercase transition-all ${
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
              </motion.div>
            )}
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            className="w-full py-3 bg-[#00E5FF] hover:bg-[#00cbe2] text-black font-black text-xs uppercase tracking-wider rounded-2xl border-2 border-black shadow-neo active:scale-[0.98] transition-colors flex items-center justify-center gap-2 mt-2"
          >
            <span>Log Meal</span>
            {hasLeftover && <span>&amp; Save Leftover</span>}
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>
      </motion.div>
    </div>
  );
}
