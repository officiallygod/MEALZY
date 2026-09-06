'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Clock,
  Trash2,
  RotateCcw,
  Sparkles,
  Utensils,
  ArrowLeftRight,
  ChevronDown,
  Sun,
  Moon,
  Coffee,
  Copy,
} from 'lucide-react';
import { MealItem, MealType } from '@/types/meal';
import { getMealAccent, getMealInitials, cleanMealTitle } from '@/lib/curated-foods';
import { getTwistForDishTitle } from '@/lib/dish-database';
import { db } from '@/lib/db';
import confetti from 'canvas-confetti';

const DETAIL_SLOTS: { type: MealType; title: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { type: 'breakfast', title: 'Breakfast', icon: Sun },
  { type: 'lunch', title: 'Lunch', icon: Utensils },
  { type: 'dinner', title: 'Dinner', icon: Moon },
  { type: 'snack', title: 'Snacks', icon: Coffee },
];

interface MealDetailModalProps {
  meal: MealItem | null;
  isOpen: boolean;
  onClose: () => void;
  onCookClick?: (meal: MealItem) => void;
  onAteOutClick?: (meal: MealItem) => void;
  onMarkGoneEarly: (mealId: string, mealTitle: string) => void;
  onDeleteMeal: (mealId: string) => void;
  onDuplicateMeal?: (meal: MealItem) => void;
  onMoveMealSlot?: (mealId: string, targetDate: string, targetType: MealType) => void;
  rollingDays?: {
    dateString: string;
    dayName: string;
    dayNumber: number;
    fullDateFormatted?: string;
    isToday: boolean;
  }[];
}

export default function MealDetailModal({
  meal,
  isOpen,
  onClose,
  onCookClick,
  onAteOutClick,
  onMarkGoneEarly,
  onDeleteMeal,
  onDuplicateMeal,
  onMoveMealSlot,
  rollingDays,
}: MealDetailModalProps) {
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [moveTargetDate, setMoveTargetDate] = useState<string>('');
  const [showMoveDayPicker, setShowMoveDayPicker] = useState(false);

  useEffect(() => {
    if (meal) {
      setMoveTargetDate(meal.dateScheduled || rollingDays?.[0]?.dateString || '');
      setIsMoveOpen(false);
      setShowMoveDayPicker(false);
    }
  }, [meal, rollingDays]);

  const getDayLabel = (dateStr: string) => {
    if (!dateStr) return 'Today';
    if (!rollingDays || rollingDays.length === 0) return 'Today';
    const foundIndex = rollingDays.findIndex((d) => d.dateString === dateStr);
    if (foundIndex === 0) return 'Today';
    if (foundIndex === 1) return 'Tomorrow';
    const found = rollingDays[foundIndex];
    if (found) return `${found.dayName} ${found.dayNumber}`;
    return dateStr;
  };
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
                {cleanMealTitle(meal.title)}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={async () => {
                onClose();
                if (onDuplicateMeal) {
                  onDuplicateMeal(meal);
                } else {
                  const id = `meal-dup-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
                  await db.meals.add({
                    ...meal,
                    id,
                  });
                  confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
                }
              }}
              className="w-8 h-8 rounded-xl bg-[#FAF8F5] dark:bg-[#20222E] hover:bg-[#D4FF00] hover:text-black dark:hover:bg-[#D4FF00] dark:hover:text-black border-2 border-black dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 shadow-neo-sm active:scale-95 transition-all cursor-pointer"
              title="Duplicate Meal"
              aria-label="Duplicate Meal"
            >
              <Copy className="w-4 h-4 stroke-[2.5]" />
            </button>

            <button
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 rounded-xl bg-[#FAF8F5] dark:bg-[#20222E] border-2 border-black dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white shadow-neo-sm active:scale-95 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto scrollbar-none space-y-4 sm:space-y-5 flex-1 min-h-0">
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

            {meal.portions && meal.portions > 1 && (
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 border-2 border-black text-xs font-black shadow-neo-sm">
                {meal.portions} Portions
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
                className="mt-3 px-3 py-1.5 bg-[#D4FF00] hover:bg-[#c3ed00] text-black font-black text-xs rounded-xl border-2 border-black shadow-neo-sm active:scale-95 transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Switch to This Twist</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 bg-[#FAF8F5] dark:bg-[#16171E] border-t-2 border-black/10 dark:border-gray-800 transition-all flex-shrink-0">
          {isMoveOpen ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Day:
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowMoveDayPicker(!showMoveDayPicker)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border-2 border-black bg-[#FFE600] text-black font-black text-xs shadow-neo-sm hover:bg-yellow-300 active:scale-95 transition-all"
                    title="Click to choose a different day"
                  >
                    <span>{getDayLabel(moveTargetDate)}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMoveDayPicker ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsMoveOpen(false);
                    setShowMoveDayPicker(false);
                  }}
                  className="text-xs font-black uppercase text-gray-500 hover:text-black dark:hover:text-white px-2.5 py-1 rounded-xl border border-black/20 dark:border-gray-700 bg-white dark:bg-[#20222E] shadow-neo-sm active:scale-95 transition-colors"
                >
                  Cancel
                </button>
              </div>

              {/* Day Picker (hidden until clicked) */}
              {showMoveDayPicker && rollingDays && rollingDays.length > 0 && (
                <div className="p-2.5 rounded-2xl bg-white dark:bg-[#1C1E29] border-2 border-black dark:border-gray-700 shadow-neo-sm space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 block">
                    Choose Destination Day:
                  </span>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {rollingDays.map((d, idx) => {
                      const isSelected = d.dateString === moveTargetDate;
                      const label = idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : d.dayName;
                      return (
                        <button
                          key={d.dateString}
                          type="button"
                          onClick={() => {
                            setMoveTargetDate(d.dateString);
                            setShowMoveDayPicker(false);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase whitespace-nowrap border-2 transition-all active:scale-95 flex items-center gap-1 ${
                            isSelected
                              ? 'bg-black text-white border-black dark:bg-[#D4FF00] dark:text-black dark:border-black shadow-neo-sm'
                              : 'bg-[#FAF8F5] dark:bg-[#20222E] text-gray-700 dark:text-gray-300 border-black/20 dark:border-gray-700 hover:border-black'
                          }`}
                        >
                          <span>{label}</span>
                          <span className="text-[10px] opacity-70">({d.dayNumber})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Slot Target Buttons */}
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 block mb-1.5">
                  Select Meal Slot:
                </span>
                {(() => {
                  const availableSlots = DETAIL_SLOTS.filter(
                    (s) => !(moveTargetDate === meal.dateScheduled && s.type === meal.mealType)
                  );

                  return (
                    <div className={`grid gap-2 ${availableSlots.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
                      {availableSlots.map((slot) => {
                        const SlotIcon = slot.icon;
                        return (
                          <button
                            key={slot.type}
                            type="button"
                            onClick={() => {
                              if (onMoveMealSlot) {
                                onMoveMealSlot(meal.id, moveTargetDate, slot.type);
                              }
                              setIsMoveOpen(false);
                              onClose();
                            }}
                            className="py-2.5 px-2 text-center font-black text-xs uppercase rounded-xl border-2 border-black bg-white dark:bg-[#20222E] hover:bg-[#00E5FF] hover:text-black dark:hover:bg-[#00E5FF] dark:hover:text-black transition-colors shadow-neo-sm active:scale-95 flex items-center justify-center gap-1.5"
                          >
                            <SlotIcon className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{slot.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2 w-full">
              {onAteOutClick && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onAteOutClick(meal);
                  }}
                  className="flex-1 min-w-0 py-2.5 px-2 sm:px-3 bg-[#00E5FF] hover:bg-[#00cbe2] text-black font-black text-[11px] sm:text-xs uppercase rounded-xl border-2 border-black shadow-neo-sm active:scale-95 transition-colors flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap cursor-pointer"
                  title="Ate out or had something else? Log meal and save leftovers."
                >
                  <Utensils className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate">ATE OUT?</span>
                </button>
              )}

              {onMoveMealSlot && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMoveOpen(true);
                    setMoveTargetDate(meal.dateScheduled || rollingDays?.[0]?.dateString || '');
                    setShowMoveDayPicker(false);
                  }}
                  className="flex-1 min-w-0 py-2.5 px-2 sm:px-3 bg-white dark:bg-[#20222E] hover:bg-[#FFE600] hover:text-black dark:hover:bg-[#FFE600] dark:hover:text-black text-gray-800 dark:text-white font-black text-[11px] sm:text-xs uppercase rounded-xl border-2 border-black shadow-neo-sm active:scale-95 transition-colors flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap cursor-pointer"
                  title="Move to another meal slot or day"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">MOVE</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onMarkGoneEarly(meal.id, meal.title);
                  onClose();
                }}
                className="flex-1 min-w-0 py-2.5 px-2 sm:px-3 bg-[#FFE600] hover:bg-yellow-400 text-black font-black text-[11px] sm:text-xs uppercase rounded-xl border-2 border-black shadow-neo-sm active:scale-95 transition-colors flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer"
                title="Mark dish as gone early"
              >
                <RotateCcw className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">GONE?</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onDeleteMeal(meal.id);
                  onClose();
                }}
                className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 bg-white dark:bg-[#20222E] hover:bg-rose-100 text-gray-500 hover:text-rose-600 rounded-xl border-2 border-black shadow-neo-sm active:scale-95 transition-colors flex items-center justify-center cursor-pointer"
                title="Delete meal"
                aria-label="Delete meal"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
