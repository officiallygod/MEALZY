'use client';

import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getRollingWeekDates, seedInitialDataIfEmpty } from '@/lib/db';
import { MealItem, MealType, FridgePantryItem, AISuggestion } from '@/types/meal';
import Header from '@/components/navigation/Header';
import BottomNav, { ActiveTab } from '@/components/navigation/BottomNav';
import RollingWeekSelector from '@/components/planner/RollingWeekSelector';
import KanbanBentoBoard from '@/components/planner/KanbanBentoBoard';
import FridgeRotBanner from '@/components/pantry/FridgeRotBanner';
import RecipeVault from '@/components/recipes/RecipeVault';
import AITwistsView from '@/components/recipes/AITwistsView';
import AddMealModal from '@/components/modals/AddMealModal';
import MealDetailModal from '@/components/modals/MealDetailModal';
import CookMealModal from '@/components/modals/CookMealModal';
import AuthModal from '@/components/common/AuthModal';
import { generateSmartSuggestions } from '@/lib/ai-engine';
import confetti from 'canvas-confetti';
import { RotateCcw, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [activeTab, setActiveTab] = useState<ActiveTab>('planner');
  const [isAllDaysView, setIsAllDaysView] = useState(false);

  // Rolling 7-day dates starting specifically from TODAY
  const [rollingDays, setRollingDays] = useState(getRollingWeekDates());
  const [selectedDate, setSelectedDate] = useState(rollingDays[0].dateString);

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);
  const [isAddMealOpen, setIsAddMealOpen] = useState(false);
  const [addMealSlot, setAddMealSlot] = useState<MealType>('lunch');
  const [addMealDate, setAddMealDate] = useState<string>(rollingDays[0].dateString);

  const [selectedMealForDetail, setSelectedMealForDetail] = useState<MealItem | null>(null);
  const [mealToCook, setMealToCook] = useState<MealItem | null>(null);

  // Quick Gone-Already celebration banner
  const [quickGoneBadge, setQuickGoneBadge] = useState<{ title: string; show: boolean }>({
    title: '',
    show: false,
  });

  // Reactive DB queries
  const meals = useLiveQuery(() => db.meals?.toArray(), []) || [];
  const fridgeItems = useLiveQuery(() => db.fridge?.toArray(), []) || [];
  const userPreferences = useLiveQuery(() => db.preferences?.get('user-default-settings'), []);

  // Initialize theme and database on client mount
  useEffect(() => {
    setIsClient(true);
    seedInitialDataIfEmpty();
    setRollingDays(getRollingWeekDates());

    const savedTheme = (localStorage.getItem('mealzy_theme') as 'dark' | 'light') || 'dark';
    setTheme(savedTheme);
    if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('mealzy_theme', nextTheme);
    if (nextTheme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  };

  // Compute daily totals for all rolling days
  const dayMealCounts: Record<string, { count: number; calories: number }> = {};
  rollingDays.forEach((d) => {
    const dMeals = meals.filter((m) => m.dateScheduled === d.dateString);
    dayMealCounts[d.dateString] = {
      count: dMeals.length,
      calories: dMeals.reduce((sum, m) => sum + (m.calories || 0), 0),
    };
  });

  // Today's total calories for the header meter
  const todayCalories = dayMealCounts[rollingDays[0].dateString]?.calories || 0;
  const calorieTarget = userPreferences?.calorieTarget || 2200;

  // Rotting items count for the bottom dock badge
  const rottingCount = fridgeItems.filter((i) => i.status === 'rotting' || i.daysInFridge >= 3).length;

  // AI Smart Suggestions
  const smartSuggestions = generateSmartSuggestions(meals, fridgeItems);

  // Handlers
  const handleQuickAdd = (dateString: string, slot: MealType) => {
    setAddMealDate(dateString);
    setAddMealSlot(slot);
    setIsAddMealOpen(true);
  };

  const handleAddMealConfirm = async (newMeal: Omit<MealItem, 'id'>) => {
    const id = `meal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    await db.meals.add({
      ...newMeal,
      id,
    });
  };

  const handleMoveMealSlot = async (mealId: string, targetDate: string, targetType: MealType) => {
    await db.meals.update(mealId, {
      dateScheduled: targetDate,
      mealType: targetType,
    });
  };

  const handleDeleteMeal = async (mealId: string) => {
    await db.meals.delete(mealId);
  };

  // Cook Once, Eat N Times Leftover Generator
  const handleConfirmCook = async (
    sourceMeal: MealItem,
    portions: number,
    targetSlots: { date: string; slot: MealType }[]
  ) => {
    await db.meals.update(sourceMeal.id, {
      totalPortionsCooked: portions,
      portionsRemaining: portions - 1,
    });

    const leftoverMeals: MealItem[] = targetSlots.map((slot, idx) => ({
      id: `leftover-${sourceMeal.id}-${idx + 1}`,
      title: `Leftover: ${sourceMeal.title}`,
      mealType: slot.slot,
      calories: sourceMeal.calories,
      protein: sourceMeal.protein,
      carbs: sourceMeal.carbs,
      fat: sourceMeal.fat,
      prepTimeMinutes: 3,
      ingredients: sourceMeal.ingredients,
      tags: ['leftover', 'quick-heat'],
      isLeftover: true,
      sourceMealId: sourceMeal.id,
      dateScheduled: slot.date,
      accentColor: sourceMeal.accentColor || '#10B981',
      notes: `Batch prepared portion #${idx + 2}. Reheat for 2 minutes.`,
    }));

    if (leftoverMeals.length > 0) {
      await db.meals.bulkAdd(leftoverMeals);
    }

    await db.fridge.put({
      id: `fridge-batch-${sourceMeal.id}`,
      name: sourceMeal.title,
      originalMealTitle: sourceMeal.title,
      cookedAt: new Date().toISOString(),
      daysInFridge: 0,
      status: 'fresh',
      portionsLeft: portions - 1,
      category: sourceMeal.mealType,
      accentColor: sourceMeal.accentColor,
    });
  };

  // Early item clearance handler
  const handleMarkGoneEarly = async (mealIdOrFridgeId: string, mealTitle: string) => {
    const item = await db.meals.get(mealIdOrFridgeId);
    if (item) {
      await db.meals.delete(mealIdOrFridgeId);
      if (item.sourceMealId) {
        await db.fridge.delete(`fridge-batch-${item.sourceMealId}`);
      }
    } else {
      await db.fridge.delete(mealIdOrFridgeId);
    }

    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.7 },
      colors: ['#84CC16', '#06B6D4'],
    });

    setQuickGoneBadge({
      title: mealTitle,
      show: true,
    });

    setTimeout(() => {
      setQuickGoneBadge({ title: '', show: false });
    }, 5000);
  };

  // Consume Fridge Item Today
  const handleConsumeFridgeItem = async (item: FridgePantryItem, slot: MealType) => {
    const today = rollingDays[0].dateString;
    await db.meals.add({
      id: `meal-consumed-${Date.now()}`,
      title: `Reheated: ${item.name}`,
      mealType: slot,
      calories: 520,
      protein: 26,
      carbs: 58,
      fat: 18,
      prepTimeMinutes: 3,
      ingredients: [{ name: item.name, amount: '1 portion' }],
      tags: ['leftover', 'reheated'],
      isLeftover: true,
      dateScheduled: today,
      accentColor: item.accentColor || '#10B981',
    });

    if (item.portionsLeft <= 1) {
      await db.fridge.delete(item.id);
    } else {
      await db.fridge.update(item.id, {
        portionsLeft: item.portionsLeft - 1,
        status: 'fresh',
      });
    }

    setActiveTab('planner');
  };

  const handleApplySuggestion = async (
    suggestion: AISuggestion,
    targetDate: string,
    targetSlot: MealType
  ) => {
    if (!suggestion.suggestedMeal) return;

    await db.meals.add({
      id: `meal-ai-${Date.now()}`,
      title: suggestion.suggestedMeal.title || suggestion.title,
      mealType: targetSlot,
      calories: suggestion.suggestedMeal.calories || suggestion.calories,
      protein: suggestion.suggestedMeal.protein || suggestion.protein,
      carbs: suggestion.suggestedMeal.carbs || 50,
      fat: suggestion.suggestedMeal.fat || 18,
      prepTimeMinutes: suggestion.suggestedMeal.prepTimeMinutes || 20,
      ingredients: suggestion.suggestedMeal.ingredients || [{ name: 'Selected Ingredients', amount: '1 serving' }],
      tags: suggestion.suggestedMeal.tags || ['recommended'],
      dateScheduled: targetDate,
      accentColor: suggestion.accentColor,
    });

    setActiveTab('planner');
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0A0B0E] flex items-center justify-center">
        <div className="w-10 h-10 rounded-xl bg-black dark:bg-[#D4FF00] flex items-center justify-center text-white dark:text-black font-black text-lg">
          M
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0B0E] text-gray-900 dark:text-white pb-28 transition-colors duration-200">
      {/* Header */}
      <Header
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAddMeal={() => handleQuickAdd(selectedDate, 'lunch')}
        userEmail={userEmail}
        todayCalories={todayCalories}
        calorieTarget={calorieTarget}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-6">
        {/* Early Item Completion Notice */}
        <AnimatePresence>
          {quickGoneBadge.show && (
            <motion.div
              initial={{ opacity: 0, y: -15, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              className="mb-6 p-4 rounded-2xl bg-white dark:bg-[#181A24] border border-amber-300 dark:border-amber-500/40 shadow-sm flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-yellow-300 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-funky font-black text-sm text-gray-900 dark:text-white">
                    Completed Ahead of Schedule
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-300">
                    Finished &quot;{quickGoneBadge.title}&quot;. Inventory updated.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  handleQuickAdd(rollingDays[0].dateString, 'dinner');
                  setQuickGoneBadge({ title: '', show: false });
                }}
                className="px-3 py-1.5 bg-gray-900 hover:bg-black text-white dark:bg-[#D4FF00] dark:hover:bg-[#c3ed00] dark:text-black font-black text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 flex-shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Re-Plan Meal</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TAB 1: PLANNER (BENTO + KANBAN) */}
        {activeTab === 'planner' && (
          <div className="space-y-6">
            {/* Rolling 7-day selector starting specifically from Today */}
            <RollingWeekSelector
              days={rollingDays}
              selectedDate={selectedDate}
              onSelectDate={(d) => setSelectedDate(d)}
              isAllDaysView={isAllDaysView}
              onToggleAllDaysView={(val) => setIsAllDaysView(val)}
              dayMealCounts={dayMealCounts}
            />

            {/* Compact Fridge Rot / Perishable Notification */}
            <FridgeRotBanner
              items={fridgeItems}
              onConsumeItemToday={handleConsumeFridgeItem}
              onMarkFinishedEarly={handleMarkGoneEarly}
              onDeleteItem={(id) => db.fridge.delete(id)}
            />

            {/* Core Kanban / Bento Board */}
            <KanbanBentoBoard
              days={rollingDays}
              selectedDate={selectedDate}
              meals={meals}
              isAllDaysView={isAllDaysView}
              onSelectMeal={(meal) => setSelectedMealForDetail(meal)}
              onQuickAddMeal={handleQuickAdd}
              onMoveMealSlot={handleMoveMealSlot}
              onCookMeal={(meal) => setMealToCook(meal)}
              onMarkGoneEarly={handleMarkGoneEarly}
              onDeleteMeal={handleDeleteMeal}
              onFocusDay={(d) => {
                setSelectedDate(d);
                setIsAllDaysView(false);
              }}
            />
          </div>
        )}

        {/* TAB 2: FRIDGE RADAR */}
        {activeTab === 'fridge' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#12141B] border border-gray-200 dark:border-black rounded-3xl p-6 shadow-sm flex items-center justify-between transition-colors">
              <div>
                <h2 className="font-funky font-black text-xl text-gray-900 dark:text-white">
                  PERISHABLE INVENTORY & REFRIGERATION
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Tracks prepared batches and leftovers so meals are consumed before spoilage.
                </p>
              </div>
              <div className="px-3 py-1.5 rounded-full bg-lime-400 dark:bg-[#D4FF00] text-black font-black text-xs">
                {fridgeItems.length} Batches Active
              </div>
            </div>

            <FridgeRotBanner
              items={fridgeItems}
              onConsumeItemToday={handleConsumeFridgeItem}
              onMarkFinishedEarly={handleMarkGoneEarly}
              onDeleteItem={(id) => db.fridge.delete(id)}
            />
          </div>
        )}

        {/* TAB 3: RECIPE VAULT */}
        {activeTab === 'vault' && (
          <RecipeVault
            onScheduleMeal={handleAddMealConfirm}
            rollingDays={rollingDays}
          />
        )}

        {/* TAB 4: RECOMMENDATIONS */}
        {activeTab === 'twists' && (
          <AITwistsView
            suggestions={smartSuggestions}
            onApplySuggestion={handleApplySuggestion}
            rollingDays={rollingDays}
          />
        )}
      </main>

      {/* Floating Bottom Navigation Dock */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        rottingCount={rottingCount}
      />

      {/* MODALS */}
      <AddMealModal
        isOpen={isAddMealOpen}
        onClose={() => setIsAddMealOpen(false)}
        targetDate={addMealDate}
        targetSlot={addMealSlot}
        onAddMeal={handleAddMealConfirm}
      />

      <MealDetailModal
        isOpen={Boolean(selectedMealForDetail)}
        meal={selectedMealForDetail}
        onClose={() => setSelectedMealForDetail(null)}
        onCookClick={(meal) => setMealToCook(meal)}
        onMarkGoneEarly={handleMarkGoneEarly}
        onDeleteMeal={handleDeleteMeal}
      />

      <CookMealModal
        isOpen={Boolean(mealToCook)}
        meal={mealToCook}
        onClose={() => setMealToCook(null)}
        onConfirmCook={handleConfirmCook}
        rollingDays={rollingDays}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        userEmail={userEmail}
        onLoginSuccess={(email) => setUserEmail(email)}
      />
    </div>
  );
}
