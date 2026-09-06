import { MealItem, FridgePantryItem, AISuggestion } from '@/types/meal';
import { CURATED_FOODS, cleanMealTitle } from './curated-foods';

export interface FlavorTwistRule {
  triggerPattern: string;
  twistTitle: string;
  headline: string;
  reason: string;
  accentColor: string;
  caloriesDelta: number;
  proteinDelta: number;
  ingredientsToAdd: { name: string; amount: string }[];
}

const FLAVOR_TWISTS: FlavorTwistRule[] = [
  {
    triggerPattern: 'salmon',
    twistTitle: 'Gochujang Honey Glazed Salmon Bowl',
    headline: 'High-Protein Spiced Variation',
    reason: 'Modifies your miso salmon base with caramelized Korean gochujang, toasted sesame, and scallions.',
    accentColor: '#F43F5E',
    caloriesDelta: +30,
    proteinDelta: +2,
    ingredientsToAdd: [
      { name: 'Korean Gochujang Paste', amount: '1.5 tbsp' },
      { name: 'Pure Honey', amount: '1 tsp' },
      { name: 'Toasted Sesame Oil', amount: '1 tsp' },
    ],
  },
  {
    triggerPattern: 'pesto',
    twistTitle: 'Sun-Dried Tomato and Burrata Rigatoni',
    headline: 'Mediterranean Pasta Twist',
    reason: 'Maintains your pasta base while blending sun-dried tomatoes with fresh burrata for balanced richness.',
    accentColor: '#EC4899',
    caloriesDelta: +60,
    proteinDelta: +4,
    ingredientsToAdd: [
      { name: 'Sun-Dried Tomatoes', amount: '50g' },
      { name: 'Fresh Burrata', amount: '1 piece' },
      { name: 'Red Chili Flakes', amount: 'pinch' },
    ],
  },
  {
    triggerPattern: 'oats',
    twistTitle: 'Caramelized Banana and Tahini Oats',
    headline: 'Nutrient-Dense Warm Oats',
    reason: 'Matches the protein macro profile of your berry oats, substituting with pan-seared bananas and nutty tahini.',
    accentColor: '#EAB308',
    caloriesDelta: +40,
    proteinDelta: +1,
    ingredientsToAdd: [
      { name: 'Sliced Banana', amount: '1 whole' },
      { name: 'Sesame Tahini', amount: '1 tbsp' },
      { name: 'Ground Cinnamon', amount: 'dash' },
    ],
  },
  {
    triggerPattern: 'ramen',
    twistTitle: 'Garlic Shoyu Broth Ramen with Shiitake',
    headline: 'Deep Umami Broth Variation',
    reason: 'Builds upon noodle broth foundations with roasted garlic chips and simmered shiitake mushrooms.',
    accentColor: '#06B6D4',
    caloriesDelta: +50,
    proteinDelta: +0,
    ingredientsToAdd: [
      { name: 'Roasted Garlic Chips', amount: '1 tbsp' },
      { name: 'Shiitake Mushrooms', amount: '50g' },
    ],
  },
  {
    triggerPattern: 'avocado',
    twistTitle: 'Chili Crunch Smashed Avocado Sourdough',
    headline: 'Savory Brunch Upgrade',
    reason: 'Upgrades classic avocado sourdough with crispy shallot chili oil and sea salt flakes.',
    accentColor: '#10B981',
    caloriesDelta: +35,
    proteinDelta: +0,
    ingredientsToAdd: [
      { name: 'Crispy Chili Oil', amount: '1 tbsp' },
      { name: 'Flaky Sea Salt', amount: 'pinch' },
    ],
  },
  {
    triggerPattern: 'chicken',
    twistTitle: 'Chipotle Lime Grilled Chicken Bowl',
    headline: 'Citrus and Smoke Twist',
    reason: 'Maintains lean chicken protein while infusing smoky chipotle adobo and fresh lime zest.',
    accentColor: '#84CC16',
    caloriesDelta: +15,
    proteinDelta: +3,
    ingredientsToAdd: [
      { name: 'Chipotle Peppers in Adobo', amount: '1 piece' },
      { name: 'Fresh Lime Juice', amount: '1 lime' },
    ],
  },
];

export function generateSmartSuggestions(
  currentMeals: MealItem[],
  fridgeItems: FridgePantryItem[]
): AISuggestion[] {
  const suggestions: AISuggestion[] = [];

  // 1. Fridge Rot Rescue Prompt
  const rottingItem = fridgeItems.find((f) => f.status === 'rotting' || f.daysInFridge >= 3);
  if (rottingItem) {
    suggestions.push({
      id: 'sugg-rot-rescue',
      title: `Consume: ${cleanMealTitle(rottingItem.name)}`,
      type: 'fridge_rescue',
      headline: 'Perishable Priority Notice',
      reason: `Cooked ${rottingItem.daysInFridge} days ago with ${rottingItem.portionsLeft} portion(s) remaining in refrigeration. Recommend allocating to lunch or dinner today.`,
      calories: 500,
      protein: 25,
      prepTime: '3 min reheat',
      accentColor: '#F43F5E',
      suggestedMeal: {
        title: cleanMealTitle(rottingItem.name),
        calories: 500,
        protein: 25,
        carbs: 60,
        fat: 18,
        prepTimeMinutes: 3,
        isLeftover: true,
        tags: ['leftover', 'quick-heat', 'fridge-priority'],
      },
    });
  }

  // 2. Flavor Twist Engine
  for (const meal of currentMeals) {
    const titleLower = meal.title.toLowerCase();
    const twist = FLAVOR_TWISTS.find((t) => titleLower.includes(t.triggerPattern));
    if (twist && !suggestions.some((s) => s.title === twist.twistTitle)) {
      suggestions.push({
        id: `sugg-twist-${meal.id}`,
        title: twist.twistTitle,
        type: 'twist',
        headline: twist.headline,
        reason: twist.reason,
        calories: meal.calories + twist.caloriesDelta,
        protein: meal.protein + twist.proteinDelta,
        prepTime: `${meal.prepTimeMinutes || 20} min`,
        accentColor: twist.accentColor,
        suggestedMeal: {
          title: twist.twistTitle,
          calories: meal.calories + twist.caloriesDelta,
          protein: meal.protein + twist.proteinDelta,
          carbs: meal.carbs,
          fat: meal.fat + 2,
          prepTimeMinutes: meal.prepTimeMinutes || 20,
          tags: [...meal.tags, 'ai-twist'],
          ingredients: [...meal.ingredients, ...twist.ingredientsToAdd],
          accentColor: twist.accentColor,
        },
      });
      break;
    }
  }

  // 3. Repeat Frequent Favorite
  const unpickedCurated = CURATED_FOODS.filter(
    (c) => !currentMeals.some((m) => m.title.toLowerCase().includes(c.title.toLowerCase()))
  );
  if (unpickedCurated.length > 0) {
    const fave = unpickedCurated[0];
    suggestions.push({
      id: `sugg-fave-${fave.id}`,
      title: fave.title,
      type: 'repeat_favorite',
      headline: 'Recommended Selection',
      reason: `Matches target nutritional benchmarks with ${fave.protein}g protein in ${fave.prepTimeMinutes} minutes preparation time.`,
      calories: fave.calories,
      protein: fave.protein,
      prepTime: `${fave.prepTimeMinutes} min`,
      accentColor: fave.accentColor,
      suggestedMeal: {
        title: fave.title,
        mealType: fave.category,
        calories: fave.calories,
        protein: fave.protein,
        carbs: fave.carbs,
        fat: fave.fat,
        prepTimeMinutes: fave.prepTimeMinutes,
        ingredients: fave.defaultIngredients,
        tags: fave.tags,
        accentColor: fave.accentColor,
      },
    });
  }

  return suggestions;
}

export async function searchOpenFoodFacts(query: string): Promise<any[]> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
        query
      )}&search_simple=1&action=process&json=1&page_size=5`
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.products) return [];

    return data.products.map((p: any) => ({
      name: p.product_name || query,
      calories: Math.round(Number(p.nutriments?.['energy-kcal_100g'] || 0)),
      protein: Math.round(Number(p.nutriments?.proteins_100g || 0)),
      carbs: Math.round(Number(p.nutriments?.carbohydrates_100g || 0)),
      fat: Math.round(Number(p.nutriments?.fat_100g || 0)),
      brand: p.brands || '',
    }));
  } catch (err) {
    console.warn('OpenFoodFacts query skipped:', err);
    return [];
  }
}
