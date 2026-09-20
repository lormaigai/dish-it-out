// Curated external recipe references for dishes in the menu.
// These are references, not the source of the menu itself.

export const RECIPE_SOURCES = {
  'scrambled-eggs': {
    label: 'Good Food',
    url: 'https://www.bbcgoodfood.com/recipes/1720/perfect-scrambled-eggs',
  },
  'evoo-avo': {
    label: 'Good Food',
    url: 'https://www.bbcgoodfood.com/recipes/avocado-toast',
  },
  'overnight-oats': {
    label: 'Nutrition.gov',
    url: 'https://www.nutrition.gov/recipes/overnight-oatmeal',
  },
  'yamitsuki-cabbage-salad': {
    label: 'Just One Cookbook',
    url: 'https://www.justonecookbook.com/yamitsuki-cabbage/',
  },
  'smothered-chicken': {
    label: 'Easy Chicken Recipes',
    url: 'https://easychickenrecipes.com/smothered-chicken-recipe/',
  },
  'stir-fried-broccoli': {
    label: 'Food.com',
    url: 'https://www.food.com/recipe/stir-fried-broccoli-and-carrots-88063',
  },
  'tomato-egg': {
    label: 'The Woks of Life',
    url: 'https://thewoksoflife.com/stir-fried-tomato-and-egg/',
  },
  'bitter-gourd-egg': {
    label: "Omnivore's Cookbook",
    url: 'https://omnivorescookbook.com/bitter-melon-with-eggs/',
  },
  'abc-soup': {
    label: 'FairPrice',
    url: 'https://www.fairprice.com.sg/recipes/abc-soup/',
  },
  'shepherds-pie': {
    label: 'Food Network',
    url: 'https://www.foodnetwork.com/recipes/food-network-kitchen/shepherds-pie-recipe-1928234',
  },
  'lemon-baked-cod': {
    label: 'The Washington Post',
    url: 'https://www.washingtonpost.com/food/2022/05/31/lemon-garlic-baked-cod-recipe/',
  },
  'pan-seared-chicken': {
    label: 'Food Network',
    url: 'https://www.foodnetwork.com/recipes/pan-seared-chicken-breast-recipe-1941670',
  },
  'salt-baked-chicken': {
    label: 'Cuisine',
    url: 'https://www.cuisine.co.nz/recipe/hakka-salt-baked-chicken/',
  },
  'lormaigai': {
    label: 'Ask Nestlé',
    url: 'https://www.asknestle.in/recipes/chicken-lo-mai-gai',
  },
  'rosemary-lemon-chicken': {
    label: 'Food.com',
    url: 'https://www.food.com/recipe/rosemary-lemon-chicken-420379',
  },
}

export function getRecipeSource(id) {
  return RECIPE_SOURCES[id] || null
}
