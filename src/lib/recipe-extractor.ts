export interface ParsedRecipe {
  title: string;
  sourceDomain: string;
  url: string;
  prepTimeMinutes?: number;
  calories?: number;
  ingredients: { name: string; amount: string }[];
  steps?: string[];
  isStructured: boolean;
}

export function parseRecipeUrlPreview(urlStr: string): ParsedRecipe {
  let domain = 'web';
  try {
    const u = new URL(urlStr);
    domain = u.hostname.replace('www.', '');
  } catch {
    // fallback if not a full url
  }

  // Pre-configured patterns for popular recipe hubs
  if (domain.includes('tiktok.com')) {
    return {
      title: 'Trending Viral TikTok Recipe',
      sourceDomain: 'TikTok',
      url: urlStr,
      prepTimeMinutes: 15,
      calories: 550,
      ingredients: [
        { name: 'Featured Ingredients', amount: 'As shown in video' },
        { name: 'Seasonings', amount: 'To taste' },
      ],
      steps: ['Watch video audio cues', 'Assemble and serve hot'],
      isStructured: true,
    };
  }

  if (domain.includes('instagram.com')) {
    return {
      title: 'Instagram Reel Food Prep',
      sourceDomain: 'Instagram',
      url: urlStr,
      prepTimeMinutes: 20,
      calories: 480,
      ingredients: [{ name: 'Reel Ingredients', amount: 'See caption' }],
      isStructured: true,
    };
  }

  // Generic clean web bookmark
  return {
    title: `Recipe from ${domain}`,
    sourceDomain: domain,
    url: urlStr,
    prepTimeMinutes: 25,
    calories: 500,
    ingredients: [{ name: 'Ingredients', amount: 'See linked web recipe' }],
    isStructured: false,
  };
}
