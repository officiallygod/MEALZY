export interface CuratedFood {
  id: string;
  title: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prepTimeMinutes: number;
  imageUrl: string;
  emoji: string;
  accentColor: string;
  tags: string[];
  defaultIngredients: { name: string; amount: string }[];
}

export const CURATED_FOODS: CuratedFood[] = [
  {
    id: 'food-1',
    title: 'Berry Protein Oats Bowl',
    category: 'breakfast',
    calories: 410,
    protein: 28,
    carbs: 52,
    fat: 9,
    prepTimeMinutes: 10,
    imageUrl: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=800&auto=format&fit=crop&q=80',
    emoji: '🫐',
    accentColor: '#C084FC',
    tags: ['high-protein', 'quick', 'sweet'],
    defaultIngredients: [
      { name: 'Rolled Oats', amount: '60g' },
      { name: 'Vanilla Whey', amount: '30g' },
      { name: 'Blueberries & Raspberries', amount: '80g' },
      { name: 'Almond Milk', amount: '200ml' },
      { name: 'Chia Seeds', amount: '1 tsp' },
    ],
  },
  {
    id: 'food-2',
    title: 'Miso Glazed Salmon & Rice',
    category: 'dinner',
    calories: 620,
    protein: 44,
    carbs: 58,
    fat: 22,
    prepTimeMinutes: 25,
    imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&auto=format&fit=crop&q=80',
    emoji: '🍣',
    accentColor: '#D4FF00',
    tags: ['omega-3', 'dinner-fave', 'chef-mode'],
    defaultIngredients: [
      { name: 'Fresh Salmon Fillet', amount: '200g' },
      { name: 'White Miso Paste', amount: '1.5 tbsp' },
      { name: 'Jasmine Rice', amount: '150g cooked' },
      { name: 'Baby Bok Choy', amount: '2 heads' },
      { name: 'Mirin & Soy Sauce', amount: '1 tbsp each' },
    ],
  },
  {
    id: 'food-3',
    title: 'Green Pistachio Pesto Rigatoni',
    category: 'lunch',
    calories: 545,
    protein: 20,
    carbs: 72,
    fat: 21,
    prepTimeMinutes: 18,
    imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281292?w=800&auto=format&fit=crop&q=80',
    emoji: '🍝',
    accentColor: '#22C55E',
    tags: ['vegetarian', 'comfort-food', 'meal-prep'],
    defaultIngredients: [
      { name: 'Rigatoni Pasta', amount: '120g' },
      { name: 'Fresh Basil Pesto', amount: '2.5 tbsp' },
      { name: 'Roasted Pistachios', amount: '20g' },
      { name: 'Parmigiano Reggiano', amount: '25g' },
      { name: 'Baby Spinach', amount: 'handful' },
    ],
  },
  {
    id: 'food-4',
    title: 'Warm Quinoa & Avocado Bowl',
    category: 'lunch',
    calories: 520,
    protein: 24,
    carbs: 67,
    fat: 18,
    prepTimeMinutes: 15,
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80',
    emoji: '🥑',
    accentColor: '#E8FA43',
    tags: ['vegan', 'superfood', 'gut-health'],
    defaultIngredients: [
      { name: 'Cooked Tricolor Quinoa', amount: '160g' },
      { name: 'Ripe Avocado', amount: '1/2 piece' },
      { name: 'Edamame Beans', amount: '70g' },
      { name: 'Cherry Tomatoes', amount: '6 pieces' },
      { name: 'Tahini Lemon Dressing', amount: '2 tbsp' },
    ],
  },
  {
    id: 'food-5',
    title: 'Spicy Mexican Crispy Potatoes',
    category: 'dinner',
    calories: 460,
    protein: 16,
    carbs: 62,
    fat: 18,
    prepTimeMinutes: 35,
    imageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?w=800&auto=format&fit=crop&q=80',
    emoji: '🥔',
    accentColor: '#FF5C5C',
    tags: ['spicy', 'crispy', 'crowd-pleaser'],
    defaultIngredients: [
      { name: 'Baby Yukon Potatoes', amount: '350g' },
      { name: 'Smoked Paprika & Cumin', amount: '1 tsp each' },
      { name: 'Black Beans', amount: '80g' },
      { name: 'Pickled Jalapeños', amount: '2 tbsp' },
      { name: 'Lime Crema', amount: '2 tbsp' },
    ],
  },
  {
    id: 'food-6',
    title: 'Tokyo Style Miso Ramen with Egg',
    category: 'dinner',
    calories: 680,
    protein: 36,
    carbs: 82,
    fat: 24,
    prepTimeMinutes: 30,
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=80',
    emoji: '🍜',
    accentColor: '#38BDF8',
    tags: ['comfort-food', 'asian-inspired', 'broth-magic'],
    defaultIngredients: [
      { name: 'Fresh Ramen Noodles', amount: '150g' },
      { name: 'Rich Miso Dashi Broth', amount: '450ml' },
      { name: 'Ajitsuke Tamago (Soft Egg)', amount: '1 piece' },
      { name: 'Chashu or Grilled Chicken', amount: '100g' },
      { name: 'Sweet Corn & Green Onions', amount: '30g' },
    ],
  },
  {
    id: 'food-7',
    title: 'Smashed Avocado & Poached Eggs',
    category: 'breakfast',
    calories: 430,
    protein: 22,
    carbs: 34,
    fat: 24,
    prepTimeMinutes: 12,
    imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&auto=format&fit=crop&q=80',
    emoji: '🍳',
    accentColor: '#22C55E',
    tags: ['classic-brunch', 'healthy-fats'],
    defaultIngredients: [
      { name: 'Artisan Sourdough Slice', amount: '2 slices' },
      { name: 'Hass Avocado', amount: '1 whole' },
      { name: 'Organic Pasture Eggs', amount: '2 eggs' },
      { name: 'Chili Flakes & Sea Salt', amount: 'pinch' },
    ],
  },
  {
    id: 'food-8',
    title: 'High Protein Chicken Shawarma Bowl',
    category: 'lunch',
    calories: 610,
    protein: 52,
    carbs: 54,
    fat: 19,
    prepTimeMinutes: 20,
    imageUrl: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=800&auto=format&fit=crop&q=80',
    emoji: '🥙',
    accentColor: '#FF3388',
    tags: ['macro-bomb', 'high-protein', 'meal-prep'],
    defaultIngredients: [
      { name: 'Spiced Chicken Breast', amount: '220g' },
      { name: 'Brown Rice or Bulgur', amount: '140g' },
      { name: 'Cucumber & Tomato Salad', amount: '100g' },
      { name: 'Garlic Greek Yogurt Sauce', amount: '3 tbsp' },
    ],
  },
  {
    id: 'food-9',
    title: 'Matcha Chia Seed Pudding',
    category: 'snack',
    calories: 270,
    protein: 11,
    carbs: 26,
    fat: 13,
    prepTimeMinutes: 5,
    imageUrl: 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=800&auto=format&fit=crop&q=80',
    emoji: '🍵',
    accentColor: '#8B5CF6',
    tags: ['antioxidants', 'snack', 'clean-energy'],
    defaultIngredients: [
      { name: 'Ceremonial Grade Matcha', amount: '1 tsp' },
      { name: 'Chia Seeds', amount: '3 tbsp' },
      { name: 'Oat Milk', amount: '180ml' },
      { name: 'Pure Maple Syrup', amount: '1 tsp' },
    ],
  },
  {
    id: 'food-10',
    title: 'Caramelized Onion & Truffle Smash Burger',
    category: 'dinner',
    calories: 740,
    protein: 48,
    carbs: 48,
    fat: 38,
    prepTimeMinutes: 20,
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80',
    emoji: '🍔',
    accentColor: '#FF5C5C',
    tags: ['cheat-meal', 'comfort-food', 'juicy'],
    defaultIngredients: [
      { name: 'Lean Beef Patty 85/15', amount: '2x 90g' },
      { name: 'Brioche Bun', amount: '1 bun' },
      { name: 'Slow Caramelized Onions', amount: '2 tbsp' },
      { name: 'Sharp Cheddar', amount: '2 slices' },
      { name: 'Truffle Aioli', amount: '1 tbsp' },
    ],
  },
];

// Aesthetic fallback colors and emojis for user dishes
export const FUNKY_PALETTES = [
  { bg: 'from-amber-400 to-orange-500', text: '#FF8800', border: '#FFAA33' },
  { bg: 'from-emerald-400 to-teal-600', text: '#22C55E', border: '#4ADE80' },
  { bg: 'from-fuchsia-500 to-pink-600', text: '#FF3388', border: '#F472B6' },
  { bg: 'from-sky-400 to-indigo-600', text: '#38BDF8', border: '#818CF8' },
  { bg: 'from-lime-400 to-emerald-500', text: '#D4FF00', border: '#A3E635' },
  { bg: 'from-purple-500 to-violet-700', text: '#C084FC', border: '#A855F7' },
];

export function getVisualForDish(title: string, category?: string): {
  imageUrl?: string;
  emoji: string;
  accentColor: string;
  hasCuratedPhoto: boolean;
} {
  const clean = title.toLowerCase().trim();
  const match = CURATED_FOODS.find((f) => clean.includes(f.title.toLowerCase()) || f.title.toLowerCase().includes(clean));

  if (match) {
    return {
      imageUrl: match.imageUrl,
      emoji: match.emoji,
      accentColor: match.accentColor,
      hasCuratedPhoto: true,
    };
  }

  // Smart emoji derivation
  let emoji = '🍽️';
  if (clean.includes('salad') || clean.includes('green')) emoji = '🥗';
  else if (clean.includes('pasta') || clean.includes('spaghetti') || clean.includes('noodle')) emoji = '🍝';
  else if (clean.includes('soup') || clean.includes('ramen') || clean.includes('broth')) emoji = '🍜';
  else if (clean.includes('oats') || clean.includes('cereal') || clean.includes('granola')) emoji = '🥣';
  else if (clean.includes('toast') || clean.includes('bread') || clean.includes('sandwich')) emoji = '🥪';
  else if (clean.includes('egg') || clean.includes('omelet')) emoji = '🍳';
  else if (clean.includes('salmon') || clean.includes('tuna') || clean.includes('fish') || clean.includes('sushi')) emoji = '🍣';
  else if (clean.includes('chicken') || clean.includes('turkey')) emoji = '🍗';
  else if (clean.includes('steak') || clean.includes('beef') || clean.includes('meat')) emoji = '🥩';
  else if (clean.includes('burger')) emoji = '🍔';
  else if (clean.includes('taco') || clean.includes('burrito') || clean.includes('mexican')) emoji = '🌮';
  else if (clean.includes('pizza')) emoji = '🍕';
  else if (clean.includes('cookie') || clean.includes('cake') || clean.includes('sweet')) emoji = '🍪';
  else if (clean.includes('smoothie') || clean.includes('juice') || clean.includes('shake')) emoji = '🧃';
  else if (clean.includes('rice') || clean.includes('curry')) emoji = '🍛';

  // Deterministic palette pick based on title length
  const palette = FUNKY_PALETTES[title.length % FUNKY_PALETTES.length];

  return {
    emoji,
    accentColor: palette.text,
    hasCuratedPhoto: false,
  };
}
