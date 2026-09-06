'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, ChefHat, Sparkles } from 'lucide-react';
import { MealItem, MealType } from '@/types/meal';

interface CookMealModalProps {
  meal: MealItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmCook: (meal: MealItem, portions: number, targetSlots: { date: string; slot: MealType }[]) => void;
  rollingDays: { dateString: string; dayName: string; dayNumber: number }[];
}

export default function CookMealModal({
  meal,
  isOpen,
  onClose,
  onConfirmCook,
  rollingDays,
}: CookMealModalProps) {
  const [portions, setPortions] = useState<number>(3);

  if (!isOpen || !meal) return null;

  const leftoverSlots: { date: string; slot: MealType; dayLabel: string }[] = [];
  for (let i = 1; i < portions; i++) {
    const dayObj = rollingDays[i] || rollingDays[rollingDays.length - 1];
    const slot: MealType = meal.mealType === 'lunch' ? 'lunch' : 'dinner';
    leftoverSlots.push({
      date: dayObj.dateString,
      slot,
      dayLabel: `${dayObj.dayName} (${dayObj.dayNumber})`,
    });
  }

  const handleCook = () => {
    onConfirmCook(
      meal,
      portions,
      leftoverSlots.map((s) => ({ date: s.date, slot: s.slot }))
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative w-full max-w-lg bg-white dark:bg-[#16171E] border-2 border-black dark:border-gray-700 rounded-3xl p-6 shadow-neo-xl text-gray-900 dark:text-white transition-colors"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-[#FAF8F5] dark:bg-[#20222E] border-2 border-black dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 transition-all"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#FFE600] border-2 border-black flex items-center justify-center text-black shadow-neo-sm">
            <ChefHat className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="rotate-[-2deg] inline-block bg-[#D4FF00] text-black font-black text-[10px] uppercase px-2 py-0.2 rounded border border-black shadow-neo-sm mb-0.5">
              BATCH COOKING MULTIPLIER
            </div>
            <h3 className="font-funky font-black text-lg text-gray-900 dark:text-white">
              COOK ONCE, EAT MULTIPLE TIMES
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-bold">
              Meal: <span className="text-gray-900 dark:text-white">{meal.title}</span>
            </p>
          </div>
        </div>

        {/* Portions Selector */}
        <div className="my-5">
          <label className="block text-xs font-black uppercase text-gray-500 dark:text-gray-400 mb-2">
            Select Total Portions Prepared
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setPortions(num)}
                className={`py-3 px-2 rounded-2xl border-2 font-black transition-all flex flex-col items-center justify-center gap-0.5 ${
                  portions === num
                    ? 'bg-[#FFE600] text-black border-2 border-black shadow-neo-sm -translate-y-0.5'
                    : 'bg-[#FAF8F5] dark:bg-[#1E202A] border-black/30 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-black'
                }`}
              >
                <span className="text-base font-funky">{num}x</span>
                <span className="text-[10px] font-bold opacity-80">
                  {num === 1 ? 'Single' : num === 2 ? '2 Portions' : num === 3 ? '3 Portions' : 'Batch 4x'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Leftover Allocation Preview */}
        {portions > 1 && (
          <div className="bg-[#FAF8F5] dark:bg-[#1E202A] border-2 border-black dark:border-gray-700 rounded-2xl p-4 mb-6 shadow-neo-sm border-l-[6px] border-l-[#00E5FF]">
            <span className="text-[11px] font-black uppercase text-black dark:text-[#00E5FF] flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Automated Leftover Placement</span>
            </span>

            <div className="space-y-2">
              {leftoverSlots.map((slot, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2 px-3 rounded-xl bg-white dark:bg-[#16171E] border-2 border-black dark:border-gray-700 text-xs shadow-neo-sm"
                >
                  <span className="font-black text-gray-900 dark:text-white">Portion #{idx + 2}</span>
                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-[11px]">
                    <span className="font-black text-gray-900 dark:text-[#D4FF00]">{slot.dayLabel}</span>
                    <span>•</span>
                    <span className="capitalize font-bold">{slot.slot}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Confirm Button */}
        <button
          onClick={handleCook}
          className="w-full py-3 bg-[#FF5500] hover:bg-[#ff681a] text-white font-black text-xs uppercase tracking-wider rounded-2xl border-2 border-black shadow-neo hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-neo-lg active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
        >
          <ChefHat className="w-4 h-4" />
          <span>CONFIRM AND ALLOCATE {portions}X PORTIONS</span>
        </button>
      </motion.div>
    </div>
  );
}
