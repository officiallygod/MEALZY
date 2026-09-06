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
        className="relative w-full max-w-lg bg-white dark:bg-[#12141B] border border-gray-200 dark:border-black rounded-3xl p-6 shadow-2xl text-gray-900 dark:text-white transition-colors"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 dark:bg-[#1C1F2B] border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-[#181A24] border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-900 dark:text-[#D4FF00]">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-funky font-black text-lg text-gray-900 dark:text-white">BATCH COOKING SCHEDULER</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Meal: <span className="font-bold text-gray-900 dark:text-white">{meal.title}</span></p>
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
                className={`py-3 px-2 rounded-2xl border font-black transition-all flex flex-col items-center justify-center gap-0.5 ${
                  portions === num
                    ? 'bg-black text-white dark:bg-[#D4FF00] dark:text-black border-black dark:border-[#D4FF00] shadow-sm scale-102'
                    : 'bg-gray-50 dark:bg-[#181A24] border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                }`}
              >
                <span className="text-base font-funky">{num}x</span>
                <span className="text-[10px] font-bold opacity-80">
                  {num === 1 ? 'Single' : num === 2 ? '2 Portions' : num === 3 ? '3 Portions' : 'Batch Prep'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Leftover Allocation Preview */}
        {portions > 1 && (
          <div className="bg-gray-50 dark:bg-[#181A24] border border-gray-200 dark:border-gray-800 rounded-2xl p-4 mb-6">
            <span className="text-[11px] font-extrabold uppercase text-purple-700 dark:text-[#C084FC] flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Automated Leftover Placement</span>
            </span>

            <div className="space-y-2">
              {leftoverSlots.map((slot, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-white dark:bg-[#1E212E] border border-gray-200 dark:border-gray-700/60 text-xs"
                >
                  <span className="font-bold text-gray-900 dark:text-white">Portion #{idx + 2}</span>
                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-[11px]">
                    <span className="font-bold text-gray-900 dark:text-[#D4FF00]">{slot.dayLabel}</span>
                    <span>•</span>
                    <span className="capitalize">{slot.slot}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Confirm Button */}
        <button
          onClick={handleCook}
          className="w-full py-3 bg-black hover:bg-gray-800 text-white dark:bg-[#D4FF00] dark:hover:bg-[#c3ed00] dark:text-black font-black text-xs rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2"
        >
          <ChefHat className="w-4 h-4" />
          <span>CONFIRM AND ALLOCATE {portions}X PORTIONS</span>
        </button>
      </motion.div>
    </div>
  );
}
