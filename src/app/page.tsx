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
import { Sparkles, Trophy, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const [isClient, setIsClient] = useState(false);
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

  // Initialize and seed on client mount
  useEffect(() => {
    setIsClient(true);
    seedInitialDataIfEmpty();
    setRollingDays(getRollingWeekDates());
  }, []);

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
    // Mark source meal with portions cooked
    await db.meals.update(sourceMeal.id, {
      totalPortionsCooked: portions,
      portionsRemaining: portions - 1,
    });

    // Auto-create leftover meal cards in target slots
    const leftoverMeals: MealItem[] = targetSlots.map((slot, idx) => ({
      id: `leftover-${sourceMeal.id}-${idx + 1}`,
      title: `Leftover: ${sourceMeal.title}`,
      mealType: slot.slot,
      calories: sourceMeal.calories,
      protein: sourceMeal.protein,
      carbs: sourceMeal.carbs,
      fat: sourceMeal.fat,
      prepTimeMinutes: 3,
      imageUrl: sourceMeal.imageUrl,
      ingredients: sourceMeal.ingredients,
      tags: ['leftover', 'quick-heat'],
      isLeftover: true,
      sourceMealId: sourceMeal.id,
      dateScheduled: slot.date,
      customEmoji: '🥡',
      accentColor: sourceMeal.accentColor || '#22C55E',
      notes: `Batch cooked portion #${idx + 2}. Reheat for 2 mins.`,
    }));

    if (leftoverMeals.length > 0) {
      await db.meals.bulkAdd(leftoverMeals);
    }

    // Add tracking to fridge radar
    await db.fridge.put({
      id: `fridge-batch-${sourceMeal.id}`,
      name: sourceMeal.title,
      originalMealTitle: sourceMeal.title,
      cookedAt: new Date().toISOString(),
      daysInFridge: 0,
      status: 'fresh',
      portionsLeft: portions - 1,
      category: sourceMeal.mealType,
      customEmoji: sourceMeal.customEmoji || '🍲',
      accentColor: sourceMeal.accentColor,
    });
  };

  // "Gone Already!" quick clear and replan trigger
  const handleMarkGoneEarly = async (mealIdOrFridgeId: string, mealTitle: string) => {
    // Delete the specific meal or any leftovers linked to it
    const item = await db.meals.get(mealIdOrFridgeId);
    if (item) {
      await db.meals.delete(mealIdOrFridgeId);
      if (item.sourceMealId) {
        await db.fridge.delete(`fridge-batch-${item.sourceMealId}`);
      }
    } else {
      await db.fridge.delete(mealIdOrFridgeId);
    }

    // Trigger celebratory confetti & badge
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#D4FF00', '#FF3388'],
    });

    setQuickGoneBadge({
      title: mealTitle,
      show: true,
    });

    setTimeout(() => {
      setQuickGoneBadge({ title: '', show: false });
    }, 6000);
  };

  // Consume Fridge Item Today
  const handleConsumeFridgeItem = async (item: FridgePantryItem, slot: MealType) => {
    const today = rollingDays[0].dateString;
    await db.meals.add({
      id: `meal-consumed-${Date.now()}`,
      title: `Fridge Rescue: ${item.name}`,
      mealType: slot,
      calories: 520,
      protein: 26,
      carbs: 58,
      fat: 18,
      prepTimeMinutes: 3,
      ingredients: [{ name: item.name, amount: '1 leftover container' }],
      tags: ['leftover', 'fridge-rescue'],
      isLeftover: true,
      dateScheduled: today,
      customEmoji: item.customEmoji || '🥡',
      accentColor: item.accentColor || '#D4FF00',
    });

    // Remove or decrement in fridge
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
      imageUrl: suggestion.suggestedMeal.imageUrl,
      ingredients: suggestion.suggestedMeal.ingredients || [{ name: 'Chef curated ingredients', amount: '1 serving' }],
      tags: suggestion.suggestedMeal.tags || ['ai-twist'],
      dateScheduled: targetDate,
      customEmoji: suggestion.emoji,
      accentColor: suggestion.accentColor,
    });

    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#C084FC', '#D4FF00'],
    });

    setActiveTab('planner');
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-[#0A0B0E] flex items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-[#D4FF00] border-2 border-black animate-spin shadow-neo flex items-center justify-center text-black font-black text-xl">
          M
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0B0E] text-white pb-28">
      {/* Top App Header */}
      <Header
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAddMeal={() => handleQuickAdd(selectedDate, 'lunch')}
        userEmail={userEmail}
        todayCalories={todayCalories}
        calorieTarget={calorieTarget}
      />

      {/* Main App Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-6">
        {/* Quick Gone-Already Celebration Banner */}
        <AnimatePresence>
          {quickGoneBadge.show && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="mb-6 p-4 rounded-2xl bg-[#181A24] border-2 border-yellow-400 shadow-neo flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-400 text-black flex items-center justify-center font-black text-xl">
                  ⚡
                </div>
                <div>
                  <h4 className="font-funky font-black text-sm text-yellow-300">
                    GONE ALREADY! QUICK MUNCHER 🏆
                  </h4>
                  <p className="text-xs text-gray-300">
                    You polished off <span className="font-bold text-white">&quot;{quickGoneBadge.title}&quot;</span> ahead of schedule!
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  handleQuickAdd(rollingDays[0].dateString, 'dinner');
                  setQuickGoneBadge({ title: '', show: false });
                }}
                className="px-3.5 py-2 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 flex-shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Cook Again?</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TAB 1: PLANNER (BENTO + KANBAN) */}
        {activeTab === 'planner' && (
          <div className="space-y-6">
            {/* Rolling 7-day selector starting specifically from Today! */}
            <RollingWeekSelector
              days={rollingDays}
              selectedDate={selectedDate}
              onSelectDate={(d) => setSelectedDate(d)}
              isAllDaysView={isAllDaysView}
              onToggleAllDaysView={(val) => setIsAllDaysView(val)}
              dayMealCounts={dayMealCounts}
            />

            {/* Gen-Z Urgent Fridge Rot Radar Banner */}
            <FridgeRotBanner
              items={fridgeItems}
              onConsumeItemToday={handleConsumeFridgeItem}
              onMarkFinishedEarly={handleMarkGoneEarly}
              onDeleteItem={(id) => db.fridge.delete(id)}
            />

            {/* The Core Drag-and-Drop Kanban / Bento Board */}
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
            />
          </div>
        )}

        {/* TAB 2: FRIDGE RADAR */}
        {activeTab === 'fridge' && (
          <div className="space-y-6">
            <div className="bg-[#12141B] border-2 border-black rounded-3xl p-6 shadow-neo flex items-center justify-between">
              <div>
                <h2 className="font-funky font-black text-2xl text-white">FRIDGE RADAR</h2>
                <p className="text-xs text-gray-400 mt-1">
                  Tracks cooked batches and leftovers so food is eaten before it spoils.
                </p>
              </div>
              <div className="px-3 py-1.5 rounded-full bg-[#D4FF00] text-black font-black text-xs">
                {fridgeItems.length} Batches Tracked
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

        {/* TAB 3: RECIPE VAULT (200+ CURATED DISHES) */}
        {activeTab === 'vault' && (
          <RecipeVault
            onScheduleMeal={handleAddMealConfirm}
            rollingDays={rollingDays}
          />
        )}

        {/* TAB 4: AI FLAVOR TWISTS */}
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
