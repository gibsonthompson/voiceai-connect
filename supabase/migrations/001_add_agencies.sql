-- ============================================================================
-- MIGRATION: Add Agency Support to CallBird Database
-- Purpose: Enable multi-tenancy for white-label platform
-- Date: 2026-01-20
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE AGENCIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.agencies (
  -- Primary Key
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  
  -- Basic Info
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text,
  phone text,
  
  -- Branding
  logo_url text,
  favicon_url text,
  primary_color text DEFAULT '#2563eb',
  secondary_color text DEFAULT '#1e40af',
  accent_color text,
  
  -- Domain Configuration
  slug text UNIQUE,                            -- "smartcall" for smartcall.voiceaiconnect.com
  marketing_domain text,                       -- "smartcallsolutions.com" (custom domain)
  domain_verified boolean DEFAULT false,
  
  -- Client Pricing (in cents)
  price_starter integer DEFAULT 4900,          -- $49
  price_pro integer DEFAULT 9900,              -- $99
  price_growth integer DEFAULT 14900,          -- $149
  
  -- Client Call Limits per Plan
  limit_starter integer DEFAULT 100,
  limit_pro integer DEFAULT 300,
  limit_growth integer DEFAULT 1000,
  
  -- Stripe (Platform billing - what agency pays us)
  stripe_customer_id text,
  stripe_subscription_id text,
  
  -- Stripe Connect (Agency receives client payments)
  stripe_account_id text,
  stripe_onboarding_complete boolean DEFAULT false,
  
  -- Agency Subscription (what they pay platform)
  plan_type text DEFAULT 'starter',            -- starter, professional, enterprise
  subscription_status text DEFAULT 'pending',  -- pending, trial, active, past_due, canceled
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  
  -- Status
  status text DEFAULT 'pending_payment',       -- pending_payment, trial, active, suspended
  onboarding_completed boolean DEFAULT false,
  onboarding_step integer DEFAULT 0,
  
  -- Settings
  support_email text,
  support_phone text,
  timezone text DEFAULT 'America/New_York',
  
  -- White-label Settings
  company_tagline text,
  website_headline text,
  website_subheadline text,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login_at timestamptz,
  
  -- Constraints
  CONSTRAINT agencies_pkey PRIMARY KEY (id),
  CONSTRAINT valid_agency_status CHECK (status IN ('pending_payment', 'trial', 'active', 'suspended')),
  CONSTRAINT valid_agency_plan CHECK (plan_type IN ('starter', 'professional', 'enterprise'))
);

-- Indexes for agencies
CREATE INDEX IF NOT EXISTS idx_agencies_email ON public.agencies(email);
CREATE INDEX IF NOT EXISTS idx_agencies_slug ON public.agencies(slug);
CREATE INDEX IF NOT EXISTS idx_agencies_marketing_domain ON public.agencies(marketing_domain);
CREATE INDEX IF NOT EXISTS idx_agencies_status ON public.agencies(status);

-- ============================================================================
-- STEP 2: CREATE DEFAULT "CALLBIRD" AGENCY FOR EXISTING DATA
-- ============================================================================
INSERT INTO public.agencies (
  id,
  name,
  email,
  slug,
  status,
  subscription_status,
  plan_type,
  onboarding_completed,
  primary_color,
  secondary_color
) VALUES (
  '00000000-0000-0000-0000-000000000001',  -- Fixed UUID for CallBird
  'CallBird AI',
  'admin@callbird.ai',
  'callbird',
  'active',
  'active',
  'enterprise',
  true,
  '#10b981',  -- CallBird green
  '#059669'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 3: ADD AGENCY_ID TO CLIENTS TABLE
-- ============================================================================
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id);

-- Assign all existing clients to CallBird agency
UPDATE public.clients 
SET agency_id = '00000000-0000-0000-0000-000000000001'
WHERE agency_id IS NULL;

-- Create index for agency lookups
CREATE INDEX IF NOT EXISTS idx_clients_agency_id ON public.clients(agency_id);

-- ============================================================================
-- STEP 4: UPDATE USERS TABLE FOR AGENCY SUPPORT
-- ============================================================================
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id);

-- Update role check to include new roles
-- First drop the old constraint if it exists
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new role constraint
ALTER TABLE public.users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('super_admin', 'agency_owner', 'agency_staff', 'client', 'admin'));

-- ============================================================================
-- STEP 5: ADD AGENCY_ID TO EMAIL_LOGS (for agency-level email tracking)
-- ============================================================================
ALTER TABLE public.email_logs 
ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id);

-- ============================================================================
-- STEP 6: ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on agencies table
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;

-- Policy: Public can read active agencies (for marketing sites)
DROP POLICY IF EXISTS "Public can read active agencies" ON public.agencies;
CREATE POLICY "Public can read active agencies" ON public.agencies
  FOR SELECT USING (status = 'active');

-- Policy: Service role can do everything (for backend operations)
DROP POLICY IF EXISTS "Service role full access to agencies" ON public.agencies;
CREATE POLICY "Service role full access to agencies" ON public.agencies
  FOR ALL USING (true);

-- Update clients RLS for agency multi-tenancy
DROP POLICY IF EXISTS "Agency can manage their clients" ON public.clients;
CREATE POLICY "Agency can manage their clients" ON public.clients
  FOR ALL USING (
    agency_id IN (
      SELECT agency_id FROM public.users WHERE id = auth.uid()
    )
    OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin')
  );

-- ============================================================================
-- STEP 7: HELPER FUNCTIONS
-- ============================================================================

-- Function to get agency by domain/slug
CREATE OR REPLACE FUNCTION get_agency_by_domain(domain_input text)
RETURNS public.agencies AS $$
DECLARE
  agency_record public.agencies;
BEGIN
  -- Try custom domain first
  SELECT * INTO agency_record
  FROM public.agencies
  WHERE marketing_domain = domain_input
    AND domain_verified = true
    AND status = 'active';
  
  IF FOUND THEN
    RETURN agency_record;
  END IF;
  
  -- Try slug (subdomain pattern)
  SELECT * INTO agency_record
  FROM public.agencies
  WHERE slug = domain_input
    AND status = 'active';
  
  RETURN agency_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check agency seat limits
CREATE OR REPLACE FUNCTION check_agency_seat_limit(agency_uuid uuid)
RETURNS boolean AS $$
DECLARE
  agency_record public.agencies;
  client_count integer;
  seat_limit integer;
BEGIN
  SELECT * INTO agency_record FROM public.agencies WHERE id = agency_uuid;
  
  SELECT COUNT(*) INTO client_count 
  FROM public.clients 
  WHERE agency_id = agency_uuid AND status != 'cancelled';
  
  -- Set limit based on plan
  seat_limit := CASE agency_record.plan_type
    WHEN 'starter' THEN 25
    WHEN 'professional' THEN 100
    WHEN 'enterprise' THEN 999999
    ELSE 25
  END;
  
  RETURN client_count < seat_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 8: UPDATE TRIGGERS
-- ============================================================================

-- Update timestamp trigger for agencies
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_agencies_updated_at ON public.agencies;
CREATE TRIGGER update_agencies_updated_at
  BEFORE UPDATE ON public.agencies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
