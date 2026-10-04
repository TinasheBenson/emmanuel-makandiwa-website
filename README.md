# emmanuel-makandiwa-website

The new emmanuelmakandiwa.com: a static [Astro](https://astro.build) site with cinematic, data-aware motion, deployed on Vercel.

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Astro 7 (static output, ~zero JS by default) |
| Page transitions | Astro `ClientRouter` + View Transitions API (`transition:name` for match-move) |
| Animation | GSAP 3 (ScrollTrigger, SplitText, Flip, MorphSVG, all free since 2025) |
| Smooth scroll | Lenis (desktop "full" tier only) |
| Video | HyperFrames compositions rendered to small MP4/WebM loops (`video/`) |
| Content | Markdown content collections in `src/content/` |
| Fonts | Archivo (Omnibus-Type) + Source Serif 4 (Adobe), self-hosted from the foundries' GitHub repos |
| Icons | Phosphor (MIT) |

## Getting started

```sh
npm install
npm run dev        # http://localhost:4321
npm run build      # static site in dist/
```

## Motion tiers

Visitors in Zimbabwe pay some of the highest mobile-data prices in the world, so motion adapts to the device. The inline script in `src/layouts/Base.astro` sets `<html data-motion>` before first paint:

| Tier | Who gets it | What happens |
| --- | --- | --- |
| `full` | Desktop, or touch devices on Wi-Fi | Background films autoplay, Lenis smooth scroll, every effect |
| `lite` | Mobile data, Save-Data, 2G/3G, low-memory devices | All GSAP motion, but no autoplay video (poster + CSS Ken Burns with a "Play film" button) |
| `reduced` | `prefers-reduced-motion` | Content simply appears; no movement |

Visitors can override the tier from the footer ("Full / Data saver / Still"). The animation engine lives in `src/scripts/motion.ts` and is driven by data attributes:

| Attribute | Effect |
| --- | --- |
| `data-split` / `data-split="hero"` | Headline words rise out of masked lines (on scroll / immediately) |
| `data-reveal="up" \| "fade" \| "clip"` | Fade-up, fade, or image wipe with zoom settle |
| `data-scrub-words` | Words brighten one by one as you scroll |
| `data-parallax="0.1"` | Scroll parallax |
| `data-hero-morph` | Full-bleed hero pulls back into a rounded card |
| `data-hscroll` | Pinned horizontal story track (desktop) |
| `svg[data-morph]` | MorphSVG shape sequence (see `Emblem.astro`) |
| `data-counter` | Count-up numbers |
| `data-marquee` | Velocity-reactive marquee |
| `data-magnetic` | Magnetic hover (fine pointers) |
| `transition:name` | Shared-element morph between pages (message cards → message page, portrait → About, book covers) |

## Content

- `src/content/messages/*.md`: sermons (optional `youtubeId` renders a click-to-load player)
- `src/content/books/*.md`: books and Life Lighter editions
- `src/content/events/*.md`: events
- `src/data/site.ts`: navigation, socials, contact details

Entries with `placeholder: true` are design samples and show a "Sample" tag. **Delete them before launch.** Copy marked `TODO` in the source is provisional and must be replaced with the wording from the current site.

## Brand

`src/styles/tokens.css` holds every colour, type and motion token. The colours are provisional until the ministry confirms its palette and logo. Swap them there and the whole site follows.

## Assets and credits

No machine-generated images, fonts or icons are used. Photographs, typefaces and icons come from openly licensed sources published in open-source repositories, listed with their licences in [CREDITS.md](CREDITS.md) (also rendered at `/credits/`). [AUDIT.md](AUDIT.md) records what was replaced and why. The photographs are atmosphere only; photos of Emmanuel and Ruth Makandiwa and of UFIC events must come from the ministry.

## Background films

`video/film-template.html` is a [HyperFrames](https://github.com/heygen-com/hyperframes) composition: slow push-ins and dissolves across the photographs, with nothing synthetic layered on top, built as a seamless loop. `video/render.mjs` stamps out one composition per film (image lists at the top of the file), renders it, and encodes 1280×720 WebM/MP4 loops (~850 KB / ~1.1 MB) into `public/video/`.

```sh
npm run video:render            # all films
npm run video:render -- hero    # one film
```

Requires FFmpeg and a Chrome headless shell (`npx hyperframes browser ensure`, or point `HYPERFRAMES_BROWSER_PATH` at an existing one). Films only download on the `full` motion tier or when a visitor taps "Play film".

## QA

```sh
npm run build && npx astro preview &
node scripts/screenshots.mjs screenshots   # full-page shots of every route, desktop + mobile
```
