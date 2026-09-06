'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Flame, Trash2, Check, ArrowRight, Sparkles, Clock } from 'lucide-react';
import { FridgePantryItem } from '@/types/meal';

interface FridgeRotBannerProps {
  items: FridgePantryItem[];
  onConsumeItemToday: (item: FridgePantryItem, mealType: 'lunch' | 'dinner') => void;
  onMarkFinishedEarly: (itemId: string, mealTitle: string) => void;
  onDeleteItem: (itemId: string) => void;
}

export default function FridgeRotBanner({
  items,
  onConsumeItemToday,
  onMarkFinishedEarly,
  onDeleteItem,
}: FridgeRotBannerProps) {
  const rottingItems = items.filter((i) => i.status === 'rotting' || i.daysInFridge >= 3);
  const freshItems = items.filter((i) => i.status !== 'rotting' && i.daysInFridge < 3);

  if (items.length === 0) {
    return (
      <div className="bg-[#12141B] border-2 border-dashed border-[#262938] rounded-3xl p-6 text-center text-gray-400 my-4">
        <span className="text-3xl mb-2 block">🧊</span>
        <h4 className="font-funky font-bold text-white text-sm">Fridge is Squeaky Clean</h4>
        <p className="text-xs text-gray-500 mt-1">
          When you cook with leftovers, your cooked batches will appear here so you never forget them!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 my-6">
      {/* Gen-Z URGENT ROTTING RADAR BANNER */}
      <AnimatePresence>
        {rottingItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gradient-to-r from-[#2A0E14] to-[#1F0A11] border-2 border-[#FF5C5C] rounded-3xl p-5 shadow-[4px_4px_0px_#FF5C5C] text-white"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#FF5C5C] text-black font-black flex items-center justify-center shadow-sm">
                  <AlertTriangle className="w-5 h-5 fill-black stroke-none" />
                </div>
                <div>
                  <h3 className="font-funky font-black text-sm tracking-wide text-[#FF8585] flex items-center gap-2">
                    ROTTING IN FRIDGE! EAT ASAP 🚨
                  </h3>
                  <p className="text-xs text-gray-300">
                    You cooked this and it&apos;s been chilling in the fridge. Do not let good food die!
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-black bg-[#FF5C5C]/20 text-[#FF5C5C] border border-[#FF5C5C]/50 uppercase tracking-widest">
                {rottingItems.length} Urgent Item{rottingItems.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {rottingItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#12141B]/90 border border-[#FF5C5C]/40 rounded-2xl p-3.5 flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{item.customEmoji || '🥡'}</span>
                      <div>
                        <h4 className="font-funky font-black text-white text-sm">{item.name}</h4>
                        <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                          <span className="flex items-center gap-1 text-[#FF8585] font-bold">
                            <Clock className="w-3 h-3" /> {item.daysInFridge} days old
                          </span>
                          <span>•</span>
                          <span className="font-bold text-gray-300">{item.portionsLeft} portion left</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions for Rotting Item */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-800 text-xs">
                    <button
                      onClick={() => onConsumeItemToday(item, 'lunch')}
                      className="flex-1 py-1.5 px-3 bg-[#D4FF00] hover:bg-[#c3ed00] text-black font-black rounded-xl text-[11px] shadow-sm flex items-center justify-center gap-1 transition-all"
                    >
                      <span>Eat for Lunch</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>

                    <button
                      onClick={() => onConsumeItemToday(item, 'dinner')}
                      className="flex-1 py-1.5 px-3 bg-[#C084FC] hover:bg-[#b06cf7] text-black font-black rounded-xl text-[11px] shadow-sm flex items-center justify-center gap-1 transition-all"
                    >
                      <span>Eat for Dinner</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>

                    <button
                      onClick={() => onMarkFinishedEarly(item.id, item.name)}
                      title="Food already eaten before expected? Clear it and get a badge to cook again!"
                      className="py-1.5 px-2.5 bg-[#1E212E] hover:bg-[#2A2E40] text-yellow-300 rounded-xl text-[10px] font-bold border border-yellow-500/30"
                    >
                      Gone Already?
                    </button>

                    <button
                      onClick={() => onDeleteItem(item.id)}
                      title="Toss item"
                      className="p-1.5 bg-[#1E212E] hover:bg-red-950 text-gray-400 hover:text-red-400 rounded-xl border border-gray-800"
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

      {/* FRESH LEFTOVERS / PANTRY SHELF */}
      {freshItems.length > 0 && (
        <div className="bg-[#12141B] border-2 border-black rounded-3xl p-5 shadow-neo">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🥗</span>
              <h3 className="font-funky font-black text-sm text-white uppercase tracking-wider">
                Fresh In The Fridge
              </h3>
            </div>
            <span className="text-xs text-gray-400 font-medium">
              Ready to reheat & save prep time
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {freshItems.map((item) => (
              <div
                key={item.id}
                className="bg-[#181A24] border border-gray-800 rounded-2xl p-3 flex flex-col justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{item.customEmoji || '🍲'}</span>
                  <div>
                    <h4 className="font-bold text-white text-xs">{item.name}</h4>
                    <p className="text-[10px] text-[#22C55E] font-bold mt-0.5">
                      Cooked {item.daysInFridge === 0 ? 'Today' : `${item.daysInFridge}d ago`} • {item.portionsLeft} portion(s)
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-gray-800/80 flex items-center justify-between">
                  <button
                    onClick={() => onMarkFinishedEarly(item.id, item.name)}
                    className="text-[10px] font-bold text-gray-400 hover:text-white"
                  >
                    Gone Already?
                  </button>
                  <button
                    onClick={() => onConsumeItemToday(item, 'lunch')}
                    className="px-2.5 py-1 bg-[#262938] hover:bg-[#34384c] text-white font-bold text-[10px] rounded-lg"
                  >
                    Schedule Today
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
