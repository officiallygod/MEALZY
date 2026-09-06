'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, CalendarDays, LayoutGrid } from 'lucide-react';
import { DayPlan } from '@/types/meal';

interface RollingWeekSelectorProps {
  days: {
    dateString: string;
    dayName: string;
    dayNumber: number;
    fullDateFormatted: string;
    isToday: boolean;
  }[];
  selectedDate: string;
  onSelectDate: (dateString: string) => void;
  isAllDaysView: boolean;
  onToggleAllDaysView: (all: boolean) => void;
  dayMealCounts: Record<string, { count: number; calories: number }>;
}

export default function RollingWeekSelector({
  days,
  selectedDate,
  onSelectDate,
  isAllDaysView,
  onToggleAllDaysView,
  dayMealCounts,
}: RollingWeekSelectorProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      {/* Date Pill Scroller (Starts specifically with TODAY!) */}
      <div className="w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 scrollbar-none flex items-center gap-2">
        {days.map((day) => {
          const isSelected = selectedDate === day.dateString && !isAllDaysView;
          const stats = dayMealCounts[day.dateString] || { count: 0, calories: 0 };

          return (
            <button
              key={day.dateString}
              onClick={() => {
                onToggleAllDaysView(false);
                onSelectDate(day.dateString);
              }}
              className={`relative px-4 py-2.5 rounded-2xl flex flex-col items-center justify-center min-w-[72px] transition-all text-center border-2 ${
                isSelected
                  ? 'bg-[#181A24] border-[#D4FF00] shadow-[3px_3px_0px_#D4FF00] -translate-y-1'
                  : 'bg-[#12141B] border-[#262938] hover:border-gray-600 text-gray-400'
              }`}
            >
              <div className="flex items-center gap-1">
                <span
                  className={`text-[10px] font-black uppercase tracking-wider ${
                    day.isToday ? 'text-[#D4FF00]' : isSelected ? 'text-white' : 'text-gray-400'
                  }`}
                >
                  {day.dayName}
                </span>
                {day.isToday && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF00] animate-ping" />
                )}
              </div>

              <span
                className={`text-lg font-funky font-black mt-0.5 ${
                  isSelected ? 'text-white' : 'text-gray-300'
                }`}
              >
                {day.dayNumber}
              </span>

              {/* Meal & Calorie Subtitle */}
              <div className="mt-1 flex items-center gap-1">
                <span className="text-[9px] font-bold text-gray-400">
                  {stats.calories > 0 ? `${stats.calories} kcal` : 'Empty'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* View Mode Toggle: Day Bento vs 7-Day Board */}
      <div className="flex items-center bg-[#12141B] p-1 rounded-2xl border-2 border-black shadow-neo self-end sm:self-auto">
        <button
          onClick={() => onToggleAllDaysView(false)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            !isAllDaysView ? 'bg-[#D4FF00] text-black shadow-sm' : 'text-gray-400 hover:text-white'
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          <span>Day Bento</span>
        </button>

        <button
          onClick={() => onToggleAllDaysView(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            isAllDaysView ? 'bg-[#D4FF00] text-black shadow-sm' : 'text-gray-400 hover:text-white'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>7-Day Board</span>
        </button>
      </div>
    </div>
  );
}
