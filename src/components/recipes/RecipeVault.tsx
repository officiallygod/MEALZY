'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Clock, Flame, Sparkles, Filter } from 'lucide-react';
import { CURATED_FOODS, CuratedFood } from '@/lib/curated-foods';
import { MealItem, MealType } from '@/types/meal';
import Image from 'next/image';

interface RecipeVaultProps {
  onScheduleMeal: (meal: Omit<MealItem, 'id'>) => void;
  rollingDays: { dateString: string; dayName: string; dayNumber: number }[];
}

export default function RecipeVault({ onScheduleMeal, rollingDays }: RecipeVaultProps) {
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [targetDayIndex, setTargetDayIndex] = useState(0);
  const [targetSlot, setTargetSlot] = useState<MealType>('dinner');

  const tags = ['all', 'high-protein', 'quick', 'vegetarian', 'comfort-food', 'asian-inspired', 'dinner-fave'];

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
      imageUrl: food.imageUrl,
      ingredients: food.defaultIngredients,
      tags: food.tags,
      customEmoji: food.emoji,
      accentColor: food.accentColor,
      dateScheduled: day.dateString,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#12141B] border-2 border-black rounded-3xl p-6 shadow-neo">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">📚</span>
              <h2 className="font-funky font-black text-xl text-white">THE AESTHETIC RECIPE VAULT</h2>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Curated chef-grade recipes with macro balances, zero broken images, and instant scheduling.
            </p>
          </div>

          {/* Quick Target Day & Slot Picker */}
          <div className="flex flex-wrap items-center gap-2 bg-[#181A24] p-2 rounded-2xl border border-gray-800 text-xs">
            <span className="text-gray-400 font-bold text-[10px] uppercase">Add to:</span>
            <select
              value={targetDayIndex}
              onChange={(e) => setTargetDayIndex(Number(e.target.value))}
              className="bg-[#262938] text-white rounded-lg px-2 py-1 font-bold text-xs border border-gray-700 focus:outline-none"
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
              className="bg-[#262938] text-white rounded-lg px-2 py-1 font-bold text-xs border border-gray-700 capitalize focus:outline-none"
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
          </div>
        </div>

        {/* Filter Tags */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 mt-4 scrollbar-none">
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all whitespace-nowrap ${
                selectedTag === tag
                  ? 'bg-[#D4FF00] text-black shadow-neo'
                  : 'bg-[#181A24] text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Recipe Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFoods.map((food) => (
          <div
            key={food.id}
            className="bg-[#12141B] border-2 border-black hover:border-[#D4FF00] rounded-3xl overflow-hidden shadow-neo transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="relative h-44 w-full bg-[#181A24]">
                <Image
                  src={food.imageUrl}
                  alt={food.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  unoptimized
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-[#D4FF00] text-[10px] font-black border border-[#D4FF00]/40 uppercase">
                  {food.category}
                </div>
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded-xl bg-black/80 backdrop-blur-md text-white text-xs font-black">
                  {food.emoji}
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-funky font-black text-sm text-white group-hover:text-[#D4FF00] transition-colors">
                  {food.title}
                </h3>

                {/* Macro Badges */}
                <div className="grid grid-cols-4 gap-1.5 my-3 text-center">
                  <div className="bg-[#181A24] rounded-lg p-1">
                    <span className="text-[9px] text-gray-500 font-bold block">KCAL</span>
                    <span className="text-xs font-black text-[#D4FF00]">{food.calories}</span>
                  </div>
                  <div className="bg-[#181A24] rounded-lg p-1">
                    <span className="text-[9px] text-gray-500 font-bold block">PROT</span>
                    <span className="text-xs font-black text-[#FF5C5C]">{food.protein}g</span>
                  </div>
                  <div className="bg-[#181A24] rounded-lg p-1">
                    <span className="text-[9px] text-gray-500 font-bold block">CARB</span>
                    <span className="text-xs font-black text-[#22C55E]">{food.carbs}g</span>
                  </div>
                  <div className="bg-[#181A24] rounded-lg p-1">
                    <span className="text-[9px] text-gray-500 font-bold block">TIME</span>
                    <span className="text-xs font-black text-[#C084FC]">{food.prepTimeMinutes}m</span>
                  </div>
                </div>

                {/* Ingredients snippet */}
                <p className="text-[11px] text-gray-400 line-clamp-2">
                  {food.defaultIngredients.map((i) => i.name).join(', ')}
                </p>
              </div>
            </div>

            <div className="p-4 pt-0">
              <button
                onClick={() => handleAdd(food)}
                className="w-full py-2.5 bg-[#262938] hover:bg-[#D4FF00] hover:text-black text-white font-black text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>SCHEDULE MEAL</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
