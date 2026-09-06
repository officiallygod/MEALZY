'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Flame, Clock, Sparkles, Check, Trash2, ArrowUpDown, ChevronRight, GripVertical } from 'lucide-react';
import { MealItem, MealType } from '@/types/meal';
import Image from 'next/image';

interface KanbanBentoBoardProps {
  days: {
    dateString: string;
    dayName: string;
    dayNumber: number;
    fullDateFormatted: string;
    isToday: boolean;
  }[];
  selectedDate: string;
  meals: MealItem[];
  isAllDaysView: boolean;
  onSelectMeal: (meal: MealItem) => void;
  onQuickAddMeal: (dateString: string, mealType: MealType) => void;
  onMoveMealSlot: (mealId: string, targetDate: string, targetType: MealType) => void;
  onCookMeal: (meal: MealItem) => void;
  onMarkGoneEarly: (mealId: string, mealTitle: string) => void;
  onDeleteMeal: (mealId: string) => void;
}

const MEAL_SLOTS: { type: MealType; title: string; emoji: string; accent: string }[] = [
  { type: 'breakfast', title: 'Breakfast', emoji: '🍳', accent: '#D4FF00' },
  { type: 'lunch', title: 'Lunch', emoji: '🥪', accent: '#22C55E' },
  { type: 'dinner', title: 'Dinner', emoji: '🍜', accent: '#C084FC' },
  { type: 'snack', title: 'Snacks & Sips', emoji: '🫐', accent: '#FF5C5C' },
];

export default function KanbanBentoBoard({
  days,
  selectedDate,
  meals,
  isAllDaysView,
  onSelectMeal,
  onQuickAddMeal,
  onMoveMealSlot,
  onCookMeal,
  onMarkGoneEarly,
  onDeleteMeal,
}: KanbanBentoBoardProps) {
  const [draggedMealId, setDraggedMealId] = useState<string | null>(null);
  const [activeDropZone, setActiveDropZone] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, mealId: string) => {
    e.dataTransfer.setData('text/plain', mealId);
    setDraggedMealId(mealId);
  };

  const handleDragOver = (e: React.DragEvent, zoneKey: string) => {
    e.preventDefault();
    if (activeDropZone !== zoneKey) {
      setActiveDropZone(zoneKey);
    }
  };

  const handleDrop = (e: React.DragEvent, targetDate: string, targetType: MealType) => {
    e.preventDefault();
    const mealId = e.dataTransfer.getData('text/plain') || draggedMealId;
    if (mealId) {
      onMoveMealSlot(mealId, targetDate, targetType);
    }
    setDraggedMealId(null);
    setActiveDropZone(null);
  };

  // If in Day Bento mode, filter specifically to selectedDate
  const daysToRender = isAllDaysView
    ? days
    : days.filter((d) => d.dateString === selectedDate);

  return (
    <div className="w-full">
      {/* 7-Day Board or Day Bento Grid */}
      <div
        className={`grid gap-5 ${
          isAllDaysView
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7'
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
        }`}
      >
        {daysToRender.map((day) => {
          const dayMeals = meals.filter((m) => m.dateScheduled === day.dateString);
          const totalCalories = dayMeals.reduce((acc, m) => acc + (m.calories || 0), 0);
          const totalProtein = dayMeals.reduce((acc, m) => acc + (m.protein || 0), 0);

          return (
            <div
              key={day.dateString}
              className={`bg-[#12141B] rounded-3xl p-4 border-2 transition-all flex flex-col ${
                day.isToday
                  ? 'border-[#D4FF00]/80 shadow-[4px_4px_0px_#D4FF00]'
                  : 'border-[#262938] shadow-neo'
              }`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black font-funky text-white uppercase tracking-wider">
                    {day.dayName}
                  </span>
                  {day.isToday && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-[#D4FF00] text-black">
                      TODAY
                    </span>
                  )}
                  <span className="text-xs text-gray-400 font-bold">{day.dayNumber}</span>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black text-[#D4FF00]">{totalCalories}</span>
                  <span className="text-[10px] text-gray-500 font-bold"> kcal</span>
                </div>
              </div>

              {/* Swimlanes: Breakfast, Lunch, Dinner, Snack */}
              <div className="flex-1 flex flex-col gap-3">
                {MEAL_SLOTS.map((slot) => {
                  const slotMeals = dayMeals.filter((m) => m.mealType === slot.type);
                  const zoneKey = `${day.dateString}_${slot.type}`;
                  const isHovered = activeDropZone === zoneKey;

                  return (
                    <div
                      key={slot.type}
                      onDragOver={(e) => handleDragOver(e, zoneKey)}
                      onDragLeave={() => setActiveDropZone(null)}
                      onDrop={(e) => handleDrop(e, day.dateString, slot.type)}
                      className={`min-h-[90px] rounded-2xl p-2.5 transition-all flex flex-col justify-between border ${
                        isHovered
                          ? 'bg-[#D4FF00]/10 border-2 border-dashed border-[#D4FF00] scale-[1.02]'
                          : 'bg-[#181A24]/90 border-gray-800/80 hover:border-gray-700'
                      }`}
                    >
                      {/* Slot Label & Add Button */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs">{slot.emoji}</span>
                          <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
                            {slot.title}
                          </span>
                        </div>

                        <button
                          onClick={() => onQuickAddMeal(day.dateString, slot.type)}
                          className="w-5 h-5 rounded-lg bg-[#262938] hover:bg-[#D4FF00] text-gray-400 hover:text-black flex items-center justify-center transition-colors"
                          title={`Add to ${slot.title}`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Drop Target Indicator when dragging */}
                      {isHovered && (
                        <div className="py-3 text-center text-xs font-black text-[#D4FF00] animate-pulse">
                          DROP HERE ⚡
                        </div>
                      )}

                      {/* Meals in this Slot */}
                      <div className="space-y-2">
                        <AnimatePresence>
                          {slotMeals.map((meal) => (
                            <motion.div
                              key={meal.id}
                              layout
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              draggable
                              onDragStart={(e: any) => handleDragStart(e, meal.id)}
                              className="group relative bg-[#1E212E] hover:bg-[#25293A] border border-gray-700 rounded-xl p-2.5 shadow-sm cursor-grab active:cursor-grabbing transition-all"
                            >
                              <div className="flex items-start gap-2.5">
                                {/* Food Visual: Curated High-Res Image OR Funky Neo-Graphic Emblem (NO "no image available") */}
                                {meal.imageUrl ? (
                                  <div className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 border border-black/40">
                                    <Image
                                      src={meal.imageUrl}
                                      alt={meal.title}
                                      fill
                                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                                      unoptimized
                                    />
                                  </div>
                                ) : (
                                  <div
                                    className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 text-xl border border-black/30 shadow-inner"
                                    style={{
                                      backgroundColor: meal.accentColor || '#D4FF00',
                                    }}
                                  >
                                    <span>{meal.customEmoji || '🍽️'}</span>
                                  </div>
                                )}

                                {/* Meal Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h4
                                      onClick={() => onSelectMeal(meal)}
                                      className="font-funky font-bold text-xs text-white truncate hover:text-[#D4FF00] cursor-pointer"
                                    >
                                      {meal.title}
                                    </h4>
                                    {meal.isLeftover && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-[#C084FC]/20 text-[#C084FC] border border-[#C084FC]/40">
                                        LEFTOVER
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400 font-bold">
                                    <span className="text-[#D4FF00]">{meal.calories} kcal</span>
                                    <span>•</span>
                                    <span>{meal.protein}g P</span>
                                    {meal.prepTimeMinutes && (
                                      <>
                                        <span>•</span>
                                        <span className="flex items-center gap-0.5">
                                          <Clock className="w-2.5 h-2.5" />
                                          {meal.prepTimeMinutes}m
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Quick Actions Hover Dock */}
                              <div className="mt-2 pt-2 border-t border-gray-800/80 flex items-center justify-between text-[10px]">
                                <div className="flex items-center gap-1">
                                  {!meal.isLeftover && (
                                    <button
                                      onClick={() => onCookMeal(meal)}
                                      className="px-2 py-0.5 rounded-md bg-[#262938] hover:bg-[#D4FF00] hover:text-black text-gray-300 font-bold transition-colors flex items-center gap-1"
                                      title="Cook & schedule leftovers"
                                    >
                                      <span>Cook</span>
                                    </button>
                                  )}

                                  <button
                                    onClick={() => onMarkGoneEarly(meal.id, meal.title)}
                                    className="px-2 py-0.5 rounded-md bg-[#262938] hover:bg-yellow-400 hover:text-black text-yellow-300 font-bold transition-colors"
                                    title="Eaten before expected? Clear and replan!"
                                  >
                                    Gone?
                                  </button>
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => onSelectMeal(meal)}
                                    className="p-1 text-gray-400 hover:text-white"
                                    title="View recipe details"
                                  >
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => onDeleteMeal(meal.id)}
                                    className="p-1 text-gray-500 hover:text-red-400"
                                    title="Remove from plan"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>

                        {slotMeals.length === 0 && !isHovered && (
                          <div
                            onClick={() => onQuickAddMeal(day.dateString, slot.type)}
                            className="py-3 px-2 text-center text-[10px] font-bold text-gray-600 hover:text-gray-400 cursor-pointer rounded-xl hover:bg-[#1E212E]/50 transition-colors border border-transparent hover:border-dashed hover:border-gray-700"
                          >
                            + Plan {slot.title}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
