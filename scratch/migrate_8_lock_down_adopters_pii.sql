-- Fix: public.adopters currently allows ANY anonymous visitor to SELECT all rows
-- (full_name, email, phone, home address, id_document_url for every applicant).
-- Verified live: anon key could read full PII for all adopters via `select('*')`.
--
-- This drops whatever SELECT/UPDATE/DELETE policies currently exist on adopters
-- and replaces them with the same staff-only pattern already used elsewhere in
-- this project (see scratch/setup-settings-rls.sql), while keeping public INSERT
-- so the adoption application form keeps working for anonymous applicants.

-- 1. Drop all existing policies on public.adopters (names unknown/inconsistent).
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'adopters'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.adopters', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.adopters ENABLE ROW LEVEL SECURITY;

-- 2. Anyone (including anonymous applicants) can create an adopter record.
CREATE POLICY "Allow public insert to adopters" ON public.adopters
  FOR INSERT WITH CHECK (true);

-- 3. Only staff can read adopter PII (name, email, phone, address, ID doc).
CREATE POLICY "Allow staff read access to adopters" ON public.adopters
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.staff s WHERE s.user_id = auth.uid()));

-- 4. Only staff can update adopters (e.g. ID verification toggle in AdminApplications.tsx).
CREATE POLICY "Allow staff update to adopters" ON public.adopters
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.staff s WHERE s.user_id = auth.uid()));

-- Note: the adoption application flow (src/pages/public/AdoptApply.tsx) also needs
-- to SELECT adopters.id by email (as an anonymous user) to reuse an existing adopter
-- record instead of failing on the unique email constraint. Since SELECT is now
-- staff-only, that lookup must go through a SECURITY DEFINER function instead of a
-- direct anon SELECT. See migrate_9_find_or_create_adopter.sql.
