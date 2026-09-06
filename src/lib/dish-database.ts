import { MealType } from '@/types/meal';
import { cleanMealTitle } from './curated-foods';

export interface OpenSourceDish {
  id: string;
  title: string;
  category: MealType;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prepTimeMinutes: number;
  accentColor: string;
  tags: string[];
  twist?: {
    title: string;
    description: string;
    caloriesDelta: number;
    proteinDelta: number;
  };
}

export const OPEN_SOURCE_DISHES: OpenSourceDish[] = [
  // BREAKFAST DISHES
  {
    id: 'dish-b1',
    title: 'Berry Protein Oats Bowl',
    category: 'breakfast',
    calories: 410,
    protein: 28,
    carbs: 52,
    fat: 9,
    prepTimeMinutes: 10,
    accentColor: '#A855F7',
    tags: ['high-protein', 'breakfast', 'quick'],
    twist: {
      title: 'Caramelized Banana & Tahini Oats',
      description: 'Pan-sear sliced banana in cinnamon and top with sesame tahini for rich nutty depth.',
      caloriesDelta: 45,
      proteinDelta: 2,
    },
  },
  {
    id: 'dish-b2',
    title: 'Smashed Avocado Sourdough Toast',
    category: 'breakfast',
    calories: 380,
    protein: 14,
    carbs: 38,
    fat: 20,
    prepTimeMinutes: 10,
    accentColor: '#10B981',
    tags: ['breakfast', 'quick', 'vegetarian'],
    twist: {
      title: 'Chili Crunch & Poached Egg Avocado Toast',
      description: 'Top with a runny poached egg, crispy chili oil, and flaky sea salt.',
      caloriesDelta: 75,
      proteinDelta: 7,
    },
  },
  {
    id: 'dish-b3',
    title: 'Greek Yogurt Bowl with Honey & Walnuts',
    category: 'breakfast',
    calories: 340,
    protein: 24,
    carbs: 30,
    fat: 14,
    prepTimeMinutes: 5,
    accentColor: '#06B6D4',
    tags: ['high-protein', 'breakfast', 'no-cook'],
    twist: {
      title: 'Roasted Fig & Pistachio Yogurt Bowl',
      description: 'Swap honey for warm roasted figs and crushed roasted pistachios.',
      caloriesDelta: 30,
      proteinDelta: 3,
    },
  },
  {
    id: 'dish-b4',
    title: 'Spinach & Feta Scrambled Eggs',
    category: 'breakfast',
    calories: 320,
    protein: 22,
    carbs: 6,
    fat: 23,
    prepTimeMinutes: 8,
    accentColor: '#84CC16',
    tags: ['keto', 'high-protein', 'low-carb'],
    twist: {
      title: 'Smoked Salmon & Dill Scramble',
      description: 'Fold in cold-smoked salmon strips and fresh dill right before finishing.',
      caloriesDelta: 50,
      proteinDelta: 10,
    },
  },
  {
    id: 'dish-b5',
    title: 'Matcha Chia Seed Superfood Pudding',
    category: 'breakfast',
    calories: 270,
    protein: 11,
    carbs: 26,
    fat: 13,
    prepTimeMinutes: 5,
    accentColor: '#8B5CF6',
    tags: ['antioxidants', 'vegan', 'breakfast'],
    twist: {
      title: 'Golden Turmeric & Cardamom Chia Pudding',
      description: 'Infuse with turmeric, black pepper, and cardamom with crushed almonds.',
      caloriesDelta: 20,
      proteinDelta: 2,
    },
  },
  {
    id: 'dish-b6',
    title: 'Classic Shakshuka with Warm Pita',
    category: 'breakfast',
    calories: 420,
    protein: 19,
    carbs: 46,
    fat: 18,
    prepTimeMinutes: 20,
    accentColor: '#F43F5E',
    tags: ['mediterranean', 'brunch', 'vegetarian'],
    twist: {
      title: 'Spicy Harissa & Goat Cheese Shakshuka',
      description: 'Add a spoonful of North African harissa paste and crumble fresh goat cheese.',
      caloriesDelta: 40,
      proteinDelta: 4,
    },
  },
  {
    id: 'dish-b7',
    title: 'Peanut Butter Banana Protein Smoothie',
    category: 'breakfast',
    calories: 450,
    protein: 34,
    carbs: 48,
    fat: 14,
    prepTimeMinutes: 5,
    accentColor: '#EAB308',
    tags: ['smoothie', 'high-protein', 'quick'],
  },

  // LUNCH DISHES
  {
    id: 'dish-l1',
    title: 'Green Pistachio Pesto Rigatoni',
    category: 'lunch',
    calories: 545,
    protein: 20,
    carbs: 72,
    fat: 21,
    prepTimeMinutes: 18,
    accentColor: '#10B981',
    tags: ['vegetarian', 'pasta', 'lunch'],
    twist: {
      title: 'Sun-Dried Tomato & Burrata Rigatoni',
      description: 'Blend sun-dried tomato tapenade with fresh burrata for Mediterranean richness.',
      caloriesDelta: 60,
      proteinDelta: 4,
    },
  },
  {
    id: 'dish-l2',
    title: 'Warm Quinoa and Avocado Power Bowl',
    category: 'lunch',
    calories: 520,
    protein: 24,
    carbs: 67,
    fat: 18,
    prepTimeMinutes: 15,
    accentColor: '#EAB308',
    tags: ['vegan', 'superfood', 'grain-bowl'],
    twist: {
      title: 'Miso Tahini & Crispy Tofu Quinoa Bowl',
      description: 'Toss crispy air-fried tofu cubes with a ginger miso tahini glaze.',
      caloriesDelta: 40,
      proteinDelta: 8,
    },
  },
  {
    id: 'dish-l3',
    title: 'Chicken Shawarma Basmati Bowl',
    category: 'lunch',
    calories: 610,
    protein: 52,
    carbs: 54,
    fat: 19,
    prepTimeMinutes: 20,
    accentColor: '#EC4899',
    tags: ['high-protein', 'meal-prep', 'lunch'],
    twist: {
      title: 'Garlic Toum & Pickled Turnip Shawarma Bowl',
      description: 'Drizzle with authentic whipped garlic toum and tangy Lebanese pink turnips.',
      caloriesDelta: 35,
      proteinDelta: 1,
    },
  },
  {
    id: 'dish-l4',
    title: 'Grilled Chicken Caesar Salad Bowl',
    category: 'lunch',
    calories: 480,
    protein: 46,
    carbs: 18,
    fat: 25,
    prepTimeMinutes: 15,
    accentColor: '#84CC16',
    tags: ['high-protein', 'low-carb', 'lunch'],
    twist: {
      title: 'Chili Lime Grilled Chicken Caesar',
      description: 'Marinate chicken in lime juice, smoked paprika, and crushed coriander.',
      caloriesDelta: 15,
      proteinDelta: 2,
    },
  },
  {
    id: 'dish-l5',
    title: 'Mediterranean Tuna Salad Whole Wheat Wrap',
    category: 'lunch',
    calories: 460,
    protein: 38,
    carbs: 42,
    fat: 15,
    prepTimeMinutes: 10,
    accentColor: '#06B6D4',
    tags: ['omega-3', 'quick', 'lunch'],
    twist: {
      title: 'Avocado Chimichurri Tuna Wrap',
      description: 'Replace mayo with mashed ripe avocado and tangy Argentine chimichurri.',
      caloriesDelta: 20,
      proteinDelta: 1,
    },
  },
  {
    id: 'dish-l6',
    title: 'Crispy Falafel & Hummus Mezze Plate',
    category: 'lunch',
    calories: 530,
    protein: 21,
    carbs: 68,
    fat: 22,
    prepTimeMinutes: 15,
    accentColor: '#F59E0B',
    tags: ['vegan', 'mediterranean', 'lunch'],
  },
  {
    id: 'dish-l7',
    title: 'Spicy Peanut Sesame Soba Noodles',
    category: 'lunch',
    calories: 510,
    protein: 19,
    carbs: 68,
    fat: 19,
    prepTimeMinutes: 15,
    accentColor: '#6366F1',
    tags: ['vegan', 'noodle', 'lunch'],
    twist: {
      title: 'Crispy Edamame & Lime Peanut Soba',
      description: 'Toss with pan-charred edamame pods and fresh lime juice for crunchy texture.',
      caloriesDelta: 30,
      proteinDelta: 5,
    },
  },

  // DINNER DISHES
  {
    id: 'dish-d1',
    title: 'Miso Glazed Salmon and Jasmine Rice',
    category: 'dinner',
    calories: 620,
    protein: 44,
    carbs: 58,
    fat: 22,
    prepTimeMinutes: 25,
    accentColor: '#84CC16',
    tags: ['omega-3', 'dinner', 'balanced'],
    twist: {
      title: 'Gochujang Honey Glazed Salmon Bowl',
      description: 'Glaze salmon with Korean gochujang chili paste and honey for caramelized heat.',
      caloriesDelta: 30,
      proteinDelta: 2,
    },
  },
  {
    id: 'dish-d2',
    title: 'Tokyo Miso Ramen with Soft Marinated Egg',
    category: 'dinner',
    calories: 680,
    protein: 36,
    carbs: 82,
    fat: 24,
    prepTimeMinutes: 30,
    accentColor: '#06B6D4',
    tags: ['noodle', 'dinner', 'comfort'],
    twist: {
      title: 'Garlic Shoyu Broth Ramen with Shiitake',
      description: 'Simmer broth with roasted garlic chips and charred shiitake mushrooms for deep umami.',
      caloriesDelta: 40,
      proteinDelta: 1,
    },
  },
  {
    id: 'dish-d3',
    title: 'Lean Beef Caramelized Onion Burger',
    category: 'dinner',
    calories: 720,
    protein: 48,
    carbs: 48,
    fat: 36,
    prepTimeMinutes: 20,
    accentColor: '#F43F5E',
    tags: ['dinner', 'high-protein'],
    twist: {
      title: 'Smoked Jalapeno Pepperjack Burger',
      description: 'Top with pickled jalapenos, pepperjack cheese, and chipotle garlic aioli.',
      caloriesDelta: 50,
      proteinDelta: 3,
    },
  },
  {
    id: 'dish-d4',
    title: 'Thai Basil Chicken Stir-Fry (Pad Krapow)',
    category: 'dinner',
    calories: 560,
    protein: 46,
    carbs: 45,
    fat: 22,
    prepTimeMinutes: 18,
    accentColor: '#10B981',
    tags: ['high-protein', 'asian', 'dinner'],
    twist: {
      title: 'Crispy Fried Egg Pad Krapow',
      description: 'Top with a crispy Thai-style sunny egg with golden lacy edges.',
      caloriesDelta: 70,
      proteinDelta: 6,
    },
  },
  {
    id: 'dish-d5',
    title: 'Creamy Tuscan Garlic Herb Chicken',
    category: 'dinner',
    calories: 580,
    protein: 48,
    carbs: 16,
    fat: 36,
    prepTimeMinutes: 25,
    accentColor: '#EC4899',
    tags: ['keto', 'high-protein', 'comfort'],
    twist: {
      title: 'Sun-Dried Tomato & Spinach Cream Cod',
      description: 'Sub tender white cod fillets for a lighter, flaky seafood variation.',
      caloriesDelta: -40,
      proteinDelta: 2,
    },
  },
  {
    id: 'dish-d6',
    title: 'Vegetarian Chickpea & Sweet Potato Coconut Curry',
    category: 'dinner',
    calories: 520,
    protein: 18,
    carbs: 72,
    fat: 19,
    prepTimeMinutes: 30,
    accentColor: '#F59E0B',
    tags: ['vegan', 'comfort', 'curry'],
    twist: {
      title: 'Cashew Butter Lemongrass Curry',
      description: 'Stir in creamy roasted cashew butter and bruised lemongrass stalks.',
      caloriesDelta: 60,
      proteinDelta: 4,
    },
  },
  {
    id: 'dish-d7',
    title: 'Grilled Flank Steak with Chimichurri & Asparagus',
    category: 'dinner',
    calories: 640,
    protein: 52,
    carbs: 12,
    fat: 42,
    prepTimeMinutes: 20,
    accentColor: '#EF4444',
    tags: ['high-protein', 'keto', 'dinner'],
  },

  // SNACK DISHES
  {
    id: 'dish-s1',
    title: 'Apple Slices with Natural Peanut Butter',
    category: 'snack',
    calories: 220,
    protein: 6,
    carbs: 26,
    fat: 12,
    prepTimeMinutes: 3,
    accentColor: '#EAB308',
    tags: ['quick', 'vegan', 'snack'],
    twist: {
      title: 'Cinnamon Spiced Almond Butter Apple Nachos',
      description: 'Drizzle warmed almond butter, dusted cinnamon, and hemp hearts over crisp honeycrisp slices.',
      caloriesDelta: 30,
      proteinDelta: 3,
    },
  },
  {
    id: 'dish-s2',
    title: 'Edamame Pods with Flaky Sea Salt',
    category: 'snack',
    calories: 160,
    protein: 14,
    carbs: 12,
    fat: 6,
    prepTimeMinutes: 5,
    accentColor: '#10B981',
    tags: ['high-protein', 'vegan', 'snack'],
    twist: {
      title: 'Togarashi Garlic Charred Edamame',
      description: 'Char pods in a skillet with sesame oil, garlic, and Japanese shichimi togarashi spice.',
      caloriesDelta: 25,
      proteinDelta: 1,
    },
  },
  {
    id: 'dish-s3',
    title: 'Dark Chocolate Rice Cakes with Sea Salt',
    category: 'snack',
    calories: 180,
    protein: 3,
    carbs: 28,
    fat: 7,
    prepTimeMinutes: 2,
    accentColor: '#A855F7',
    tags: ['sweet', 'snack', 'quick'],
  },
  {
    id: 'dish-s4',
    title: 'Cottage Cheese with Fresh Blueberries',
    category: 'snack',
    calories: 210,
    protein: 26,
    carbs: 18,
    fat: 4,
    prepTimeMinutes: 3,
    accentColor: '#06B6D4',
    tags: ['high-protein', 'snack', 'low-fat'],
    twist: {
      title: 'Balsamic Glaze & Black Pepper Cottage Cheese',
      description: 'Drizzle sweet aged balsamic reduction with freshly cracked black peppercorn.',
      caloriesDelta: 20,
      proteinDelta: 0,
    },
  },
];

// Instant live typeahead search across open source dishes
export function searchDishCatalog(query: string, slot?: MealType): OpenSourceDish[] {
  const clean = query.trim().toLowerCase();
  let matches = OPEN_SOURCE_DISHES;

  if (slot) {
    matches = matches.filter((d) => d.category === slot);
  }

  if (!clean) {
    return matches.slice(0, 40);
  }

  return OPEN_SOURCE_DISHES.filter((dish) => {
    const titleMatch = dish.title.toLowerCase().includes(clean);
    const tagMatch = dish.tags.some((t) => t.toLowerCase().includes(clean));
    const twistMatch = dish.twist?.title.toLowerCase().includes(clean);
    return titleMatch || tagMatch || twistMatch;
  }).slice(0, 40);
}

// Find twist variation for a dish title
export function getTwistForDishTitle(dishTitle: string): OpenSourceDish['twist'] | undefined {
  const clean = dishTitle.toLowerCase();
  const matched = OPEN_SOURCE_DISHES.find(
    (d) =>
      clean.includes(d.title.toLowerCase()) ||
      d.title.toLowerCase().includes(clean) ||
      (d.twist && clean.includes(d.twist.title.toLowerCase()))
  );
  return matched?.twist;
}

// Fallback search to OpenFoodFacts for packaged or international products
export async function searchOpenFoodFactsFallback(query: string): Promise<Partial<OpenSourceDish>[]> {
  if (!query || query.trim().length < 3) return [];
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
        query.trim()
      )}&search_simple=1&action=process&json=1&page_size=8`
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.products) return [];

    return data.products
      .filter((p: any) => p.product_name)
      .map((p: any) => ({
        id: `off-${p.code || Math.random().toString(36).substring(2, 7)}`,
        title: p.product_name,
        calories: Math.round(Number(p.nutriments?.['energy-kcal_100g'] || 0)),
        protein: Math.round(Number(p.nutriments?.proteins_100g || 0)),
        carbs: Math.round(Number(p.nutriments?.carbohydrates_100g || 0)),
        fat: Math.round(Number(p.nutriments?.fat_100g || 0)),
        prepTimeMinutes: 10,
        accentColor: '#06B6D4',
        tags: ['open-source-db', p.brands ? p.brands.split(',')[0].trim() : 'item'].filter(Boolean),
      }));
  } catch (err) {
    return [];
  }
}

// Rough estimation based on closest matching food or sensible slot benchmarks
export function estimateDishNutrition(
  queryTitle: string,
  slot?: MealType
): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prepTimeMinutes: number;
  matchedFoodTitle?: string;
  accentColor: string;
} {
  const clean = queryTitle.trim().toLowerCase();

  // Try to find closest food in open-source database by word matching
  if (clean.length > 0) {
    const words = clean.split(/\s+/).filter((w) => w.length > 2);
    for (const dish of OPEN_SOURCE_DISHES) {
      const dishTitleLower = dish.title.toLowerCase();
      // Exact substring match
      if (dishTitleLower.includes(clean) || clean.includes(dishTitleLower)) {
        return {
          calories: dish.calories,
          protein: dish.protein,
          carbs: dish.carbs,
          fat: dish.fat,
          prepTimeMinutes: dish.prepTimeMinutes,
          matchedFoodTitle: dish.title,
          accentColor: dish.accentColor,
        };
      }
      // Word match
      if (words.some((w) => dishTitleLower.includes(w) || dish.tags.some((t) => t.includes(w)))) {
        return {
          calories: dish.calories,
          protein: dish.protein,
          carbs: dish.carbs,
          fat: dish.fat,
          prepTimeMinutes: dish.prepTimeMinutes,
          matchedFoodTitle: dish.title,
          accentColor: dish.accentColor,
        };
      }
    }
  }

  // Fallback estimation benchmarks by slot
  switch (slot) {
    case 'breakfast':
      return {
        calories: 420,
        protein: 22,
        carbs: 48,
        fat: 16,
        prepTimeMinutes: 12,
        accentColor: '#FFE600',
      };
    case 'lunch':
      return {
        calories: 540,
        protein: 34,
        carbs: 56,
        fat: 18,
        prepTimeMinutes: 15,
        accentColor: '#00E5FF',
      };
    case 'dinner':
      return {
        calories: 640,
        protein: 44,
        carbs: 58,
        fat: 22,
        prepTimeMinutes: 20,
        accentColor: '#FF5500',
      };
    case 'snack':
      return {
        calories: 210,
        protein: 12,
        carbs: 24,
        fat: 8,
        prepTimeMinutes: 5,
        accentColor: '#D4FF00',
      };
    default:
      return {
        calories: 500,
        protein: 28,
        carbs: 50,
        fat: 18,
        prepTimeMinutes: 15,
        accentColor: '#10B981',
      };
  }
}

// Find older meals the user previously made for this slot that they haven't had recently
export interface RediscoverMeal {
  title: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prepTimeMinutes: number;
  recipeUrl?: string;
  tags: string[];
  accentColor?: string;
  lastDateScheduled: string;
  daysSinceLastEaten: number;
}

export function getRediscoverMeals(
  allMeals: { title: string; mealType: MealType; dateScheduled?: string; calories: number; protein: number; carbs: number; fat: number; prepTimeMinutes?: number; recipeUrl?: string; tags?: string[]; accentColor?: string }[],
  currentSlot: MealType,
  targetDate: string
): RediscoverMeal[] {
  const targetTime = new Date(targetDate).getTime();
  const mealMap = new Map<string, RediscoverMeal>();

  for (const m of allMeals) {
    if (m.mealType !== currentSlot || !m.dateScheduled) continue;
    const cleanTitle = cleanMealTitle(m.title);
    const mealTime = new Date(m.dateScheduled).getTime();
    const daysDiff = Math.round((targetTime - mealTime) / (1000 * 60 * 60 * 24));

    if (daysDiff >= 2) {
      const existing = mealMap.get(cleanTitle.toLowerCase());
      if (!existing || daysDiff < existing.daysSinceLastEaten) {
        mealMap.set(cleanTitle.toLowerCase(), {
          title: cleanTitle,
          calories: m.calories,
          protein: m.protein,
          carbs: m.carbs,
          fat: m.fat,
          prepTimeMinutes: m.prepTimeMinutes || 15,
          recipeUrl: m.recipeUrl,
          tags: m.tags || [],
          accentColor: m.accentColor,
          lastDateScheduled: m.dateScheduled,
          daysSinceLastEaten: daysDiff,
        });
      }
    }
  }

  return Array.from(mealMap.values())
    .sort((a, b) => b.daysSinceLastEaten - a.daysSinceLastEaten)
    .slice(0, 4);
}

