

# Professional Developer Dashboard Redesign

## Overview

Redesign the Developer Panel (`DeveloperPanel.tsx`) from a flat feature-flag list into a professional, tabbed control panel. Add a new `developer_service_pricing` database table so the developer can define maintenance service prices, and display those in the admin panel's Service Status section as monthly billing items.

## Database Changes

### New table: `developer_service_pricing`
- `id` uuid PK
- `service_name` text NOT NULL
- `description` text
- `monthly_price` numeric NOT NULL DEFAULT 0
- `currency` text DEFAULT 'NPR'
- `is_active` boolean DEFAULT true
- `billing_start_date` date NOT NULL DEFAULT CURRENT_DATE
- `category` text DEFAULT 'maintenance' (maintenance, api, automation, advanced)
- `display_order` integer DEFAULT 0
- `created_at` / `updated_at` timestamps
- RLS: developer role can manage, admin can SELECT

## File Changes

### 1. `src/pages/DeveloperPanel.tsx` -- Full rewrite

Tabbed layout with 4 sections:

**Overview Tab**
- Summary cards: total services, active/disabled count, total monthly revenue from service pricing
- System uptime status (all flags operational or not)
- Quick actions: enable/disable all

**Service Management Tab**
- The existing feature flags list but in a cleaner table/grid layout with toggle switches
- Grouped by category (api_service, core, etc.)

**Service Pricing Tab**
- CRUD interface for `developer_service_pricing`
- Add/edit service name, description, monthly price, billing start date
- Shows calculated months since billing started and total billed
- Category selector (API Maintenance, Chatbot System, Automation, Advanced Offers)

**Maintenance Log Tab**
- Embed the existing MaintenanceLog component

### 2. `src/components/admin/ServiceStatus.tsx` -- Enhanced

Add a "Monthly Maintenance Costs" section at the bottom:
- Fetches from `developer_service_pricing` 
- Shows each active service with its monthly price
- Shows billing start date and months elapsed
- Shows total monthly cost summary

### 3. Migration SQL
- Create `developer_service_pricing` table with RLS
- Seed a few default rows (API Maintenance, Chatbot System, etc.)

### 4. `src/integrations/supabase/types.ts` -- Auto-updated after migration

## UI Design Approach

- Clean header with gradient accent and developer branding
- Tabs component for navigation between sections
- Consistent card-based layouts with proper spacing
- Professional color scheme: subtle backgrounds, clear status indicators
- Responsive grid layouts for all sections
- No "hacker-style" elements -- structured, corporate feel

## Implementation Order

1. Database migration (new table + RLS + seed data)
2. Rewrite DeveloperPanel.tsx with tabs and all sections
3. Update ServiceStatus.tsx to show pricing/billing info

