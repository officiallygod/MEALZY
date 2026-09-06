'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Search, Link as LinkIcon, Plus, Globe } from 'lucide-react';
import { MealItem, MealType } from '@/types/meal';
import { CURATED_FOODS, getMealAccent, getMealInitials } from '@/lib/curated-foods';
import { searchOpenFoodFacts } from '@/lib/ai-engine';
import { parseRecipeUrlPreview } from '@/lib/recipe-extractor';

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
  const [activeTab, setActiveTab] = useState<'catalog' | 'custom' | 'link' | 'openfood'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<MealType>(targetSlot || 'lunch');

  // Custom Form State
  const [customTitle, setCustomTitle] = useState('');
  const [calories, setCalories] = useState('500');
  const [protein, setProtein] = useState('30');
  const [carbs, setCarbs] = useState('50');
  const [fat, setFat] = useState('15');
  const [prepTime, setPrepTime] = useState('20');

  // Recipe Link State
  const [recipeUrl, setRecipeUrl] = useState('');

  // Open Food Facts State
  const [openFoodResults, setOpenFoodResults] = useState<any[]>([]);
  const [isOpenFoodLoading, setIsOpenFoodLoading] = useState(false);

  if (!isOpen) return null;

  const filteredCurated = CURATED_FOODS.filter((f) =>
    f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handlePickCurated = (food: typeof CURATED_FOODS[0]) => {
    onAddMeal({
      title: food.title,
      mealType: selectedSlot,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      prepTimeMinutes: food.prepTimeMinutes,
      ingredients: food.defaultIngredients,
      tags: food.tags,
      accentColor: food.accentColor,
      dateScheduled: targetDate,
    });
    onClose();
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle) return;

    onAddMeal({
      title: customTitle,
      mealType: selectedSlot,
      calories: Number(calories) || 450,
      protein: Number(protein) || 25,
      carbs: Number(carbs) || 40,
      fat: Number(fat) || 15,
      prepTimeMinutes: Number(prepTime) || 15,
      accentColor: getMealAccent(customTitle),
      ingredients: [{ name: 'Fresh Ingredients', amount: '1 serving' }],
      tags: ['custom-meal'],
      dateScheduled: targetDate,
    });
    onClose();
  };

  const handleAddFromLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipeUrl) return;

    const parsed = parseRecipeUrlPreview(recipeUrl);

    onAddMeal({
      title: parsed.title,
      mealType: selectedSlot,
      calories: parsed.calories || 520,
      protein: 28,
      carbs: 55,
      fat: 18,
      prepTimeMinutes: parsed.prepTimeMinutes || 20,
      recipeUrl: parsed.url,
      accentColor: getMealAccent(parsed.title),
      ingredients: parsed.ingredients,
      tags: ['linked-recipe', parsed.sourceDomain.toLowerCase()],
      dateScheduled: targetDate,
    });
    onClose();
  };

  const handleSearchOpenFoodFacts = async () => {
    if (!searchQuery) return;
    setIsOpenFoodLoading(true);
    const results = await searchOpenFoodFacts(searchQuery);
    setOpenFoodResults(results);
    setIsOpenFoodLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative w-full max-w-xl bg-white dark:bg-[#12141B] border border-gray-200 dark:border-black rounded-3xl p-6 shadow-2xl text-gray-900 dark:text-white max-h-[90vh] flex flex-col transition-colors"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 dark:bg-[#1C1F2B] border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-4">
          <h2 className="font-funky font-black text-xl text-gray-900 dark:text-white">ADD TO SCHEDULE</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Planning for <span className="font-bold text-gray-900 dark:text-white">{targetDate}</span>
          </p>
        </div>

        {/* Slot Selector */}
        <div className="flex gap-2 mb-4">
          {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((slot) => (
            <button
              key={slot}
              onClick={() => setSelectedSlot(slot)}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black uppercase transition-all ${
                selectedSlot === slot
                  ? 'bg-black text-white dark:bg-[#D4FF00] dark:text-black shadow-sm'
                  : 'bg-gray-100 dark:bg-[#181A24] text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white border border-gray-200 dark:border-gray-800'
              }`}
            >
              {slot}
            </button>
          ))}
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-gray-100 dark:bg-[#181A24] p-1 rounded-2xl mb-4 border border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'catalog'
                ? 'bg-white text-black dark:bg-[#D4FF00] dark:text-black shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
            }`}
          >
            Curated Catalog
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'custom'
                ? 'bg-white text-black dark:bg-[#D4FF00] dark:text-black shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
            }`}
          >
            Custom Meal
          </button>
          <button
            onClick={() => setActiveTab('link')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'link'
                ? 'bg-white text-black dark:bg-[#D4FF00] dark:text-black shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
            }`}
          >
            Recipe URL
          </button>
          <button
            onClick={() => setActiveTab('openfood')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'openfood'
                ? 'bg-white text-black dark:bg-[#D4FF00] dark:text-black shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
            }`}
          >
            Food Database
          </button>
        </div>

        {/* TAB 1: CURATED CATALOG */}
        {activeTab === 'catalog' && (
          <div className="flex-1 overflow-y-auto space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search curated meals, pasta, oats..."
                className="w-full bg-gray-50 dark:bg-[#181A24] border border-gray-200 dark:border-gray-700 rounded-xl pl-9 pr-4 py-2 text-xs text-gray-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
              {filteredCurated.map((food) => {
                const initials = getMealInitials(food.title);
                const accent = food.accentColor || getMealAccent(food.title);

                return (
                  <div
                    key={food.id}
                    onClick={() => handlePickCurated(food)}
                    className="bg-gray-50 dark:bg-[#181A24] hover:bg-gray-100 dark:hover:bg-[#202330] border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-[#D4FF00] rounded-2xl p-3 cursor-pointer transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs text-white flex-shrink-0"
                        style={{ backgroundColor: accent }}
                      >
                        {initials}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-gray-900 dark:text-white">
                          {food.title}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                          <span className="font-black text-gray-900 dark:text-[#D4FF00]">{food.calories} kcal</span>
                          <span>•</span>
                          <span>{food.protein}g P</span>
                          <span>•</span>
                          <span>{food.prepTimeMinutes}m</span>
                        </div>
                      </div>
                    </div>

                    <button className="w-6 h-6 rounded-lg bg-gray-200 dark:bg-[#262938] group-hover:bg-black group-hover:text-white dark:group-hover:bg-[#D4FF00] dark:group-hover:text-black flex items-center justify-center transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: CUSTOM MEAL */}
        {activeTab === 'custom' && (
          <form onSubmit={handleAddCustom} className="space-y-3 overflow-y-auto pr-1">
            <div>
              <label className="block text-[11px] font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">
                Meal Title
              </label>
              <input
                type="text"
                required
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g. Lentil Curry with Basmati Rice"
                className="w-full bg-gray-50 dark:bg-[#181A24] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1">Calories</label>
                <input
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#181A24] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1">Protein (g)</label>
                <input
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#181A24] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1">Carbs (g)</label>
                <input
                  type="number"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#181A24] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1">Fats (g)</label>
                <input
                  type="number"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#181A24] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-black hover:bg-gray-800 text-white dark:bg-[#D4FF00] dark:hover:bg-[#c3ed00] dark:text-black font-black text-xs rounded-xl shadow-sm transition-all mt-3"
            >
              SAVE TO {selectedSlot.toUpperCase()}
            </button>
          </form>
        )}

        {/* TAB 3: RECIPE URL */}
        {activeTab === 'link' && (
          <form onSubmit={handleAddFromLink} className="space-y-3">
            <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#181A24] border border-gray-200 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-300 flex items-start gap-2">
              <LinkIcon className="w-4 h-4 text-blue-600 dark:text-[#D4FF00] flex-shrink-0 mt-0.5" />
              <span>
                Paste a recipe link from any food publication or social platform. The bookmark will be registered to your schedule.
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">
                Recipe URL
              </label>
              <input
                type="url"
                required
                value={recipeUrl}
                onChange={(e) => setRecipeUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-gray-50 dark:bg-[#181A24] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-black hover:bg-gray-800 text-white dark:bg-[#D4FF00] dark:hover:bg-[#c3ed00] dark:text-black font-black text-xs rounded-xl shadow-sm transition-all"
            >
              IMPORT AND SCHEDULE
            </button>
          </form>
        )}

        {/* TAB 4: OPEN FOOD FACTS */}
        {activeTab === 'openfood' && (
          <div className="space-y-3 overflow-y-auto">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search global food database..."
                className="flex-1 bg-gray-50 dark:bg-[#181A24] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSearchOpenFoodFacts}
                disabled={isOpenFoodLoading}
                className="py-2 px-4 bg-gray-900 hover:bg-black text-white dark:bg-[#262938] dark:hover:bg-[#34384c] font-bold text-xs rounded-xl flex items-center gap-1"
              >
                <Globe className="w-3.5 h-3.5 text-sky-400" />
                <span>{isOpenFoodLoading ? 'Searching...' : 'Search'}</span>
              </button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {openFoodResults.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    onAddMeal({
                      title: item.name,
                      mealType: selectedSlot,
                      calories: item.calories || 400,
                      protein: item.protein || 20,
                      carbs: item.carbs || 45,
                      fat: item.fat || 12,
                      prepTimeMinutes: 10,
                      accentColor: '#06B6D4',
                      ingredients: [{ name: item.name, amount: '1 portion' }],
                      tags: ['open-food-facts'],
                      dateScheduled: targetDate,
                    });
                    onClose();
                  }}
                  className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#181A24] hover:bg-gray-100 dark:hover:bg-[#202330] border border-gray-200 dark:border-gray-800 cursor-pointer flex items-center justify-between text-xs"
                >
                  <div>
                    <h5 className="font-bold text-gray-900 dark:text-white">{item.name}</h5>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                      {item.calories} kcal • {item.protein}g Protein • {item.brand}
                    </p>
                  </div>
                  <Plus className="w-4 h-4 text-gray-400" />
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
