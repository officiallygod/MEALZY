'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Sparkles, ChevronDown } from 'lucide-react';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true,
    fridgeStorage: true,
    tasteAnalytics: false,
  });

  useEffect(() => {
    const hasConsent = document.cookie.includes('mealzy_cookie_consent=true');
    if (!hasConsent) {
      const timer = setTimeout(() => setIsVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    document.cookie = 'mealzy_cookie_consent=true; max-age=31536000; path=/; SameSite=Lax';
    document.cookie = 'mealzy_pref_fridge=true; max-age=31536000; path=/; SameSite=Lax';
    document.cookie = 'mealzy_pref_analytics=true; max-age=31536000; path=/; SameSite=Lax';
    setIsVisible(false);
  };

  const handleSaveCustom = () => {
    document.cookie = 'mealzy_cookie_consent=true; max-age=31536000; path=/; SameSite=Lax';
    document.cookie = `mealzy_pref_fridge=${preferences.fridgeStorage}; max-age=31536000; path=/; SameSite=Lax`;
    document.cookie = `mealzy_pref_analytics=${preferences.tasteAnalytics}; max-age=31536000; path=/; SameSite=Lax`;
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-50 sm:max-w-md w-auto"
        >
          <div className="bg-white/95 dark:bg-[#12141B]/95 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-3xl p-5 shadow-2xl text-gray-900 dark:text-white transition-colors">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gray-100 dark:bg-[#181A24] border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-900 dark:text-[#D4FF00] flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-funky font-bold text-sm tracking-wide text-gray-900 dark:text-white uppercase">
                    Storage & Privacy
                  </h3>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  MEALZY utilizes local cookies and browser IndexedDB to persist your meal plans, perishable inventory, and macro targets strictly on your device.
                </p>
              </div>
            </div>

            {/* Expandable Preferences Drawer */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2 overflow-hidden text-xs"
                >
                  <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-[#1A1D27]">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-[#D4FF00]" />
                      <span>Essential Scheduling State</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-[#D4FF00]">REQUIRED</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-[#1A1D27]">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600 dark:text-[#C084FC]" />
                      <span>Fridge Storage Persistence</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.fridgeStorage}
                      onChange={(e) =>
                        setPreferences({ ...preferences, fridgeStorage: e.target.checked })
                      }
                      className="accent-lime-500 dark:accent-[#D4FF00] w-4 h-4 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-[#1A1D27]">
                    <span>Smart Suggestions & Twists</span>
                    <input
                      type="checkbox"
                      checked={preferences.tasteAnalytics}
                      onChange={(e) =>
                        setPreferences({ ...preferences, tasteAnalytics: e.target.checked })
                      }
                      className="accent-lime-500 dark:accent-[#D4FF00] w-4 h-4 cursor-pointer"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Buttons */}
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleAcceptAll}
                className="flex-1 py-2 px-4 bg-black hover:bg-gray-800 text-white dark:bg-[#D4FF00] dark:hover:bg-[#c4ed00] dark:text-black font-bold text-xs rounded-xl shadow-sm transition-all"
              >
                Accept All
              </button>

              {showSettings ? (
                <button
                  onClick={handleSaveCustom}
                  className="py-2 px-4 bg-gray-100 dark:bg-[#262938] hover:bg-gray-200 text-gray-900 dark:text-white font-bold text-xs rounded-xl border border-gray-200 dark:border-gray-700 transition-all"
                >
                  Save Selection
                </button>
              ) : (
                <button
                  onClick={() => setShowSettings(true)}
                  className="py-2 px-3 bg-gray-100 dark:bg-[#181A24] hover:bg-gray-200 text-gray-600 dark:text-gray-300 font-medium text-xs rounded-xl border border-gray-200 dark:border-gray-800 transition-all flex items-center justify-center gap-1"
                >
                  <span>Customize</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
