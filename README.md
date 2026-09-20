# Dish It Out

**Open the fridge. Stock what you have. Get a menu matched to your kitchen.**

[Live demo](https://lormaigai.github.io/dish-it-out/)

Dish It Out is a fridge-first recipe matcher built around one idea: choosing ingredients should feel like using a kitchen, not filling in a form.

Instead of checking boxes and getting a generic list, you open a fridge, tap ingredients, watch them travel onto the correct shelf, close the fridge, and get a menu ranked against what you actually stocked.

## Why I built it

I kept running into the same small problem: I had food at home, but no idea what I could make from it.

Most ingredient-to-recipe tools solve that with a long checklist. I wanted to make the interaction itself part of the answer, so the interface behaves more like a tiny kitchen than a database search.

The project is intentionally frontend-only. There is no backend and no AI API in the matching loop. The interesting part is the state model, ranking logic, and motion design that make a simple idea feel physical and immediate.

## The interaction

1. Open the fridge.
2. Stock ingredients from the picker.
3. Each ingredient animates into its real storage zone.
4. Close the fridge and generate the menu.
5. Dish It Out ranks dishes by how much of the recipe you already have.
6. The strongest fridge match gets a dedicated reveal, with ingredient coverage and a recipe reference when available.

Your stocked ingredients persist in `localStorage`, so refreshing the page does not wipe your kitchen.

## What I focused on

- **Spatial state**  
  Ingredients are not just selected. They live in the freezer, shelves, crisper, door rack, or pantry.

- **State-driven animation**  
  The motion reflects real app state. Selected ingredients physically travel into storage and reappear in the transition and result reveal.

- **Transparent matching**  
  Result cards show what you have, what you are missing, and a visible ingredient-match percentage.

- **A clear payoff**  
  The results screen promotes the strongest match instead of treating every result as an identical card.

- **Useful exits**  
  Selected dishes can link to curated external recipe references. These links are explicitly references, not claimed as the source of the menu.

- **Local-first behaviour**  
  No account, database, or server is required for the core experience.

## How the matcher works

Each dish declares required ingredients and, where relevant, an “any of these” group.

For every dish, the app computes:

- required ingredients already stocked
- missing required ingredients
- whether an “any of” requirement is satisfied
- whether the dish is fully matched
- an ingredient coverage percentage

The best-match module then prioritises fully matched dishes first, followed by the fewest missing ingredients, then by how many stocked ingredients the dish actually uses.

The ranking is deliberately understandable rather than hidden behind a black box.

## Tech

- React 18
- Vite
- CSS animations and the Web Animations API
- `localStorage`
- GitHub Pages
- GitHub Actions

No component library and no animation library.

## Run locally

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## Project structure

```text
src/
├── App.jsx            # interaction, ranking, transitions, result UI
├── ingredients.js     # ingredient inventory + fridge zones
├── menu.js            # dishes + matching model
├── recipeSources.js   # curated external recipe references
├── index.css          # layout, fridge UI, motion, responsive design
└── main.jsx
```

## Recipe references

External recipes are curated in `src/recipeSources.js`. They are shown in the interface as **recipe references** so the project does not imply that those sites are the original source of the menu itself.

## Deployment

Pushes to `main` deploy to GitHub Pages through `.github/workflows/deploy.yml`.

Pull requests and pushes are also build-checked in CI before changes are merged.
