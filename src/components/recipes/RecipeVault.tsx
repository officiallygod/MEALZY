'use client';

import React, { useState } from 'react';
import { Search, Plus, Clock } from 'lucide-react';
import { CURATED_FOODS, CuratedFood, getMealAccent, getMealInitials } from '@/lib/curated-foods';
import { MealItem, MealType } from '@/types/meal';

interface RecipeVaultProps {
  onScheduleMeal: (meal: Omit<MealItem, 'id'>) => void;
  rollingDays: { dateString: string; dayName: string; dayNumber: number }[];
}

export default function RecipeVault({ onScheduleMeal, rollingDays }: RecipeVaultProps) {
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [targetDayIndex, setTargetDayIndex] = useState(0);
  const [targetSlot, setTargetSlot] = useState<MealType>('dinner');

  const tags = ['all', 'high-protein', 'quick', 'vegetarian', 'dinner', 'breakfast', 'lunch'];

  const filteredFoods = CURATED_FOODS.filter((food) => {
    const matchesTag = selectedTag === 'all' || food.tags.includes(selectedTag);
    const matchesSearch =
      food.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      food.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTag && matchesSearch;
  });

  const handleAdd = (food: CuratedFood) => {
    const day = rollingDays[targetDayIndex] || rollingDays[0];
    onScheduleMeal({
      title: food.title,
      mealType: targetSlot,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      prepTimeMinutes: food.prepTimeMinutes,
      ingredients: food.defaultIngredients,
      tags: food.tags,
      accentColor: food.accentColor,
      dateScheduled: day.dateString,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white dark:bg-[#12141B] border border-gray-200 dark:border-black rounded-3xl p-6 shadow-sm transition-colors">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="font-funky font-black text-xl text-gray-900 dark:text-white">RECIPE VAULT</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Nutritionally balanced culinary library with instant scheduling.
            </p>
          </div>

          {/* Allocation Selector */}
          <div className="flex flex-wrap items-center gap-2 bg-gray-100 dark:bg-[#181A24] p-1.5 rounded-2xl border border-gray-200 dark:border-gray-800 text-xs">
            <span className="text-gray-500 dark:text-gray-400 font-bold text-[10px] uppercase pl-1">
              Add to:
            </span>
            <select
              value={targetDayIndex}
              onChange={(e) => setTargetDayIndex(Number(e.target.value))}
              className="bg-white dark:bg-[#262938] text-gray-900 dark:text-white rounded-lg px-2 py-1 font-bold text-xs border border-gray-200 dark:border-gray-700 focus:outline-none"
            >
              {rollingDays.map((d, i) => (
                <option key={d.dateString} value={i}>
                  {d.dayName} ({d.dayNumber})
                </option>
              ))}
            </select>

            <select
              value={targetSlot}
              onChange={(e) => setTargetSlot(e.target.value as MealType)}
              className="bg-white dark:bg-[#262938] text-gray-900 dark:text-white rounded-lg px-2 py-1 font-bold text-xs border border-gray-200 dark:border-gray-700 capitalize focus:outline-none"
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
          </div>
        </div>

        {/* Search & Tags */}
        <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search recipes, ingredients, tags..."
              className="w-full bg-gray-50 dark:bg-[#181A24] border border-gray-200 dark:border-gray-800 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all whitespace-nowrap ${
                  selectedTag === tag
                    ? 'bg-black text-white dark:bg-[#D4FF00] dark:text-black shadow-sm'
                    : 'bg-gray-100 dark:bg-[#181A24] text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white border border-gray-200 dark:border-gray-800'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recipe Cards Grid (No Images, Pure Typographic Polish) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFoods.map((food) => {
          const initials = getMealInitials(food.title);
          const accent = food.accentColor || getMealAccent(food.title);

          return (
            <div
              key={food.id}
              className="bg-white dark:bg-[#12141B] border border-gray-200 dark:border-[#262938] hover:border-black dark:hover:border-[#D4FF00] rounded-3xl p-5 shadow-sm transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm text-white flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: accent }}
                  >
                    {initials}
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      {food.category}
                    </span>
                    <h3 className="font-funky font-black text-sm text-gray-900 dark:text-white">
                      {food.title}
                    </h3>
                  </div>
                </div>

                {/* Macro Pills */}
                <div className="grid grid-cols-4 gap-1.5 my-3 text-center">
                  <div className="bg-gray-50 dark:bg-[#181A24] rounded-xl p-1.5 border border-gray-100 dark:border-gray-800">
                    <span className="text-[9px] text-gray-400 font-bold block">CAL</span>
                    <span className="text-xs font-black text-gray-900 dark:text-[#D4FF00]">{food.calories}</span>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#181A24] rounded-xl p-1.5 border border-gray-100 dark:border-gray-800">
                    <span className="text-[9px] text-gray-400 font-bold block">PROT</span>
                    <span className="text-xs font-black text-rose-600 dark:text-rose-400">{food.protein}g</span>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#181A24] rounded-xl p-1.5 border border-gray-100 dark:border-gray-800">
                    <span className="text-[9px] text-gray-400 font-bold block">CARB</span>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{food.carbs}g</span>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#181A24] rounded-xl p-1.5 border border-gray-100 dark:border-gray-800">
                    <span className="text-[9px] text-gray-400 font-bold block">TIME</span>
                    <span className="text-xs font-black text-gray-700 dark:text-gray-300">{food.prepTimeMinutes}m</span>
                  </div>
                </div>

                {/* Ingredients snippet */}
                <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2">
                  {food.defaultIngredients.map((i) => i.name).join(', ')}
                </p>
              </div>

              <div className="pt-4 mt-2 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={() => handleAdd(food)}
                  className="w-full py-2 bg-gray-900 hover:bg-black text-white dark:bg-[#D4FF00] dark:hover:bg-[#c3ed00] dark:text-black font-black text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>SCHEDULE MEAL</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
