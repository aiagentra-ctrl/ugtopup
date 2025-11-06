-- Phase 1a: Add new enum values (must be committed separately)

-- Expand app_role enum for enhanced user roles
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'sub_admin';