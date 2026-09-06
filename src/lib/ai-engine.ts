import { MealItem, FridgePantryItem, AISuggestion } from '@/types/meal';
import { CURATED_FOODS } from './curated-foods';

export interface FlavorTwistRule {
  triggerPattern: string;
  twistTitle: string;
  headline: string;
  reason: string;
  emoji: string;
  accentColor: string;
  caloriesDelta: number;
  proteinDelta: number;
  ingredientsToAdd: { name: string; amount: string }[];
}

const FLAVOR_TWISTS: FlavorTwistRule[] = [
  {
    triggerPattern: 'salmon',
    twistTitle: 'Gochujang Honey Glazed Salmon Bowl',
    headline: 'Same Omega-3 King, But Spicier 🌶️',
    reason: 'You loved the Miso Salmon. This twist swaps miso for caramelized Korean Gochujang and toasted sesame.',
    emoji: '🔥',
    accentColor: '#FF5C5C',
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
    twistTitle: 'Sun-Dried Tomato & Burrata Rigatoni',
    headline: 'Pesto Vibe, Italian Summer Twist 🍅',
    reason: 'Take your favorite pasta base, blend sweet sun-dried tomatoes with fresh burrata for maximum creaminess.',
    emoji: '🧀',
    accentColor: '#FF3388',
    caloriesDelta: +60,
    proteinDelta: +4,
    ingredientsToAdd: [
      { name: 'Sun-Dried Tomatoes in Oil', amount: '50g' },
      { name: 'Fresh Mini Burrata', amount: '1 ball' },
      { name: 'Calabrian Chili Flakes', amount: 'pinch' },
    ],
  },
  {
    triggerPattern: 'oats',
    twistTitle: 'Caramelized Banana & Tahini Oats',
    headline: 'Dessert-for-Breakfast Upgrade 🍌',
    reason: 'High protein just like your berry oats, but warm caramelized banana slices with nutty tahini drizzle.',
    emoji: '🍯',
    accentColor: '#E8FA43',
    caloriesDelta: +40,
    proteinDelta: +1,
    ingredientsToAdd: [
      { name: 'Pan-Seared Ripe Banana', amount: '1 whole' },
      { name: 'Runny Tahini', amount: '1 tbsp' },
      { name: 'Cinnamon & Sea Salt', amount: 'generous dash' },
    ],
  },
  {
    triggerPattern: 'ramen',
    twistTitle: 'Truffle Butter Garlic Shoyu Ramen',
    headline: 'Umami Overload Tokyo Style 🍜',
    reason: 'Takes the comforting noodle broth base and infuses browned garlic and white truffle butter.',
    emoji: '🥢',
    accentColor: '#38BDF8',
    caloriesDelta: +50,
    proteinDelta: +0,
    ingredientsToAdd: [
      { name: 'Crispy Garlic Chips', amount: '1 tbsp' },
      { name: 'Truffle Infused Butter', amount: '10g' },
      { name: 'Shiitake Slices', amount: '50g' },
    ],
  },
  {
    triggerPattern: 'avocado',
    twistTitle: 'Chili Crunch Smashed Avo Toast with Hot Honey',
    headline: 'Sweet & Spicy Brunch Hype 🥑',
    reason: 'Your go-to avocado toast leveled up with crispy shallot chili crunch and Mike’s hot honey.',
    emoji: '🌶️',
    accentColor: '#D4FF00',
    caloriesDelta: +35,
    proteinDelta: +0,
    ingredientsToAdd: [
      { name: 'Crispy Chili Crunch Oil', amount: '1 tbsp' },
      { name: 'Habanero Hot Honey', amount: '1 tsp' },
      { name: 'Flaky Maldon Salt', amount: 'to taste' },
    ],
  },
  {
    triggerPattern: 'chicken',
    twistTitle: 'Chipotle Lime Charred Chicken Rice',
    headline: 'Bold Citrus & Smoke Twist 🍗',
    reason: 'Shares the macro-friendly chicken base, charred with chipotle adobo, lime zest, and sweet corn salsa.',
    emoji: '🍋',
    accentColor: '#22C55E',
    caloriesDelta: +15,
    proteinDelta: +3,
    ingredientsToAdd: [
      { name: 'Chipotle Peppers in Adobo', amount: '1 pepper minced' },
      { name: 'Fresh Lime Zest & Juice', amount: '1 lime' },
      { name: 'Charred Corn Kernels', amount: '40g' },
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
      title: `Eat: ${rottingItem.name} ASAP!`,
      type: 'fridge_rescue',
      headline: 'Rotting in fridge alert! 🚨',
      reason: `You cooked this ${rottingItem.daysInFridge} days ago. It has ${rottingItem.portionsLeft} portion(s) left waiting in your fridge. Eat it for lunch or dinner today before it’s gone!`,
      calories: 500,
      protein: 25,
      prepTime: '2 min microwave',
      emoji: '🥡',
      accentColor: '#FF5C5C',
      suggestedMeal: {
        title: `Leftover: ${rottingItem.name}`,
        calories: 500,
        protein: 25,
        carbs: 60,
        fat: 18,
        prepTimeMinutes: 3,
        isLeftover: true,
        tags: ['leftover', 'quick-heat', 'fridge-rescue'],
      },
    });
  }

  // 2. Flavor Twist Engine ("Same Vibe with a Twist")
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
        prepTime: `${meal.prepTimeMinutes || 20} mins`,
        emoji: twist.emoji,
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
          customEmoji: twist.emoji,
          accentColor: twist.accentColor,
        },
      });
      break; // Pick the best twist for clean UI
    }
  }

  // 3. Repeat Your Fave
  const unpickedCurated = CURATED_FOODS.filter(
    (c) => !currentMeals.some((m) => m.title.toLowerCase().includes(c.title.toLowerCase()))
  );
  if (unpickedCurated.length > 0) {
    const fave = unpickedCurated[0];
    suggestions.push({
      id: `sugg-fave-${fave.id}`,
      title: fave.title,
      type: 'repeat_favorite',
      headline: 'Crowd Favorite Hit 🌟',
      reason: `Matches your high-protein target with ${fave.protein}g protein in just ${fave.prepTimeMinutes} mins.`,
      calories: fave.calories,
      protein: fave.protein,
      prepTime: `${fave.prepTimeMinutes} mins`,
      emoji: fave.emoji,
      accentColor: fave.accentColor,
      suggestedMeal: {
        title: fave.title,
        mealType: fave.category,
        calories: fave.calories,
        protein: fave.protein,
        carbs: fave.carbs,
        fat: fave.fat,
        prepTimeMinutes: fave.prepTimeMinutes,
        imageUrl: fave.imageUrl,
        ingredients: fave.defaultIngredients,
        tags: fave.tags,
        customEmoji: fave.emoji,
        accentColor: fave.accentColor,
      },
    });
  }

  return suggestions;
}

// Free Open Food Facts search helper (Open Source, Zero Cost)
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
