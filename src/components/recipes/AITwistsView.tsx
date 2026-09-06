'use client';

import React from 'react';
import { Sparkles, ArrowRight, Flame, ChefHat, Check, AlertTriangle, RefreshCw } from 'lucide-react';
import { AISuggestion, MealItem, MealType } from '@/types/meal';

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
      {/* Gen-Z AI Banner */}
      <div className="bg-gradient-to-r from-[#181A24] to-[#20152B] border-2 border-black rounded-3xl p-6 shadow-neo">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-[#C084FC] text-black font-black flex items-center justify-center text-xl shadow-neo">
            ✨
          </div>
          <div>
            <h2 className="font-funky font-black text-xl text-white flex items-center gap-2">
              MEALZY FLAVOR TWIST ENGINE
              <span className="text-[10px] bg-[#C084FC]/20 text-[#C084FC] px-2 py-0.5 rounded-full border border-[#C084FC]/40 font-bold">
                LOCAL AI
              </span>
            </h2>
            <p className="text-xs text-gray-400">
              Heuristic intelligence based on your taste profile. Zero recurring API charges, runs 100% offline.
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
              className={`rounded-3xl p-5 border-2 flex flex-col justify-between transition-all ${
                isRescue
                  ? 'bg-[#1C1014] border-[#FF5C5C] shadow-[4px_4px_0px_#FF5C5C]'
                  : isTwist
                  ? 'bg-[#12141B] border-[#D4FF00] shadow-[4px_4px_0px_#D4FF00]'
                  : 'bg-[#12141B] border-[#262938] shadow-neo'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-3xl">{sugg.emoji}</span>
                    <div>
                      <span
                        className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border"
                        style={{
                          backgroundColor: `${sugg.accentColor}22`,
                          borderColor: `${sugg.accentColor}55`,
                          color: sugg.accentColor,
                        }}
                      >
                        {sugg.headline}
                      </span>
                      <h3 className="font-funky font-black text-base text-white mt-1">
                        {sugg.title}
                      </h3>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed mb-4">{sugg.reason}</p>

                {/* Macro preview */}
                <div className="flex items-center gap-3 text-xs font-bold text-gray-400 mb-4 bg-[#181A24] p-2.5 rounded-xl border border-gray-800">
                  <span className="text-[#D4FF00]">{sugg.calories} kcal</span>
                  <span>•</span>
                  <span>{sugg.protein}g Protein</span>
                  <span>•</span>
                  <span>{sugg.prepTime}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-gray-800 flex items-center gap-2">
                <button
                  onClick={() => onApplySuggestion(sugg, tomorrow.dateString, 'dinner')}
                  className="flex-1 py-2.5 px-3 bg-[#D4FF00] hover:bg-[#c3ed00] text-black font-black text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Add to Tomorrow Dinner</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onApplySuggestion(sugg, rollingDays[0].dateString, 'lunch')}
                  className="py-2.5 px-3 bg-[#262938] hover:bg-[#323648] text-white font-bold text-xs rounded-xl transition-all"
                >
                  Eat Today
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
