'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Flame, ChefHat, ExternalLink, Trash2, CheckCircle2, RotateCcw } from 'lucide-react';
import { MealItem } from '@/types/meal';
import Image from 'next/image';

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative w-full max-w-lg bg-[#12141B] border-2 border-black rounded-3xl overflow-hidden shadow-[6px_6px_0px_#D4FF00] text-white max-h-[90vh] flex flex-col"
      >
        {/* Hero Visual */}
        <div className="relative h-48 w-full bg-[#181A24] border-b border-gray-800 flex items-center justify-center overflow-hidden flex-shrink-0">
          {meal.imageUrl ? (
            <Image
              src={meal.imageUrl}
              alt={meal.title}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div
              className="w-full h-full flex flex-col items-center justify-center text-center p-6"
              style={{
                background: `linear-gradient(135deg, #181A24 0%, ${meal.accentColor || '#C084FC'}33 100%)`,
              }}
            >
              <span className="text-5xl mb-2">{meal.customEmoji || '🍽️'}</span>
              <span className="font-funky font-black text-xl text-white">{meal.title}</span>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:scale-105 transition-transform z-10"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Tag Badges */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 flex-wrap z-10">
            {meal.tags?.map((t) => (
              <span
                key={t}
                className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/80 backdrop-blur-md text-[#D4FF00] border border-[#D4FF00]/40"
              >
                #{t}
              </span>
            ))}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          <div>
            <h2 className="font-funky font-black text-xl text-white">{meal.title}</h2>
            <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
              <span className="capitalize text-[#D4FF00] font-extrabold">{meal.mealType}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {meal.prepTimeMinutes || 15} mins prep
              </span>
              {meal.isLeftover && (
                <>
                  <span>•</span>
                  <span className="text-[#C084FC] font-extrabold">Reheated Leftover</span>
                </>
              )}
            </div>
          </div>

          {/* Macro Rings / Bento Grid Stat Cards */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-[#181A24] border border-gray-800 rounded-2xl p-2.5">
              <span className="text-xs text-gray-400 font-bold block">Calories</span>
              <span className="text-base font-black text-[#D4FF00]">{meal.calories}</span>
              <span className="text-[9px] text-gray-500 block">kcal</span>
            </div>

            <div className="bg-[#181A24] border border-gray-800 rounded-2xl p-2.5">
              <span className="text-xs text-gray-400 font-bold block">Protein</span>
              <span className="text-base font-black text-[#FF5C5C]">{meal.protein}g</span>
              <span className="text-[9px] text-gray-500 block">muscle</span>
            </div>

            <div className="bg-[#181A24] border border-gray-800 rounded-2xl p-2.5">
              <span className="text-xs text-gray-400 font-bold block">Carbs</span>
              <span className="text-base font-black text-[#22C55E]">{meal.carbs}g</span>
              <span className="text-[9px] text-gray-500 block">energy</span>
            </div>

            <div className="bg-[#181A24] border border-gray-800 rounded-2xl p-2.5">
              <span className="text-xs text-gray-400 font-bold block">Fats</span>
              <span className="text-base font-black text-[#C084FC]">{meal.fat}g</span>
              <span className="text-[9px] text-gray-500 block">healthy</span>
            </div>
          </div>

          {/* Ingredients List */}
          {meal.ingredients && meal.ingredients.length > 0 && (
            <div>
              <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-2">
                Ingredients Required
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {meal.ingredients.map((ing, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-1.5 rounded-xl bg-[#181A24] border border-gray-800 text-xs font-medium flex items-center gap-1.5"
                  >
                    <span className="text-white font-bold">{ing.name}</span>
                    <span className="text-gray-400 text-[11px]">({ing.amount})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* External Recipe Link if pasted */}
          {meal.recipeUrl && (
            <div className="bg-[#181A24] border border-gray-800 rounded-2xl p-3 flex items-center justify-between">
              <div className="text-xs truncate mr-2">
                <span className="text-gray-400 block text-[10px]">Recipe Bookmark</span>
                <span className="text-[#38BDF8] font-bold truncate block">{meal.recipeUrl}</span>
              </div>
              <a
                href={meal.recipeUrl}
                target="_blank"
                rel="noreferrer"
                className="py-1.5 px-3 bg-[#262938] hover:bg-[#34384c] text-white font-bold text-xs rounded-xl flex items-center gap-1 flex-shrink-0"
              >
                <span>Open</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#181A24] border-t border-gray-800 flex items-center gap-2">
          {!meal.isLeftover && (
            <button
              onClick={() => {
                onClose();
                onCookClick(meal);
              }}
              className="flex-1 py-3 bg-[#D4FF00] hover:bg-[#c3ed00] text-black font-black text-xs rounded-xl shadow-neo transition-all flex items-center justify-center gap-1.5"
            >
              <ChefHat className="w-4 h-4" />
              <span>COOK & MULTIPLY</span>
            </button>
          )}

          <button
            onClick={() => {
              onMarkGoneEarly(meal.id, meal.title);
              onClose();
            }}
            className="flex-1 py-3 bg-[#262938] hover:bg-yellow-400 hover:text-black text-yellow-300 font-black text-xs rounded-xl border border-yellow-500/30 transition-all flex items-center justify-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>GONE ALREADY? REPLAN</span>
          </button>

          <button
            onClick={() => {
              onDeleteMeal(meal.id);
              onClose();
            }}
            className="p-3 bg-[#262938] hover:bg-red-950 text-gray-400 hover:text-red-400 rounded-xl border border-gray-800 transition-colors"
            title="Delete meal"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
