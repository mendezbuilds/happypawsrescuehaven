-- ========================================================
-- HPRH TRANSPORT SUBDOMAIN — DATABASE MIGRATION
-- Run this in your Supabase SQL Editor
-- ========================================================

-- --------------------------------------------------------
-- 1. SHIPMENT PRICING TIERS
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shipment_pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  shipping_method TEXT NOT NULL CHECK (shipping_method IN ('land', 'air')),
  min_distance_km NUMERIC NOT NULL DEFAULT 0,
  max_distance_km NUMERIC,               -- NULL = unlimited (open-ended top tier)
  base_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  per_km_rate NUMERIC(10,4) NOT NULL DEFAULT 0,
  per_kg_rate NUMERIC(10,4) NOT NULL DEFAULT 0,  -- optional weight surcharge
  currency TEXT NOT NULL DEFAULT 'USD',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Seed with sensible starter tiers
INSERT INTO public.shipment_pricing_tiers
  (name, shipping_method, min_distance_km, max_distance_km, base_fee, per_km_rate, per_kg_rate, currency)
VALUES
  ('Land — Local (0–100 km)',       'land', 0,    100,  50,   0.30, 0.10, 'USD'),
  ('Land — Regional (100–500 km)',  'land', 100,  500,  80,   0.25, 0.10, 'USD'),
  ('Land — Long-Haul (500+ km)',    'land', 500,  NULL, 150,  0.20, 0.08, 'USD'),
  ('Air Freight — Short (0–2000 km)','air', 0,    2000, 200,  0.15, 0.12, 'USD'),
  ('Air Freight — Long (2000+ km)', 'air',  2000, NULL, 350,  0.10, 0.10, 'USD');

-- --------------------------------------------------------
-- 2. SHIPMENTS
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Shipment intent
  shipment_type TEXT NOT NULL CHECK (shipment_type IN ('self', 'send_to_other')),
  shipment_category TEXT NOT NULL,   -- 'pets' | 'documents' | 'electronics' | etc.
  shipping_method TEXT NOT NULL CHECK (shipping_method IN ('land', 'air')),

  -- Sender
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  sender_phone TEXT,

  -- Recipient (only required when shipment_type = 'send_to_other')
  recipient_name TEXT,
  recipient_email TEXT,
  recipient_phone TEXT,
  recipient_address TEXT,

  -- Locations
  pickup_address TEXT NOT NULL,
  pickup_latitude NUMERIC,
  pickup_longitude NUMERIC,
  destination_address TEXT NOT NULL,
  destination_latitude NUMERIC,
  destination_longitude NUMERIC,
  distance_km NUMERIC,

  -- Package
  package_description TEXT,
  weight_kg NUMERIC NOT NULL DEFAULT 0,
  length_cm NUMERIC,
  width_cm NUMERIC,
  height_cm NUMERIC,
  num_packages INTEGER NOT NULL DEFAULT 1,
  declared_value NUMERIC,
  special_handling TEXT,
  preferred_delivery_date DATE,

  -- Pet details (populated when shipment_category = 'pets')
  pet_name TEXT,
  pet_species TEXT,
  pet_breed TEXT,
  pet_age TEXT,
  pet_weight_kg NUMERIC,
  pet_crate_size TEXT,
  pet_health_status TEXT,
  pet_special_care TEXT,

  -- Pricing
  pricing_tier_id UUID REFERENCES public.shipment_pricing_tiers(id) ON DELETE SET NULL,
  transport_fee_amount NUMERIC(10,2),
  transport_fee_currency TEXT DEFAULT 'USD',
  security_deposit_amount NUMERIC(10,2),  -- set by admin
  security_deposit_currency TEXT DEFAULT 'USD',

  -- Transport fee payment proof
  transport_fee_status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (transport_fee_status IN ('PENDING', 'SUBMITTED', 'PAID', 'REJECTED')),
  transport_fee_proof_url TEXT,
  transport_fee_bank_id UUID,
  transport_fee_amount_claimed NUMERIC,
  transport_fee_reference TEXT,
  transport_fee_rejection_reason TEXT,
  transport_fee_reviewed_at TIMESTAMPTZ,
  transport_fee_reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Security deposit payment proof
  security_deposit_status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (security_deposit_status IN ('PENDING', 'SUBMITTED', 'PAID', 'REJECTED')),
  security_deposit_proof_url TEXT,
  security_deposit_bank_id UUID,
  security_deposit_amount_claimed NUMERIC,
  security_deposit_reference TEXT,
  security_deposit_rejection_reason TEXT,
  security_deposit_reviewed_at TIMESTAMPTZ,
  security_deposit_reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Tracking
  tracking_number TEXT UNIQUE,
  current_status TEXT NOT NULL DEFAULT 'SHIPMENT_CREATED',
  current_location TEXT,
  estimated_delivery_date DATE,        -- admin sets this after reviewing
  admin_notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.shipments_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS shipments_updated_at ON public.shipments;
CREATE TRIGGER shipments_updated_at
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.shipments_set_updated_at();

-- --------------------------------------------------------
-- 3. SHIPMENT TRACKING EVENTS
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shipment_tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID REFERENCES public.shipments(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL,
  location TEXT,
  notes TEXT,
  event_time TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  posted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- --------------------------------------------------------
-- 4. ROW LEVEL SECURITY
-- --------------------------------------------------------
ALTER TABLE public.shipment_pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_tracking_events ENABLE ROW LEVEL SECURITY;

-- Pricing tiers: anyone can read active tiers (for quote calculation)
CREATE POLICY "Public can read active pricing tiers"
  ON public.shipment_pricing_tiers FOR SELECT USING (is_active = true);

CREATE POLICY "Staff full access to pricing tiers"
  ON public.shipment_pricing_tiers FOR ALL
  USING (EXISTS (SELECT 1 FROM public.staff s WHERE s.user_id = auth.uid()));

-- Shipments: anonymous users can insert (submit a shipment request)
CREATE POLICY "Anyone can submit a shipment"
  ON public.shipments FOR INSERT WITH CHECK (true);

-- Shipments: user can view their own (by email match)
CREATE POLICY "Sender can view their own shipment"
  ON public.shipments FOR SELECT
  USING (sender_email = current_setting('request.jwt.claims', true)::json->>'email'
         OR tracking_number IS NOT NULL);

-- Shipments: staff full access
CREATE POLICY "Staff full access to shipments"
  ON public.shipments FOR ALL
  USING (EXISTS (SELECT 1 FROM public.staff s WHERE s.user_id = auth.uid()));

-- Tracking events: public can read (for tracking page)
CREATE POLICY "Public can read tracking events"
  ON public.shipment_tracking_events FOR SELECT USING (true);

CREATE POLICY "Staff full access to tracking events"
  ON public.shipment_tracking_events FOR ALL
  USING (EXISTS (SELECT 1 FROM public.staff s WHERE s.user_id = auth.uid()));

-- --------------------------------------------------------
-- 5. STORAGE BUCKET & POLICIES for shipment proofs
-- --------------------------------------------------------
-- Create public bucket 'shipment-proofs' if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('shipment-proofs', 'shipment-proofs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Enable SELECT access for public viewing of proofs
DROP POLICY IF EXISTS "Allow public read access to shipment-proofs" ON storage.objects;
CREATE POLICY "Allow public read access to shipment-proofs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'shipment-proofs');

-- Enable INSERT access for anyone submitting proof screenshots
DROP POLICY IF EXISTS "Allow public uploads to shipment-proofs" ON storage.objects;
CREATE POLICY "Allow public uploads to shipment-proofs"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'shipment-proofs');

-- ========================================================
-- DONE — tables and storage bucket/policies initialized
-- ========================================================
