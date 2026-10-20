-- Companion to migrate_8_lock_down_adopters_pii.sql.
-- Once adopters.SELECT is staff-only, the public adoption form can no longer
-- look up an existing adopter by email directly. This SECURITY DEFINER function
-- does the "reuse if email exists, else create" logic server-side, atomically,
-- and only ever returns a single adopter id (never leaks other applicants' PII).

CREATE OR REPLACE FUNCTION public.find_or_create_adopter(
  p_full_name text,
  p_email text,
  p_phone text,
  p_address text,
  p_id_document_url text,
  p_age_confirmed boolean
)
RETURNS uuid AS $$
DECLARE
  result_id uuid;
BEGIN
  -- Atomic upsert-or-noop: if the email already exists, this is a no-op and
  -- returns nothing; otherwise it inserts and returns the new id.
  INSERT INTO public.adopters (full_name, email, phone, address, id_document_url, age_confirmed, user_id)
  VALUES (p_full_name, p_email, p_phone, p_address, p_id_document_url, p_age_confirmed, NULL)
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO result_id;

  IF result_id IS NULL THEN
    SELECT id INTO result_id FROM public.adopters WHERE email = p_email;
  END IF;

  RETURN result_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.find_or_create_adopter(text, text, text, text, text, boolean) TO anon, authenticated;
