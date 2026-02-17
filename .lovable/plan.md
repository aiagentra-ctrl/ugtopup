## Mobile Legends Full API Integration Update

### Problem Summary

The edge function `process-ml-order` only maps 4 packages to Liana variation IDs (878 Diamonds, Weekly, Super Value Pass, Twilight). All other diamond packages (86, 172, 257, 343, etc.) fail with "Unknown package" errors. The complete Liana API product catalog has now been provided.

### What Will Change

#### 1. Update Edge Function Product Mapping

Update `supabase/functions/process-ml-order/index.ts` with the complete mapping of all ML Indian diamond packages and special passes to their correct Liana `wc_variation_id`:


| Frontend Package Name        | Liana Variation ID |
| ---------------------------- | ------------------ |
| 86 Diamonds                  | 5743               |
| 172 Diamonds                 | 5857               |
| 257 Diamonds                 | 5859               |
| 343 Diamonds                 | 5860               |
| 429 Diamonds                 | 5861               |
| 514 Diamonds                 | 5862               |
| 706 Diamonds                 | 5864               |
| 878 Diamonds                 | 6936               |
| 1050 Diamonds (maps to 1049) | 5865               |
| 1135 Diamonds                | 6978               |
| 1412 Diamonds                | 5866               |
| 2195 Diamonds                | 5867               |
| 3688 Diamonds                | 5868               |
| 5532 Diamonds                | 5869               |
| 9288 Diamonds                | 5870               |
| Weekly                       | 5570               |
| Twilight                     | 6111               |
| Super Value Pass             | 7236               |


Note: Some frontend packages (55, 110, 165, 275, 565) do not have a direct Liana Indian variation ID. These will be handled by either:

- Mapping to the closest available product, OR
- Disabling them in the database so users cannot order unavailable items

#### 2. Update Database Product List

Update `game_product_prices` to match the actual Liana API catalog:

- **Remove** packages not available via Liana API (55, 110, 165, 275, 565 Diamonds)
- **Add** missing packages that ARE available (343, 600, 1135 Diamonds)
- **Update quantities** to match Liana's exact diamond counts (e.g., 1050 to 1049, 2215 to 2195)

#### 3. Add Fuzzy Package Name Matching

Add fallback logic in the edge function to handle minor name variations (e.g., "1050 Diamonds" matching variation ID for 1049 Diamonds) to prevent failures from small quantity mismatches.

#### 4. Redeploy Edge Function

Deploy the updated `process-ml-order` function with the complete mapping.

### Technical Details

**Files to modify:**

- `supabase/functions/process-ml-order/index.ts` -- Complete productIdMap with all ML Indian variation IDs
- SQL migration -- Update `game_product_prices` rows for `mobile_legends` to match available Liana products

**Database changes (via migration):**

- Delete rows for packages not in Liana catalog (55, 110, 165, 275, 565 Diamonds)
- Insert missing packages (343, 600, 1135 Diamonds)
- Update existing quantities/names to match Liana exactly
- Reorder display_order for clean sequencing

**Edge function changes:**

- Expand `productIdMap` from 5 entries to ~20+ entries
- Add name normalization (trim, handle "X Diamonds" pattern) for robust matching
- Map quantity-based lookups as fallback (e.g., quantity 1050 maps to variation 5865)

> Do not remove these packages: **Packages not available via Liana API (55, 110, 165, 275, 565 Diamonds).**
>
> These packages should still be available and processed through the **normal order management system**, not through the API.
>
> Also, in the **Admin Panel (when changing prices)**, create two separate sections:
>
> 1. **API Packages** – Products connected and processed via Liana API
> 2. **Non-API Packages** – Products not available via API (processed manually / normal order system)
>
> Make sure:
>
> - API packages are validated and processed automatically
> - Non-API packages go directly to normal order management
> - Admin can change prices separately for both sections
> - No package is removed or mixed between API and Non-API sections
>
> Ensure proper backend logic and clear separation between API and Non-API products.