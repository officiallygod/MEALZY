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

// Initial seed data so the user opens a jaw-dropping populated board
export async function seedInitialDataIfEmpty() {
  if (typeof window === 'undefined') return;

  const count = await db.meals.count();
  if (count > 0) return;

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
      imageUrl: CURATED_FOODS[0].imageUrl,
      ingredients: CURATED_FOODS[0].defaultIngredients,
      tags: ['high-protein', 'breakfast', 'quick'],
      dateScheduled: today,
      customEmoji: '🫐',
      accentColor: '#C084FC',
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
      imageUrl: CURATED_FOODS[2].imageUrl,
      ingredients: CURATED_FOODS[2].defaultIngredients,
      tags: ['vegetarian', 'comfort', 'pasta'],
      dateScheduled: today,
      customEmoji: '🍝',
      accentColor: '#22C55E',
      totalPortionsCooked: 3,
      portionsRemaining: 2,
    },
    {
      id: 'meal-seed-3',
      title: 'Miso Glazed Salmon & Rice',
      mealType: 'dinner',
      calories: 620,
      protein: 44,
      carbs: 58,
      fat: 22,
      prepTimeMinutes: 25,
      imageUrl: CURATED_FOODS[1].imageUrl,
      ingredients: CURATED_FOODS[1].defaultIngredients,
      tags: ['omega-3', 'dinner-fave'],
      dateScheduled: today,
      customEmoji: '🍣',
      accentColor: '#D4FF00',
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
      imageUrl: CURATED_FOODS[8].imageUrl,
      ingredients: CURATED_FOODS[8].defaultIngredients,
      tags: ['antioxidants', 'snack'],
      dateScheduled: today,
      customEmoji: '🍵',
      accentColor: '#8B5CF6',
    },
    // Leftover automatically placed tomorrow lunch!
    {
      id: 'meal-seed-5',
      title: 'Leftover: Pistachio Pesto Rigatoni',
      mealType: 'lunch',
      calories: 545,
      protein: 20,
      carbs: 72,
      fat: 21,
      prepTimeMinutes: 3,
      imageUrl: CURATED_FOODS[2].imageUrl,
      ingredients: CURATED_FOODS[2].defaultIngredients,
      tags: ['leftover', 'quick-heat'],
      isLeftover: true,
      sourceMealId: 'meal-seed-2',
      dateScheduled: tomorrow,
      customEmoji: '🥡',
      accentColor: '#22C55E',
      notes: 'Cooked today, reheat for 2 min. Taste gets even richer!',
    },
    {
      id: 'meal-seed-6',
      title: 'Warm Quinoa & Avocado Bowl',
      mealType: 'dinner',
      calories: 520,
      protein: 24,
      carbs: 67,
      fat: 18,
      prepTimeMinutes: 15,
      imageUrl: CURATED_FOODS[3].imageUrl,
      ingredients: CURATED_FOODS[3].defaultIngredients,
      tags: ['vegan', 'superfood'],
      dateScheduled: tomorrow,
      customEmoji: '🥑',
      accentColor: '#E8FA43',
    },
    {
      id: 'meal-seed-7',
      title: 'Tokyo Style Miso Ramen with Egg',
      mealType: 'dinner',
      calories: 680,
      protein: 36,
      carbs: 82,
      fat: 24,
      prepTimeMinutes: 30,
      imageUrl: CURATED_FOODS[5].imageUrl,
      ingredients: CURATED_FOODS[5].defaultIngredients,
      tags: ['comfort-food', 'asian-inspired'],
      dateScheduled: day3,
      customEmoji: '🍜',
      accentColor: '#38BDF8',
    },
  ];

  await db.meals.bulkAdd(initialMeals);

  // Seed fridge item with one rotting item to demonstrate Gen-Z alert
  const initialFridge: FridgePantryItem[] = [
    {
      id: 'fridge-1',
      name: 'Creamy Tuscan Pasta',
      originalMealTitle: 'Creamy Tuscan Pasta',
      cookedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago!
      daysInFridge: 3,
      status: 'rotting', // triggers funny alert
      portionsLeft: 1,
      category: 'dinner',
      customEmoji: '🍝',
      accentColor: '#FF5C5C',
    },
    {
      id: 'fridge-2',
      name: 'Greek Lemon Chicken',
      originalMealTitle: 'Greek Lemon Chicken',
      cookedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      daysInFridge: 1,
      status: 'fresh',
      portionsLeft: 2,
      category: 'dinner',
      customEmoji: '🍗',
      accentColor: '#22C55E',
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
}
