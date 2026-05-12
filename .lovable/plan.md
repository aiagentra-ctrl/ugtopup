## Goal
Bring the futuristic gaming look from `/tournaments` (sheen sweep, gradient borders, glow, glass) to the rest of the site — homepage, product cards/banners, header, Why Choose Us, Customer Reviews, Products page, and footer — without changing any business logic.

## Scope
Frontend & presentation only. No API, DB, or routing changes. Reuse existing utilities (`.sheen`, `.card-premium`, `.glass-card`, `.glow-border`, `animate-shimmer`, `animate-float`, `animate-bg-pan`, `animate-glow-pulse`) already defined in `src/index.css` and `tailwind.config.ts`.

## Changes by file

### 1. `src/index.css` — add reusable next-gen utilities
- `.sheen-strong` — brighter sweep variant for product cards (white/15% gradient, 1.1s sweep).
- `.glow-ring` — animated conic/gradient border ring on hover (uses `--primary`/`--secondary`).
- `.glass-premium-hover` — glassmorphism + lift + inner border glow on hover.
- `.animated-gradient-text` — uses `bg-pan` keyframe across primary→secondary→primary.
- `.bg-grid` — subtle radial-grid background pattern for sections (CSS only, low cost).
- New keyframes: `star-twinkle`, `card-glow-pulse`.

### 2. `src/components/ProductCard.tsx`
- Wrap outer card in `card-premium sheen-strong` (gradient border + sweep).
- Add `group-hover:shadow-[0_0_28px_-4px_hsl(var(--primary)/0.5)]` glow.
- Image: keep aspect, add `group-hover:brightness-110` and slow zoom (`duration-700`).
- Title: `group-hover:text-primary transition-colors`.

### 3. `src/components/HeroBanner.tsx`
- Add `sheen-strong` to outer slide container so banner inherits the same sweep on hover/touch.
- Strengthen ring with `ring-1 ring-white/5 hover:ring-primary/40 transition`.
- Active dot: switch to `animate-glow-pulse`.

### 4. `src/components/Header.tsx`
- Replace flat `bg-black` with translucent `bg-black/70 backdrop-blur-xl` + bottom gradient hairline (`after:` pseudo with primary→secondary).
- Logo: subtle `hover:drop-shadow-[0_0_12px_hsl(var(--primary)/0.6)]`.
- Credit pill: glassmorphism (`bg-white/5 backdrop-blur` + animated gradient border via `card-premium` mini variant).
- Add Plus button: keep `neon-button`, add `animate-glow-pulse` on idle.
- User pill / mobile avatar: glass + ring on hover.
- Mobile menu panel: glass surface + slide-in animation (`animate-fade-in`).

### 5. `src/components/WhyChooseUs.tsx`
- Section background: add `bg-grid` overlay + two floating `.orb` (primary, secondary).
- Heading: wrap "UG TOP-UP" with `animated-gradient-text`.
- Cards: replace plain card with `card-premium sheen glass-premium-hover`, icon container gets `animate-glow-pulse` ring on hover, value bumps with `group-hover:scale-110`.
- Add staggered entry via `animate-fade-in` + inline `style={{animationDelay}}`.

### 6. `src/components/Testimonials.tsx` — full premium redesign
- Section background: dark with `bg-grid` and two soft orbs.
- Title: `animated-gradient-text`, add small "PLAYERS LOVE US" eyebrow chip.
- Cards: 3-up on desktop (md+), 1-up auto-rotating on mobile. Use `card-premium sheen` with glass body, large quote glyph, animated 5-star row using `star-twinkle` keyframe (staggered delays).
- Auto-rotation kept (4s) on mobile; on desktop, show 3 simultaneously with subtle hover lift + glow.
- Avatar: gradient ring + initial.
- Dot indicators: glow-pulse on active.

### 7. `src/components/Footer.tsx`
- Background: layer `bg-grid` + top gradient hairline + faint orb on the left.
- Brand title: `animated-gradient-text`.
- Section headings: keep color, add small underline accent (`after:` gradient bar).
- Social/Support items: glass chip pills with `sheen` and color-tinted hover (TikTok pink, Facebook blue, WhatsApp green, Email primary).
- Quick-links chips: upgrade to `card-premium`-style gradient border + `sheen` hover.
- Bottom copyright: subtle separator gradient.

### 8. `src/pages/Products.tsx`
- Page header: `animated-gradient-text` for "All Products", subtle `bg-grid` strip.
- Search bar: glassmorphism (`bg-white/5 backdrop-blur` + focus ring glow).
- Category tabs: gradient-border pills with `sheen` and active glow.
- Empty state: glass card with icon glow.
- Grid items already use updated `ProductCard` so they inherit the new effect.

## Performance / accessibility
- Sheen and orbs are CSS-only (no JS), respect `prefers-reduced-motion` via existing global behavior — add a `@media (prefers-reduced-motion: reduce)` rule disabling sheen/glow-pulse/float.
- All colors stay in HSL semantic tokens; no hardcoded color classes outside what's already there.
- Mobile: keep existing tap targets; sheen on touch fires via `:active` (add `.sheen-strong:active::after` rule).

## Out of scope
- No business logic, data fetching, routing, or copy changes beyond what's stated.
- Chatbot, dashboard, admin panels untouched.
- No new dependencies.
