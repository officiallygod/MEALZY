import Dexie, { type Table } from 'dexie';
import { MealItem, FridgePantryItem, UserPreferences } from '@/types/meal';
import { CURATED_FOODS } from './curated-foods';

export class MealzyDatabase extends Dexie {
  meals!: Table<MealItem, string>;
  fridge!: Table<FridgePantryItem, string>;
  preferences!: Table<UserPreferences & { id: string }, string>;

  constructor() {
    super('MealzyDB');
    this.version(1).stores({
      meals: 'id, mealType, dateScheduled, sourceMealId, isLeftover',
      fridge: 'id, status, daysInFridge',
    });
    this.version(2).stores({
      meals: 'id, mealType, dateScheduled, sourceMealId, isLeftover',
      fridge: 'id, status, daysInFridge',
      preferences: 'id',
    });
  }
}

export const db = typeof window !== 'undefined' ? new MealzyDatabase() : ({} as MealzyDatabase);

// Helper to format Date to YYYY-MM-DD in local time
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Generate the rolling 7 days starting specifically from TODAY
export function getRollingWeekDates(): {
  dateString: string;
  dayName: string;
  dayNumber: number;
  fullDateFormatted: string;
  isToday: boolean;
}[] {
  const days: {
    dateString: string;
    dayName: string;
    dayNumber: number;
    fullDateFormatted: string;
    isToday: boolean;
  }[] = [];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const now = new Date();

  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);

    const dateString = formatDateKey(d);
    const dayName = i === 0 ? 'Today' : dayNames[d.getDay()];
    const fullDateFormatted = `${dayNames[d.getDay()]}, ${monthNames[d.getMonth()]} ${d.getDate()}`;

    days.push({
      dateString,
      dayName,
      dayNumber: d.getDate(),
      fullDateFormatted,
      isToday: i === 0,
    });
  }

  return days;
}

export const SEED_ONCE_KEY = 'mealzy_sample_seeded_once';
export const LAST_LOCAL_MODIFIED_KEY = 'mealzy_last_local_modified';

export function markLocalDataModified(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LAST_LOCAL_MODIFIED_KEY, Date.now().toString());
  } catch (_) {}
}

export function getLastLocalModifiedTime(): number {
  if (typeof window === 'undefined') return 0;
  try {
    return Number(localStorage.getItem(LAST_LOCAL_MODIFIED_KEY) || 0);
  } catch (_) {
    return 0;
  }
}

// Initial seed data: strictly added ONCE during first use
export async function seedInitialDataIfEmpty() {
  if (typeof window === 'undefined') return;

  // If already seeded once, never re-add sample data (even if user wiped everything)
  const alreadySeeded = localStorage.getItem(SEED_ONCE_KEY);
  if (alreadySeeded === 'true') return;

  const count = await db.meals.count();
  if (count > 0) {
    // Database already has records, mark as seeded so future wipes stay clean
    localStorage.setItem(SEED_ONCE_KEY, 'true');
    return;
  }

  // If user has an existing account session, backup, or preferences, do not seed sample data
  const hasExistingSession =
    localStorage.getItem('mealzy_google_access_token') ||
    localStorage.getItem('mealzy_user_email') ||
    localStorage.getItem('mealzy_local_backup_snapshot');
  if (hasExistingSession) {
    localStorage.setItem(SEED_ONCE_KEY, 'true');
    return;
  }

  const rolling = getRollingWeekDates();
  const today = rolling[0].dateString;
  const tomorrow = rolling[1].dateString;
  const day3 = rolling[2].dateString;

  const initialMeals: MealItem[] = [
    {
      id: 'meal-seed-1',
      title: 'Berry Protein Oats Bowl',
      mealType: 'breakfast',
      calories: 410,
      protein: 28,
      carbs: 52,
      fat: 9,
      prepTimeMinutes: 10,
      ingredients: CURATED_FOODS[0].defaultIngredients,
      tags: ['high-protein', 'breakfast', 'quick'],
      dateScheduled: today,
      accentColor: '#A855F7',
    },
    {
      id: 'meal-seed-2',
      title: 'Green Pistachio Pesto Rigatoni',
      mealType: 'lunch',
      calories: 545,
      protein: 20,
      carbs: 72,
      fat: 21,
      prepTimeMinutes: 18,
      ingredients: CURATED_FOODS[2].defaultIngredients,
      tags: ['vegetarian', 'comfort', 'pasta'],
      dateScheduled: today,
      accentColor: '#10B981',
      totalPortionsCooked: 3,
      portionsRemaining: 2,
    },
    {
      id: 'meal-seed-3',
      title: 'Miso Glazed Salmon and Rice',
      mealType: 'dinner',
      calories: 620,
      protein: 44,
      carbs: 58,
      fat: 22,
      prepTimeMinutes: 25,
      ingredients: CURATED_FOODS[1].defaultIngredients,
      tags: ['omega-3', 'dinner'],
      dateScheduled: today,
      accentColor: '#84CC16',
    },
    {
      id: 'meal-seed-4',
      title: 'Matcha Chia Seed Pudding',
      mealType: 'snack',
      calories: 270,
      protein: 11,
      carbs: 26,
      fat: 13,
      prepTimeMinutes: 5,
      ingredients: CURATED_FOODS[8].defaultIngredients,
      tags: ['antioxidants', 'snack'],
      dateScheduled: today,
      accentColor: '#8B5CF6',
    },
    {
      id: 'meal-seed-5',
      title: 'Green Pistachio Pesto Rigatoni',
      mealType: 'lunch',
      calories: 545,
      protein: 20,
      carbs: 72,
      fat: 21,
      prepTimeMinutes: 3,
      ingredients: CURATED_FOODS[2].defaultIngredients,
      tags: ['leftover', 'quick-heat'],
      isLeftover: true,
      sourceMealId: 'meal-seed-2',
      dateScheduled: tomorrow,
      accentColor: '#10B981',
      notes: 'Cooked today, reheat for 2 min.',
    },
    {
      id: 'meal-seed-6',
      title: 'Warm Quinoa and Avocado Bowl',
      mealType: 'dinner',
      calories: 520,
      protein: 24,
      carbs: 67,
      fat: 18,
      prepTimeMinutes: 15,
      ingredients: CURATED_FOODS[3].defaultIngredients,
      tags: ['vegan', 'superfood'],
      dateScheduled: tomorrow,
      accentColor: '#EAB308',
    },
    {
      id: 'meal-seed-7',
      title: 'Tokyo Miso Ramen with Soft Egg',
      mealType: 'dinner',
      calories: 680,
      protein: 36,
      carbs: 82,
      fat: 24,
      prepTimeMinutes: 30,
      ingredients: CURATED_FOODS[5].defaultIngredients,
      tags: ['comfort', 'noodle'],
      dateScheduled: day3,
      accentColor: '#06B6D4',
    },
  ];

  await db.meals.bulkAdd(initialMeals);

  const initialFridge: FridgePantryItem[] = [
    {
      id: 'fridge-1',
      name: 'Creamy Tuscan Pasta',
      originalMealTitle: 'Creamy Tuscan Pasta',
      cookedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      daysInFridge: 8,
      status: 'rotting',
      portionsLeft: 1,
      category: 'dinner',
      accentColor: '#F43F5E',
    },
    {
      id: 'fridge-2',
      name: 'Greek Lemon Chicken',
      originalMealTitle: 'Greek Lemon Chicken',
      cookedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      daysInFridge: 2,
      status: 'fresh',
      portionsLeft: 2,
      category: 'dinner',
      accentColor: '#10B981',
    },
  ];

  await db.fridge.bulkAdd(initialFridge);

  const initialPreferences: UserPreferences & { id: string } = {
    id: 'user-default-settings',
    calorieTarget: 2200,
    proteinTarget: 140,
    carbsTarget: 240,
    fatTarget: 65,
    dietPreference: 'high-protein',
    theme: 'dark',
    cookieConsent: {
      accepted: false,
      essentialOnly: false,
      storagePreferences: true,
      analytics: false,
      timestamp: Date.now(),
    },
  };

  await db.preferences.put(initialPreferences);
  localStorage.setItem(SEED_ONCE_KEY, 'true');
  markLocalDataModified();
}
