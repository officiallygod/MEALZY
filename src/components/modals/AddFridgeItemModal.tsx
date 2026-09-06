'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, Plus, Minus, Sparkles, Clock, Check } from 'lucide-react';
import { FridgePantryItem } from '@/types/meal';

interface AddFridgeItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: Omit<FridgePantryItem, 'id'>) => void;
}

const QUICK_SUGGESTIONS = [
  'Leftover Dinner',
  'Cooked Jasmine Rice',
  'Grilled Chicken Breast',
  'Roasted Veggies',
  'Homemade Pasta Sauce',
  'Fresh Salad Greens',
  'Boiled Eggs',
  'Soup Batch',
];

const CATEGORIES = [
  { id: 'leftovers', label: 'Leftovers', color: '#FFE600' },
  { id: 'protein', label: 'Protein', color: '#FF5500' },
  { id: 'grains', label: 'Grains & Pasta', color: '#00E5FF' },
  { id: 'produce', label: 'Produce & Veg', color: '#10B981' },
  { id: 'sauce', label: 'Sauce & Dairy', color: '#D4FF00' },
];

export default function AddFridgeItemModal({
  isOpen,
  onClose,
  onAddItem,
}: AddFridgeItemModalProps) {
  const [name, setName] = useState('');
  const [portions, setPortions] = useState(2);
  const [daysInFridge, setDaysInFridge] = useState(0);
  const [category, setCategory] = useState('leftovers');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = name.trim() || 'Prepared Dish';
    const status: 'fresh' | 'eat-soon' | 'rotting' =
      daysInFridge >= 7 ? 'rotting' : daysInFridge >= 4 ? 'eat-soon' : 'fresh';

    const cookedDate = new Date();
    cookedDate.setDate(cookedDate.getDate() - daysInFridge);

    onAddItem({
      name: cleanTitle,
      originalMealTitle: cleanTitle,
      portionsLeft: portions,
      daysInFridge,
      status,
      cookedAt: cookedDate.toISOString(),
      category,
      accentColor: CATEGORIES.find((c) => c.id === category)?.color || '#FFE600',
    });

    setName('');
    setPortions(2);
    setDaysInFridge(0);
    setCategory('leftovers');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto scrollbar-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative w-full max-w-md bg-white dark:bg-[#16171E] border-2 border-black dark:border-gray-700 rounded-3xl p-5 sm:p-6 shadow-neo-xl text-gray-900 dark:text-white max-h-[92vh] overflow-y-auto custom-scrollbar"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-[#FAF8F5] dark:bg-[#20222E] border-2 border-black dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white shadow-neo-sm active:scale-95 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#00E5FF] border-2 border-black flex items-center justify-center text-black shadow-neo-sm">
            <Package className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="rotate-[-2deg] bg-[#FFE600] text-black font-black text-[9px] uppercase px-2 py-0.5 rounded-md border border-black">
                Perishable Radar
              </span>
            </div>
            <h3 className="font-funky font-black text-lg text-gray-900 dark:text-white leading-tight mt-0.5">
              Stash Item in Fridge
            </h3>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Item Name */}
          <div>
            <label className="block text-[11px] font-black uppercase text-gray-700 dark:text-gray-300 mb-1.5">
              What are you putting in the fridge?
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Leftover Chicken Curry, Rice, Veggies..."
              className="w-full bg-[#FAF8F5] dark:bg-[#20222E] border-2 border-black dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-[#FF5500]"
            />

            {/* Quick 1-Click Suggestions */}
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              {QUICK_SUGGESTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setName(item)}
                  className="text-[10px] font-bold px-2 py-1 rounded-lg bg-[#FAF8F5] dark:bg-[#20222E] hover:bg-[#FFE600] dark:hover:bg-[#FFE600] hover:text-black dark:hover:text-black border border-black/20 dark:border-gray-700 hover:border-black transition-all cursor-pointer"
                >
                  + {item}
                </button>
              ))}
            </div>
          </div>

          {/* Portions & Quantity */}
          <div className="p-3 bg-[#FAF8F5] dark:bg-[#20222E] rounded-2xl border-2 border-black dark:border-gray-700 flex items-center justify-between shadow-neo-sm">
            <div>
              <span className="font-black text-xs uppercase text-gray-900 dark:text-white block">
                Portions / Servings
              </span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                How many meals can this make?
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPortions(Math.max(1, portions - 1))}
                className="w-8 h-8 rounded-xl bg-white dark:bg-[#16171E] border-2 border-black dark:border-gray-700 font-black text-sm flex items-center justify-center active:scale-95 shadow-neo-sm cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
              <span className="font-funky font-black text-base w-8 text-center text-gray-900 dark:text-white">
                {portions}
              </span>
              <button
                type="button"
                onClick={() => setPortions(Math.min(10, portions + 1))}
                className="w-8 h-8 rounded-xl bg-white dark:bg-[#16171E] border-2 border-black dark:border-gray-700 font-black text-sm flex items-center justify-center active:scale-95 shadow-neo-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Freshness Age */}
          <div className="p-3 bg-[#FAF8F5] dark:bg-[#20222E] rounded-2xl border-2 border-black dark:border-gray-700 space-y-2 shadow-neo-sm">
            <div className="flex items-center justify-between">
              <span className="font-black text-xs uppercase text-gray-900 dark:text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#FF5500]" />
                <span>When was it prepared?</span>
              </span>
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                {daysInFridge === 0 ? 'Fresh Today' : `${daysInFridge} day${daysInFridge > 1 ? 's' : ''} in fridge`}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {[
                { label: 'Today (0d)', days: 0 },
                { label: 'Yesterday (1d)', days: 1 },
                { label: '2 Days Ago (2d)', days: 2 },
              ].map((preset) => (
                <button
                  key={preset.days}
                  type="button"
                  onClick={() => setDaysInFridge(preset.days)}
                  className={`py-1.5 rounded-xl border-2 text-[10px] font-black transition-all cursor-pointer ${
                    daysInFridge === preset.days
                      ? 'bg-[#D4FF00] text-black border-black shadow-neo-sm'
                      : 'bg-white dark:bg-[#16171E] border-black/20 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Tag */}
          <div>
            <label className="block text-[11px] font-black uppercase text-gray-700 dark:text-gray-300 mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`py-1.5 px-2 rounded-xl border-2 text-[10px] font-black transition-all truncate cursor-pointer ${
                    category === cat.id
                      ? 'border-black shadow-neo-sm text-black'
                      : 'bg-[#FAF8F5] dark:bg-[#20222E] border-black/20 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                  style={{ backgroundColor: category === cat.id ? cat.color : undefined }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-white dark:bg-[#20222E] hover:bg-gray-100 text-gray-800 dark:text-gray-200 font-black text-xs uppercase rounded-xl border-2 border-black dark:border-gray-700 shadow-neo-sm active:scale-95 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-[#FF5500] hover:bg-[#ff681a] text-white font-black text-xs uppercase rounded-xl border-2 border-black shadow-neo active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Stash in Fridge</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
