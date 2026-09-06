'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ChefHat, Calendar, Check, ArrowRight } from 'lucide-react';
import { MealItem, MealType } from '@/types/meal';
import confetti from 'canvas-confetti';

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
  const [portions, setPortions] = useState<number>(3); // default 3x as requested

  if (!isOpen || !meal) return null;

  // Compute upcoming dates for leftovers
  const leftoverSlots: { date: string; slot: MealType; dayLabel: string }[] = [];
  for (let i = 1; i < portions; i++) {
    const dayObj = rollingDays[i] || rollingDays[rollingDays.length - 1];
    // Alternate lunch / dinner
    const slot: MealType = meal.mealType === 'lunch' ? 'lunch' : 'dinner';
    leftoverSlots.push({
      date: dayObj.dateString,
      slot,
      dayLabel: `${dayObj.dayName} (${dayObj.dayNumber})`,
    });
  }

  const handleCook = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#D4FF00', '#FF5C5C', '#C084FC', '#22C55E'],
    });

    onConfirmCook(
      meal,
      portions,
      leftoverSlots.map((s) => ({ date: s.date, slot: s.slot }))
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative w-full max-w-lg bg-[#12141B] border-2 border-black rounded-3xl p-6 shadow-[6px_6px_0px_#D4FF00] text-white"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#1C1F2B] border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-[#D4FF00] border-2 border-black flex items-center justify-center text-black font-black shadow-neo text-2xl">
            🍳
          </div>
          <div>
            <h3 className="font-funky font-black text-xl text-white">COOK ONCE, EAT MULTIPLE</h3>
            <p className="text-xs text-gray-400">Cooking: <span className="text-[#D4FF00] font-bold">{meal.title}</span></p>
          </div>
        </div>

        {/* Portions Selector */}
        <div className="my-5">
          <label className="block text-xs font-black uppercase text-gray-400 mb-2">
            How many times will you eat this?
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setPortions(num)}
                className={`py-3 px-2 rounded-2xl border-2 font-black transition-all flex flex-col items-center justify-center gap-0.5 ${
                  portions === num
                    ? 'bg-[#D4FF00] border-black text-black shadow-neo scale-105'
                    : 'bg-[#181A24] border-gray-800 text-gray-300 hover:border-gray-600'
                }`}
              >
                <span className="text-base font-funky">{num}x</span>
                <span className="text-[10px] font-bold opacity-80">
                  {num === 1 ? 'Just Today' : num === 2 ? 'Cook 1 Eat 2' : num === 3 ? '3 Portions' : 'Meal Prep 👑'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Scheduled Leftovers Preview */}
        {portions > 1 && (
          <div className="bg-[#181A24] border border-gray-800 rounded-2xl p-4 mb-6">
            <span className="text-[11px] font-extrabold uppercase text-[#C084FC] flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Auto-Scheduled Leftover Slots</span>
            </span>

            <div className="space-y-2">
              {leftoverSlots.map((slot, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-[#1E212E] border border-gray-700/60 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🥡</span>
                    <span className="font-bold text-white">Leftover Portion #{idx + 2}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-400 text-[11px]">
                    <span className="text-[#D4FF00] font-bold">{slot.dayLabel}</span>
                    <span>•</span>
                    <span className="capitalize">{slot.slot}</span>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-gray-400 mt-2.5">
              These will be placed on your calendar and tracked in your Fridge Radar so they never spoil!
            </p>
          </div>
        )}

        {/* Action button */}
        <button
          onClick={handleCook}
          className="w-full py-3.5 bg-[#D4FF00] hover:bg-[#c3ed00] text-black font-black text-sm rounded-2xl shadow-neo transition-all active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-2"
        >
          <ChefHat className="w-4 h-4" />
          <span>CONFIRM & COOK {portions}X PORTIONS</span>
        </button>
      </motion.div>
    </div>
  );
}
