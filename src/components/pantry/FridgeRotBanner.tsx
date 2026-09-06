'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Clock, Trash2, CalendarCheck, Check, X, Plus } from 'lucide-react';
import { FridgePantryItem, MealItem, MealType } from '@/types/meal';
import { cleanMealTitle } from '@/lib/curated-foods';

interface FridgeRotBannerProps {
  items: FridgePantryItem[];
  meals?: MealItem[];
  onConsumeItemToday: (item: FridgePantryItem, mealType: MealType) => void;
  onMarkFinishedEarly: (itemId: string, mealTitle: string) => void;
  onDeleteItem: (itemId: string) => void;
  onOpenAddFridge?: () => void;
  onlyRotting?: boolean;
}

export default function FridgeRotBanner({
  items,
  meals = [],
  onConsumeItemToday,
  onMarkFinishedEarly,
  onDeleteItem,
  onOpenAddFridge,
  onlyRotting = false,
}: FridgeRotBannerProps) {
  const [pickerItemId, setPickerItemId] = useState<string | null>(null);
  // Check if an item has been assigned anywhere in scheduled meals
  const isItemAssigned = (item: FridgePantryItem): boolean => {
    if (!meals || meals.length === 0) return false;
    const nameClean = cleanMealTitle(item.name).toLowerCase();
    return meals.some((m) => {
      const mealTitleClean = cleanMealTitle(m.title).toLowerCase();
      const matchesSource = m.sourceMealId === item.id || m.sourceMealId === `fridge-batch-${item.id}`;
      const matchesTitle = mealTitleClean.includes(nameClean) || nameClean.includes(mealTitleClean);
      return matchesSource || matchesTitle;
    });
  };

  // Rotting rule: strictly > 7 days old AND NOT assigned anywhere
  const rottingItems = items.filter((item) => {
    const isOverAWeekOld = item.daysInFridge > 7;
    const assigned = isItemAssigned(item);
    return isOverAWeekOld && !assigned;
  });

  // Fresh / scheduled batches
  const freshItems = items.filter((item) => {
    const isOverAWeekOld = item.daysInFridge > 7;
    const assigned = isItemAssigned(item);
    return !isOverAWeekOld || assigned;
  });

  if (items.length === 0) {
    if (onlyRotting) return null;
    return (
      <div className="bg-white dark:bg-[#16171E] border-2 border-black dark:border-gray-800 rounded-3xl p-8 shadow-neo-lg text-center transition-colors">
        <div className="w-14 h-14 rounded-2xl bg-[#00E5FF] border-2 border-black flex items-center justify-center mx-auto mb-3 shadow-neo-sm text-2xl">
          🧊
        </div>
        <h3 className="font-funky font-black text-lg text-gray-900 dark:text-white">
          Fridge Radar is Clear!
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1 mb-4 font-medium">
          Zero food waste risk right now. Stash leftovers, cooked batches, or groceries to track freshness.
        </p>
        {onOpenAddFridge && (
          <button
            type="button"
            onClick={onOpenAddFridge}
            className="px-4 py-2.5 bg-[#FF5500] hover:bg-[#ff681a] text-white font-black text-xs uppercase rounded-xl border-2 border-black shadow-neo active:scale-95 transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Item to Fridge</span>
          </button>
        )}
      </div>
    );
  }

  if (onlyRotting && rottingItems.length === 0) return null;

  return (
    <div className="space-y-4 mb-6">
      {/* NEO-BRUTALIST CRITICAL SPOILAGE ALERT (> 7 DAYS & UNASSIGNED) */}
      <AnimatePresence>
        {rottingItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-[#16171E] border-2 border-black dark:border-rose-800 rounded-3xl p-4 sm:p-5 shadow-neo-lg border-l-[10px] border-l-rose-500 transition-colors"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 pb-3 border-b-2 border-black/10 dark:border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="rotate-[-2deg] bg-rose-500 text-white font-black text-xs uppercase px-3 py-1 rounded-xl border-2 border-black shadow-neo-sm flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>SPOILAGE ALERT</span>
                </div>
                <span className="font-funky font-black text-sm text-gray-900 dark:text-white uppercase tracking-tight">
                  {rottingItems.length} Batch{rottingItems.length > 1 ? 'es' : ''} Past 1 Week Unassigned
                </span>
              </div>
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                Not scheduled anywhere. Consume today to prevent food waste.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {rottingItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-rose-50/70 dark:bg-[#201820] border-2 border-black dark:border-rose-900/60 rounded-2xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 shadow-neo-sm"
                >
                  <div className="min-w-0 flex-1">
                    <h5 className="font-funky font-black text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                      {cleanMealTitle(item.name)}
                    </h5>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mt-1 font-bold flex-wrap">
                      <span className="text-rose-600 dark:text-rose-400 font-black flex items-center gap-1">
                        <Clock className="w-3 h-3 flex-shrink-0" /> {item.daysInFridge}d in fridge (&gt; 7 days)
                      </span>
                      <span>•</span>
                      <span>{item.portionsLeft} portion{item.portionsLeft > 1 ? 's' : ''} remaining</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end sm:justify-start pt-2 sm:pt-0 border-t sm:border-t-0 border-rose-200/80 dark:border-rose-900/40 w-full sm:w-auto flex-shrink-0">
                    {pickerItemId === item.id ? (
                      <div className="flex items-center gap-1 bg-white dark:bg-[#16171E] p-1 rounded-xl border-2 border-black dark:border-gray-700 shadow-neo-sm flex-wrap w-full sm:w-auto justify-between sm:justify-start">
                        <span className="text-[9px] font-black uppercase text-gray-500 px-1">For:</span>
                        <div className="flex items-center gap-1 flex-wrap">
                          {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((slot) => (
                            <button
                              key={slot}
                              onClick={() => {
                                onConsumeItemToday(item, slot);
                                setPickerItemId(null);
                              }}
                              className={`px-1.5 py-0.5 text-[9px] font-black uppercase rounded border border-black ${
                                slot === 'breakfast'
                                  ? 'bg-[#FFE600] text-black'
                                  : slot === 'lunch'
                                  ? 'bg-[#00E5FF] text-black'
                                  : slot === 'dinner'
                                  ? 'bg-[#FF5500] text-white'
                                  : 'bg-[#D4FF00] text-black'
                              }`}
                            >
                              {slot === 'breakfast' ? 'Bfast' : slot}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => setPickerItemId(null)}
                          className="px-1 text-gray-400 hover:text-black dark:hover:text-white text-xs font-black"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => setPickerItemId(item.id)}
                          className="flex-1 sm:flex-initial px-3 py-1.5 bg-[#D4FF00] hover:bg-[#c3ed00] text-black font-black rounded-xl text-[11px] border-2 border-black shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 transition-all text-center"
                        >
                          Eat Today
                        </button>
                        <button
                          onClick={() => onMarkFinishedEarly(item.id, item.name)}
                          className="flex-1 sm:flex-initial px-2.5 py-1.5 bg-[#FFE600] hover:bg-yellow-400 text-black font-black rounded-xl text-[11px] border-2 border-black shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 transition-all text-center"
                          title="Item was finished earlier? Mark completed."
                        >
                          Gone?
                        </button>
                        <button
                          onClick={() => onDeleteItem(item.id)}
                          className="p-1.5 bg-gray-100 dark:bg-[#2A2B36] hover:bg-rose-100 text-gray-500 hover:text-rose-600 rounded-xl border border-black/20 transition-colors flex-shrink-0"
                          title="Discard item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REFRIGERATED BATCHES (CLEAN NEO-BRUTALIST INVENTORY) */}
      {!onlyRotting && freshItems.length > 0 && (
        <div className="bg-white dark:bg-[#16171E] border-2 border-black dark:border-gray-800 rounded-3xl p-5 shadow-neo-lg transition-colors">
          <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-black/10 dark:border-gray-800">
            <div className="flex items-center gap-2.5">
              <span className="rotate-[-1deg] bg-[#00E5FF] text-black font-black text-xs uppercase px-2.5 py-1 rounded-xl border-2 border-black shadow-neo-sm">
                INVENTORY
              </span>
              <span className="font-funky font-black text-sm text-gray-900 dark:text-white uppercase tracking-tight">
                Active Batches ({freshItems.length})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 hidden sm:inline">
                Safe &amp; available to allocate
              </span>
              {onOpenAddFridge && (
                <button
                  type="button"
                  onClick={onOpenAddFridge}
                  className="px-2.5 py-1 bg-[#FF5500] hover:bg-[#ff681a] text-white font-black text-[11px] uppercase rounded-xl border border-black shadow-neo-sm flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Add Item</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {freshItems.map((item) => {
              const assigned = isItemAssigned(item);

              return (
                <div
                  key={item.id}
                  className="bg-[#FAF8F5] dark:bg-[#1E202A] border-2 border-black dark:border-gray-700 rounded-2xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 shadow-neo-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h6 className="font-funky font-bold text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                        {cleanMealTitle(item.name)}
                      </h6>
                      {assigned && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-400 flex items-center gap-0.5">
                          <CalendarCheck className="w-2.5 h-2.5" /> Scheduled
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 font-bold mt-0.5">
                      {item.daysInFridge}d old • {item.portionsLeft} portion(s) left
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0 justify-end sm:justify-start pt-2 sm:pt-0 border-t sm:border-t-0 border-black/10 dark:border-gray-700/50 w-full sm:w-auto">
                    {pickerItemId === item.id ? (
                      <div className="flex items-center gap-1 bg-white dark:bg-[#16171E] p-1 rounded-xl border-2 border-black dark:border-gray-700 shadow-neo-sm flex-wrap w-full sm:w-auto justify-between sm:justify-start">
                        <span className="text-[9px] font-black uppercase text-gray-500 px-1">For:</span>
                        <div className="flex items-center gap-1 flex-wrap">
                          {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((slot) => (
                            <button
                              key={slot}
                              onClick={() => {
                                onConsumeItemToday(item, slot);
                                setPickerItemId(null);
                              }}
                              className={`px-1.5 py-0.5 text-[9px] font-black uppercase rounded border border-black ${
                                slot === 'breakfast'
                                  ? 'bg-[#FFE600] text-black'
                                  : slot === 'lunch'
                                  ? 'bg-[#00E5FF] text-black'
                                  : slot === 'dinner'
                                  ? 'bg-[#FF5500] text-white'
                                  : 'bg-[#D4FF00] text-black'
                              }`}
                            >
                              {slot === 'breakfast' ? 'Bfast' : slot}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => setPickerItemId(null)}
                          className="px-1 text-gray-400 hover:text-black dark:hover:text-white text-xs font-black"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => setPickerItemId(item.id)}
                          className="flex-1 sm:flex-initial px-2.5 py-1 bg-[#D4FF00] hover:bg-[#c3ed00] text-black font-black text-[10px] sm:text-[11px] rounded-lg border border-black shadow-neo-sm transition-all text-center"
                        >
                          Eat
                        </button>
                        <button
                          onClick={() => onMarkFinishedEarly(item.id, item.name)}
                          className="flex-1 sm:flex-initial px-2 py-1 bg-[#FFE600] hover:bg-yellow-400 text-black font-bold text-[10px] sm:text-[11px] rounded-lg border border-black shadow-neo-sm text-center"
                        >
                          Gone?
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
