'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Sparkles, Plus, Clock, Check } from 'lucide-react';
import { MealItem, MealType } from '@/types/meal';
import { getMealAccent, getMealInitials } from '@/lib/curated-foods';
import {
  searchDishCatalog,
  getTwistForDishTitle,
  searchOpenFoodFactsFallback,
  OpenSourceDish,
} from '@/lib/dish-database';

interface AddMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetDate: string;
  targetSlot: MealType;
  onAddMeal: (meal: Omit<MealItem, 'id'>) => void;
}

export default function AddMealModal({
  isOpen,
  onClose,
  targetDate,
  targetSlot,
  onAddMeal,
}: AddMealModalProps) {
  const [selectedSlot, setSelectedSlot] = useState<MealType>(targetSlot || 'lunch');
  const [dishTitle, setDishTitle] = useState('');
  const [calories, setCalories] = useState('500');
  const [protein, setProtein] = useState('30');
  const [carbs, setCarbs] = useState('50');
  const [fat, setFat] = useState('16');
  const [prepTime, setPrepTime] = useState('15');
  const [tags, setTags] = useState<string[]>(['planned']);
  const [accentColor, setAccentColor] = useState('#10B981');

  // Typeahead search state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [localSuggestions, setLocalSuggestions] = useState<OpenSourceDish[]>([]);
  const [onlineSuggestions, setOnlineSuggestions] = useState<Partial<OpenSourceDish>[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);

  // Contextual Twist
  const [activeTwist, setActiveTwist] = useState<OpenSourceDish['twist'] | null>(null);
  const [isTwistApplied, setIsTwistApplied] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Reset or initialize when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedSlot(targetSlot || 'lunch');
      setDishTitle('');
      setCalories('500');
      setProtein('30');
      setCarbs('50');
      setFat('16');
      setPrepTime('15');
      setTags(['planned']);
      setActiveTwist(null);
      setIsTwistApplied(false);
      setLocalSuggestions(searchDishCatalog('', targetSlot || 'lunch'));
      setShowSuggestions(false);
    }
  }, [isOpen, targetSlot]);

  // Update suggestions whenever user types or slot changes
  useEffect(() => {
    const matches = searchDishCatalog(dishTitle, selectedSlot);
    setLocalSuggestions(matches);

    // Check if there is an automatic twist for this dish
    const twist = getTwistForDishTitle(dishTitle);
    setActiveTwist(twist || null);
    setIsTwistApplied(false);

    // Debounced online fallback if query >= 3 characters and few local matches
    if (dishTitle.trim().length >= 3 && matches.length < 3) {
      setIsSearchingOnline(true);
      const timer = setTimeout(async () => {
        const results = await searchOpenFoodFactsFallback(dishTitle);
        setOnlineSuggestions(results);
        setIsSearchingOnline(false);
      }, 350);
      return () => clearTimeout(timer);
    } else {
      setOnlineSuggestions([]);
      setIsSearchingOnline(false);
    }
  }, [dishTitle, selectedSlot]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleSelectDish = (dish: Partial<OpenSourceDish>) => {
    if (!dish.title) return;
    setDishTitle(dish.title);
    setCalories(String(dish.calories || 450));
    setProtein(String(dish.protein || 25));
    setCarbs(String(dish.carbs || 45));
    setFat(String(dish.fat || 15));
    setPrepTime(String(dish.prepTimeMinutes || 15));
    setAccentColor(dish.accentColor || getMealAccent(dish.title));
    setTags(dish.tags || ['planned']);

    if (dish.twist) {
      setActiveTwist(dish.twist);
    } else {
      setActiveTwist(getTwistForDishTitle(dish.title) || null);
    }
    setIsTwistApplied(false);
    setShowSuggestions(false);
  };

  const handleToggleApplyTwist = () => {
    if (!activeTwist) return;

    if (!isTwistApplied) {
      setDishTitle(activeTwist.title);
      setCalories((prev) => String(Number(prev) + activeTwist.caloriesDelta));
      setProtein((prev) => String(Number(prev) + activeTwist.proteinDelta));
      setTags((prev) => [...prev.filter((t) => t !== 'twist-applied'), 'twist-applied']);
      setIsTwistApplied(true);
    } else {
      const original = dishTitle.replace(activeTwist.title, '').trim() || activeTwist.title;
      setCalories((prev) => String(Math.max(100, Number(prev) - activeTwist.caloriesDelta)));
      setProtein((prev) => String(Math.max(0, Number(prev) - activeTwist.proteinDelta)));
      setTags((prev) => prev.filter((t) => t !== 'twist-applied'));
      setIsTwistApplied(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishTitle.trim()) return;

    onAddMeal({
      title: dishTitle.trim(),
      mealType: selectedSlot,
      calories: Number(calories) || 450,
      protein: Number(protein) || 25,
      carbs: Number(carbs) || 45,
      fat: Number(fat) || 15,
      prepTimeMinutes: Number(prepTime) || 15,
      accentColor: accentColor || getMealAccent(dishTitle),
      ingredients: [{ name: dishTitle, amount: '1 portion' }],
      tags: tags.length > 0 ? tags : ['planned'],
      dateScheduled: targetDate,
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
        className="relative w-full max-w-lg bg-white dark:bg-[#16171E] border-2 border-black dark:border-gray-700 rounded-3xl p-6 shadow-neo-xl text-gray-900 dark:text-white max-h-[92vh] flex flex-col transition-colors overflow-hidden"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-[#FAF8F5] dark:bg-[#20222E] border-2 border-black dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 transition-all"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Modal Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <span className="rotate-[-2deg] bg-[#FFE600] text-black font-black text-[10px] uppercase px-2.5 py-0.5 rounded-lg border-2 border-black shadow-neo-sm">
              ✦ DISH PLANNER
            </span>
          </div>
          <h2 className="font-funky font-black text-2xl text-gray-900 dark:text-white mt-1.5">
            SCHEDULE DISH
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-bold">
            Planning for <span className="font-black text-gray-900 dark:text-white">{targetDate}</span>
          </p>
        </div>

        {/* Meal Slot Selector */}
        <div className="flex gap-2 mb-4">
          {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((slot) => (
            <button
              key={slot}
              type="button"
              onClick={() => setSelectedSlot(slot)}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black uppercase transition-all border-2 border-black ${
                selectedSlot === slot
                  ? 'bg-[#FFE600] text-black shadow-neo-sm'
                  : 'bg-[#FAF8F5] dark:bg-[#20222E] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#282b3a]'
              }`}
            >
              {slot}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto pr-1">
          {/* Dish Name with Live Open-Source Typeahead */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Dish Name
              </label>
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">
                Type to see open-source ideas
              </span>
            </div>

            <div className="relative">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                required
                value={dishTitle}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  setDishTitle(e.target.value);
                  setShowSuggestions(true);
                }}
                placeholder="e.g. Miso Glazed Salmon, Avocado Toast, Pesto Rigatoni..."
                className="w-full bg-gray-50 dark:bg-[#181A24] border border-gray-200 dark:border-gray-700 focus:border-black dark:focus:border-[#D4FF00] rounded-xl pl-9 pr-4 py-2.5 text-xs text-gray-900 dark:text-white focus:outline-none transition-colors"
              />
            </div>

            {/* Typeahead Suggestions Dropdown */}
            <AnimatePresence>
              {showSuggestions && (
                <motion.div
                  ref={dropdownRef}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-[#181A24] border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-20 max-h-56 overflow-y-auto p-1.5 space-y-1"
                >
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center justify-between">
                    <span>Popular Dishes for {selectedSlot}</span>
                    {isSearchingOnline && <span>Searching database...</span>}
                  </div>

                  {localSuggestions.map((dish) => {
                    const initials = getMealInitials(dish.title);
                    return (
                      <div
                        key={dish.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectDish(dish);
                        }}
                        className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#222533] cursor-pointer flex items-center justify-between gap-2.5 transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-[10px] text-white flex-shrink-0"
                            style={{ backgroundColor: dish.accentColor }}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-gray-900 dark:text-white truncate">
                              {dish.title}
                            </h4>
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400">
                              <span className="font-bold text-gray-900 dark:text-[#D4FF00]">
                                {dish.calories} kcal
                              </span>
                              <span>•</span>
                              <span>{dish.protein}g P</span>
                              <span>•</span>
                              <span>{dish.prepTimeMinutes}m</span>
                            </div>
                          </div>
                        </div>

                        {dish.twist && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-lime-100 dark:bg-[#D4FF00]/20 text-lime-700 dark:text-[#D4FF00] border border-lime-300 dark:border-[#D4FF00]/40 flex-shrink-0">
                            Twist available
                          </span>
                        )}
                      </div>
                    );
                  })}

                  {/* Online Fallback Matches */}
                  {onlineSuggestions.map((dish, idx) => (
                    <div
                      key={`online-${idx}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectDish(dish);
                      }}
                      className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#222533] cursor-pointer flex items-center justify-between gap-2.5 transition-colors border-t border-gray-100 dark:border-gray-800"
                    >
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-gray-900 dark:text-white truncate">
                          {dish.title}
                        </h4>
                        <p className="text-[10px] text-gray-400">
                          {dish.calories} kcal • {dish.protein}g Protein • Open-source data
                        </p>
                      </div>
                      <Plus className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Contextual Twist Recommendation Card */}
          <AnimatePresence>
            {activeTwist && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-lime-50/80 dark:bg-[#181A24] border border-lime-300 dark:border-[#D4FF00]/30 rounded-2xl p-3.5"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 text-lime-800 dark:text-[#D4FF00] font-black text-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Flavor Twist Idea</span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                    +{activeTwist.caloriesDelta} kcal • +{activeTwist.proteinDelta}g P
                  </span>
                </div>

                <h5 className="font-bold text-xs text-gray-900 dark:text-white">
                  {activeTwist.title}
                </h5>
                <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-0.5 leading-relaxed">
                  {activeTwist.description}
                </p>

                <button
                  type="button"
                  onClick={handleToggleApplyTwist}
                  className={`mt-2.5 px-3 py-1.5 rounded-xl font-black text-[11px] transition-all flex items-center gap-1.5 ${
                    isTwistApplied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-lime-400 dark:bg-[#D4FF00] hover:bg-lime-300 dark:hover:bg-[#c3ed00] text-black shadow-sm'
                  }`}
                >
                  {isTwistApplied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Twist Applied</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Apply This Twist</span>
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Macro & Nutrition Targets */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              Nutrition & Timing (Auto-filled from selection)
            </label>
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-gray-50 dark:bg-[#181A24] border border-gray-200 dark:border-gray-800 rounded-xl p-2">
                <span className="block text-[9px] font-bold text-gray-400 uppercase">Calories</span>
                <input
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  className="w-full bg-transparent text-xs font-black text-gray-900 dark:text-[#D4FF00] focus:outline-none"
                />
              </div>

              <div className="bg-gray-50 dark:bg-[#181A24] border border-gray-200 dark:border-gray-800 rounded-xl p-2">
                <span className="block text-[9px] font-bold text-gray-400 uppercase">Protein (g)</span>
                <input
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  className="w-full bg-transparent text-xs font-black text-rose-600 dark:text-rose-400 focus:outline-none"
                />
              </div>

              <div className="bg-gray-50 dark:bg-[#181A24] border border-gray-200 dark:border-gray-800 rounded-xl p-2">
                <span className="block text-[9px] font-bold text-gray-400 uppercase">Carbs (g)</span>
                <input
                  type="number"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  className="w-full bg-transparent text-xs font-black text-emerald-600 dark:text-emerald-400 focus:outline-none"
                />
              </div>

              <div className="bg-gray-50 dark:bg-[#181A24] border border-gray-200 dark:border-gray-800 rounded-xl p-2">
                <span className="block text-[9px] font-bold text-gray-400 uppercase">Fats (g)</span>
                <input
                  type="number"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  className="w-full bg-transparent text-xs font-black text-purple-600 dark:text-purple-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Prep Time */}
          <div className="flex items-center gap-3 bg-gray-50 dark:bg-[#181A24] border border-gray-200 dark:border-gray-800 rounded-xl p-2.5">
            <Clock className="w-4 h-4 text-gray-400" />
            <div className="flex-1 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Preparation Time</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value)}
                  className="w-12 bg-white dark:bg-[#12141B] border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-0.5 text-xs text-right font-black text-gray-900 dark:text-white"
                />
                <span className="text-xs text-gray-400">mins</span>
              </div>
            </div>
          </div>

          {/* Action Button: Neon Orange like Get In Touch from Portfolio */}
          <button
            type="submit"
            className="w-full py-3 bg-[#FF5500] hover:bg-[#ff681a] text-white font-black text-xs uppercase tracking-wider rounded-2xl border-2 border-black shadow-neo hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-neo-lg active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 mt-3"
          >
            <span>PLAN DISH FOR {selectedSlot.toUpperCase()}</span>
          </button>
        </form>
      </motion.div>
    </div>
  );
}
