'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { X, Clock, ChefHat, ExternalLink, Trash2, RotateCcw } from 'lucide-react';
import { MealItem } from '@/types/meal';
import { getMealAccent, getMealInitials } from '@/lib/curated-foods';

interface MealDetailModalProps {
  meal: MealItem | null;
  isOpen: boolean;
  onClose: () => void;
  onCookClick: (meal: MealItem) => void;
  onMarkGoneEarly: (mealId: string, mealTitle: string) => void;
  onDeleteMeal: (mealId: string) => void;
}

export default function MealDetailModal({
  meal,
  isOpen,
  onClose,
  onCookClick,
  onMarkGoneEarly,
  onDeleteMeal,
}: MealDetailModalProps) {
  if (!isOpen || !meal) return null;

  const initials = getMealInitials(meal.title);
  const accent = meal.accentColor || getMealAccent(meal.title);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative w-full max-w-lg bg-white dark:bg-[#12141B] border border-gray-200 dark:border-black rounded-3xl overflow-hidden shadow-2xl text-gray-900 dark:text-white max-h-[90vh] flex flex-col transition-colors"
      >
        {/* Header Strip with Initials (NO IMAGES, NO EMOJIS) */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base text-white flex-shrink-0 shadow-sm"
              style={{ backgroundColor: accent }}
            >
              {initials}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {meal.mealType}
              </span>
              <h2 className="font-funky font-black text-lg text-gray-900 dark:text-white leading-snug">
                {meal.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#1C1F2B] border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Metadata Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-[#181A24] text-xs font-bold text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{meal.prepTimeMinutes || 15} min prep</span>
            </div>

            {meal.isLeftover && (
              <span className="px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold">
                Reheated Leftover
              </span>
            )}

            {meal.tags?.map((t) => (
              <span
                key={t}
                className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-[#181A24] text-gray-500 dark:text-gray-400 text-xs font-bold"
              >
                #{t}
              </span>
            ))}
          </div>

          {/* Macro Bento Stats */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-gray-50 dark:bg-[#181A24] border border-gray-100 dark:border-gray-800 rounded-2xl p-2.5">
              <span className="text-xs text-gray-400 font-bold block">Calories</span>
              <span className="text-base font-black text-gray-900 dark:text-[#D4FF00]">{meal.calories}</span>
              <span className="text-[9px] text-gray-400 block">kcal</span>
            </div>

            <div className="bg-gray-50 dark:bg-[#181A24] border border-gray-100 dark:border-gray-800 rounded-2xl p-2.5">
              <span className="text-xs text-gray-400 font-bold block">Protein</span>
              <span className="text-base font-black text-rose-600 dark:text-rose-400">{meal.protein}g</span>
              <span className="text-[9px] text-gray-400 block">protein</span>
            </div>

            <div className="bg-gray-50 dark:bg-[#181A24] border border-gray-100 dark:border-gray-800 rounded-2xl p-2.5">
              <span className="text-xs text-gray-400 font-bold block">Carbs</span>
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400">{meal.carbs}g</span>
              <span className="text-[9px] text-gray-400 block">carbs</span>
            </div>

            <div className="bg-gray-50 dark:bg-[#181A24] border border-gray-100 dark:border-gray-800 rounded-2xl p-2.5">
              <span className="text-xs text-gray-400 font-bold block">Fats</span>
              <span className="text-base font-black text-purple-600 dark:text-purple-400">{meal.fat}g</span>
              <span className="text-[9px] text-gray-400 block">fats</span>
            </div>
          </div>

          {/* Ingredients */}
          {meal.ingredients && meal.ingredients.length > 0 && (
            <div>
              <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-2">
                Ingredients
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {meal.ingredients.map((ing, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-[#181A24] border border-gray-200 dark:border-gray-800 text-xs font-medium flex items-center gap-1.5"
                  >
                    <span className="text-gray-900 dark:text-white font-bold">{ing.name}</span>
                    <span className="text-gray-500 dark:text-gray-400 text-[11px]">({ing.amount})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* External Recipe Link */}
          {meal.recipeUrl && (
            <div className="bg-gray-50 dark:bg-[#181A24] border border-gray-200 dark:border-gray-800 rounded-2xl p-3 flex items-center justify-between">
              <div className="text-xs truncate mr-2">
                <span className="text-gray-400 block text-[10px]">Reference Link</span>
                <span className="text-blue-600 dark:text-sky-400 font-bold truncate block">{meal.recipeUrl}</span>
              </div>
              <a
                href={meal.recipeUrl}
                target="_blank"
                rel="noreferrer"
                className="py-1.5 px-3 bg-gray-200 dark:bg-[#262938] hover:bg-gray-300 dark:hover:bg-[#34384c] text-gray-900 dark:text-white font-bold text-xs rounded-xl flex items-center gap-1 flex-shrink-0"
              >
                <span>Open</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 dark:bg-[#181A24] border-t border-gray-100 dark:border-gray-800 flex items-center gap-2">
          {!meal.isLeftover && (
            <button
              onClick={() => {
                onClose();
                onCookClick(meal);
              }}
              className="flex-1 py-2.5 bg-black hover:bg-gray-800 text-white dark:bg-[#D4FF00] dark:hover:bg-[#c3ed00] dark:text-black font-black text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
            >
              <ChefHat className="w-4 h-4" />
              <span>COOK AND MULTIPLY</span>
            </button>
          )}

          <button
            onClick={() => {
              onMarkGoneEarly(meal.id, meal.title);
              onClose();
            }}
            className="flex-1 py-2.5 bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-yellow-300 border border-amber-200 dark:border-yellow-500/30 hover:bg-amber-200 font-black text-xs rounded-xl transition-all flex items-center justify-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>GONE ALREADY?</span>
          </button>

          <button
            onClick={() => {
              onDeleteMeal(meal.id);
              onClose();
            }}
            className="p-2.5 bg-gray-200 dark:bg-[#262938] hover:bg-rose-100 text-gray-500 hover:text-rose-600 rounded-xl transition-colors"
            title="Delete meal"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
