# Juice KC — Shopify Theme

Custom Online Store 2.0 theme for Juice KC.

## Connecting to Shopify

1. Push this repo to GitHub (see below).
2. In Shopify admin: **Online Store → Themes → Add theme → Connect from GitHub**.
3. Authorize Shopify, pick this repository and the branch you want to track.
4. Shopify creates a theme that syncs with that branch.

Once connected, commits to the tracked branch appear in Shopify automatically,
and edits made in the Shopify theme editor are committed back to the branch.

## Branch strategy

- `main` — connected to the **live/published** theme
- `dev` — connected to an **unpublished** theme for testing

Work on `dev`, preview it in Shopify, then merge into `main` when it's ready.
Never edit the live theme directly in the editor if you can avoid it.

## A note on settings_data.json

`config/settings_data.json` holds the values set in the theme editor
(colors, copy, images). Shopify writes to this file when you edit in the admin.

If two people edit at once — one in the editor, one in code — this is the file
that will conflict. If that gets annoying, uncomment the last line of
`.gitignore` so the editor owns it and code never touches it.

## Local development

```bash
npm install -g @shopify/cli @shopify/theme
shopify theme dev --store your-store.myshopify.com
```

That serves the theme locally with hot reload against real store data.

```bash
shopify theme check      # lint for Liquid errors
shopify theme push       # push to a theme manually
shopify theme pull       # pull editor changes down
```

## Structure

```
layout/theme.liquid          wraps every page
templates/*.json             which sections appear on each page type
sections/                    the editable building blocks
snippets/fruit-shape.liquid  the fruit illustrations
assets/base.css              all styling
assets/juice.js              flavor switching, mascot, calculator, menu
config/settings_schema.json  theme editor settings
```

## Custom sections

| Section | What it does |
|---|---|
| `hero-flavor` | Photo hero with flavor switcher that recolors the site |
| `harvest` | Pink field of fruit cards |
| `split` | Photo + text, optional checklist, flippable |
| `energy` | Electrolytes and energy explainer with curve comparison |
| `batch-calculator` | 5–50 bottle slider with five price tiers |
| `sourcing` | Where the fruit comes from |
| `ticker` | Scrolling marquee |
| `flying-mascot` | The watermelon, plus the catch-3-times reward |

## The catch reward

The mascot reward surfaces a discount code — it does not create one.
Create the code in **Discounts** first, then paste it into the
Flying mascot section settings. Set a usage limit of one per customer.
