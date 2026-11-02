-- ============================================================================
-- MIGRATION: Call-center settings + branding columns
-- Purpose: Back the call-center Settings and Branding screens with real columns
--          on the call_centers account (support contacts + brand fonts/kit),
--          so a call center edits its own account instead of an agency row.
-- Additive and safe. Run after 003_call_centers.sql.
-- Date: 2026-11-02
-- ============================================================================
ALTER TABLE public.call_centers ADD COLUMN IF NOT EXISTS support_email text;
ALTER TABLE public.call_centers ADD COLUMN IF NOT EXISTS support_phone text;
ALTER TABLE public.call_centers ADD COLUMN IF NOT EXISTS display_font text;
ALTER TABLE public.call_centers ADD COLUMN IF NOT EXISTS body_font text;
ALTER TABLE public.call_centers ADD COLUMN IF NOT EXISTS icon_style text;
ALTER TABLE public.call_centers ADD COLUMN IF NOT EXISTS brand_kit jsonb;
