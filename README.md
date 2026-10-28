# Michito Chichen

A cozy 6x6 matching game. Flip two tiles at a time and find all 18 pairs in 26 moves or fewer.

- Matched pairs fly into **mi mochila** (bottom-left).
- Wrong guesses shake and flip back over.
- The cat in the bottom-right sleeps until you get matches in a row: 2 in a row earns one taco, 3 in a row earns two, and so on.
- Win, and a band of mariachi cats plays you a song. Use your 27th move without finishing, and the tiles break away.

## Adding the photos

The tiles currently show placeholders: **1–9** for the cat photos and **A–I** for the photos of us.

1. Put the cat photos in `images/cats/` and the photos of us in `images/us/` (square-ish photos look best).
2. Open `game.js` and fill in `image` for each pair at the top, for example:

   ```js
   { id: 'cat1', kind: 'cat', label: '1', image: 'images/cats/cat1.jpg' },
   ```

Any pair left with `image: ''` keeps its placeholder.

## Running it

It's a plain static site (no build step), published with GitHub Pages from the `main` branch.
