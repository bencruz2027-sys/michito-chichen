# Michito Chichen

A cozy 6x6 matching game. Flip two tiles at a time and find all 18 pairs in 37 moves or fewer.

- Matched pairs fly into **mi mochila** (bottom-left).
- Wrong guesses shake and flip back over.
- The cat in the bottom-right sleeps until you make a match. Every match feeds it a taco (one extra taco for each match in a row), and every 3 matches it shouts a Spanish exclamation.
- Win, and a band of mariachi cats plays you a song. Use your 38th move without finishing, and the tiles break away.

## Changing the photos

The cat photos live in `images/cats/` and the photos of us in `images/us/`, as square crops. To swap one, replace the file, or point its `image` at a new file in the list at the top of `game.js`:

```js
{ id: 'cat1', kind: 'cat', label: '1', image: 'images/cats/cat1.png' },
```

Any pair with `image: ''` shows its placeholder instead (1–9 for cats, A–I for photos of us).

## Running it

It's a plain static site (no build step), published with GitHub Pages from the `main` branch.
