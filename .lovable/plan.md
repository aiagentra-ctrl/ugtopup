

# New Products Page + Product Recommendation Engine

## Overview

Create a `/products` page with full catalog, search, filtering, and sorting. Add a `Recommendations.tsx` component powered by `product_orders` data. Add inactive user re-engagement via notifications. Homepage remains untouched.

## New Files

### 1. `src/pages/Products.tsx`
- Full catalog page with Header/Footer
- Search bar (filters by product title)
- Category filter tabs (reuses `useDynamicProducts` data)
- Sort dropdown: Name A-Z, Price Low-High, Price High-Low, Newest
- Responsive grid layout (2 cols mobile, 3 tablet, 4-5 desktop)
- Uses existing `ProductCard` component for each product
- "Trending Now" section at top using `Recommendations` component

### 2. `src/components/Recommendations.tsx`
- Reusable component accepting props: `type` ("frequently_bought" | "trending" | "popular"), optional `currentProductCategory`
- Fetches from `product_orders` table to calculate:
  - **Trending**: Most ordered products in the last 7 days (group by `product_name`, count orders)
  - **Frequently Bought Together**: For a given product category, find other categories users also ordered (co-purchase analysis from same `user_id`)
  - **Popular**: All-time most ordered products
- Displays as horizontal scrollable card row with product images from `dynamic_products` or `game_product_prices`
- Falls back gracefully if no order data exists

### 3. `src/hooks/useRecommendations.ts`
- Hook that queries `product_orders` for recommendation data
- `useTrending()`: SELECT product_name, product_category, COUNT(*) FROM product_orders WHERE created_at > now() - interval '7 days' GROUP BY product_name, product_category ORDER BY count DESC LIMIT 8
- `useFrequentlyBoughtTogether(category)`: Find users who ordered in this category, then find their other top categories
- Caches with react-query (staleTime 30 min)

## Modified Files

### `src/App.tsx`
- Add `import Products from "./pages/Products"`
- Add route: `<Route path="/products" element={<Products />} />`

### `src/components/Header.tsx`
- Add "Products" link in navigation (both desktop and mobile menu)

## No Database Changes Required
- All recommendation queries use existing `product_orders` table (read-only)
- Product data comes from existing `dynamic_products` + `product_categories`

## User Re-engagement
- Add a section in `Recommendations.tsx` that can be rendered on the Dashboard page for returning users
- The inactive user notification system (automated campaigns) is already seeded as a feature flag (`automated_campaigns`) — the actual cron edge function would be a separate task

## Implementation Order
1. Create `useRecommendations.ts` hook
2. Create `Recommendations.tsx` component
3. Create `Products.tsx` page
4. Update `App.tsx` with route
5. Add navigation link in `Header.tsx`

