-- Sultan Quotation Maker — Database Setup (Supabase / PostgreSQL)
-- Run this entire file in the Supabase SQL Editor to create the three tables.
-- Row-level security (RLS) is turned ON for every table so nothing is open to the public.
-- Only the app server (using SUPABASE_SERVICE_KEY) can read or write these tables.

-- 1. SETTINGS TABLE
-- Holds a single row (id = 1) with Sultan Enterprises business details, bank details,
-- signature image storage path, quotation number prefix, and footer slogan.
CREATE TABLE IF NOT EXISTS public.settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  company_name TEXT NOT NULL DEFAULT '',
  tagline TEXT NOT NULL DEFAULT '',
  address_line1 TEXT NOT NULL DEFAULT '',
  address_line2 TEXT NOT NULL DEFAULT '',
  phone_numbers TEXT NOT NULL DEFAULT '',
  gstin TEXT NOT NULL DEFAULT '',
  bank_name TEXT NOT NULL DEFAULT '',
  account_holder TEXT NOT NULL DEFAULT '',
  account_number TEXT NOT NULL DEFAULT '',
  ifsc_code TEXT NOT NULL DEFAULT '',
  branch_code TEXT NOT NULL DEFAULT '',
  signature_storage_path TEXT,
  number_prefix TEXT NOT NULL DEFAULT 'SE',
  footer_slogan TEXT NOT NULL DEFAULT 'PLAY HARD. PLAY FAIR.',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert the single default settings row if it does not exist yet
INSERT INTO public.settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- 2. QUOTATIONS TABLE
-- Holds one row per saved quotation.
-- Money values (total_paise and item unit prices inside items JSON) are stored as whole paise (integers).
CREATE TABLE IF NOT EXISTS public.quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_number TEXT UNIQUE,
  buyer_name TEXT NOT NULL,
  buyer_address TEXT NOT NULL DEFAULT '',
  quotation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_paise BIGINT NOT NULL DEFAULT 0 CHECK (total_paise >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotations_created_at
  ON public.quotations (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_quotations_buyer_name
  ON public.quotations (buyer_name);

-- 3. COUNTERS TABLE
-- Keeps track of the last quotation number handed out so numbers count up safely and are never reused.
CREATE TABLE IF NOT EXISTS public.counters (
  name TEXT PRIMARY KEY,
  last_value BIGINT NOT NULL DEFAULT 0 CHECK (last_value >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.counters (name, last_value)
VALUES ('quotation_number', 0)
ON CONFLICT (name) DO NOTHING;

-- Atomic helper function to hand out the next quotation number in one safe step.
-- Even if two staff phones tap Create PDF at the exact same moment, each gets a different number.
CREATE OR REPLACE FUNCTION public.claim_next_quotation_number()
RETURNS BIGINT
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.counters
  SET last_value = last_value + 1,
      updated_at = NOW()
  WHERE name = 'quotation_number'
  RETURNING last_value;
$$;

-- 4. SECURITY: Enable Row-Level Security (RLS) on all tables.
-- With RLS enabled and no public policies added, anonymous/browser requests are completely blocked.
-- Only the server using SUPABASE_SERVICE_KEY can access the data.
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counters ENABLE ROW LEVEL SECURITY;
