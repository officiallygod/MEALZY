'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  Sparkles,
  Plus,
  Clock,
  Link as LinkIcon,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Check,
  ArrowLeft,
  ArrowRight,
  Layers,
} from 'lucide-react';
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
import { scheduleBackgroundDriveSync } from '@/lib/sync/google-drive';
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
  // Wizard Step: 1 = Dish, 2 = Schedule & Batches, 3 = Cooking & Nutrition
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

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

  // Step 3 Close Match Search
  const [showCloseMatchSearch, setShowCloseMatchSearch] = useState(false);
  const [closeMatchQuery, setCloseMatchQuery] = useState('');
  const [closeMatchLocalResults, setCloseMatchLocalResults] = useState<OpenSourceDish[]>([]);
  const [closeMatchOnlineResults, setCloseMatchOnlineResults] = useState<Partial<OpenSourceDish>[]>([]);
  const [isSearchingCloseOnline, setIsSearchingCloseOnline] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize or reset when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setSelectedSlot(targetSlot || 'lunch');
      setStartDate(targetDate);
      setDishTitle('');
      setRecipeUrl('');
      setDivideDays(1);
      setIsCustomNutrition(false);
      setShowMacroSettings(false);
      setActiveTwist(null);
      setIsTwistApplied(false);
      setShowCloseMatchSearch(false);
      setCloseMatchQuery('');
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

  // Close Match search debouncing
  useEffect(() => {
    if (!showCloseMatchSearch || !closeMatchQuery.trim()) {
      setCloseMatchLocalResults([]);
      setCloseMatchOnlineResults([]);
      return;
    }

    const localMatches = searchDishCatalog(closeMatchQuery, selectedSlot);
    setCloseMatchLocalResults(localMatches);

    if (closeMatchQuery.trim().length >= 3) {
      setIsSearchingCloseOnline(true);
      const timer = setTimeout(async () => {
        const results = await searchOpenFoodFactsFallback(closeMatchQuery);
        setCloseMatchOnlineResults(results);
        setIsSearchingCloseOnline(false);
      }, 350);
      return () => clearTimeout(timer);
    } else {
      setCloseMatchOnlineResults([]);
      setIsSearchingCloseOnline(false);
    }
  }, [closeMatchQuery, selectedSlot, showCloseMatchSearch]);

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
    setIsCustomNutrition(false);
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

  const handleSelectCloseMatch = (dish: Partial<OpenSourceDish>) => {
    if (!dish.title) return;
    setCalories(String(dish.calories || 500));
    setProtein(String(dish.protein || 30));
    setCarbs(String(dish.carbs || 50));
    setFat(String(dish.fat || 16));
    if (dish.prepTimeMinutes) {
      setPrepTime(String(dish.prepTimeMinutes));
    }
    setMatchedFoodName(dish.title);
    setIsCustomNutrition(false);
    setShowCloseMatchSearch(false);

    confetti({
      particleCount: 30,
      spread: 45,
      origin: { y: 0.6 },
      colors: ['#FFE600', '#00E5FF', '#D4FF00'],
    });
  };

  const handleToggleApplyTwist = () => {
    if (!activeTwist) return;

    if (!isTwistApplied) {
      setDishTitle(activeTwist.title);
      setCalories((prev) => String(Number(prev) + activeTwist.caloriesDelta));
      setProtein((prev) => String(Number(prev) + activeTwist.proteinDelta));
      setIsTwistApplied(true);
    } else {
      setCalories((prev) => String(Math.max(100, Number(prev) - activeTwist.caloriesDelta)));
      setProtein((prev) => String(Math.max(0, Number(prev) - activeTwist.proteinDelta)));
      setIsTwistApplied(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!dishTitle.trim()) {
      setCurrentStep(1);
      return;
    }

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

    scheduleBackgroundDriveSync(1000);
    onClose();
  };

  const getDayNameLabel = (dateStr: string) => {
    const idx = rollingDays.findIndex((d) => d.dateString === dateStr);
    if (idx === 0) return 'Today';
    if (idx === 1) return 'Tomorrow';
    const found = rollingDays[idx];
    return found ? `${found.dayName} (${found.dayNumber})` : dateStr;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative w-full max-w-lg md:max-w-xl 2xl:max-w-2xl bg-white dark:bg-[#16171E] border-2 border-black dark:border-gray-700 rounded-3xl p-4 sm:p-6 shadow-neo-xl text-gray-900 dark:text-white max-h-[92vh] flex flex-col transition-colors overflow-hidden"
      >
        {/* Top Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 rounded-xl bg-[#FAF8F5] dark:bg-[#20222E] border-2 border-black dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white shadow-neo-sm active:scale-95 transition-colors z-10"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Modal Header */}
        <div className="flex-shrink-0 mb-3 pr-10">
          <div className="flex items-center gap-2">
            <span className="rotate-[-2deg] bg-[#FFE600] text-black font-black text-[10px] uppercase px-2.5 py-0.5 rounded-lg border-2 border-black shadow-neo-sm">
              ✦ STEP {currentStep} OF 3
            </span>
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {currentStep === 1 && 'DISH SELECTION'}
              {currentStep === 2 && 'PLAN & SCHEDULE'}
              {currentStep === 3 && 'COOKING & MACROS'}
            </span>
          </div>

          <h2 className="font-funky font-black text-xl sm:text-2xl text-gray-900 dark:text-white mt-1">
            {currentStep === 1 && 'WHAT ARE WE COOKING?'}
            {currentStep === 2 && 'WHEN & WHERE TO PLAN?'}
            {currentStep === 3 && 'FINISHING TOUCHES'}
          </h2>
        </div>

        {/* Interactive Step Progress Pills */}
        <div className="flex-shrink-0 flex items-center gap-1.5 sm:gap-2 mb-4">
          {[
            { num: 1, label: '1. Dish' },
            { num: 2, label: '2. Schedule' },
            { num: 3, label: '3. Details' },
          ].map((s) => {
            const isCurrent = currentStep === s.num;
            const isDone = currentStep > s.num;
            return (
              <button
                key={s.num}
                type="button"
                onClick={() => {
                  if (s.num === 1 || dishTitle.trim().length > 0) {
                    setCurrentStep(s.num as 1 | 2 | 3);
                  }
                }}
                className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider border-2 transition-all flex items-center justify-center gap-1 active:scale-95 ${
                  isCurrent
                    ? 'bg-[#FFE600] text-black border-black shadow-neo-sm'
                    : isDone
                    ? 'bg-black text-white dark:bg-[#20222E] dark:text-[#D4FF00] border-black dark:border-gray-700'
                    : 'bg-transparent text-gray-400 border-black/20 dark:border-gray-800'
                }`}
              >
                <span
                  className={`w-3.5 h-3.5 rounded-full text-[8px] flex items-center justify-center font-black ${
                    isCurrent
                      ? 'bg-black text-white'
                      : isDone
                      ? 'bg-[#00E5FF] text-black'
                      : 'bg-gray-200 dark:bg-gray-800 text-gray-500'
                  }`}
                >
                  {isDone ? '✓' : s.num}
                </span>
                <span className="truncate">{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Wrapping Scrollable Body & Pinned Footer */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-2 space-y-4">
            {/* ================================================================= */}
            {/* STEP 1: DISH SELECTION */}
            {/* ================================================================= */}
            {currentStep === 1 && (
              <div className="space-y-4">
                {/* Dish Name Search Input */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      Meal Name or Recipe
                    </label>
                    {matchedFoodName && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-[#D4FF00]">
                        ~{calories} kcal • {protein}g P
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                    <input
                      ref={inputRef}
                      type="text"
                      autoFocus
                      required
                      value={dishTitle}
                      onFocus={() => setShowSuggestions(true)}
                      onChange={(e) => {
                        setDishTitle(e.target.value);
                        setIsCustomNutrition(false);
                        setShowSuggestions(true);
                      }}
                      placeholder="e.g. Pistachio Pesto Rigatoni, Lentil Curry..."
                      className="w-full bg-[#FAF8F5] dark:bg-[#20222E] border-2 border-black dark:border-gray-700 rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none shadow-neo-sm font-medium"
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
                        className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-[#1E202A] border-2 border-black dark:border-gray-700 rounded-2xl shadow-neo-lg z-30 max-h-56 overflow-y-auto custom-scrollbar p-1.5 space-y-1"
                      >
                        <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center justify-between">
                          <span>Suggestions</span>
                          {isSearchingOnline && (
                            <span className="flex items-center gap-1 text-black dark:text-[#D4FF00]">
                              <span className="w-2 h-2 rounded-full bg-[#FF5500] animate-pulse" />
                              Searching open data...
                            </span>
                          )}
                        </div>

                        {/* Option to use written text directly */}
                        {dishTitle.trim().length > 0 && (
                          <div
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setShowSuggestions(false);
                              setIsCustomNutrition(true);
                              setMatchedFoodName('Custom written dish');
                            }}
                            className="p-2.5 rounded-xl bg-[#FFE600] text-black border-2 border-black cursor-pointer flex items-center justify-between gap-2 transition-all hover:bg-[#ffd900] active:scale-[0.99] mb-1.5 shadow-neo-sm"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-7 h-7 rounded-lg bg-white border-2 border-black flex items-center justify-center text-black font-black text-xs flex-shrink-0 shadow-neo-sm">
                                ✍️
                              </span>
                              <div className="min-w-0">
                                <span className="text-xs font-black truncate block text-black">
                                  Use written text: &quot;{dishTitle.trim()}&quot;
                                </span>
                                <span className="text-[10px] font-bold text-gray-900 block mt-0.5">
                                  Keep your own custom recipe title
                                </span>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-md bg-black text-white text-[9px] font-black uppercase tracking-wider flex-shrink-0 border border-black shadow-neo-sm">
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
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Selected Dish Indicator */}
                {dishTitle.trim().length > 0 && (
                  <div className="p-3 bg-[#F6FCF0] dark:bg-[#131911] rounded-2xl border-2 border-lime-500 shadow-neo-sm flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-xs flex-shrink-0 border-2 border-black shadow-neo-sm"
                        style={{ backgroundColor: getMealAccent(dishTitle) }}
                      >
                        {getMealInitials(dishTitle)}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-black text-gray-900 dark:text-white truncate block">
                          {cleanMealTitle(dishTitle)}
                        </span>
                        <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 block">
                          ~{calories} kcal • {protein}g P • {prepTime}m prep
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-[#D4FF00] text-black font-black text-[9px] border border-black uppercase flex-shrink-0">
                      Ready
                    </span>
                  </div>
                )}

                {/* Past Rediscovered Meals */}
                {rediscoverMeals.length > 0 && (
                  <div className="p-3.5 bg-[#FAF8F5] dark:bg-[#1E202A] rounded-2xl border-2 border-black dark:border-gray-700 shadow-neo-sm space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5 text-orange-500" />
                      <span>Previously Made (Tap to repeat):</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {rediscoverMeals.map((past, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectRediscoverMeal(past)}
                          className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#262938] hover:bg-[#FFE600] hover:text-black dark:hover:bg-[#D4FF00] dark:hover:text-black border border-black dark:border-gray-700 text-xs font-bold transition-all shadow-neo-sm flex items-center gap-1 active:scale-95"
                        >
                          <span>{past.title}</span>
                          <span className="text-[9px] opacity-70">({past.daysSinceLastEaten}d ago)</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ================================================================= */}
            {/* STEP 2: ASSIGN SLOT, START DATE & BATCHES */}
            {/* ================================================================= */}
            {currentStep === 2 && (
              <div className="space-y-4">
                {/* Active Dish Header Badge */}
                <div className="p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#20222E] border border-black/30 dark:border-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">Dish:</span>
                    <span className="text-xs font-black truncate">{dishTitle}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-[10px] font-black text-[#FF5500] hover:underline"
                  >
                    Change
                  </button>
                </div>

                {/* Meal Slot Selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Meal Slot
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {SLOT_PRESETS.map((slot) => {
                      const isSelected = selectedSlot === slot.type;
                      return (
                        <button
                          key={slot.type}
                          type="button"
                          onClick={() => setSelectedSlot(slot.type)}
                          className={`py-2.5 px-2 text-center font-black text-xs uppercase rounded-xl border-2 transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
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

                {/* Start Eating On Date Selector */}
                {rollingDays.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">
                        Start Eating On
                      </label>
                      <span className="text-[10px] font-bold text-gray-500">
                        {getDayNameLabel(startDate)}
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
                            className={`px-3 py-1.5 rounded-xl text-xs font-black border-2 transition-all flex-shrink-0 flex items-center gap-1 active:scale-95 ${
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

                {/* Divide Across Days (Batch Prep) */}
                <div className="p-3.5 bg-[#FAF8F5] dark:bg-[#1E202A] rounded-2xl border-2 border-black dark:border-gray-700 shadow-neo-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#FF5500]" />
                      <span className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-gray-200">
                        Cook Once, Eat Multiple Times
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-gray-500">
                      {divideDays === 1 ? '1 Meal' : `${divideDays} Days Batch`}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDivideDays(d)}
                        className={`py-2 px-1 rounded-xl text-xs font-black transition-all border-2 border-black ${
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
                    <div className="mt-2.5 pt-2.5 border-t-2 border-black/10 dark:border-gray-700 space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 block">
                        Assign Remaining {divideDays - 1} Leftover Portion{divideDays > 2 ? 's' : ''}:
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
                                    className={`py-1 px-1.5 text-center font-black text-[10px] uppercase rounded-lg border transition-colors flex items-center justify-center gap-1 active:scale-95 ${
                                      isChosen
                                        ? `${slot.activeColor} ${slot.textColor} border-black font-black shadow-neo-sm`
                                        : 'bg-[#FAF8F5] dark:bg-[#1E202A] text-gray-600 dark:text-gray-400 border-black/20 dark:border-gray-700 hover:border-black'
                                    }`}
                                  >
                                    <span>{slot.code}</span>
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
              </div>
            )}

            {/* ================================================================= */}
            {/* STEP 3: PREP TIME, MACROS & CLOSE MATCH */}
            {/* ================================================================= */}
            {currentStep === 3 && (
              <div className="space-y-4">
                {/* Dish & Plan Summary Pill */}
                <div className="p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#20222E] border border-black/30 dark:border-gray-700 flex items-center justify-between text-xs font-black">
                  <span className="truncate">{dishTitle}</span>
                  <span className="px-2 py-0.5 rounded-lg bg-[#FFE600] text-black uppercase text-[10px] border border-black">
                    {selectedSlot} • {getDayNameLabel(startDate)}
                  </span>
                </div>

                {/* Compact Prep Time Box (Smaller, Clean Box) */}
                <div className="flex items-center justify-between bg-[#FAF8F5] dark:bg-[#1E202A] border-2 border-black dark:border-gray-700 rounded-2xl p-3 shadow-neo-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-xs font-black text-gray-900 dark:text-white uppercase">
                      Prep Time
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPrepTime(String(Math.max(1, (Number(prepTime) || 15) - 5)))}
                      className="w-7 h-7 rounded-xl border-2 border-black bg-white dark:bg-[#20222E] hover:bg-gray-100 dark:hover:bg-gray-700 text-xs font-black shadow-neo-sm active:scale-95 transition-all flex items-center justify-center"
                    >
                      -5
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="480"
                      value={prepTime}
                      onChange={(e) => setPrepTime(e.target.value)}
                      className="w-14 bg-white dark:bg-[#16171E] border-2 border-black dark:border-gray-700 rounded-xl px-2 py-1 text-xs text-center font-black text-gray-900 dark:text-white shadow-neo-sm focus:outline-none"
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-bold">m</span>
                    <button
                      type="button"
                      onClick={() => setPrepTime(String((Number(prepTime) || 15) + 5))}
                      className="w-7 h-7 rounded-xl border-2 border-black bg-white dark:bg-[#20222E] hover:bg-gray-100 dark:hover:bg-gray-700 text-xs font-black shadow-neo-sm active:scale-95 transition-all flex items-center justify-center"
                    >
                      +5
                    </button>
                  </div>
                </div>

                {/* Optional Recipe / Reference Link */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
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

                {/* Contextual Twist Recommendation */}
                <AnimatePresence>
                  {activeTwist && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-[#FAF8F5] dark:bg-[#1E202A] border-2 border-black dark:border-gray-700 rounded-2xl p-3 shadow-neo-sm border-l-[6px] border-l-[#D4FF00]"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 text-black dark:text-[#D4FF00] font-black text-xs">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Chef&apos;s Twist Idea</span>
                        </div>
                        <span className="text-[10px] font-bold text-gray-500">
                          +{activeTwist.caloriesDelta} kcal • +{activeTwist.proteinDelta}g P
                        </span>
                      </div>
                      <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                        {activeTwist.description}
                      </p>
                      <button
                        type="button"
                        onClick={handleToggleApplyTwist}
                        className={`mt-2 px-3 py-1 rounded-xl font-black text-[11px] transition-colors border-2 border-black shadow-neo-sm flex items-center gap-1.5 active:scale-95 ${
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

                {/* Nutrition & Open Data Close Match Lookup */}
                <div className="p-3.5 bg-[#FAF8F5] dark:bg-[#1E202A] rounded-2xl border-2 border-black dark:border-gray-700 shadow-neo-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black uppercase text-gray-900 dark:text-white block">
                        Nutrition &amp; Macros
                      </span>
                      <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                        {matchedFoodName
                          ? `Matched: "${matchedFoodName}" (~${calories} kcal • ${protein}g P)`
                          : `Rough Estimate: ~${calories} kcal • ${protein}g P`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCloseMatchSearch(!showCloseMatchSearch);
                          if (!showCloseMatchSearch && !closeMatchQuery) {
                            setCloseMatchQuery(dishTitle);
                          }
                        }}
                        className="px-2.5 py-1 rounded-xl border border-black bg-[#FFE600] text-black text-[10px] font-black shadow-neo-sm hover:bg-yellow-300 active:scale-95 transition-all flex items-center gap-1"
                        title="Search database for a close dish"
                      >
                        <Search className="w-3 h-3" />
                        <span>Close Match?</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowMacroSettings(!showMacroSettings)}
                        className="px-2.5 py-1 rounded-xl border border-black bg-white dark:bg-[#20222E] text-gray-800 dark:text-white text-[10px] font-black shadow-neo-sm hover:bg-gray-100 active:scale-95 transition-all flex items-center gap-1"
                      >
                        <span>{showMacroSettings ? 'Hide' : 'Fine-Tune'}</span>
                        {showMacroSettings ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {/* Close Match Search Drawer */}
                  {showCloseMatchSearch && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-2.5 rounded-xl bg-white dark:bg-[#16171E] border-2 border-black dark:border-gray-700 shadow-neo-sm space-y-2"
                    >
                      <span className="text-[10px] font-black uppercase text-gray-600 dark:text-gray-400 block">
                        Search Open Data for a Similar Dish:
                      </span>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
                        <input
                          type="text"
                          value={closeMatchQuery}
                          onChange={(e) => setCloseMatchQuery(e.target.value)}
                          placeholder="Search similar food (e.g. Chicken Rice, Pasta, Curry)..."
                          className="w-full bg-[#FAF8F5] dark:bg-[#20222E] border border-black dark:border-gray-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none"
                        />
                      </div>

                      {/* Close Match Search Results */}
                      <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1">
                        {isSearchingCloseOnline && (
                          <div className="text-[10px] text-gray-500 py-1 text-center">
                            Searching open database...
                          </div>
                        )}
                        {closeMatchLocalResults.slice(0, 5).map((dish) => (
                          <div
                            key={dish.id}
                            onClick={() => handleSelectCloseMatch(dish)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#282b3a] cursor-pointer flex items-center justify-between border border-transparent hover:border-black"
                          >
                            <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                              {dish.title}
                            </span>
                            <span className="text-[10px] font-black text-emerald-600 dark:text-[#D4FF00] whitespace-nowrap ml-2">
                              {dish.calories} kcal • {dish.protein}g P
                            </span>
                          </div>
                        ))}
                        {closeMatchOnlineResults.slice(0, 4).map((dish, i) => (
                          <div
                            key={`close-online-${i}`}
                            onClick={() => handleSelectCloseMatch(dish)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#282b3a] cursor-pointer flex items-center justify-between border-t border-gray-200 dark:border-gray-800"
                          >
                            <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                              {dish.title}
                            </span>
                            <span className="text-[10px] font-black text-sky-600 dark:text-sky-400 whitespace-nowrap ml-2">
                              {dish.calories} kcal
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Fine-Tune Macro Inputs */}
                  {showMacroSettings && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="grid grid-cols-4 gap-2 pt-1"
                    >
                      <div className="bg-white dark:bg-[#16171E] border-2 border-black dark:border-gray-700 rounded-xl p-2 shadow-neo-sm">
                        <span className="block text-[9px] font-black text-gray-500 uppercase">Calories</span>
                        <input
                          type="number"
                          value={calories}
                          onChange={(e) => {
                            setCalories(e.target.value);
                            setIsCustomNutrition(true);
                          }}
                          className="w-full bg-transparent text-xs font-black text-gray-900 dark:text-[#D4FF00] focus:outline-none"
                        />
                      </div>

                      <div className="bg-white dark:bg-[#16171E] border-2 border-black dark:border-gray-700 rounded-xl p-2 shadow-neo-sm">
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

                      <div className="bg-white dark:bg-[#16171E] border-2 border-black dark:border-gray-700 rounded-xl p-2 shadow-neo-sm">
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

                      <div className="bg-white dark:bg-[#16171E] border-2 border-black dark:border-gray-700 rounded-xl p-2 shadow-neo-sm">
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
              </div>
            )}
          </div>

          {/* ================================================================= */}
          {/* PINNED RESPONSIVE BOTTOM NAVIGATION FOOTER */}
          {/* ================================================================= */}
          <div className="flex-shrink-0 pt-3 border-t-2 border-black/10 dark:border-gray-800 bg-white dark:bg-[#16171E] flex items-center justify-between gap-2">
            {/* Step 1 Footer */}
            {currentStep === 1 && (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-4 bg-[#FAF8F5] dark:bg-[#20222E] text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white font-black text-xs uppercase rounded-xl border-2 border-black dark:border-gray-700 shadow-neo-sm active:scale-95 transition-all"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={!dishTitle.trim()}
                  onClick={() => setCurrentStep(2)}
                  className={`py-2.5 px-5 font-black text-xs uppercase tracking-wider rounded-xl border-2 border-black shadow-neo active:scale-95 transition-all flex items-center gap-1.5 ${
                    dishTitle.trim()
                      ? 'bg-[#FFE600] text-black hover:bg-yellow-400 cursor-pointer'
                      : 'bg-gray-200 text-gray-400 dark:bg-gray-800 dark:text-gray-600 border-gray-300 dark:border-gray-700 cursor-not-allowed shadow-none'
                  }`}
                >
                  <span>Next: Schedule</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Step 2 Footer */}
            {currentStep === 2 && (
              <>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="py-2.5 px-3 sm:px-4 bg-[#FAF8F5] dark:bg-[#20222E] text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white font-black text-xs uppercase rounded-xl border-2 border-black dark:border-gray-700 shadow-neo-sm active:scale-95 transition-all flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSubmit()}
                    className="hidden sm:inline-flex py-2.5 px-3 bg-white dark:bg-[#20222E] hover:bg-gray-100 text-gray-800 dark:text-white font-black text-xs uppercase rounded-xl border-2 border-black dark:border-gray-700 shadow-neo-sm active:scale-95 transition-all"
                    title="Finish now with smart defaults"
                  >
                    Save Now
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="py-2.5 px-4 sm:px-5 bg-[#FFE600] hover:bg-yellow-400 text-black font-black text-xs uppercase tracking-wider rounded-xl border-2 border-black shadow-neo active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <span>Next: Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}

            {/* Step 3 Footer */}
            {currentStep === 3 && (
              <>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="py-2.5 px-3 sm:px-4 bg-[#FAF8F5] dark:bg-[#20222E] text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white font-black text-xs uppercase rounded-xl border-2 border-black dark:border-gray-700 shadow-neo-sm active:scale-95 transition-all flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="submit"
                  className="flex-1 max-w-xs sm:max-w-none py-3 px-4 bg-[#FF5500] hover:bg-[#ff681a] text-white font-black text-xs uppercase tracking-wider rounded-xl border-2 border-black shadow-neo active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>
                    SAVE TO {selectedSlot.toUpperCase()} {divideDays > 1 ? `(${divideDays}D)` : ''}
                  </span>
                </button>
              </>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
}
