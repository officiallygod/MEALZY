'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Clock, Trash2, ArrowRight, Check } from 'lucide-react';
import { FridgePantryItem } from '@/types/meal';

interface FridgeRotBannerProps {
  items: FridgePantryItem[];
  onConsumeItemToday: (item: FridgePantryItem, mealType: 'lunch' | 'dinner') => void;
  onMarkFinishedEarly: (itemId: string, mealTitle: string) => void;
  onDeleteItem: (itemId: string) => void;
  onlyRotting?: boolean;
}

export default function FridgeRotBanner({
  items,
  onConsumeItemToday,
  onMarkFinishedEarly,
  onDeleteItem,
  onlyRotting = false,
}: FridgeRotBannerProps) {
  const rottingItems = items.filter((i) => i.status === 'rotting' || i.daysInFridge >= 3);
  const freshItems = items.filter((i) => i.status !== 'rotting' && i.daysInFridge < 3);

  if (items.length === 0) return null;
  if (onlyRotting && rottingItems.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      {/* COMPACT PERISHABLE NOTIFICATION */}
      <AnimatePresence>
        {rottingItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-rose-50 dark:bg-rose-950/25 border border-rose-200 dark:border-rose-900/60 rounded-2xl p-3.5 transition-colors"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                <span className="text-xs font-black uppercase tracking-wider text-rose-800 dark:text-rose-300">
                  Perishable Priority ({rottingItems.length} item{rottingItems.length > 1 ? 's' : ''} past 3 days)
                </span>
              </div>
              <span className="text-[11px] text-rose-700/80 dark:text-rose-400 font-medium">
                Consume today to prevent food waste
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {rottingItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-[#181A24] border border-rose-200 dark:border-rose-900/50 rounded-xl p-3 flex items-center justify-between gap-3"
                >
                  <div>
                    <h5 className="font-bold text-xs text-gray-900 dark:text-white">{item.name}</h5>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                      <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> {item.daysInFridge}d in fridge
                      </span>
                      <span>•</span>
                      <span>{item.portionsLeft} portion remaining</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => onConsumeItemToday(item, 'lunch')}
                      className="px-2.5 py-1 bg-lime-400 dark:bg-[#D4FF00] hover:bg-lime-300 dark:hover:bg-[#c3ed00] text-black font-black rounded-lg text-[10px] transition-all"
                    >
                      Eat Today
                    </button>
                    <button
                      onClick={() => onMarkFinishedEarly(item.id, item.name)}
                      className="px-2 py-1 bg-gray-100 dark:bg-[#262938] hover:bg-gray-200 dark:hover:bg-[#34384c] text-gray-700 dark:text-gray-300 font-bold rounded-lg text-[10px]"
                      title="Item was finished earlier? Mark completed."
                    >
                      Gone?
                    </button>
                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className="p-1 text-gray-400 hover:text-rose-500 rounded-lg"
                      title="Discard item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FRESH REFRIGERATOR BATCHES (CLEAN COMPACT STRIP) */}
      {!onlyRotting && freshItems.length > 0 && (
        <div className="bg-white dark:bg-[#12141B] border border-gray-200 dark:border-gray-800 rounded-2xl p-3 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Refrigerated Batches ({freshItems.length})
            </span>
            <span className="text-[11px] text-gray-500 dark:text-gray-400">Available to allocate</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {freshItems.map((item) => (
              <div
                key={item.id}
                className="bg-gray-50 dark:bg-[#181A24] border border-gray-200 dark:border-gray-800 rounded-xl p-2.5 flex items-center justify-between text-xs"
              >
                <div>
                  <h6 className="font-bold text-gray-900 dark:text-white text-xs">{item.name}</h6>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    {item.portionsLeft} portion(s) left
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onConsumeItemToday(item, 'lunch')}
                    className="px-2 py-0.5 bg-gray-200 dark:bg-[#262938] hover:bg-black hover:text-white dark:hover:bg-[#D4FF00] dark:hover:text-black font-bold text-[10px] rounded"
                  >
                    Eat
                  </button>
                  <button
                    onClick={() => onMarkFinishedEarly(item.id, item.name)}
                    className="px-1.5 py-0.5 text-gray-400 hover:text-black dark:hover:text-white text-[10px]"
                  >
                    Gone?
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
