export interface CuratedFood {
  id: string;
  title: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prepTimeMinutes: number;
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
    accentColor: '#A855F7',
    tags: ['high-protein', 'quick', 'breakfast'],
    defaultIngredients: [
      { name: 'Rolled Oats', amount: '60g' },
      { name: 'Vanilla Whey', amount: '30g' },
      { name: 'Mixed Berries', amount: '80g' },
      { name: 'Almond Milk', amount: '200ml' },
      { name: 'Chia Seeds', amount: '1 tsp' },
    ],
  },
  {
    id: 'food-2',
    title: 'Miso Glazed Salmon and Rice',
    category: 'dinner',
    calories: 620,
    protein: 44,
    carbs: 58,
    fat: 22,
    prepTimeMinutes: 25,
    accentColor: '#84CC16',
    tags: ['omega-3', 'dinner', 'balanced'],
    defaultIngredients: [
      { name: 'Salmon Fillet', amount: '200g' },
      { name: 'White Miso Paste', amount: '1.5 tbsp' },
      { name: 'Jasmine Rice', amount: '150g' },
      { name: 'Bok Choy', amount: '2 heads' },
      { name: 'Mirin and Soy Sauce', amount: '1 tbsp' },
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
    accentColor: '#10B981',
    tags: ['vegetarian', 'pasta', 'lunch'],
    defaultIngredients: [
      { name: 'Rigatoni Pasta', amount: '120g' },
      { name: 'Fresh Basil Pesto', amount: '2.5 tbsp' },
      { name: 'Roasted Pistachios', amount: '20g' },
      { name: 'Parmigiano Reggiano', amount: '25g' },
      { name: 'Baby Spinach', amount: '40g' },
    ],
  },
  {
    id: 'food-4',
    title: 'Warm Quinoa and Avocado Bowl',
    category: 'lunch',
    calories: 520,
    protein: 24,
    carbs: 67,
    fat: 18,
    prepTimeMinutes: 15,
    accentColor: '#EAB308',
    tags: ['vegan', 'superfood', 'grain-bowl'],
    defaultIngredients: [
      { name: 'Tricolor Quinoa', amount: '160g' },
      { name: 'Fresh Avocado', amount: '0.5' },
      { name: 'Edamame Beans', amount: '70g' },
      { name: 'Cherry Tomatoes', amount: '6 pieces' },
      { name: 'Tahini Lemon Dressing', amount: '2 tbsp' },
    ],
  },
  {
    id: 'food-5',
    title: 'Crispy Paprika Spiced Potatoes',
    category: 'dinner',
    calories: 460,
    protein: 16,
    carbs: 62,
    fat: 18,
    prepTimeMinutes: 35,
    accentColor: '#F43F5E',
    tags: ['comfort', 'dinner', 'side'],
    defaultIngredients: [
      { name: 'Baby Yukon Potatoes', amount: '350g' },
      { name: 'Smoked Paprika', amount: '1 tsp' },
      { name: 'Black Beans', amount: '80g' },
      { name: 'Olive Oil', amount: '1.5 tbsp' },
    ],
  },
  {
    id: 'food-6',
    title: 'Tokyo Miso Ramen with Soft Egg',
    category: 'dinner',
    calories: 680,
    protein: 36,
    carbs: 82,
    fat: 24,
    prepTimeMinutes: 30,
    accentColor: '#06B6D4',
    tags: ['noodle', 'dinner', 'comfort'],
    defaultIngredients: [
      { name: 'Ramen Noodles', amount: '150g' },
      { name: 'Miso Broth', amount: '450ml' },
      { name: 'Marinated Soft Egg', amount: '1 piece' },
      { name: 'Chicken Breast', amount: '100g' },
      { name: 'Scallions', amount: '20g' },
    ],
  },
  {
    id: 'food-7',
    title: 'Smashed Avocado and Poached Eggs',
    category: 'breakfast',
    calories: 430,
    protein: 22,
    carbs: 34,
    fat: 24,
    prepTimeMinutes: 12,
    accentColor: '#10B981',
    tags: ['breakfast', 'high-protein', 'quick'],
    defaultIngredients: [
      { name: 'Sourdough Bread', amount: '2 slices' },
      { name: 'Avocado', amount: '1 piece' },
      { name: 'Eggs', amount: '2 pieces' },
      { name: 'Sea Salt & Pepper', amount: 'pinch' },
    ],
  },
  {
    id: 'food-8',
    title: 'Chicken Shawarma Rice Bowl',
    category: 'lunch',
    calories: 610,
    protein: 52,
    carbs: 54,
    fat: 19,
    prepTimeMinutes: 20,
    accentColor: '#EC4899',
    tags: ['high-protein', 'meal-prep', 'lunch'],
    defaultIngredients: [
      { name: 'Spiced Chicken Breast', amount: '220g' },
      { name: 'Basmati Rice', amount: '140g' },
      { name: 'Cucumber Tomato Salad', amount: '100g' },
      { name: 'Greek Yogurt Sauce', amount: '3 tbsp' },
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
    accentColor: '#8B5CF6',
    tags: ['snack', 'antioxidants', 'quick'],
    defaultIngredients: [
      { name: 'Matcha Powder', amount: '1 tsp' },
      { name: 'Chia Seeds', amount: '3 tbsp' },
      { name: 'Oat Milk', amount: '180ml' },
    ],
  },
  {
    id: 'food-10',
    title: 'Lean Beef and Caramelized Onion Burger',
    category: 'dinner',
    calories: 740,
    protein: 48,
    carbs: 48,
    fat: 38,
    prepTimeMinutes: 20,
    accentColor: '#F43F5E',
    tags: ['dinner', 'high-protein'],
    defaultIngredients: [
      { name: 'Lean Beef Patty', amount: '180g' },
      { name: 'Whole Wheat Bun', amount: '1 piece' },
      { name: 'Caramelized Onions', amount: '30g' },
      { name: 'Cheddar Cheese', amount: '25g' },
    ],
  },
];

export function getMealAccent(title: string): string {
  const clean = title.toLowerCase();
  if (clean.includes('oat') || clean.includes('egg') || clean.includes('toast')) return '#A855F7';
  if (clean.includes('salmon') || clean.includes('fish') || clean.includes('tuna')) return '#84CC16';
  if (clean.includes('pasta') || clean.includes('noodle') || clean.includes('ramen')) return '#06B6D4';
  if (clean.includes('chicken') || clean.includes('beef') || clean.includes('burger')) return '#F43F5E';
  if (clean.includes('salad') || clean.includes('quinoa') || clean.includes('avocado')) return '#10B981';
  return '#6366F1';
}

export function getMealInitials(title: string): string {
  const words = title.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return title.slice(0, 2).toUpperCase();
}
