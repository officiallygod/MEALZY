'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, RefreshCw, Check, Sun, Utensils, Moon, Coffee } from 'lucide-react';
import { MealItem, MealType } from '@/types/meal';
import { CURATED_FOODS, getMealAccent } from '@/lib/curated-foods';

interface SuggestedSlotMeal {
  slot: MealType;
  dish: typeof CURATED_FOODS[number];
}

interface AutoFillSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetDate: string;
  missingSlots: MealType[];
  onApplySuggestions: (meals: Omit<MealItem, 'id'>[]) => void;
}

const SLOT_ICONS: Record<MealType, React.ComponentType<{ className?: string }>> = {
  breakfast: Sun,
  lunch: Utensils,
  dinner: Moon,
  snack: Coffee,
};

const SLOT_COLORS: Record<MealType, { bg: string; text: string; label: string }> = {
  breakfast: { bg: 'bg-[#FFE600]', text: 'text-black', label: 'Breakfast' },
  lunch: { bg: 'bg-[#00E5FF]', text: 'text-black', label: 'Lunch' },
  dinner: { bg: 'bg-[#FF5500]', text: 'text-white', label: 'Dinner' },
  snack: { bg: 'bg-[#D4FF00]', text: 'text-black', label: 'Snack' },
};

function getRandomDishForSlot(slot: MealType, currentTitle?: string) {
  const candidates = CURATED_FOODS.filter((f) => f.category === slot);
  const filtered = currentTitle ? candidates.filter((f) => f.title !== currentTitle) : candidates;
  const list = filtered.length > 0 ? filtered : candidates;
  return list[Math.floor(Math.random() * list.length)] || CURATED_FOODS[0];
}

export default function AutoFillSuggestionModal({
  isOpen,
  onClose,
  targetDate,
  missingSlots,
  onApplySuggestions,
}: AutoFillSuggestionModalProps) {
  const [suggestions, setSuggestions] = useState<SuggestedSlotMeal[]>(() =>
    missingSlots.map((slot) => ({
      slot,
      dish: getRandomDishForSlot(slot),
    }))
  );

  // Re-sync if missingSlots changes when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSuggestions(
        missingSlots.map((slot) => ({
          slot,
          dish: getRandomDishForSlot(slot),
        }))
      );
    }
  }, [isOpen, missingSlots]);

  if (!isOpen || missingSlots.length === 0) return null;

  const handleShuffleSlot = (slot: MealType) => {
    setSuggestions((prev) =>
      prev.map((item) => {
        if (item.slot === slot) {
          return {
            slot,
            dish: getRandomDishForSlot(slot, item.dish.title),
          };
        }
        return item;
      })
    );
  };

  const handleShuffleAll = () => {
    setSuggestions((prev) =>
      prev.map((item) => ({
        slot: item.slot,
        dish: getRandomDishForSlot(item.slot, item.dish.title),
      }))
    );
  };

  const handleConfirm = () => {
    const newMeals: Omit<MealItem, 'id'>[] = suggestions.map(({ slot, dish }) => ({
      title: dish.title,
      mealType: slot,
      calories: dish.calories,
      protein: dish.protein,
      carbs: dish.carbs,
      fat: dish.fat,
      prepTimeMinutes: dish.prepTimeMinutes,
      ingredients: dish.defaultIngredients,
      tags: dish.tags,
      dateScheduled: targetDate,
      accentColor: dish.accentColor || getMealAccent(dish.title),
    }));

    onApplySuggestions(newMeals);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative w-full max-w-lg bg-white dark:bg-[#16171E] border-2 border-black dark:border-gray-700 rounded-3xl p-6 shadow-neo-xl text-gray-900 dark:text-white max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-[#FAF8F5] dark:bg-[#20222E] border-2 border-black dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white shadow-neo-sm active:scale-95 transition-colors"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Header */}
        <div className="flex-shrink-0 mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4FF00] text-black font-black text-xs uppercase border-2 border-black shadow-neo-sm mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Smart Auto-Fill Suggestions</span>
          </div>
          <h2 className="text-2xl font-funky font-black tracking-tight text-gray-900 dark:text-white">
            SUGGESTED MEAL PLAN
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-bold">
            Review the suggestions below for {targetDate}. Re-roll any meal you want or apply all with one click.
          </p>
        </div>

        {/* Scrollable Suggestions List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-3 pb-2">
          {suggestions.map(({ slot, dish }) => {
            const Icon = SLOT_ICONS[slot];
            const meta = SLOT_COLORS[slot];

            return (
              <div
                key={slot}
                className="p-3.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#1E202A] border-2 border-black dark:border-gray-700 shadow-neo-sm flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl ${meta.bg} ${meta.text} border-2 border-black flex items-center justify-center flex-shrink-0 shadow-neo-sm`}
                  >
                    <Icon className="w-4 h-4 stroke-[2.5]" />
                  </div>

                  <div className="min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 block">
                      {meta.label}
                    </span>
                    <h4 className="font-bold text-xs text-gray-900 dark:text-white truncate">
                      {dish.title}
                    </h4>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400 font-bold mt-0.5">
                      <span className="text-gray-900 dark:text-[#D4FF00] font-black">
                        {dish.calories} kcal
                      </span>
                      <span>•</span>
                      <span>{dish.protein}g P</span>
                      <span>•</span>
                      <span>{dish.prepTimeMinutes}m</span>
                    </div>
                  </div>
                </div>

                {/* Re-roll this slot */}
                <button
                  type="button"
                  onClick={() => handleShuffleSlot(slot)}
                  className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#282B38] hover:bg-[#FFE600] hover:text-black text-gray-700 dark:text-gray-200 border-2 border-black dark:border-gray-700 shadow-neo-sm text-[11px] font-black flex items-center gap-1 flex-shrink-0 transition-colors active:scale-95"
                  title="Shuffle this meal"
                >
                  <RefreshCw className="w-3 h-3 stroke-[2.5]" />
                  <span>Shuffle</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex-shrink-0 pt-3 border-t-2 border-black/10 dark:border-white/10 flex items-center gap-2">
          <button
            type="button"
            onClick={handleShuffleAll}
            className="py-3 px-4 rounded-2xl bg-white dark:bg-[#20222E] hover:bg-gray-100 dark:hover:bg-[#2b2e3e] text-gray-900 dark:text-white font-black text-xs uppercase border-2 border-black dark:border-gray-700 shadow-neo active:scale-95 transition-colors flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Shuffle All</span>
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-3 bg-[#D4FF00] hover:bg-[#c3ed00] text-black font-black text-xs uppercase tracking-wider rounded-2xl border-2 border-black shadow-neo active:scale-95 transition-colors flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Apply Suggestions ({suggestions.length})</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
