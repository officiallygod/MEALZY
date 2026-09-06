'use client';

import React from 'react';
import { CalendarDays, LayoutGrid } from 'lucide-react';

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
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
      {/* Date Pill Scroller (Starts specifically with TODAY) */}
      <div className="w-full sm:w-auto overflow-x-auto py-3.5 px-2 scrollbar-none flex items-center gap-2.5">
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
              className={`relative px-3.5 py-2 rounded-2xl flex flex-col items-center justify-center min-w-[80px] flex-shrink-0 transition-all text-center border-2 ${
                isSelected
                  ? 'bg-white dark:bg-[#1E202A] border-black dark:border-[#D4FF00] shadow-neo ring-2 ring-[#D4FF00]/50'
                  : 'bg-white dark:bg-[#16171E] border-black/30 dark:border-gray-800 hover:border-black dark:hover:border-gray-500 shadow-neo-sm text-gray-600 dark:text-gray-300'
              }`}
            >
              <div className="flex items-center justify-center gap-1 leading-none">
                <span
                  className={`text-[10px] font-black uppercase tracking-wider leading-none ${
                    day.isToday
                      ? 'text-lime-600 dark:text-[#D4FF00]'
                      : isSelected
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {day.dayName}
                </span>
                {day.isToday && (
                  <span className="w-1.5 h-1.5 rounded-full bg-lime-500 dark:bg-[#D4FF00]" />
                )}
              </div>

              <span
                className={`text-xl font-funky font-black mt-1 leading-none ${
                  isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-800 dark:text-gray-200'
                }`}
              >
                {day.dayNumber}
              </span>

              {/* Meal & Calorie Subtitle */}
              <div className="mt-1.5 flex items-center justify-center gap-1 leading-none">
                <span className="text-[9px] font-black text-gray-500 dark:text-gray-400 leading-none">
                  {stats.calories > 0 ? `${stats.calories} kcal` : 'Empty'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Right: View Mode Toggle (Day Bento vs 7-Day Board) */}
      <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
        <div className="flex items-center bg-white dark:bg-[#16171E] p-1.5 rounded-2xl border-2 border-black dark:border-gray-700 shadow-neo-sm">
          <button
            onClick={() => onToggleAllDaysView(false)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
              !isAllDaysView
                ? 'bg-[#FFE600] text-black border-2 border-black shadow-neo-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Day Bento</span>
          </button>

          <button
            onClick={() => onToggleAllDaysView(true)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
              isAllDaysView
                ? 'bg-[#FFE600] text-black border-2 border-black shadow-neo-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>7-Day Board</span>
          </button>
        </div>
      </div>
    </div>
  );
}
