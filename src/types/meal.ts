export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Ingredient {
  name: string;
  amount: string;
  category?: 'produce' | 'dairy' | 'protein' | 'grain' | 'spice' | 'other';
}

export interface MealItem {
  id: string;
  title: string;
  mealType: MealType;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prepTimeMinutes: number;
  recipeUrl?: string;
  ingredients: Ingredient[];
  tags: string[];
  isLeftover?: boolean;
  sourceMealId?: string;
  cookedDate?: string; // ISO date string
  totalPortionsCooked?: number;
  portionsRemaining?: number;
  notes?: string;
  portions?: number;
  accentColor?: string;
  dateScheduled?: string; // YYYY-MM-DD
}

export interface DayPlan {
  dateString: string; // YYYY-MM-DD
  dayName: string; // e.g., "Today", "Mon", "Tue"
  fullDateFormatted: string; // e.g., "Sun, Sep 6"
  dayNumber: number; // e.g., 6
  isToday: boolean;
  meals: MealItem[];
  dailyTargets?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface FridgePantryItem {
  id: string;
  name: string;
  cookedAt: string; // ISO date string
  daysInFridge: number;
  status: 'fresh' | 'eat-soon' | 'rotting';
  portionsLeft: number;
  originalMealTitle: string;
  category: string;
  accentColor?: string;
}

export interface UserPreferences {
  calorieTarget: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
  dietPreference: 'omnivore' | 'high-protein' | 'vegetarian' | 'keto' | 'balanced';
  theme: 'dark' | 'light';
  cookieConsent?: {
    accepted: boolean;
    essentialOnly: boolean;
    storagePreferences: boolean;
    analytics: boolean;
    timestamp: number;
  };
}

export interface AISuggestion {
  id: string;
  title: string;
  type: 'twist' | 'repeat_favorite' | 'quick_prep' | 'fridge_rescue';
  headline: string;
  reason: string;
  calories: number;
  protein: number;
  prepTime: string;
  accentColor: string;
  suggestedMeal: Partial<MealItem>;
}
