
# Dynamic Website with Advanced Admin Panel

## Overview
Make the entire website content dynamic and admin-controlled by creating two new admin sections and supporting database tables. The existing "Products (New)" page (GameProductPrices) will remain completely untouched.

## What Changes

### Phase 1: Database Setup

**New table: `dynamic_products`** - stores products displayed on the homepage
- `id`, `title`, `description`, `image_url`, `link`, `category` (topup/voucher/subscription/design), `price`, `discount_price`, `features` (jsonb array), `tags` (text array), `plans` (jsonb array), `display_order`, `is_active`, `created_at`, `updated_at`

**New table: `product_categories`** - dynamic categories
- `id`, `name`, `slug`, `display_order`, `is_active`, `created_at`, `updated_at`

**New table: `offers`** - dynamic offer/deal sections
- `id`, `title`, `subtitle`, `description`, `image_url`, `offer_type` (flash_sale/limited_time/daily_deal/discount_bundle), `timer_enabled`, `timer_type` (hours/days/both/none), `timer_end_date`, `product_link`, `custom_icon_url`, `display_order`, `is_active`, `show_on_homepage`, `show_on_product_page`, `created_at`, `updated_at`

RLS: Public SELECT for active items, admin ALL for management.

**Seed `dynamic_products`** with current hardcoded data from ProductTabs so nothing changes visually on day one.

### Phase 2: Admin Panel - Product Update Page (new section)

Add a new sidebar menu item **"Product Update"** in AdminLayout.

New component: `src/components/admin/DynamicProductManager.tsx`
- Full CRUD table listing all dynamic products
- Inline editing with image upload (to `product-images` storage bucket)
- Fields: title, description, image, link, category, price, discount price, features (add/remove chips), tags (add/remove), plans (JSON editor)
- Product preview panel showing how it looks on the frontend
- Search, filter by category, drag-to-reorder

New component: `src/components/admin/CategoryManager.tsx`
- Add/rename/delete categories
- Reorder categories via drag or arrows
- Auto-updates category options across the product form

### Phase 3: Admin Panel - Offer Management Page (new section)

Add a new sidebar menu item **"Offers"** in AdminLayout.

New component: `src/components/admin/OfferManager.tsx`
- List all offers with enable/disable toggle
- Add new offer with form: title, subtitle, description, image upload, offer type selector, timer controls (enable/disable, type, end date), product link picker
- Edit existing offers inline
- Reorder offers
- Toggle homepage/product page visibility

### Phase 4: Frontend - Make ProductTabs Dynamic

Update `src/components/ProductTabs.tsx`:
- Fetch products from `dynamic_products` table instead of hardcoded `productData`
- Fetch categories from `product_categories` table for tab names
- Keep the exact same visual layout, just swap data source
- Real-time subscription so admin changes appear instantly

### Phase 5: Frontend - Make BestDeals/Offers Dynamic

Update `src/components/BestDeals.tsx`:
- Fetch active homepage offers from `offers` table
- Render offer blocks dynamically with optional countdown timers
- Keep existing visual style, just make content admin-controlled

### What Will NOT Change
- **"Products (New)" page** (`GameProductPrices` component) -- zero modifications
- **Existing `ProductsList`** component -- untouched
- **Game pricing system** (`game_product_prices` table) -- untouched
- **Overall website design/layout** -- only data sources change

## Technical Details

### New Files
- `src/components/admin/DynamicProductManager.tsx` - Product Update admin page
- `src/components/admin/CategoryManager.tsx` - Category management
- `src/components/admin/OfferManager.tsx` - Offer management admin page
- `src/lib/dynamicProductApi.ts` - API functions for dynamic products/categories
- `src/lib/offerApi.ts` - API functions for offers
- `src/hooks/useDynamicProducts.ts` - Frontend hook with real-time subscriptions
- `src/hooks/useOffers.ts` - Frontend hook for offers

### Modified Files
- `src/components/admin/AdminLayout.tsx` - Add 3 new sidebar items (Product Update, Categories, Offers)
- `src/pages/AdminPanel.tsx` - Add new section cases in switch
- `src/components/ProductTabs.tsx` - Replace hardcoded data with database fetch
- `src/components/BestDeals.tsx` - Replace hardcoded deals with database fetch

### New Storage Bucket
- `product-images` (public) for product image uploads

### Database Migration
- Create `dynamic_products`, `product_categories`, `offers` tables
- Create `product-images` storage bucket
- RLS policies for all new tables
- Seed initial data from current hardcoded products
