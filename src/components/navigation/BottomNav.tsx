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
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 px-3 py-2 bg-white/95 dark:bg-[#12141B]/90 backdrop-blur-2xl border border-gray-200 dark:border-black rounded-full shadow-lg dark:shadow-[5px_5px_0px_#000000] flex items-center gap-1 sm:gap-2 transition-colors">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className="relative px-3.5 sm:px-5 py-2 rounded-full font-funky font-black text-xs transition-all flex items-center gap-2"
          >
            {isActive && (
              <motion.div
                layoutId="activeTabPill"
                className="absolute inset-0 bg-lime-400 dark:bg-[#D4FF00] rounded-full border border-black shadow-sm"
                transition={{ type: 'spring', stiffness: 450, damping: 30 }}
              />
            )}

            <div className="relative z-10 flex items-center gap-1.5">
              <Icon
                className={`w-4 h-4 transition-colors ${
                  isActive
                    ? 'text-black'
                    : 'text-gray-500 dark:text-gray-400 group-hover:text-black dark:group-hover:text-white'
                }`}
              />
              <span
                className={`${
                  isActive
                    ? 'text-black font-extrabold'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {tab.label}
              </span>

              {tab.badge && (
                <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
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
