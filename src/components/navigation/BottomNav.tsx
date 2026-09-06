'use client';

import React from 'react';
import { Calendar, Layers } from 'lucide-react';
import { motion } from 'framer-motion';

export type ActiveTab = 'planner' | 'fridge';

interface BottomNavProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  rottingCount?: number;
}

interface TabItem {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export default function BottomNav({ activeTab, onSelectTab, rottingCount = 0 }: BottomNavProps) {
  const tabs: TabItem[] = [
    { id: 'planner', label: 'Plan', icon: Calendar },
    { id: 'fridge', label: 'Fridge Radar', icon: Layers, badge: rottingCount > 0 ? rottingCount : undefined },
  ];

  return (
    <nav
      style={{ bottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))' }}
      className="fixed left-1/2 -translate-x-1/2 z-40 p-1.5 sm:p-2 bg-white/95 dark:bg-[#16171E]/95 backdrop-blur-xl border-2 border-black dark:border-gray-700 rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] flex items-center gap-1 sm:gap-2 transition-all max-w-[calc(100vw-1.5rem)] select-none"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className="relative px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-funky font-black text-xs sm:text-sm transition-all flex items-center gap-2 active:scale-95 touch-manipulation cursor-pointer"
          >
            {isActive && (
              <motion.div
                layoutId="activeTabPill"
                className="absolute inset-0 bg-[#FFE600] rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                transition={{ type: 'spring', stiffness: 500, damping: 32 }}
              />
            )}

            <div className="relative z-10 flex items-center gap-1.5 sm:gap-2">
              <Icon
                className={`w-4 h-4 sm:w-4.5 sm:h-4.5 transition-colors ${
                  isActive
                    ? 'text-black stroke-[2.5]'
                    : 'text-gray-500 dark:text-gray-400 group-hover:text-black dark:group-hover:text-white'
                }`}
              />
              <span
                className={`whitespace-nowrap transition-colors ${
                  isActive
                    ? 'text-black font-black uppercase tracking-wider'
                    : 'text-gray-600 dark:text-gray-400 font-bold'
                }`}
              >
                {tab.label}
              </span>

              {tab.badge && (
                <span className="px-1.5 min-w-[18px] h-[18px] rounded-full bg-rose-500 text-white text-[9px] font-black border border-black flex items-center justify-center animate-pulse shadow-neo-sm">
                  {tab.badge}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </nav>
  );
}
