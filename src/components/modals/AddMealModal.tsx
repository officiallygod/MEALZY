'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Sparkles, Plus, Clock, Link as LinkIcon, RotateCcw, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { MealItem, MealType } from '@/types/meal';
import { getMealAccent, getMealInitials, cleanMealTitle } from '@/lib/curated-foods';
import {
  searchDishCatalog,
  getTwistForDishTitle,
  estimateDishNutrition,
  getRediscoverMeals,
  searchOpenFoodFactsFallback,
  OpenSourceDish,
  RediscoverMeal,
} from '@/lib/dish-database';
import { db } from '@/lib/db';
import confetti from 'canvas-confetti';
import NeoSelect, { NeoSelectOption } from '@/components/common/NeoSelect';

interface AddMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetDate: string;
  targetSlot: MealType;
  allMeals?: MealItem[];
  rollingDays?: { dateString: string; dayName: string; dayNumber: number }[];
  onAddMeal?: (meal: Omit<MealItem, 'id'>) => void;
}

interface BatchPortionConfig {
  portionNumber: number;
  date: string;
  slot: MealType;
}

const SLOT_PRESETS: { type: MealType; label: string; code: string; activeColor: string; textColor: string }[] = [
  { type: 'breakfast', label: 'Breakfast', code: 'B', activeColor: 'bg-[#FFE600]', textColor: 'text-black' },
  { type: 'lunch', label: 'Lunch', code: 'L', activeColor: 'bg-[#00E5FF]', textColor: 'text-black' },
  { type: 'dinner', label: 'Dinner', code: 'D', activeColor: 'bg-[#FF5500]', textColor: 'text-white' },
  { type: 'snack', label: 'Snack (Opt)', code: 'S', activeColor: 'bg-[#D4FF00]', textColor: 'text-black' },
];

export default function AddMealModal({
  isOpen,
  onClose,
  targetDate,
  targetSlot,
  allMeals = [],
  rollingDays = [],
  onAddMeal,
}: AddMealModalProps) {
  const [selectedSlot, setSelectedSlot] = useState<MealType>(targetSlot || 'lunch');
  const [startDate, setStartDate] = useState(targetDate);
  const [dishTitle, setDishTitle] = useState('');
  const [recipeUrl, setRecipeUrl] = useState('');

  // Nutrition values (estimated automatically behind the scenes)
  const [calories, setCalories] = useState('500');
  const [protein, setProtein] = useState('30');
  const [carbs, setCarbs] = useState('50');
  const [fat, setFat] = useState('16');
  const [prepTime, setPrepTime] = useState('15');
  const [isCustomNutrition, setIsCustomNutrition] = useState(false);
  const [showMacroSettings, setShowMacroSettings] = useState(false);
  const [matchedFoodName, setMatchedFoodName] = useState<string | null>(null);

  // Divide across days (Batch prep)
  const [divideDays, setDivideDays] = useState<number>(1);
  const [batchAllocations, setBatchAllocations] = useState<BatchPortionConfig[]>([]);

  // Typeahead suggestions
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [localSuggestions, setLocalSuggestions] = useState<OpenSourceDish[]>([]);
  const [onlineSuggestions, setOnlineSuggestions] = useState<Partial<OpenSourceDish>[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);

  // Older meals previously made for this slot that haven't been had recently
  const [rediscoverMeals, setRediscoverMeals] = useState<RediscoverMeal[]>([]);

  // Contextual Twist
  const [activeTwist, setActiveTwist] = useState<OpenSourceDish['twist'] | null>(null);
  const [isTwistApplied, setIsTwistApplied] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize or reset when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedSlot(targetSlot || 'lunch');
      setStartDate(targetDate);
      setDishTitle('');
      setRecipeUrl('');
      setDivideDays(1);
      setIsCustomNutrition(false);
      setShowMacroSettings(false);
      setActiveTwist(null);
      setIsTwistApplied(false);
      setLocalSuggestions(searchDishCatalog('', targetSlot || 'lunch'));
      setShowSuggestions(false);

      // Estimate initial benchmarks for slot
      const initialEstimate = estimateDishNutrition('', targetSlot || 'lunch');
      setCalories(String(initialEstimate.calories));
      setProtein(String(initialEstimate.protein));
      setCarbs(String(initialEstimate.carbs));
      setFat(String(initialEstimate.fat));
      setPrepTime(String(initialEstimate.prepTimeMinutes));
      setMatchedFoodName(null);

      // Load older meals previously enjoyed for this slot
      const past = getRediscoverMeals(allMeals, targetSlot || 'lunch', targetDate);
      setRediscoverMeals(past);
    }
  }, [isOpen, targetDate, targetSlot, allMeals]);

  // Update rediscover meals when slot changes
  useEffect(() => {
    const past = getRediscoverMeals(allMeals, selectedSlot, startDate);
    setRediscoverMeals(past);
  }, [selectedSlot, allMeals, startDate]);

  // Recalculate default batch portion assignments when divideDays, startDate or slot changes
  useEffect(() => {
    if (divideDays <= 1) {
      setBatchAllocations([]);
      return;
    }

    const targetIndex = rollingDays.findIndex((d) => d.dateString === startDate);
    const startIndex = targetIndex >= 0 ? targetIndex + 1 : 1;
    const defaultLeftoverSlot: MealType = selectedSlot === 'dinner' ? 'lunch' : 'dinner';

    setBatchAllocations((prev) => {
      const updated: BatchPortionConfig[] = [];
      for (let i = 1; i < divideDays; i++) {
        const nextDay = rollingDays[startIndex + i - 1] || rollingDays[rollingDays.length - 1] || { dateString: startDate };
        const existing = prev[i - 1];
        updated.push({
          portionNumber: i + 1,
          date: existing?.date || nextDay.dateString,
          slot: existing?.slot || defaultLeftoverSlot,
        });
      }
      return updated;
    });
  }, [divideDays, selectedSlot, startDate, rollingDays]);

  const handleUpdateBatchSlot = (idx: number, slot: MealType) => {
    setBatchAllocations((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, slot } : item))
    );
  };

  const handleUpdateBatchDate = (idx: number, date: string) => {
    setBatchAllocations((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, date } : item))
    );
  };

  // Automatic rough estimation and typeahead filtering whenever title changes
  useEffect(() => {
    const matches = searchDishCatalog(dishTitle, selectedSlot);
    setLocalSuggestions(matches);

    // Contextual twist check
    const twist = getTwistForDishTitle(dishTitle);
    setActiveTwist(twist || null);
    setIsTwistApplied(false);

    // Rough estimation behind the scenes if user hasn't manually overridden numbers
    if (!isCustomNutrition && dishTitle.trim().length > 0) {
      const estimate = estimateDishNutrition(dishTitle, selectedSlot);
      setCalories(String(estimate.calories));
      setProtein(String(estimate.protein));
      setCarbs(String(estimate.carbs));
      setFat(String(estimate.fat));
      setPrepTime(String(estimate.prepTimeMinutes));
      setMatchedFoodName(estimate.matchedFoodTitle || null);
    }

    // Debounced online fallback if query is 3+ characters and few local matches
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
  }, [dishTitle, selectedSlot, isCustomNutrition]);

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
    setIsCustomNutrition(true);
    setMatchedFoodName(dish.title);

    if (dish.twist) {
      setActiveTwist(dish.twist);
    } else {
      setActiveTwist(getTwistForDishTitle(dish.title) || null);
    }
    setIsTwistApplied(false);
    setShowSuggestions(false);
  };

  const handleSelectRediscoverMeal = (past: RediscoverMeal) => {
    setDishTitle(past.title);
    setCalories(String(past.calories));
    setProtein(String(past.protein));
    setCarbs(String(past.carbs));
    setFat(String(past.fat));
    setPrepTime(String(past.prepTimeMinutes));
    if (past.recipeUrl) setRecipeUrl(past.recipeUrl);
    setIsCustomNutrition(true);
    setMatchedFoodName(`Your past meal (${past.daysSinceLastEaten}d ago)`);
    setShowSuggestions(false);
  };

  const handleToggleApplyTwist = () => {
    if (!activeTwist) return;

    if (!isTwistApplied) {
      setDishTitle(activeTwist.title);
      setCalories((prev) => String(Number(prev) + activeTwist.caloriesDelta));
      setProtein((prev) => String(Number(prev) + activeTwist.proteinDelta));
      setIsTwistApplied(true);
    } else {
      const original = dishTitle.replace(activeTwist.title, '').trim() || activeTwist.title;
      setCalories((prev) => String(Math.max(100, Number(prev) - activeTwist.caloriesDelta)));
      setProtein((prev) => String(Math.max(0, Number(prev) - activeTwist.proteinDelta)));
      setIsTwistApplied(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishTitle.trim()) return;

    const sourceMealId = `meal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const calNum = calories.trim() === '' ? 0 : (Number(calories) || 0);
    const pNum = Number(protein) || 0;
    const cNum = Number(carbs) || 0;
    const fNum = Number(fat) || 0;
    const prepNum = Number(prepTime) || 15;
    const accent = getMealAccent(dishTitle);

    // 1. Add primary meal
    await db.meals.add({
      id: sourceMealId,
      title: dishTitle.trim(),
      mealType: selectedSlot,
      calories: calNum,
      protein: pNum,
      carbs: cNum,
      fat: fNum,
      prepTimeMinutes: prepNum,
      recipeUrl: recipeUrl.trim() || undefined,
      accentColor: accent,
      ingredients: [{ name: dishTitle.trim(), amount: '1 portion' }],
      tags: isTwistApplied ? ['planned', 'twist-applied'] : ['planned'],
      dateScheduled: startDate,
      totalPortionsCooked: divideDays,
      portionsRemaining: divideDays - 1,
    });

    // 2. If divided across multiple days: create leftover meals for subsequent rolling days
    if (divideDays > 1 && rollingDays.length > 1) {
      const targetIndex = rollingDays.findIndex((d) => d.dateString === startDate);
      const startIndex = targetIndex >= 0 ? targetIndex + 1 : 1;

      const leftoverMeals: MealItem[] = [];
      for (let i = 1; i < divideDays; i++) {
        const nextDay = rollingDays[startIndex + i - 1] || rollingDays[rollingDays.length - 1];
        const alloc = batchAllocations[i - 1];
        const assignedDate = alloc?.date || nextDay.dateString;
        const assignedSlot = alloc?.slot || (selectedSlot === 'dinner' ? 'lunch' : selectedSlot);

        leftoverMeals.push({
          id: `leftover-${sourceMealId}-${i}`,
          title: cleanMealTitle(dishTitle.trim()),
          mealType: assignedSlot,
          calories: calNum,
          protein: pNum,
          carbs: cNum,
          fat: fNum,
          prepTimeMinutes: 3,
          recipeUrl: recipeUrl.trim() || undefined,
          accentColor: accent,
          ingredients: [{ name: cleanMealTitle(dishTitle.trim()), amount: '1 portion' }],
          tags: ['leftover', 'divided-portion'],
          dateScheduled: assignedDate,
          isLeftover: true,
          portions: 1,
          sourceMealId: sourceMealId,
          notes: `Portion #${i + 1} of ${divideDays} batch prepared on ${startDate}`,
        });
      }

      if (leftoverMeals.length > 0) {
        await db.meals.bulkAdd(leftoverMeals);
      }

      // Add to fridge batch inventory
      await db.fridge.put({
        id: `fridge-batch-${sourceMealId}`,
        name: dishTitle.trim(),
        originalMealTitle: dishTitle.trim(),
        cookedAt: new Date().toISOString(),
        daysInFridge: 0,
        status: 'fresh',
        portionsLeft: divideDays - 1,
        category: selectedSlot,
        accentColor: accent,
      });

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#FF5500', '#D4FF00', '#00E5FF'],
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
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
          aria-label="Close"
          className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-[#FAF8F5] dark:bg-[#20222E] border-2 border-black dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white shadow-neo-sm active:scale-95 transition-colors z-10"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Modal Header (flex-shrink-0) */}
        <div className="flex-shrink-0 mb-3">
          <div className="flex items-center gap-2">
            <span className="rotate-[-2deg] bg-[#FFE600] text-black font-black text-[10px] uppercase px-2.5 py-0.5 rounded-lg border-2 border-black shadow-neo-sm">
              ✦ DISH PLANNER
            </span>
          </div>
          <h2 className="font-funky font-black text-2xl text-gray-900 dark:text-white mt-1.5">
            ADD TO PLAN
          </h2>
        </div>

        {/* Form Wrapping Scrollable Body & Pinned Footer */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-2 space-y-4">
            {/* Compact B L D S Meal Slot Selector */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Meal Slot
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {SLOT_PRESETS.map((slot) => {
                  const isSelected = selectedSlot === slot.type;
                  return (
                    <button
                      key={slot.type}
                      type="button"
                      onClick={() => {
                        setSelectedSlot(slot.type);
                        if (!dishTitle.trim()) {
                          const est = estimateDishNutrition('', slot.type);
                          setCalories(String(est.calories));
                          setProtein(String(est.protein));
                          setCarbs(String(est.carbs));
                          setFat(String(est.fat));
                          setPrepTime(String(est.prepTimeMinutes));
                        }
                      }}
                      className={`py-2 px-1 text-center font-black text-xs uppercase rounded-xl border-2 transition-colors flex items-center justify-center gap-1.5 active:scale-95 ${
                        isSelected
                          ? `${slot.activeColor} ${slot.textColor} border-black shadow-neo-sm`
                          : 'bg-[#FAF8F5] dark:bg-[#20222E] text-gray-700 dark:text-gray-300 border-black/20 dark:border-gray-700 hover:border-black'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-md bg-black/15 flex items-center justify-center text-[10px] font-black">
                        {slot.code}
                      </span>
                      <span className="truncate">{slot.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Start Eating From (Next 7 Dates) */}
            {rollingDays.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Start Eating On
                  </label>
                  <span className="text-[10px] font-bold text-gray-400">
                    {startDate}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                  {rollingDays.map((d, dIdx) => {
                    const isStart = startDate === d.dateString;
                    return (
                      <button
                        key={d.dateString}
                        type="button"
                        onClick={() => setStartDate(d.dateString)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-black border-2 transition-colors flex-shrink-0 flex items-center gap-1 active:scale-95 ${
                          isStart
                            ? 'bg-[#FFE600] text-black border-black shadow-neo-sm'
                            : 'bg-[#FAF8F5] dark:bg-[#20222E] text-gray-700 dark:text-gray-300 border-black/20 dark:border-gray-700 hover:border-black'
                        }`}
                      >
                        <span>{dIdx === 0 ? 'Today' : dIdx === 1 ? 'Tomorrow' : d.dayName}</span>
                        <span className="text-[10px] opacity-70">({d.dayNumber})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          {/* Rediscover Past Meals for this slot */}
          {rediscoverMeals.length > 0 && (
            <div className="p-3 bg-[#FAF8F5] dark:bg-[#1E202A] rounded-2xl border-2 border-black dark:border-gray-700 shadow-neo-sm">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-600 dark:text-gray-400 flex items-center gap-1.5 mb-2">
                <RotateCcw className="w-3 h-3 text-orange-500" />
                <span>Previously Made for {selectedSlot} (Tap to repeat):</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {rediscoverMeals.map((past, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectRediscoverMeal(past)}
                    className="px-2.5 py-1 rounded-xl bg-white dark:bg-[#262938] hover:bg-[#FFE600] hover:text-black dark:hover:bg-[#D4FF00] dark:hover:text-black border border-black dark:border-gray-700 text-xs font-bold transition-all shadow-neo-sm flex items-center gap-1"
                  >
                    <span>{past.title}</span>
                    <span className="text-[9px] opacity-70">({past.daysSinceLastEaten}d ago)</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dish Name with Live Open-Source Typeahead & Rough Estimation */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Meal Title
              </label>
              {matchedFoodName && (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-[#D4FF00]">
                  Rough estimate: ~{calories} kcal • {protein}g P
                </span>
              )}
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
                  setIsCustomNutrition(false);
                  setShowSuggestions(true);
                }}
                placeholder="e.g. Grandma's Secret Lentil Curry, Salmon Bowl..."
                className="w-full bg-[#FAF8F5] dark:bg-[#20222E] border-2 border-black dark:border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-gray-900 dark:text-white focus:outline-none shadow-neo-sm"
              />
            </div>

            {/* Live Autocomplete Dropdown */}
            <AnimatePresence>
              {showSuggestions && (
                <motion.div
                  ref={dropdownRef}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-[#1E202A] border-2 border-black dark:border-gray-700 rounded-2xl shadow-neo-lg z-20 max-h-56 overflow-y-auto custom-scrollbar p-1.5 space-y-1"
                >
                  <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center justify-between">
                    <span>Suggestions for {selectedSlot}</span>
                    {isSearchingOnline && (
                      <span className="flex items-center gap-1 text-black dark:text-[#D4FF00]">
                        <span className="w-2 h-2 rounded-full bg-[#FF5500] animate-pulse" />
                        Searching database...
                      </span>
                    )}
                  </div>

                  {/* Option to use written text directly as a custom meal */}
                  {dishTitle.trim().length > 0 && (
                    <div
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setShowSuggestions(false);
                        setIsCustomNutrition(true);
                        setMatchedFoodName('Custom written meal');
                      }}
                      className="p-2 rounded-xl bg-[#D4FF00]/25 hover:bg-[#D4FF00] hover:text-black border-2 border-black cursor-pointer flex items-center justify-between gap-2 transition-colors mb-1 shadow-neo-sm group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-[#D4FF00] border border-black flex items-center justify-center text-black font-black text-xs flex-shrink-0">
                          ✍️
                        </span>
                        <div className="min-w-0">
                          <span className="text-xs font-black truncate block text-gray-900 dark:text-white group-hover:text-black">
                            Use written text: &quot;{dishTitle.trim()}&quot;
                          </span>
                          <span className="text-[9px] font-bold text-gray-500 group-hover:text-black/80 block">
                            Add as custom recipe without database lookup
                          </span>
                        </div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded-md bg-black text-white text-[9px] font-black flex-shrink-0">
                        Custom Meal
                      </span>
                    </div>
                  )}

                  {localSuggestions.map((dish) => {
                    const initials = getMealInitials(dish.title);
                    return (
                      <div
                        key={dish.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectDish(dish);
                        }}
                        className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#282b3a] cursor-pointer flex items-center justify-between gap-2.5 transition-colors border border-transparent hover:border-black"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-[10px] text-white flex-shrink-0 border border-black"
                            style={{ backgroundColor: dish.accentColor }}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-gray-900 dark:text-white truncate">
                              {dish.title}
                            </h4>
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400 font-bold">
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

                        {dish.twist && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-[#D4FF00] text-black border border-black flex-shrink-0">
                            Twist ready
                          </span>
                        )}
                      </div>
                    );
                  })}

                  {onlineSuggestions.map((dish, idx) => (
                    <div
                      key={`online-${idx}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectDish(dish);
                      }}
                      className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#282b3a] cursor-pointer flex items-center justify-between gap-2.5 transition-colors border-t border-gray-200 dark:border-gray-800"
                    >
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-gray-900 dark:text-white truncate">
                          {dish.title}
                        </h4>
                        <p className="text-[10px] text-gray-500 font-bold">
                          {dish.calories} kcal • {dish.protein}g Protein
                        </p>
                      </div>
                      <Plus className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                  ))}

                  {onlineSuggestions.length > 0 && (
                    <div className="pt-1.5 pb-1 px-2 text-center border-t border-gray-200 dark:border-gray-800">
                      <span className="text-[9px] font-bold text-gray-400">
                        Nutrition data powered by Open Food Facts &amp; open data
                      </span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Reference Link Option (Directly in Custom Meal Form) */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
              Recipe / Reference Link (Optional)
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="url"
                value={recipeUrl}
                onChange={(e) => setRecipeUrl(e.target.value)}
                placeholder="https://... (e.g. TikTok, food blog, YouTube link)"
                className="w-full bg-[#FAF8F5] dark:bg-[#20222E] border-2 border-black dark:border-gray-700 rounded-xl pl-9 pr-4 py-2 text-xs text-gray-900 dark:text-white focus:outline-none shadow-neo-sm"
              />
            </div>
          </div>

          {/* Divide Throughout Many Days (Batch Cooking Multiplier) */}
          <div className="p-3.5 bg-[#FAF8F5] dark:bg-[#1E202A] rounded-2xl border-2 border-black dark:border-gray-700 shadow-neo-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-gray-800 dark:text-gray-200">
                Divide Across Days (Cook once, eat multiple times)
              </span>
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                {divideDays === 1 ? '1 Day' : `Batch: ${divideDays} Days`}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDivideDays(d)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-black transition-all border-2 border-black ${
                    divideDays === d
                      ? 'bg-[#FFE600] text-black shadow-neo-sm'
                      : 'bg-white dark:bg-[#262938] text-gray-700 dark:text-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {d === 1 ? 'Single (1x)' : `${d} Days`}
                </button>
              ))}
            </div>

            {divideDays > 1 && (
              <div className="mt-3 pt-3 border-t-2 border-black/10 dark:border-gray-700 space-y-2.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 block">
                  Customize Remaining {divideDays - 1} Leftover Portion{divideDays > 2 ? 's' : ''}:
                </span>

                {batchAllocations.map((alloc, idx) => (
                  <div
                    key={alloc.portionNumber}
                    className="p-2.5 bg-white dark:bg-[#16171E] rounded-xl border-2 border-black dark:border-gray-700 shadow-neo-sm space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-black text-white dark:bg-[#FFE600] dark:text-black rounded-md">
                        Portion #{alloc.portionNumber}
                      </span>
                      <NeoSelect
                        value={alloc.date}
                        onChange={(val) => handleUpdateBatchDate(idx, val)}
                        options={rollingDays.map((d, dIdx) => ({
                          value: d.dateString,
                          label:
                            dIdx === 0
                              ? `Today (${d.dayNumber})`
                              : dIdx === 1
                              ? `Tomorrow (${d.dayNumber})`
                              : `${d.dayName} (${d.dayNumber})`,
                        }))}
                        size="sm"
                        align="right"
                        ariaLabel={`Portion ${alloc.portionNumber} Day`}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-200 dark:border-gray-800">
                      <span className="text-[10px] font-black uppercase text-gray-500">Slot:</span>
                      <div className="grid grid-cols-4 gap-1">
                        {SLOT_PRESETS.map((slot) => {
                          const isChosen = alloc.slot === slot.type;
                          return (
                            <button
                              key={slot.type}
                              type="button"
                              onClick={() => handleUpdateBatchSlot(idx, slot.type)}
                              className={`py-1 px-2 text-center font-black text-[10px] uppercase rounded-lg border transition-colors flex items-center justify-center gap-1 active:scale-95 ${
                                isChosen
                                  ? `${slot.activeColor} ${slot.textColor} border-black font-black shadow-neo-sm`
                                  : 'bg-[#FAF8F5] dark:bg-[#1E202A] text-gray-600 dark:text-gray-400 border-black/20 dark:border-gray-700 hover:border-black'
                              }`}
                              title={slot.label}
                            >
                              <span className="font-black">{slot.code}</span>
                              <span className="hidden sm:inline">{slot.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contextual Twist Recommendation */}
          <AnimatePresence>
            {activeTwist && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-[#FAF8F5] dark:bg-[#1E202A] border-2 border-black dark:border-gray-700 rounded-2xl p-3.5 shadow-neo-sm border-l-[6px] border-l-[#D4FF00]"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 text-black dark:text-[#D4FF00] font-black text-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Flavor Twist Idea</span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                    +{activeTwist.caloriesDelta > 0 ? `${activeTwist.caloriesDelta} kcal` : '0 kcal'} • +{activeTwist.proteinDelta}g Protein
                  </span>
                </div>

                <p className="text-xs text-gray-700 dark:text-gray-300 font-bold">
                  {activeTwist.description}
                </p>

                <button
                  type="button"
                  onClick={handleToggleApplyTwist}
                  className={`mt-2.5 px-3 py-1.5 rounded-xl font-black text-[11px] transition-colors border-2 border-black shadow-neo-sm flex items-center gap-1.5 active:scale-95 ${
                    isTwistApplied
                      ? 'bg-emerald-500 text-white'
                      : 'bg-[#D4FF00] hover:bg-[#c3ed00] text-black'
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

          {/* Collapsible Macro Adjustment */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowMacroSettings(!showMacroSettings)}
              className="w-full flex items-center justify-between text-xs font-black uppercase text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white py-1"
            >
              <div className="flex items-center gap-1.5 flex-wrap text-left">
                <span>Calories &amp; Macros</span>
                {calories && Number(calories) > 0 ? (
                  <span className="text-gray-900 dark:text-[#D4FF00]">
                    ({calories} kcal • {protein}g P)
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 rounded bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-[10px] font-black border border-black/20">
                    Calories Not Given
                  </span>
                )}
                <span className="text-[10px] text-gray-400">
                  • {isCustomNutrition ? 'Custom' : 'Auto-Estimated'}
                </span>
              </div>
              {showMacroSettings ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showMacroSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-4 gap-2 pt-2"
              >
                <div className="bg-[#FAF8F5] dark:bg-[#1E202A] border-2 border-black dark:border-gray-700 rounded-xl p-2 shadow-neo-sm">
                  <span className="block text-[9px] font-black text-gray-500 uppercase">Calories</span>
                  <input
                    type="number"
                    value={calories}
                    onChange={(e) => {
                      setCalories(e.target.value);
                      setIsCustomNutrition(true);
                    }}
                    placeholder="None"
                    className="w-full bg-transparent text-xs font-black text-gray-900 dark:text-[#D4FF00] focus:outline-none"
                  />
                </div>

                <div className="bg-[#FAF8F5] dark:bg-[#1E202A] border-2 border-black dark:border-gray-700 rounded-xl p-2 shadow-neo-sm">
                  <span className="block text-[9px] font-black text-gray-500 uppercase">Protein (g)</span>
                  <input
                    type="number"
                    value={protein}
                    onChange={(e) => {
                      setProtein(e.target.value);
                      setIsCustomNutrition(true);
                    }}
                    className="w-full bg-transparent text-xs font-black text-rose-600 dark:text-rose-400 focus:outline-none"
                  />
                </div>

                <div className="bg-[#FAF8F5] dark:bg-[#1E202A] border-2 border-black dark:border-gray-700 rounded-xl p-2 shadow-neo-sm">
                  <span className="block text-[9px] font-black text-gray-500 uppercase">Carbs (g)</span>
                  <input
                    type="number"
                    value={carbs}
                    onChange={(e) => {
                      setCarbs(e.target.value);
                      setIsCustomNutrition(true);
                    }}
                    className="w-full bg-transparent text-xs font-black text-sky-600 dark:text-sky-400 focus:outline-none"
                  />
                </div>

                <div className="bg-[#FAF8F5] dark:bg-[#1E202A] border-2 border-black dark:border-gray-700 rounded-xl p-2 shadow-neo-sm">
                  <span className="block text-[9px] font-black text-gray-500 uppercase">Fats (g)</span>
                  <input
                    type="number"
                    value={fat}
                    onChange={(e) => {
                      setFat(e.target.value);
                      setIsCustomNutrition(true);
                    }}
                    className="w-full bg-transparent text-xs font-black text-purple-600 dark:text-purple-400 focus:outline-none"
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* Prep Time */}
          <div className="flex items-center gap-3 bg-[#FAF8F5] dark:bg-[#1E202A] border-2 border-black dark:border-gray-700 rounded-xl p-2.5 shadow-neo-sm">
            <Clock className="w-4 h-4 text-gray-400" />
            <div className="flex-1 flex items-center justify-between">
              <span className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase">Preparation Time</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="1"
                  max="480"
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value)}
                  className="w-16 bg-white dark:bg-[#16171E] border-2 border-black dark:border-gray-700 rounded-xl px-2 py-1 text-xs text-center font-black text-gray-900 dark:text-white shadow-neo-sm focus:outline-none focus:border-black"
                />
                <span className="text-xs text-gray-500 dark:text-gray-400 font-bold">mins</span>
              </div>
            </div>
          </div>
          </div>

          {/* Pinned Non-Cropping Footer */}
          <div className="flex-shrink-0 pt-3 border-t-2 border-black/10 dark:border-white/10 bg-white dark:bg-[#16171E]">
            <button
              type="submit"
              className="w-full py-3.5 bg-[#FF5500] hover:bg-[#ff681a] text-white font-black text-xs uppercase tracking-wider rounded-2xl border-2 border-black shadow-neo active:scale-[0.98] transition-colors flex items-center justify-center gap-2"
            >
              <span>SAVE TO {selectedSlot.toUpperCase()} {divideDays > 1 ? `(${divideDays} DAYS)` : ''}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
