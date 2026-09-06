'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Link as LinkIcon, Sparkles, Plus, Clock, Globe } from 'lucide-react';
import { MealItem, MealType } from '@/types/meal';
import { CURATED_FOODS, getVisualForDish } from '@/lib/curated-foods';
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
  const [customEmoji, setCustomEmoji] = useState('🍲');

  // Recipe Link State
  const [recipeUrl, setRecipeUrl] = useState('');

  // Open Food Facts State
  const [openFoodResults, setOpenFoodResults] = useState<any[]>([]);
  const [isOpenFoodLoading, setIsOpenFoodLoading] = useState(false);

  if (!isOpen) return null;

  // Filter curated foods
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
      imageUrl: food.imageUrl,
      ingredients: food.defaultIngredients,
      tags: food.tags,
      customEmoji: food.emoji,
      accentColor: food.accentColor,
      dateScheduled: targetDate,
    });
    onClose();
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle) return;

    const visual = getVisualForDish(customTitle);

    onAddMeal({
      title: customTitle,
      mealType: selectedSlot,
      calories: Number(calories) || 450,
      protein: Number(protein) || 25,
      carbs: Number(carbs) || 40,
      fat: Number(fat) || 15,
      prepTimeMinutes: Number(prepTime) || 15,
      imageUrl: visual.imageUrl,
      customEmoji: visual.emoji,
      accentColor: visual.accentColor,
      ingredients: [{ name: 'Custom fresh ingredients', amount: '1 serving' }],
      tags: ['custom-dish'],
      dateScheduled: targetDate,
    });
    onClose();
  };

  const handleAddFromLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipeUrl) return;

    const parsed = parseRecipeUrlPreview(recipeUrl);
    const visual = getVisualForDish(parsed.title);

    onAddMeal({
      title: parsed.title,
      mealType: selectedSlot,
      calories: parsed.calories || 520,
      protein: 28,
      carbs: 55,
      fat: 18,
      prepTimeMinutes: parsed.prepTimeMinutes || 20,
      recipeUrl: parsed.url,
      customEmoji: visual.emoji,
      accentColor: visual.accentColor,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative w-full max-w-xl bg-[#12141B] border-2 border-black rounded-3xl p-6 shadow-[6px_6px_0px_#D4FF00] text-white max-h-[90vh] flex flex-col"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#1C1F2B] border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-4">
          <h2 className="font-funky font-black text-2xl text-white">ADD TO PLAN</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Planning for <span className="text-[#D4FF00] font-bold">{targetDate}</span>
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
                  ? 'bg-[#D4FF00] text-black shadow-neo'
                  : 'bg-[#181A24] text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              {slot}
            </button>
          ))}
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#181A24] p-1 rounded-2xl mb-4 border border-gray-800">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'catalog' ? 'bg-[#D4FF00] text-black shadow-neo' : 'text-gray-400 hover:text-white'
            }`}
          >
            Aesthetic Top 200
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'custom' ? 'bg-[#D4FF00] text-black shadow-neo' : 'text-gray-400 hover:text-white'
            }`}
          >
            Custom Meal
          </button>
          <button
            onClick={() => setActiveTab('link')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'link' ? 'bg-[#D4FF00] text-black shadow-neo' : 'text-gray-400 hover:text-white'
            }`}
          >
            Paste Link
          </button>
          <button
            onClick={() => setActiveTab('openfood')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'openfood' ? 'bg-[#D4FF00] text-black shadow-neo' : 'text-gray-400 hover:text-white'
            }`}
          >
            Open Database
          </button>
        </div>

        {/* TAB 1: CURATED TOP 200 CATALOG */}
        {activeTab === 'catalog' && (
          <div className="flex-1 overflow-y-auto space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search curated bowls, ramen, pasta, oats..."
                className="w-full bg-[#181A24] border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4FF00]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
              {filteredCurated.map((food) => (
                <div
                  key={food.id}
                  onClick={() => handlePickCurated(food)}
                  className="bg-[#181A24] hover:bg-[#202330] border border-gray-800 hover:border-[#D4FF00] rounded-2xl p-3 cursor-pointer transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{food.emoji}</span>
                    <div>
                      <h4 className="font-bold text-xs text-white group-hover:text-[#D4FF00] transition-colors">
                        {food.title}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium">
                        <span className="text-[#D4FF00] font-black">{food.calories} kcal</span>
                        <span>•</span>
                        <span>{food.protein}g P</span>
                        <span>•</span>
                        <span>{food.prepTimeMinutes}m</span>
                      </div>
                    </div>
                  </div>

                  <button className="w-6 h-6 rounded-lg bg-[#262938] group-hover:bg-[#D4FF00] group-hover:text-black flex items-center justify-center transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: CUSTOM MEAL */}
        {activeTab === 'custom' && (
          <form onSubmit={handleAddCustom} className="space-y-3 overflow-y-auto pr-1">
            <div>
              <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">Meal Title</label>
              <input
                type="text"
                required
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g. Grandma's Secret Lentil Curry"
                className="w-full bg-[#181A24] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4FF00]"
              />
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1">Calories</label>
                <input
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  className="w-full bg-[#181A24] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1">Protein (g)</label>
                <input
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  className="w-full bg-[#181A24] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1">Carbs (g)</label>
                <input
                  type="number"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  className="w-full bg-[#181A24] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1">Fats (g)</label>
                <input
                  type="number"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  className="w-full bg-[#181A24] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#D4FF00] hover:bg-[#c3ed00] text-black font-black text-xs rounded-xl shadow-neo transition-all mt-3"
            >
              SAVE TO {selectedSlot.toUpperCase()}
            </button>
          </form>
        )}

        {/* TAB 3: RECIPE LINK IMPORT */}
        {activeTab === 'link' && (
          <form onSubmit={handleAddFromLink} className="space-y-3">
            <div className="p-3 rounded-2xl bg-[#181A24] border border-gray-800 text-xs text-gray-300 flex items-start gap-2">
              <LinkIcon className="w-4 h-4 text-[#D4FF00] flex-shrink-0 mt-0.5" />
              <span>
                Paste any recipe URL from TikTok, Instagram, YouTube, NYT Cooking, or food blogs.
                We&apos;ll bookmark it directly into your schedule!
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">Recipe URL</label>
              <input
                type="url"
                required
                value={recipeUrl}
                onChange={(e) => setRecipeUrl(e.target.value)}
                placeholder="https://www.tiktok.com/@chef/video/... or food blog link"
                className="w-full bg-[#181A24] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4FF00]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#D4FF00] hover:bg-[#c3ed00] text-black font-black text-xs rounded-xl shadow-neo transition-all"
            >
              IMPORT & SCHEDULE
            </button>
          </form>
        )}

        {/* TAB 4: OPEN FOOD FACTS SEARCH */}
        {activeTab === 'openfood' && (
          <div className="space-y-3 overflow-y-auto">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search global open food database..."
                className="flex-1 bg-[#181A24] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white"
              />
              <button
                type="button"
                onClick={handleSearchOpenFoodFacts}
                disabled={isOpenFoodLoading}
                className="py-2 px-4 bg-[#262938] hover:bg-[#34384c] text-white font-bold text-xs rounded-xl flex items-center gap-1"
              >
                <Globe className="w-3.5 h-3.5 text-[#38BDF8]" />
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
                      customEmoji: '📦',
                      accentColor: '#38BDF8',
                      ingredients: [{ name: item.name, amount: '1 portion' }],
                      tags: ['open-food-facts'],
                      dateScheduled: targetDate,
                    });
                    onClose();
                  }}
                  className="p-2.5 rounded-xl bg-[#181A24] hover:bg-[#202330] border border-gray-800 hover:border-[#38BDF8] cursor-pointer flex items-center justify-between text-xs"
                >
                  <div>
                    <h5 className="font-bold text-white">{item.name}</h5>
                    <p className="text-[10px] text-gray-400">
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
