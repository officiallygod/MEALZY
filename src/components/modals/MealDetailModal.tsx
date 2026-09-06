'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { X, Clock, ChefHat, Trash2, RotateCcw, Sparkles } from 'lucide-react';
import { MealItem } from '@/types/meal';
import { getMealAccent, getMealInitials } from '@/lib/curated-foods';
import { getTwistForDishTitle } from '@/lib/dish-database';
import { db } from '@/lib/db';
import confetti from 'canvas-confetti';

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
  const twist = getTwistForDishTitle(meal.title);
  const isTwistAlreadyApplied = meal.tags?.includes('twist-applied');

  const handleApplyTwist = async () => {
    if (!twist) return;

    await db.meals.update(meal.id, {
      title: twist.title,
      calories: meal.calories + twist.caloriesDelta,
      protein: meal.protein + twist.proteinDelta,
      tags: [...(meal.tags || []).filter((t) => t !== 'twist-applied'), 'twist-applied'],
    });

    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.6 },
      colors: ['#D4FF00', '#10B981', '#06B6D4'],
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative w-full max-w-lg bg-white dark:bg-[#16171E] border-2 border-black dark:border-gray-700 rounded-3xl overflow-hidden shadow-neo-xl text-gray-900 dark:text-white max-h-[90vh] flex flex-col transition-colors"
      >
        {/* Header Strip with Initials (NO IMAGES, NO EMOJIS) */}
        <div className="p-6 border-b-2 border-black/10 dark:border-gray-800 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base text-white flex-shrink-0 border-2 border-black shadow-neo-sm"
              style={{ backgroundColor: accent }}
            >
              {initials}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {meal.mealType}
              </span>
              <h2 className="font-funky font-black text-xl text-gray-900 dark:text-white leading-snug">
                {meal.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#FAF8F5] dark:bg-[#20222E] border-2 border-black dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 transition-all"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Metadata Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-3 py-1 rounded-full bg-[#FAF8F5] dark:bg-[#1E202A] text-xs font-black text-gray-700 dark:text-gray-300 border-2 border-black dark:border-gray-700 flex items-center gap-1.5 shadow-neo-sm">
              <Clock className="w-3.5 h-3.5" />
              <span>{meal.prepTimeMinutes || 15} min prep</span>
            </div>

            {meal.isLeftover && (
              <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 border-2 border-black text-xs font-black shadow-neo-sm">
                Reheated Leftover
              </span>
            )}

            {isTwistAlreadyApplied && (
              <span className="px-3 py-1 rounded-full bg-[#D4FF00] text-black border-2 border-black text-xs font-black shadow-neo-sm flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Twist Applied</span>
              </span>
            )}

            {meal.tags
              ?.filter((t) => t !== 'twist-applied')
              .map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 rounded-full bg-white dark:bg-[#20222E] text-gray-600 dark:text-gray-300 text-xs font-bold border border-black/30 dark:border-gray-700 shadow-neo-sm"
                >
                  #{t}
                </span>
              ))}
          </div>

          {/* Macro Bento Stats */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-[#FAF8F5] dark:bg-[#1E202A] border-2 border-black dark:border-gray-700 rounded-2xl p-2.5 shadow-neo-sm border-l-[4px] border-l-[#D4FF00]">
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase block">Energy</span>
              <span className="text-base font-black text-gray-900 dark:text-[#D4FF00]">{meal.calories}</span>
              <span className="text-[9px] text-gray-400 font-bold block">kcal</span>
            </div>

            <div className="bg-[#FAF8F5] dark:bg-[#1E202A] border-2 border-black dark:border-gray-700 rounded-2xl p-2.5 shadow-neo-sm border-l-[4px] border-l-rose-500">
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase block">Protein</span>
              <span className="text-base font-black text-rose-600 dark:text-rose-400">{meal.protein}g</span>
              <span className="text-[9px] text-gray-400 font-bold block">protein</span>
            </div>

            <div className="bg-[#FAF8F5] dark:bg-[#1E202A] border-2 border-black dark:border-gray-700 rounded-2xl p-2.5 shadow-neo-sm border-l-[4px] border-l-[#00E5FF]">
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase block">Carbs</span>
              <span className="text-base font-black text-sky-600 dark:text-sky-400">{meal.carbs}g</span>
              <span className="text-[9px] text-gray-400 font-bold block">carbs</span>
            </div>

            <div className="bg-[#FAF8F5] dark:bg-[#1E202A] border-2 border-black dark:border-gray-700 rounded-2xl p-2.5 shadow-neo-sm border-l-[4px] border-l-purple-500">
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase block">Fats</span>
              <span className="text-base font-black text-purple-600 dark:text-purple-400">{meal.fat}g</span>
              <span className="text-[9px] text-gray-400 font-bold block">fats</span>
            </div>
          </div>

          {/* Contextual Flavor Twist Recommendation */}
          {twist && !isTwistAlreadyApplied && (
            <div className="bg-[#FAF8F5] dark:bg-[#1E202A] border-2 border-black dark:border-gray-700 rounded-2xl p-4 shadow-neo-sm border-l-[6px] border-l-[#D4FF00] transition-colors">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-black dark:text-[#D4FF00] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Chef&apos;s Twist Idea</span>
                </span>
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                  +{twist.caloriesDelta} kcal • +{twist.proteinDelta}g P
                </span>
              </div>

              <h4 className="font-bold text-xs text-gray-900 dark:text-white">
                {twist.title}
              </h4>
              <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-1 leading-relaxed font-medium">
                {twist.description}
              </p>

              <button
                type="button"
                onClick={handleApplyTwist}
                className="mt-3 px-3 py-1.5 bg-[#D4FF00] hover:bg-[#c3ed00] text-black font-black text-xs rounded-xl border-2 border-black shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Switch to This Twist</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#FAF8F5] dark:bg-[#16171E] border-t-2 border-black/10 dark:border-gray-800 flex items-center gap-2.5">
          {!meal.isLeftover && (
            <button
              onClick={() => {
                onClose();
                onCookClick(meal);
              }}
              className="flex-1 py-2.5 bg-[#FF5500] hover:bg-[#ff681a] text-white font-black text-xs uppercase rounded-xl border-2 border-black shadow-neo hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5"
            >
              <ChefHat className="w-4 h-4" />
              <span>COOK &amp; MULTIPLY</span>
            </button>
          )}

          <button
            onClick={() => {
              onMarkGoneEarly(meal.id, meal.title);
              onClose();
            }}
            className="flex-1 py-2.5 bg-[#FFE600] hover:bg-yellow-400 text-black font-black text-xs uppercase rounded-xl border-2 border-black shadow-neo hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>GONE ALREADY?</span>
          </button>

          <button
            onClick={() => {
              onDeleteMeal(meal.id);
              onClose();
            }}
            className="p-2.5 bg-white dark:bg-[#20222E] hover:bg-rose-100 text-gray-500 hover:text-rose-600 rounded-xl border-2 border-black shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 transition-all"
            title="Delete meal"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
