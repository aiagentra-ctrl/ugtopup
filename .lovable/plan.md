## Diagnosis

I inspected the codebase and DB. Here is what I found:

### 1. Admin Mobile App is mixed with the User app
- `public/manifest.json` has `start_url: "/"` and a single name "UGTOPUPS". When an admin installs the PWA from `/admin`, it still launches the user homepage.
- There is no separate manifest, no separate launch icon/route logic, and no auto-redirect for admins on app launch.

### 2. Coupon code feature not working on most products
- A working `CouponInput` component, `validate_coupon` RPC, and `place_order(p_coupon_code)` RPC all exist.
- But the `CouponInput` is **only wired into Free Fire's `OrderReview`**. Searched all other product flows (ML, PUBG, TikTok, Netflix, Garena, Roblox, SmileCoin, Unipin, YouTube, ChatGPT, Design) — none import `CouponInput` or pass `coupon_code` to `placeOrder`. So coupons are silently ignored on every other product.

### 3. Referral / Refer-and-Earn not working
DB confirms: 1,243 profiles exist, **0 rows in `referrals`** and **0 profiles with `referred_by` set**, despite the signup flow accepting `?ref=CODE`.

Root cause is in `src/contexts/AuthContext.tsx` `signup()`:
- After `supabase.auth.signUp`, it tries `supabase.from('profiles').update({ referred_by })` and `supabase.from('referrals').insert(...)` from the **anon/unauthenticated client**.
- `profiles` RLS only allows users to update their own row (and email confirmation may not be complete yet, so `auth.uid()` is null).
- `referrals` RLS only allows admins to insert. Both writes fail silently — the catch block just `console.error`s.

The reward trigger (`trg_check_referral_rewards`) and coupon generation logic are correct, but they never fire because no referral rows are ever created.

---

## Plan

### A. Separate Admin Mobile App

1. Add a second PWA manifest `public/manifest-admin.json` with:
   - `name: "UGTOPUPS Admin"`, `short_name: "UG Admin"`
   - `start_url: "/admin"`, `scope: "/admin"`
   - Distinct theme color and a separate admin icon (reuse existing icons for now, can swap later).
2. In `index.html`, keep the default user manifest. In `src/pages/AdminPanel.tsx` (and `AdminLogin.tsx`), inject `<link rel="manifest" href="/manifest-admin.json">` dynamically via `useEffect` so when an admin installs from the admin panel, the OS captures the admin manifest with `start_url=/admin`.
3. Update `src/main.tsx` (or a small bootstrap effect in `App.tsx`) so that when the app launches in `display-mode: standalone` AND the installed start path is `/admin`, the user is routed straight to the admin login/panel.
4. Add a check in `AdminLogin.tsx`/`AdminPanel.tsx`: if launched standalone from `/admin`, hide the user header/footer chrome to make it visually a separate app.
5. Update `AdminAppDownload.tsx` to clearly explain: "Open `/admin` in Chrome → Install" so installation captures the admin scope.

### B. Fix Coupons on All Products

For each of the 11 product OrderReview components, add the same wiring already used in `freefire/OrderReview.tsx`:

1. Import and render `<CouponInput orderAmount={...} productCategory="<category>" onCouponApplied={...} onCouponRemoved={...} appliedCoupon={appliedCoupon} />` above the price summary.
2. Track `appliedCoupon` state, show a discount line + new total in the summary.
3. Pass `coupon_code: appliedCoupon?.code` in the `placeOrder()` call.

Files to update:
- `src/components/ml/MLOrderReview.tsx`
- `src/components/pubg/PubgOrderReview.tsx`
- `src/components/tiktok/TikTokOrderReview.tsx`
- `src/components/netflix/NetflixOrderReview.tsx`
- `src/components/garena/GarenaOrderReview.tsx`
- `src/components/roblox/RobloxOrderReview.tsx`
- `src/components/smilecoin/SmileCoinOrderReview.tsx`
- `src/components/unipin/UnipinOrderReview.tsx`
- `src/components/youtube/YouTubeOrderReview.tsx`
- `src/components/chatgpt/ChatGPTOrderReview.tsx`
- `src/components/design/DesignOrderReview.tsx`

### C. Fix Referral Tracking

1. **DB migration** — create a `SECURITY DEFINER` RPC `apply_referral(p_referral_code text)` that:
   - Reads `auth.uid()` (must be authenticated)
   - Looks up referrer by `referral_code`
   - Sets `profiles.referred_by` for the current user (only if not already set)
   - Inserts into `referrals(referrer_id, referee_id)` (idempotent on `(referrer_id, referee_id)`)
   - Returns `{success, message}`
2. Add a unique constraint `referrals_referrer_referee_unique (referrer_id, referee_id)` to make it idempotent.
3. **Frontend changes**:
   - In `AuthContext.signup()`: instead of writing `profiles`/`referrals` directly, store the `ref` code in `localStorage` (key `pending_referral_code`) — because email confirmation may delay `auth.uid()` availability.
   - In `AuthContext` after auth state becomes `SIGNED_IN`, if `pending_referral_code` exists in localStorage, call `supabase.rpc('apply_referral', { p_referral_code })` and clear the key on success.
   - Pass `referral_code` in `signUp` `options.data` as well so it's preserved through email confirmation.
4. Verify `Rewards`/`Referrals` pages display the user's coupons (they already query `coupons` table; should start populating once trigger fires).

### Verification after implementation

- Install PWA from `/admin` → confirm it launches into admin login, separate icon name.
- Place an order on ML/PUBG/TikTok with a valid coupon → discount applied, `coupons.is_used` flips, `promotion_analytics` row inserted.
- Sign up with `?ref=CODE` → `referrals` row created; after referee's first completed order, both referrer and referee receive coupons (visible in `/rewards`).

Once approved I'll implement A → B → C in that order, then run lint/build.