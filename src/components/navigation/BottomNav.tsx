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
    <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 px-2 sm:px-3 py-2 bg-white dark:bg-[#16171E] backdrop-blur-2xl border-2 border-black dark:border-gray-700 rounded-full shadow-neo-lg flex items-center gap-1 sm:gap-2 transition-colors">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className="relative px-4 sm:px-6 py-2 rounded-full font-funky font-black text-xs transition-all flex items-center gap-2"
          >
            {isActive && (
              <motion.div
                layoutId="activeTabPill"
                className="absolute inset-0 bg-[#FFE600] rounded-full border-2 border-black shadow-neo-sm"
                transition={{ type: 'spring', stiffness: 500, damping: 32 }}
              />
            )}

            <div className="relative z-10 flex items-center gap-1.5">
              <Icon
                className={`w-4 h-4 transition-colors ${
                  isActive
                    ? 'text-black stroke-[2.5]'
                    : 'text-gray-500 dark:text-gray-400 group-hover:text-black dark:group-hover:text-white'
                }`}
              />
              <span
                className={`${
                  isActive
                    ? 'text-black font-black uppercase tracking-wider'
                    : 'text-gray-600 dark:text-gray-400 font-bold'
                }`}
              >
                {tab.label}
              </span>

              {tab.badge && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black border border-black flex items-center justify-center">
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
