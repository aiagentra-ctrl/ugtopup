

# Developer-Controlled Feature System with Payment Reminder

## Overview

Create a `feature_flags` table managed exclusively by developer-role users. Admins see a read-only "Service Status" panel showing which API-dependent features are active and payment reminders. A new `/developer` route provides full control.

## Database Changes

### 1. Add `developer` to `app_role` enum
```sql
ALTER TYPE public.app_role ADD VALUE 'developer';
```

### 2. Create `feature_flags` table
```sql
CREATE TABLE public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key text UNIQUE NOT NULL,
  feature_name text NOT NULL,
  description text,
  is_enabled boolean NOT NULL DEFAULT true,
  category text NOT NULL DEFAULT 'api_service',
  monthly_cost_note text,
  depends_on text, -- e.g. "Liana API", "Lovable AI Gateway"
  disabled_message text DEFAULT 'This feature is currently unavailable.',
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read flags (needed to check feature status)
CREATE POLICY "Anyone can view feature flags" ON public.feature_flags
  FOR SELECT TO authenticated USING (true);

-- Only developers can modify
CREATE POLICY "Developers can manage feature flags" ON public.feature_flags
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'developer'))
  WITH CHECK (public.has_role(auth.uid(), 'developer'));
```

### 3. Create `is_developer()` helper function
```sql
CREATE OR REPLACE FUNCTION public.is_developer()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'developer');
$$;
```

### 4. Seed initial feature flags
Insert rows for: `ai_chatbot`, `liana_api`, `payment_gateway`, `push_notifications`, `promotion_system`.

## Frontend Changes

### New Files

| File | Purpose |
|------|---------|
| `src/pages/DeveloperPanel.tsx` | Developer-only page with feature toggle controls |
| `src/components/DeveloperRoute.tsx` | Route guard checking `developer` role |
| `src/components/admin/ServiceStatus.tsx` | Read-only admin widget showing feature statuses and payment reminder |
| `src/hooks/useFeatureFlags.ts` | Hook to fetch flags with real-time subscription and caching |

### Modified Files

| File | Change |
|------|--------|
| `src/App.tsx` | Add `/developer` route wrapped in `DeveloperRoute` |
| `src/components/admin/AdminLayout.tsx` | Add "Service Status" menu item |
| `src/pages/AdminPanel.tsx` | Add `case "service-status"` rendering `<ServiceStatus />` |
| `src/components/admin/EnhancedDashboard.tsx` | Add payment reminder banner at top if any features are disabled |

### Developer Panel Features
- Table of all feature flags with toggle switches
- Each row shows: feature name, description, dependency, monthly cost note, enabled/disabled status
- Toggle calls `supabase.from('feature_flags').update({ is_enabled })` 
- Only accessible to users with `developer` role

### Service Status (Admin View)
- Read-only card grid showing each feature's status (green/red indicator)
- Payment reminder alert banner: "Some features require ongoing API maintenance. Contact the developer if services are inactive."
- Links to relevant admin sections for each feature

### useFeatureFlags Hook
- Fetches all feature flags on mount
- Subscribes to real-time changes
- Exports `isFeatureEnabled(key)` helper
- Components that depend on API features (e.g., ChatWidget, ML order processing) can check `isFeatureEnabled('ai_chatbot')` before making API calls

## Security
- `developer` role is separate from `admin`/`super_admin` — only assignable via direct DB insert
- Feature flags table has RLS: read for all authenticated, write only for developers
- No client-side bypass possible — features check the flag from Supabase on each load

