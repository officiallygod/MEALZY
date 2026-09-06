'use client';

import React from 'react';
import { Sparkles, ArrowRight, Zap } from 'lucide-react';
import { AISuggestion, MealType } from '@/types/meal';

interface AITwistsViewProps {
  suggestions: AISuggestion[];
  onApplySuggestion: (suggestion: AISuggestion, targetDate: string, targetSlot: MealType) => void;
  rollingDays: { dateString: string; dayName: string; dayNumber: number }[];
}

export default function AITwistsView({
  suggestions,
  onApplySuggestion,
  rollingDays,
}: AITwistsViewProps) {
  const tomorrow = rollingDays[1] || rollingDays[0];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#12141B] border border-gray-200 dark:border-black rounded-3xl p-6 shadow-sm transition-colors">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-[#C084FC]/20 text-purple-700 dark:text-[#C084FC] border border-purple-200 dark:border-[#C084FC]/40 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-funky font-black text-lg text-gray-900 dark:text-white">
              RECOMMENDATIONS AND FLAVOR VARIATIONS
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Heuristic suggestions based on your scheduled choices and perishable items.
            </p>
          </div>
        </div>
      </div>

      {/* Suggestion Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {suggestions.map((sugg) => {
          const isRescue = sugg.type === 'fridge_rescue';
          const isTwist = sugg.type === 'twist';

          return (
            <div
              key={sugg.id}
              className={`rounded-3xl p-5 border flex flex-col justify-between transition-all bg-white dark:bg-[#12141B] ${
                isRescue
                  ? 'border-rose-300 dark:border-rose-900/60 shadow-sm'
                  : isTwist
                  ? 'border-gray-200 dark:border-[#262938] hover:border-black dark:hover:border-[#D4FF00] shadow-sm'
                  : 'border-gray-200 dark:border-[#262938]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-gray-100 dark:bg-[#181A24] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                    {sugg.headline}
                  </span>
                  <span className="text-xs font-bold text-gray-400">
                    {sugg.prepTime}
                  </span>
                </div>

                <h3 className="font-funky font-black text-base text-gray-900 dark:text-white mt-1 mb-2">
                  {sugg.title}
                </h3>

                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  {sugg.reason}
                </p>

                {/* Macro Summary */}
                <div className="flex items-center gap-3 text-xs font-bold text-gray-500 dark:text-gray-400 mb-4 bg-gray-50 dark:bg-[#181A24] p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
                  <span className="text-gray-900 dark:text-[#D4FF00] font-black">{sugg.calories} kcal</span>
                  <span>•</span>
                  <span>{sugg.protein}g Protein</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2">
                <button
                  onClick={() => onApplySuggestion(sugg, tomorrow.dateString, 'dinner')}
                  className="flex-1 py-2 px-3 bg-gray-900 hover:bg-black text-white dark:bg-[#D4FF00] dark:hover:bg-[#c3ed00] dark:text-black font-black text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Add to Tomorrow Dinner</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onApplySuggestion(sugg, rollingDays[0].dateString, 'lunch')}
                  className="py-2 px-3 bg-gray-100 dark:bg-[#262938] hover:bg-gray-200 dark:hover:bg-[#323648] text-gray-700 dark:text-white font-bold text-xs rounded-xl transition-all"
                >
                  Schedule Today
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
