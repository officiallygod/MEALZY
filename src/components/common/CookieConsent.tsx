'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, Check, Sparkles, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true,
    fridgeStorage: true,
    tasteAnalytics: false,
  });

  useEffect(() => {
    // Check if consent cookie exists
    const hasConsent = document.cookie.includes('mealzy_cookie_consent=true');
    if (!hasConsent) {
      // Show after a brief delay for ultra-smooth entrance
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
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="fixed bottom-24 sm:bottom-8 left-4 right-4 sm:left-auto sm:right-8 z-50 sm:max-w-md w-auto"
        >
          <div className="bg-[#12141B]/95 backdrop-blur-xl border-2 border-[#D4FF00] rounded-3xl p-5 shadow-[5px_5px_0px_#000000] text-white">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#D4FF00] flex items-center justify-center text-black flex-shrink-0 shadow-neo">
                <Cookie className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-funky font-bold text-base tracking-wide text-white">
                    COOKIES? NOM NOM 🍪
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D4FF00]/20 text-[#D4FF00] border border-[#D4FF00]/40">
                    GEN-Z PROMISE
                  </span>
                </div>
                <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                  We use cookies strictly to remember what's in your fridge, your macro goals, and
                  keep your meal schedule offline. Zero creepy ad trackers.
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
                  className="mt-4 pt-3 border-t border-gray-800 space-y-2 overflow-hidden text-xs"
                >
                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#1A1D27]">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#D4FF00]" />
                      <span>Essential Munchies (Always On)</span>
                    </div>
                    <span className="text-[11px] font-bold text-[#D4FF00]">REQUIRED</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#1A1D27]">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#C084FC]" />
                      <span>Fridge Memory & Rot Radar</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.fridgeStorage}
                      onChange={(e) =>
                        setPreferences({ ...preferences, fridgeStorage: e.target.checked })
                      }
                      className="accent-[#D4FF00] w-4 h-4 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#1A1D27]">
                    <div className="flex items-center gap-2">
                      <span>Internal AI Flavor Engine</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.tasteAnalytics}
                      onChange={(e) =>
                        setPreferences({ ...preferences, tasteAnalytics: e.target.checked })
                      }
                      className="accent-[#D4FF00] w-4 h-4 cursor-pointer"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Buttons */}
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleAcceptAll}
                className="flex-1 py-2.5 px-4 bg-[#D4FF00] hover:bg-[#c4ed00] text-black font-bold text-xs rounded-xl shadow-neo transition-all active:translate-x-0.5 active:translate-y-0.5"
              >
                Accept All (Nom Nom)
              </button>

              {showSettings ? (
                <button
                  onClick={handleSaveCustom}
                  className="py-2.5 px-4 bg-[#262938] hover:bg-[#323648] text-white font-bold text-xs rounded-xl border border-gray-700 transition-all"
                >
                  Save Choices
                </button>
              ) : (
                <button
                  onClick={() => setShowSettings(true)}
                  className="py-2.5 px-3 bg-[#181A24] hover:bg-[#202330] text-gray-300 font-medium text-xs rounded-xl border border-gray-800 transition-all flex items-center justify-center gap-1"
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
