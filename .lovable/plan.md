

# Fix Homepage Product Images — Analysis & Plan

## Root Cause

This is **not a code bug**. The rendering logic in `ProductTabs.tsx` correctly maps each product's `image_url` to its card. The issue is that **multiple products in the database share the same image URL**.

Here are the duplicates found in `dynamic_products`:

| Product | image_url |
|---------|-----------|
| Logo Design | `https://i.ibb.co/MxC1sGxQ/SAVE-20251108-163259.jpg` |
| Post Design | `https://i.ibb.co/MxC1sGxQ/SAVE-20251108-163259.jpg` |
| Banner Design | `https://i.ibb.co/MxC1sGxQ/SAVE-20251108-163259.jpg` |
| Thumbnail Design | `https://i.ibb.co/MxC1sGxQ/SAVE-20251108-163259.jpg` |

All four design products point to the **exact same ibb.co image**. The admin needs to upload distinct images for each.

## Plan

### 1. Add visual indicator for duplicate images in admin panel
In the `DynamicProductManager.tsx` admin component, add a warning badge next to products that share the same `image_url` as another product. This helps the admin spot and fix duplicates.

### 2. Add placeholder differentiation
Update `ProductCard.tsx` so that when an image fails to load or is missing, it shows the product's **first letter or title** as a colored placeholder instead of a generic icon — making duplicates more obvious and cards more distinguishable.

### 3. Admin action required
The actual fix is updating the image URLs for Logo Design, Post Design, Banner Design, and Thumbnail Design via the Admin Panel > Product Update section with unique images for each product.

## Files to modify
- `src/components/ProductCard.tsx` — improved fallback with product initial
- `src/components/admin/DynamicProductManager.tsx` — duplicate image warning

