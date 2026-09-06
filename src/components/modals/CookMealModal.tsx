'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, ChefHat, Sparkles, Check, ShieldCheck } from 'lucide-react';
import { MealItem, MealType } from '@/types/meal';

interface CookMealModalProps {
  meal: MealItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmCook: (
    meal: MealItem,
    portions: number,
    targetSlots: { date: string; slot: MealType }[]
  ) => void;
  rollingDays: { dateString: string; dayName: string; dayNumber: number; fullDateFormatted?: string }[];
}

interface LeftoverAllocation {
  portionNumber: number;
  date: string;
  slot: MealType;
  scheduleOnCalendar: boolean;
}

const SLOT_CONFIGS: {
  type: MealType;
  label: string;
  activeColor: string;
  textColor: string;
}[] = [
  { type: 'breakfast', label: 'Breakfast', activeColor: 'bg-[#FFE600]', textColor: 'text-black' },
  { type: 'lunch', label: 'Lunch', activeColor: 'bg-[#00E5FF]', textColor: 'text-black' },
  { type: 'dinner', label: 'Dinner', activeColor: 'bg-[#FF5500]', textColor: 'text-white' },
  { type: 'snack', label: 'Snack', activeColor: 'bg-[#D4FF00]', textColor: 'text-black' },
];

export default function CookMealModal({
  meal,
  isOpen,
  onClose,
  onConfirmCook,
  rollingDays,
}: CookMealModalProps) {
  const [portions, setPortions] = useState<number>(3);
  const [allocations, setAllocations] = useState<LeftoverAllocation[]>([]);

  // Initialize and synchronize allocations whenever meal or portion count changes
  useEffect(() => {
    if (!meal || !isOpen) return;

    const newAllocations: LeftoverAllocation[] = [];
    // Default slot preference for leftovers:
    // If dinner was cooked, leftovers default to lunch next day
    // If lunch was cooked, leftovers default to dinner or lunch
    const defaultLeftoverSlot: MealType = meal.mealType === 'dinner' ? 'lunch' : 'dinner';

    for (let i = 1; i < portions; i++) {
      const dayObj = rollingDays[i] || rollingDays[rollingDays.length - 1] || { dateString: meal.dateScheduled || '' };
      
      // Preserve existing user customization if available for this portion index
      const existing = allocations[i - 1];
      newAllocations.push({
        portionNumber: i + 1,
        date: existing?.date || dayObj.dateString,
        slot: existing?.slot || defaultLeftoverSlot,
        scheduleOnCalendar: existing ? existing.scheduleOnCalendar : true,
      });
    }

    setAllocations(newAllocations);
  }, [meal, portions, isOpen]);

  if (!isOpen || !meal) return null;

  const handleUpdateSlot = (portionIndex: number, newSlot: MealType) => {
    setAllocations((prev) =>
      prev.map((item, idx) => (idx === portionIndex ? { ...item, slot: newSlot } : item))
    );
  };

  const handleUpdateDate = (portionIndex: number, newDate: string) => {
    setAllocations((prev) =>
      prev.map((item, idx) => (idx === portionIndex ? { ...item, date: newDate } : item))
    );
  };

  const handleToggleSchedule = (portionIndex: number) => {
    setAllocations((prev) =>
      prev.map((item, idx) =>
        idx === portionIndex ? { ...item, scheduleOnCalendar: !item.scheduleOnCalendar } : item
      )
    );
  };

  const handleCook = () => {
    // Collect active calendar target slots
    const targetSlots = allocations
      .filter((a) => a.scheduleOnCalendar)
      .map((a) => ({ date: a.date, slot: a.slot }));

    onConfirmCook(meal, portions, targetSlots);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative w-full max-w-xl bg-white dark:bg-[#16171E] border-2 border-black dark:border-gray-700 rounded-3xl p-6 shadow-neo-xl text-gray-900 dark:text-white max-h-[90vh] flex flex-col transition-colors"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-[#FAF8F5] dark:bg-[#20222E] border-2 border-black dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 transition-all"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Header Strip */}
        <div className="flex items-center gap-3.5 mb-5 pb-4 border-b-2 border-black/10 dark:border-gray-800 flex-shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-[#FFE600] border-2 border-black flex items-center justify-center text-black shadow-neo-sm flex-shrink-0">
            <ChefHat className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="rotate-[-2deg] inline-block bg-[#D4FF00] text-black font-black text-[10px] uppercase px-2.5 py-0.5 rounded border border-black shadow-neo-sm mb-1">
              ✦ SMART BATCH ALLOCATION
            </div>
            <h3 className="font-funky font-black text-xl text-gray-900 dark:text-white leading-none">
              COOK ONCE, EAT MULTIPLE
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-300 font-bold mt-1">
              Dish: <span className="text-black dark:text-[#FFE600] font-black">{meal.title}</span>
            </p>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto scrollbar-none pr-1 space-y-5 flex-1">
          {/* Portion Multiplier Selector */}
          <div>
            <label className="block text-xs font-black uppercase text-gray-600 dark:text-gray-400 mb-2">
              How Many Portions Are You Cooking?
            </label>
            <div className="grid grid-cols-4 gap-2.5">
              {[
                { count: 1, title: '1x', subtitle: 'Just Today' },
                { count: 2, title: '2x', subtitle: 'Cook 1, Eat 2' },
                { count: 3, title: '3x', subtitle: '3 Portions' },
                { count: 4, title: '4x', subtitle: 'Batch Prep' },
              ].map((item) => (
                <button
                  key={item.count}
                  type="button"
                  onClick={() => setPortions(item.count)}
                  className={`py-3 px-2 rounded-2xl border-2 font-black transition-all flex flex-col items-center justify-center gap-0.5 ${
                    portions === item.count
                      ? 'bg-[#FFE600] text-black border-2 border-black shadow-neo -translate-y-0.5'
                      : 'bg-[#FAF8F5] dark:bg-[#1E202A] border-black/30 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-black active:translate-y-0'
                  }`}
                >
                  <span className="text-base font-funky">{item.title}</span>
                  <span className="text-[10px] font-bold opacity-80 text-center leading-tight">
                    {item.subtitle}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Leftover Allocation Cards (Customizable day & slot for each portion) */}
          {portions > 1 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#FF5500]" />
                  <span>Configure Leftover Portions</span>
                </span>
                <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">
                  {allocations.filter((a) => a.scheduleOnCalendar).length} scheduled to plan
                </span>
              </div>

              <div className="space-y-3">
                {allocations.map((alloc, idx) => (
                  <div
                    key={alloc.portionNumber}
                    className="bg-[#FAF8F5] dark:bg-[#1E202A] border-2 border-black dark:border-gray-700 rounded-2xl p-4 shadow-neo-sm border-l-[6px] border-l-[#00E5FF] transition-all"
                  >
                    {/* Portion Header & Schedule Toggle */}
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-black text-white dark:bg-[#FFE600] dark:text-black text-[10px] font-black rounded-lg uppercase">
                          Portion #{alloc.portionNumber}
                        </span>
                        <span className="text-xs font-black text-gray-800 dark:text-white">
                          Leftover: {meal.title}
                        </span>
                      </div>

                      {/* Schedule vs Fridge-Only Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleSchedule(idx)}
                        className={`px-2.5 py-1 text-[10px] font-black rounded-xl border-2 transition-all flex items-center gap-1 ${
                          alloc.scheduleOnCalendar
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-600 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-500'
                            : 'bg-gray-200 text-gray-700 border-gray-400 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600'
                        }`}
                      >
                        <Check className="w-3 h-3 stroke-[2.5]" />
                        <span>{alloc.scheduleOnCalendar ? 'On Calendar' : 'Fridge Only'}</span>
                      </button>
                    </div>

                    {alloc.scheduleOnCalendar ? (
                      <div className="space-y-2.5">
                        {/* Day Selector */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase w-12 flex-shrink-0">
                            Target Day:
                          </span>
                          <select
                            value={alloc.date}
                            onChange={(e) => handleUpdateDate(idx, e.target.value)}
                            className="flex-1 bg-white dark:bg-[#16171E] border-2 border-black dark:border-gray-700 rounded-xl px-3 py-1.5 text-xs font-black text-gray-900 dark:text-white focus:outline-none shadow-neo-sm cursor-pointer"
                          >
                            {rollingDays.map((d, dayIndex) => (
                              <option key={d.dateString} value={d.dateString}>
                                {dayIndex === 0
                                  ? `Today (${d.dayName} ${d.dayNumber})`
                                  : dayIndex === 1
                                  ? `Tomorrow (${d.dayName} ${d.dayNumber})`
                                  : `${d.dayName} (${d.dayNumber})`}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Interactive Meal Slot Selector (Never forced!) */}
                        <div>
                          <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase block mb-1.5">
                            Select Meal Slot:
                          </span>
                          <div className="grid grid-cols-4 gap-1.5">
                            {SLOT_CONFIGS.map((slot) => {
                              const isSelected = alloc.slot === slot.type;
                              return (
                                <button
                                  key={slot.type}
                                  type="button"
                                  onClick={() => handleUpdateSlot(idx, slot.type)}
                                  className={`py-2 px-1 text-center font-black text-[11px] uppercase rounded-xl border-2 transition-all flex items-center justify-center ${
                                    isSelected
                                      ? `${slot.activeColor} ${slot.textColor} border-2 border-black shadow-neo-sm font-black`
                                      : 'bg-white dark:bg-[#16171E] text-gray-600 dark:text-gray-400 border-black/20 dark:border-gray-700 hover:border-black'
                                  }`}
                                >
                                  {slot.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 font-bold italic py-1">
                        Will be stored in Fridge Radar inventory only. You can consume it whenever you are ready.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fridge Radar & Spoilage Guarantee Notice */}
          <div className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#1E202A] border-2 border-black/20 dark:border-gray-800 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <p className="text-[11px] text-gray-600 dark:text-gray-400 font-medium leading-tight">
              All leftover portions are automatically logged in your <span className="font-bold text-black dark:text-white">Fridge Radar</span> with real-time freshness tracking to prevent waste.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-4 pt-3 border-t-2 border-black/10 dark:border-gray-800 flex-shrink-0">
          <button
            onClick={handleCook}
            className="w-full py-3.5 bg-[#FF5500] hover:bg-[#ff681a] text-white font-black text-xs uppercase tracking-wider rounded-2xl border-2 border-black shadow-neo hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-neo-lg active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
          >
            <ChefHat className="w-4 h-4" />
            <span>CONFIRM &amp; ALLOCATE {portions}X PORTIONS</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
