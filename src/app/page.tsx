'use client';

import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getRollingWeekDates, seedInitialDataIfEmpty } from '@/lib/db';
import { MealItem, MealType, FridgePantryItem, AISuggestion, UserPreferences } from '@/types/meal';
import Header from '@/components/navigation/Header';
import BottomNav, { ActiveTab } from '@/components/navigation/BottomNav';
import { syncAcrossDevicesOnStartup, enableAutomaticDriveSync, scheduleBackgroundDriveSync } from '@/lib/sync/google-drive';
import RollingWeekSelector from '@/components/planner/RollingWeekSelector';
import DailyNutritionMonitor from '@/components/planner/DailyNutritionMonitor';
import KanbanBentoBoard from '@/components/planner/KanbanBentoBoard';
import FridgeRotBanner from '@/components/pantry/FridgeRotBanner';
import AddMealModal from '@/components/modals/AddMealModal';
import MealDetailModal from '@/components/modals/MealDetailModal';
import CookMealModal from '@/components/modals/CookMealModal';
import AddFridgeItemModal from '@/components/modals/AddFridgeItemModal';
import AuthModal from '@/components/common/AuthModal';
import ExportWeekModal from '@/components/modals/ExportWeekModal';
import AteOutModal, { AteOutConfirmData } from '@/components/modals/AteOutModal';
import AutoFillSuggestionModal from '@/components/modals/AutoFillSuggestionModal';
import UndoToast, { UndoAction } from '@/components/common/UndoToast';
import SplashScreen from '@/components/common/SplashScreen';
import { generateSmartSuggestions } from '@/lib/ai-engine';
import { CURATED_FOODS, cleanMealTitle } from '@/lib/curated-foods';
import confetti from 'canvas-confetti';
import { RotateCcw, CheckCircle2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MARQUEE_ITEMS = [
  '✦ 7-DAY ROLLING TIMELINE',
  '✦ ZERO FOOD SPOILAGE',
  '✦ NEO-BENTO PLANNING',
  '✦ MACROS TRACKED',
  '✦ COOK ONCE EAT 3X',
  '✦ MEALZY',
  '✦ 7-DAY ROLLING TIMELINE',
  '✦ ZERO FOOD SPOILAGE',
  '✦ NEO-BENTO PLANNING',
  '✦ MACROS TRACKED',
  '✦ COOK ONCE EAT 3X',
  '✦ MEALZY',
];

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
  const [userName, setUserName] = useState<string | undefined>(undefined);
  const [userAvatar, setUserAvatar] = useState<string | undefined>(undefined);
  const [isAddMealOpen, setIsAddMealOpen] = useState(false);
  const [isAddFridgeItemOpen, setIsAddFridgeItemOpen] = useState(false);
  const [isExportWeekOpen, setIsExportWeekOpen] = useState(false);
  const [addMealSlot, setAddMealSlot] = useState<MealType>('lunch');
  const [addMealDate, setAddMealDate] = useState<string>(rollingDays[0].dateString);

  const [selectedMealForDetail, setSelectedMealForDetail] = useState<MealItem | null>(null);
  const [mealToCook, setMealToCook] = useState<MealItem | null>(null);
  const [ateOutTarget, setAteOutTarget] = useState<{
    meal?: MealItem | null;
    meals?: MealItem[];
    dateString: string;
    mealType: MealType;
  } | null>(null);

  // Smart Auto-Fill preview state
  const [autoFillTarget, setAutoFillTarget] = useState<{
    targetDate: string;
    missingSlots: MealType[];
  } | null>(null);

  // Global 5-second Undo Toast
  const [undoAction, setUndoAction] = useState<UndoAction | null>(null);

  // Quick Gone-Already celebration banner
  const [quickGoneBadge, setQuickGoneBadge] = useState<{ title: string; show: boolean }>({
    title: '',
    show: false,
  });

  // Reactive DB queries
  const meals = useLiveQuery(() => db.meals?.toArray(), []) || [];
  const fridgeItems = useLiveQuery(() => db.fridge?.toArray(), []) || [];
  const userPreferences = useLiveQuery(() => db.preferences?.get('user-default-settings'), []);

  // Auto-sanitize existing database: strip ugly prefixes ("Fridge Rescue:", "Leftover:", etc.)
  // and consolidate duplicate meals in the same slot into a single card with portions count
  const sanitizeDatabase = async () => {
    try {
      const allMeals = await db.meals.toArray();
      const seenMap = new Map<string, MealItem>();

      for (const meal of allMeals) {
        const cleanTitle = cleanMealTitle(meal.title);
        const hasPrefix = /^(fridge rescue|friday rescue|leftover|reheated|rescue):\s*/i.test(meal.title);
        const key = `${meal.dateScheduled || ''}_${meal.mealType}_${cleanTitle.toLowerCase()}`;

        if (seenMap.has(key)) {
          // Consolidate duplicate meals in same slot on same date
          const existing = seenMap.get(key)!;
          const combinedPortions = (existing.portions || 1) + (meal.portions || 1);
          await db.meals.update(existing.id, {
            portions: combinedPortions,
          });
          await db.meals.delete(meal.id);
        } else {
          if (hasPrefix || cleanTitle !== meal.title) {
            await db.meals.update(meal.id, {
              title: cleanTitle,
              isLeftover: true,
            });
            meal.title = cleanTitle;
            meal.isLeftover = true;
          }
          seenMap.set(key, meal);
        }
      }

      // Also clean fridge item names
      const allFridge = await db.fridge.toArray();
      for (const item of allFridge) {
        const cleanName = cleanMealTitle(item.name);
        if (cleanName !== item.name) {
          await db.fridge.update(item.id, {
            name: cleanName,
            originalMealTitle: cleanMealTitle(item.originalMealTitle || cleanName),
          });
        }
      }
    } catch (e) {
      console.warn('DB Sanitization notice:', e);
    }
  };

  // Initialize theme, database, and cross-device sync on client mount
  useEffect(() => {
    setIsClient(true);
    seedInitialDataIfEmpty().then(() => {
      sanitizeDatabase();
      // Activate reactive background auto-sync
      enableAutomaticDriveSync();
      // Silently sync latest state across devices from Google Drive if signed in
      syncAcrossDevicesOnStartup().then((res) => {
        if (res.status === 'synced_from_cloud') {
          const syncedTheme = (localStorage.getItem('mealzy_theme') as 'dark' | 'light') || 'dark';
          setTheme(syncedTheme);
          const syncedEmail = localStorage.getItem('mealzy_user_email');
          const syncedName = localStorage.getItem('mealzy_user_name');
          const syncedAvatar = localStorage.getItem('mealzy_user_avatar');
          if (syncedEmail) setUserEmail(syncedEmail);
          if (syncedName) setUserName(syncedName);
          if (syncedAvatar) setUserAvatar(syncedAvatar);
        }
      });
    });
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

    const savedEmail = localStorage.getItem('mealzy_user_email');
    const savedName = localStorage.getItem('mealzy_user_name');
    const savedAvatar = localStorage.getItem('mealzy_user_avatar');
    if (savedEmail) {
      setUserEmail(savedEmail);
      setUserName(savedName || savedEmail.split('@')[0]);
      if (savedAvatar) setUserAvatar(savedAvatar);
    }

    // Listen for cross-device cloud sync events
    const handleSyncApplied = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        if (customEvent.detail.theme) setTheme(customEvent.detail.theme);
        if (customEvent.detail.userName) setUserName(customEvent.detail.userName);
        if (customEvent.detail.userAvatar) setUserAvatar(customEvent.detail.userAvatar);
        if (customEvent.detail.userEmail) setUserEmail(customEvent.detail.userEmail);
      }
    };
    window.addEventListener('mealzy_cloud_sync_applied', handleSyncApplied);
    return () => {
      window.removeEventListener('mealzy_cloud_sync_applied', handleSyncApplied);
    };
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

    scheduleBackgroundDriveSync();

    setUndoAction({
      id: `theme-${Date.now()}`,
      badge: nextTheme === 'dark' ? '🌙' : '☀️',
      message: nextTheme === 'dark' ? 'Dark Mode Engaged' : 'Light Mode Activated',
      funSubtext: nextTheme === 'dark' ? 'Night kitchen vibes on. Sleek and easy on the eyes!' : 'Kitchen blinds pulled open. Crisp and bright!',
    });
  };

  const handleLoginSuccess = (email: string, name?: string, avatar?: string) => {
    setUserEmail(email);
    const resolvedName = name || email.split('@')[0];
    setUserName(resolvedName);
    if (avatar) {
      setUserAvatar(avatar);
      localStorage.setItem('mealzy_user_avatar', avatar);
    }
    localStorage.setItem('mealzy_user_email', email);
    localStorage.setItem('mealzy_user_name', resolvedName);

    scheduleBackgroundDriveSync(500);

    setUndoAction({
      id: `auth-${Date.now()}`,
      badge: '👨‍🍳',
      message: `Welcome chef, ${resolvedName}!`,
      funSubtext: 'Signed in with Google. Meals and preferences synced across all devices.',
    });
  };

  const handleLogout = () => {
    setUserEmail(undefined);
    setUserName(undefined);
    setUserAvatar(undefined);
    localStorage.removeItem('mealzy_user_email');
    localStorage.removeItem('mealzy_user_name');
    localStorage.removeItem('mealzy_user_avatar');
    localStorage.removeItem('mealzy_google_access_token');

    setUndoAction({
      id: `logout-${Date.now()}`,
      badge: '👋',
      message: 'Signed Out of Google',
      funSubtext: 'Switched to offline guest mode. Local data preserved.',
    });
  };

  const handleLogoClick = () => {
    setIsAddMealOpen(false);
    setSelectedMealForDetail(null);
    setIsAuthOpen(false);
    setMealToCook(null);
    setIsExportWeekOpen(false);
    setAteOutTarget(null);
    setAutoFillTarget(null);
    setActiveTab('planner');
    setIsAllDaysView(false);
    setSelectedDate(rollingDays[0]?.dateString || new Date().toISOString().split('T')[0]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // Rotting items count for the bottom dock badge: strictly > 7 days old AND unassigned
  const rottingCount = fridgeItems.filter((item) => {
    const isOverAWeekOld = item.daysInFridge > 7;
    const nameClean = cleanMealTitle(item.name).toLowerCase();
    const isAssigned = meals.some((m) => {
      const mealTitleClean = cleanMealTitle(m.title).toLowerCase();
      const matchesSource = m.sourceMealId === item.id || m.sourceMealId === `fridge-batch-${item.id}`;
      const matchesTitle = mealTitleClean.includes(nameClean) || nameClean.includes(mealTitleClean);
      return matchesSource || matchesTitle;
    });
    return isOverAWeekOld && !isAssigned;
  }).length;

  // Selected day object and its meals
  const selectedDayObj = rollingDays.find((d) => d.dateString === selectedDate) || rollingDays[0];
  const selectedDayMeals = meals.filter((m) => m.dateScheduled === selectedDate);

  // Handlers
  const handleQuickAdd = (dateString: string, slot: MealType) => {
    setAddMealDate(dateString);
    setAddMealSlot(slot);
    setIsAddMealOpen(true);
  };

  const handleAutoFillClick = (targetDate: string) => {
    const dayMeals = meals.filter((m) => m.dateScheduled === targetDate);
    const existingSlots = new Set(dayMeals.map((m) => m.mealType));
    const slots: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
    const missingSlots = slots.filter((s) => !existingSlots.has(s));

    if (missingSlots.length === 0) return;

    setAutoFillTarget({ targetDate, missingSlots });
  };

  const handleApplyAutoFillSuggestions = async (suggestedMeals: Omit<MealItem, 'id'>[]) => {
    const newMeals: MealItem[] = suggestedMeals.map((m) => ({
      ...m,
      id: `meal-autofill-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    }));

    await db.meals.bulkAdd(newMeals);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#D4FF00', '#10B981', '#06B6D4', '#A855F7'],
    });

    setUndoAction({
      id: `autofill-${Date.now()}`,
      badge: '✨',
      message: `Added ${newMeals.length} suggested dishes`,
      funSubtext: 'Your sous-chef did the heavy lifting for you! 🤖',
      onUndo: async () => {
        for (const m of newMeals) {
          await db.meals.delete(m.id);
        }
      },
    });
  };

  const handleAddMealConfirm = async (newMeal: Omit<MealItem, 'id'>) => {
    const id = `meal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    await db.meals.add({
      ...newMeal,
      id,
    });

    setUndoAction({
      id: `add-${Date.now()}`,
      badge: '🥗',
      message: `Added "${newMeal.title}" to ${newMeal.mealType}`,
      funSubtext: 'Future you is already pumped for this dish! 😋',
      onUndo: async () => {
        await db.meals.delete(id);
      },
    });
  };

  const handleMoveMealSlot = async (mealId: string, targetDate: string, targetType: MealType) => {
    const m = await db.meals.get(mealId);
    if (!m) return;
    const prevDate = m.dateScheduled;
    const prevType = m.mealType;

    await db.meals.update(mealId, {
      dateScheduled: targetDate,
      mealType: targetType,
    });
    scheduleBackgroundDriveSync(1000);

    const isDifferentDay = targetDate !== prevDate;
    const targetDayName =
      targetDate === rollingDays[0]?.dateString
        ? 'Today'
        : targetDate === rollingDays[1]?.dateString
        ? 'Tomorrow'
        : targetDate;

    setUndoAction({
      id: `move-${Date.now()}`,
      badge: '🎯',
      message: isDifferentDay
        ? `Moved "${m.title}" to ${targetDayName} ${targetType}`
        : `Moved "${m.title}" to ${targetType}`,
      funSubtext: 'Tactical dish redeployment complete! Menu reshuffled. 🍱',
      onUndo: async () => {
        await db.meals.update(mealId, {
          dateScheduled: prevDate,
          mealType: prevType,
        });
        scheduleBackgroundDriveSync(1000);
      },
    });
  };

  const handleDeleteMeal = async (mealId: string) => {
    const m = await db.meals.get(mealId);
    if (m) {
      const clean = cleanMealTitle(m.title).toLowerCase();
      const dupes = await db.meals
        .where('dateScheduled')
        .equals(m.dateScheduled || '')
        .and((other) => other.mealType === m.mealType && cleanMealTitle(other.title).toLowerCase() === clean)
        .toArray();
      for (const d of dupes) {
        await db.meals.delete(d.id);
      }
      setUndoAction({
        id: `delete-${Date.now()}`,
        badge: '🗑️',
        message: `Removed "${m.title}"`,
        funSubtext: 'Cleared off the board. Room made for new flavors! 🚀',
        onUndo: async () => {
          await db.meals.bulkAdd(dupes);
        },
      });
    } else {
      await db.meals.delete(mealId);
    }
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

    const cleanDish = cleanMealTitle(sourceMeal.title);

    const leftoverMeals: MealItem[] = targetSlots.map((slot, idx) => ({
      id: `leftover-${sourceMeal.id}-${idx + 1}`,
      title: cleanDish,
      mealType: slot.slot,
      calories: sourceMeal.calories,
      protein: sourceMeal.protein,
      carbs: sourceMeal.carbs,
      fat: sourceMeal.fat,
      prepTimeMinutes: 3,
      ingredients: sourceMeal.ingredients,
      tags: ['leftover', 'quick-heat'],
      isLeftover: true,
      portions: 1,
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
      name: cleanDish,
      originalMealTitle: cleanDish,
      cookedAt: new Date().toISOString(),
      daysInFridge: 0,
      status: 'fresh',
      portionsLeft: portions - 1,
      category: sourceMeal.mealType,
      accentColor: sourceMeal.accentColor,
    });

    setUndoAction({
      id: `cook-${Date.now()}`,
      badge: '🍳',
      message: `Cooked "${cleanDish}" (${portions} portions)`,
      funSubtext: portions > 1 ? `Chef mode on! ${portions - 1} extra portion(s) saved in Fridge Radar.` : 'Cooked and enjoyed hot off the skillet!',
      onUndo: async () => {
        await db.meals.update(sourceMeal.id, {
          totalPortionsCooked: undefined,
          portionsRemaining: undefined,
        });
        for (const lm of leftoverMeals) {
          await db.meals.delete(lm.id);
        }
        await db.fridge.delete(`fridge-batch-${sourceMeal.id}`);
      },
    });
  };

  // Early item clearance handler with 5s undo
  const handleMarkGoneEarly = async (mealIdOrFridgeId: string, mealTitle: string) => {
    const item = await db.meals.get(mealIdOrFridgeId);
    let originalCopy: MealItem | undefined;
    if (item) {
      originalCopy = { ...item };
      if (item.portions && item.portions > 1) {
        await db.meals.update(item.id, {
          portions: item.portions - 1,
        });
      } else {
        await db.meals.delete(mealIdOrFridgeId);
        if (item.sourceMealId) {
          await db.fridge.delete(`fridge-batch-${item.sourceMealId}`);
        }
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

    setUndoAction({
      id: `gone-${Date.now()}`,
      badge: '🧹',
      message: `Cleared "${mealTitle}"`,
      funSubtext: 'Zero crumbs left behind! Kitchen efficiency 100%. ✨',
      onUndo: async () => {
        if (originalCopy) {
          await db.meals.put(originalCopy);
        }
      },
    });
  };

  // Consume Fridge Item Today
  const handleConsumeFridgeItem = async (item: FridgePantryItem, slot: MealType) => {
    const today = rollingDays[0].dateString;
    const cleanName = cleanMealTitle(item.name);

    // Consolidate if this meal is already in this slot today to prevent taking up space
    const existingInSlot = await db.meals
      .where('dateScheduled')
      .equals(today)
      .and((m) => m.mealType === slot && cleanMealTitle(m.title).toLowerCase() === cleanName.toLowerCase())
      .first();

    if (existingInSlot) {
      const newPortions = (existingInSlot.portions || 1) + 1;
      await db.meals.update(existingInSlot.id, {
        portions: newPortions,
        notes: `${newPortions} portions prepared from fridge batch.`,
      });
    } else {
      await db.meals.add({
        id: `meal-consumed-${Date.now()}`,
        title: cleanName,
        mealType: slot,
        calories: 520,
        protein: 26,
        carbs: 58,
        fat: 18,
        prepTimeMinutes: 3,
        ingredients: [{ name: cleanName, amount: '1 portion' }],
        tags: ['leftover', 'reheated'],
        isLeftover: true,
        portions: 1,
        dateScheduled: today,
        accentColor: item.accentColor || '#10B981',
      });
    }

    if (item.portionsLeft <= 1) {
      await db.fridge.delete(item.id);
    } else {
      await db.fridge.update(item.id, {
        portionsLeft: item.portionsLeft - 1,
        status: 'fresh',
      });
    }

    setUndoAction({
      id: `consume-${Date.now()}`,
      badge: '🧊',
      message: `Reheated "${cleanName}" for ${slot}`,
      funSubtext: 'Zero food waste achieved! Fridge hero status unlocked. 🦸‍♂️',
      onUndo: async () => {
        if (existingInSlot) {
          await db.meals.update(existingInSlot.id, {
            portions: existingInSlot.portions,
          });
        } else {
          await db.meals.where('dateScheduled').equals(today).and((m) => m.title === cleanName).delete();
        }
        await db.fridge.put(item);
      },
    });

    setActiveTab('planner');
  };

  const handleAddFridgeItem = async (item: Omit<FridgePantryItem, 'id'>) => {
    const id = `fridge-manual-${Date.now()}`;
    await db.fridge.add({
      ...item,
      id,
    });
    scheduleBackgroundDriveSync(1000);
    setUndoAction({
      id: `fridge-add-${Date.now()}`,
      badge: '🧊',
      message: `Stashed "${item.name}" in Fridge`,
      funSubtext: 'Portions tracked in Fridge Radar to prevent spoilage!',
      onUndo: async () => {
        await db.fridge.delete(id);
        scheduleBackgroundDriveSync(1000);
      },
    });
  };

  // Handle Ate Out / Ate Something Else with Slot-Level Food Movement & Undo
  const handleConfirmAteOut = async (data: AteOutConfirmData) => {
    const tomorrow = rollingDays[1]?.dateString || rollingDays[0]?.dateString;

    // 1. Handle original meal(s) scheduled for this slot
    const targetMealsToProcess = (data.originalMeals && data.originalMeals.length > 0)
      ? data.originalMeals
      : (data.originalMeal ? [data.originalMeal] : []);

    const originalMealBackups: MealItem[] = targetMealsToProcess.map((m) => ({ ...m }));

    if (targetMealsToProcess.length > 0) {
      for (const origMeal of targetMealsToProcess) {
        if (data.originalMealAction === 'push_tomorrow') {
          const targetPushDate = data.originalMealPushDate || tomorrow;
          const targetPushSlot = data.originalMealPushSlot || origMeal.mealType;
          await db.meals.update(origMeal.id, {
            dateScheduled: targetPushDate,
            mealType: targetPushSlot,
            notes: `${origMeal.notes ? origMeal.notes + ' • ' : ''}Moved from ${data.dateScheduled} (ate out).`,
          });
        } else if (data.originalMealAction === 'save_fridge') {
          const origClean = cleanMealTitle(origMeal.title);
          await db.fridge.put({
            id: `fridge-pushed-${origMeal.id}`,
            name: origClean,
            originalMealTitle: origClean,
            cookedAt: new Date().toISOString(),
            daysInFridge: 0,
            status: 'fresh',
            portionsLeft: origMeal.portions || 1,
            category: 'saved-dish',
            accentColor: origMeal.accentColor || '#10B981',
          });
          await db.meals.delete(origMeal.id);
        } else if (data.originalMealAction === 'replace') {
          await db.meals.delete(origMeal.id);
        }
      }
    }

    // 2. Log the "Ate Out / Something Else" dish in this slot
    const ateOutId = `ate-out-${Date.now()}`;
    const cleanAteOutTitle = cleanMealTitle(data.title || 'Ate Out');
    await db.meals.add({
      id: ateOutId,
      title: cleanAteOutTitle,
      mealType: data.mealType,
      calories: data.calories || 750,
      protein: Math.round((data.calories || 750) * 0.04),
      carbs: Math.round((data.calories || 750) * 0.12),
      fat: Math.round((data.calories || 750) * 0.04),
      prepTimeMinutes: 0,
      ingredients: [{ name: cleanAteOutTitle, amount: '1 meal' }],
      tags: ['ate-out', 'dining-out', 'no-cooking'],
      dateScheduled: data.dateScheduled,
      accentColor: '#00E5FF',
      notes: data.notes || `Ate out on ${data.dateScheduled}.`,
    });

    // 3. Handle Leftover (if user selected YES)
    if (data.hasLeftover) {
      const leftoverTitle = cleanMealTitle(data.title || 'Takeout');

      if (data.leftoverDestination === 'schedule') {
        await db.meals.add({
          id: `leftover-${ateOutId}`,
          title: leftoverTitle,
          mealType: data.leftoverScheduleSlot || 'lunch',
          dateScheduled: data.leftoverScheduleDate || tomorrow,
          calories: Math.round((data.calories || 750) * 0.75),
          protein: Math.round((data.calories || 750) * 0.035),
          carbs: Math.round((data.calories || 750) * 0.1),
          fat: Math.round((data.calories || 750) * 0.035),
          prepTimeMinutes: 2,
          ingredients: [{ name: leftoverTitle, amount: `${data.leftoverPortions} portion` }],
          tags: ['leftover', 'takeout-box', 'quick-heat'],
          isLeftover: true,
          portions: data.leftoverPortions || 1,
          accentColor: '#A855F7',
          notes: `Brought home from ${cleanAteOutTitle}. Reheat and enjoy!`,
        });
      } else {
        await db.fridge.put({
          id: `fridge-leftover-${ateOutId}`,
          name: leftoverTitle,
          originalMealTitle: cleanAteOutTitle,
          cookedAt: new Date().toISOString(),
          daysInFridge: 0,
          status: 'fresh',
          portionsLeft: data.leftoverPortions || 1,
          category: 'takeout-leftover',
          accentColor: '#A855F7',
        });
      }
    }

    // 5s Undo Toast for Ate Out Action
    setUndoAction({
      id: `ateout-${Date.now()}`,
      badge: '🥂',
      message: `Marked ${data.mealType} as Ate Out`,
      funSubtext: 'Zero pots or pans were harmed tonight. Enjoy dining out! 🍷',
      onUndo: async () => {
        await db.meals.delete(ateOutId);
        if (data.hasLeftover) {
          await db.meals.delete(`leftover-${ateOutId}`);
          await db.fridge.delete(`fridge-leftover-${ateOutId}`);
        }
        for (const orig of originalMealBackups) {
          await db.meals.put(orig);
          await db.fridge.delete(`fridge-pushed-${orig.id}`);
        }
      },
    });

    // Celebration Confetti
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#00E5FF', '#D4FF00', '#A855F7'],
    });

    // Banner feedback
    setQuickGoneBadge({
      title: data.hasLeftover
        ? `${data.title} logged + leftover scheduled!`
        : `${data.title} logged!`,
      show: true,
    });

    setTimeout(() => {
      setQuickGoneBadge({ title: '', show: false });
    }, 4500);
  };

  const handleUpdateCalorieTarget = async (newTarget: number) => {
    const current: UserPreferences & { id: string } = (userPreferences as any) || {
      id: 'user-default-settings',
      calorieTarget: 2200,
      proteinTarget: 140,
      carbsTarget: 240,
      fatTarget: 65,
      dietPreference: 'balanced',
      theme: theme || 'dark',
    };
    await db.preferences.put({
      ...current,
      id: 'user-default-settings',
      calorieTarget: newTarget,
    });
    scheduleBackgroundDriveSync(1000);
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
      <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0D0E12] flex items-center justify-center">
        <SplashScreen isReady={false} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F7F4EE] dark:bg-[#0D0E12] text-gray-900 dark:text-white pb-0 transition-colors duration-200 relative overflow-x-hidden">
      {/* Soft Ambient Background Glow (matching Allen Benny Portfolio) */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-pink-500/10 via-orange-400/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header */}
      <Header
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAddMeal={() => handleQuickAdd(selectedDate, 'lunch')}
        onExportWeekImage={() => setIsExportWeekOpen(true)}
        onLogoClick={handleLogoClick}
        userEmail={userEmail}
        userName={userName}
        userAvatar={userAvatar}
        todayCalories={todayCalories}
        calorieTarget={calorieTarget}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Seamless Infinite Marquee Ticker Strip */}
      <div className="w-full bg-[#FF5500] text-white border-b-2 border-black overflow-hidden py-2 shadow-sm select-none flex">
        <div className="animate-marquee flex items-center gap-6 pr-6 flex-shrink-0 text-xs font-black uppercase tracking-wider">
          {MARQUEE_ITEMS.map((item, idx) => (
            <span key={`ticker-1-${idx}`}>{item}</span>
          ))}
        </div>
        <div className="animate-marquee flex items-center gap-6 pr-6 flex-shrink-0 text-xs font-black uppercase tracking-wider" aria-hidden="true">
          {MARQUEE_ITEMS.map((item, idx) => (
            <span key={`ticker-2-${idx}`}>{item}</span>
          ))}
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-8 pt-6 pb-28 w-full">
        {/* Early Item Completion Notice */}
        <AnimatePresence>
          {quickGoneBadge.show && (
            <motion.div
              initial={{ opacity: 0, y: -15, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              className="mb-6 p-4 rounded-3xl bg-white dark:bg-[#16171E] border-2 border-black dark:border-amber-500/40 shadow-neo-lg flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-yellow-300 border-2 border-black flex items-center justify-center font-black shadow-neo-sm">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-funky font-black text-sm text-gray-900 dark:text-white">
                    Completed Ahead of Schedule
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-300 font-medium">
                    Finished &quot;{quickGoneBadge.title}&quot;. Inventory updated.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  handleQuickAdd(rollingDays[0].dateString, 'dinner');
                  setQuickGoneBadge({ title: '', show: false });
                }}
                className="px-3.5 py-2 bg-[#D4FF00] hover:bg-[#c3ed00] text-black font-black text-xs rounded-xl border-2 border-black shadow-neo-sm active:scale-95 transition-colors flex items-center gap-1.5 flex-shrink-0"
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

            {/* Daily Nutrition & Engagement Monitor */}
            <DailyNutritionMonitor
              dayName={selectedDayObj.dayName}
              dayDateFormatted={selectedDayObj.fullDateFormatted}
              isToday={selectedDayObj.isToday}
              meals={selectedDayMeals}
              calorieTarget={calorieTarget}
              proteinTarget={userPreferences?.proteinTarget || 140}
              carbsTarget={userPreferences?.carbsTarget || 240}
              fatTarget={userPreferences?.fatTarget || 65}
              onUpdateCalorieTarget={handleUpdateCalorieTarget}
              onAutoFillDay={() => handleAutoFillClick(selectedDate)}
              onQuickAddMeal={(slot) => handleQuickAdd(selectedDate, slot)}
            />

            {/* Compact Fridge Rot / Perishable Priority Notification (only urgent unassigned > 7 days) */}
            <FridgeRotBanner
              items={fridgeItems}
              meals={meals}
              onlyRotting={true}
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
              onAteOutSlot={(dateString, mealType, slotMeals) =>
                setAteOutTarget({
                  meals: slotMeals,
                  dateString,
                  mealType,
                })
              }
              onAteOut={(meal, dateString, mealType) =>
                setAteOutTarget({
                  meal: meal || null,
                  dateString: dateString || selectedDate,
                  mealType: mealType || 'dinner',
                })
              }
              onFocusDay={(d) => {
                setSelectedDate(d);
                setIsAllDaysView(false);
              }}
              onTriggerToast={setUndoAction}
            />
          </div>
        )}

        {/* TAB 2: FRIDGE RADAR */}
        {activeTab === 'fridge' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#16171E] border-2 border-black dark:border-gray-800 rounded-3xl p-6 shadow-neo-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="rotate-[-2deg] bg-[#FFE600] text-black font-black text-xs uppercase px-3 py-1 rounded-xl border-2 border-black shadow-neo-sm">
                    PERISHABLE RADAR
                  </span>
                </div>
                <h2 className="font-funky font-black text-xl text-gray-900 dark:text-white mt-1">
                  INVENTORY &amp; SPOILAGE PREVENTION
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Tracks batch portions. Spoilage alert triggers strictly for items older than 7 days that remain unassigned.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-shrink-0 self-stretch sm:self-auto justify-between sm:justify-end">
                <div className="px-3.5 py-2 rounded-2xl bg-[#D4FF00] text-black font-black text-xs border-2 border-black shadow-neo-sm whitespace-nowrap">
                  {fridgeItems.length} Batches Active
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddFridgeItemOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#FF5500] hover:bg-[#ff681a] text-white font-black text-xs uppercase rounded-2xl border-2 border-black shadow-neo active:scale-95 transition-all cursor-pointer flex-shrink-0"
                  title="Add new batch or leftover to Fridge"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Add to Fridge</span>
                </button>
              </div>
            </div>

            <FridgeRotBanner
              items={fridgeItems}
              meals={meals}
              onConsumeItemToday={handleConsumeFridgeItem}
              onMarkFinishedEarly={handleMarkGoneEarly}
              onDeleteItem={(id) => db.fridge.delete(id)}
              onOpenAddFridge={() => setIsAddFridgeItemOpen(true)}
            />
          </div>
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
        allMeals={meals}
        rollingDays={rollingDays}
        onAddMeal={handleAddMealConfirm}
      />

      <MealDetailModal
        isOpen={Boolean(selectedMealForDetail)}
        meal={selectedMealForDetail}
        onClose={() => setSelectedMealForDetail(null)}
        onCookClick={(meal) => setMealToCook(meal)}
        onAteOutClick={(meal) =>
          setAteOutTarget({
            meal,
            dateString: meal.dateScheduled || selectedDate,
            mealType: meal.mealType,
          })
        }
        onMarkGoneEarly={handleMarkGoneEarly}
        onDeleteMeal={handleDeleteMeal}
        onMoveMealSlot={handleMoveMealSlot}
        rollingDays={rollingDays}
      />

      <AteOutModal
        isOpen={Boolean(ateOutTarget)}
        onClose={() => setAteOutTarget(null)}
        targetMeal={ateOutTarget?.meal}
        targetMeals={ateOutTarget?.meals}
        targetDate={ateOutTarget?.dateString || rollingDays[0].dateString}
        targetSlot={ateOutTarget?.mealType || 'dinner'}
        rollingDays={rollingDays}
        calorieTarget={calorieTarget}
        onUpdateCalorieTarget={handleUpdateCalorieTarget}
        onConfirmAteOut={handleConfirmAteOut}
      />

      {autoFillTarget && (
        <AutoFillSuggestionModal
          isOpen={Boolean(autoFillTarget)}
          onClose={() => setAutoFillTarget(null)}
          targetDate={autoFillTarget.targetDate}
          missingSlots={autoFillTarget.missingSlots}
          onApplySuggestions={handleApplyAutoFillSuggestions}
        />
      )}

      <CookMealModal
        isOpen={Boolean(mealToCook)}
        meal={mealToCook}
        onClose={() => setMealToCook(null)}
        onConfirmCook={handleConfirmCook}
        rollingDays={rollingDays}
      />

      <AddFridgeItemModal
        isOpen={isAddFridgeItemOpen}
        onClose={() => setIsAddFridgeItemOpen(false)}
        onAddItem={handleAddFridgeItem}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        userEmail={userEmail}
        userName={userName}
        userAvatar={userAvatar}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
        calorieTarget={calorieTarget}
        onUpdateCalorieTarget={handleUpdateCalorieTarget}
      />

      <ExportWeekModal
        isOpen={isExportWeekOpen}
        onClose={() => setIsExportWeekOpen(false)}
        days={rollingDays}
        meals={meals}
        calorieTarget={calorieTarget}
      />

      {/* Global 5-second Undo Action Toast */}
      <UndoToast
        action={undoAction}
        onDismiss={() => setUndoAction(null)}
      />

      {/* Funky Initial Loading Screen */}
      <SplashScreen isReady={isClient} />
    </div>
  );
}
