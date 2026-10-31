-- Foster coordination RPCs (final versions of scratch/migrate_2..9).
-- Visitors reach these with an assignment id from the emailed link; tables stay closed to anon.
alter table public.transport_requests drop constraint if exists transport_requests_foster_assignment_id_key;
alter table public.transport_requests add constraint transport_requests_foster_assignment_id_key unique (foster_assignment_id);

-- 1. Redefine get_foster_coordination_details to allow fetching assignment in any status (during setup and tracking phases)
CREATE OR REPLACE FUNCTION public.get_foster_coordination_details(assignment_id uuid)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'assignment', (
      SELECT json_build_object(
        'id', fa.id,
        'status', fa.status,
        'foster_address', fa.foster_address,
        'foster_state', fa.foster_state,
        'deposit_required', fa.deposit_required,
        'deposit_terms_agreed', fa.deposit_terms_agreed,
        'deposit_terms_agreed_at', fa.deposit_terms_agreed_at,
        'email', fva.email,
        'full_name', fva.full_name,
        'phone', fva.phone
      )
      FROM public.foster_assignments fa
      JOIN public.foster_volunteer_applications fva ON fva.id = fa.application_id
      WHERE fa.id = assignment_id
    ),
    'pet', (
      SELECT json_build_object(
        'id', p.id,
        'name', p.name,
        'current_location', p.current_location,
        'origin_latitude', p.origin_latitude,
        'origin_longitude', p.origin_longitude
      )
      FROM public.foster_assignments fa
      JOIN public.pets p ON p.id = fa.pet_id
      WHERE fa.id = assignment_id
    ),
    'transport_request', (
      SELECT row_to_json(tr.*)
      FROM public.transport_requests tr
      WHERE tr.foster_assignment_id = assignment_id
    ),
    'payment_proofs', (
      SELECT coalesce(json_agg(row_to_json(pp.*)), '[]'::json)
      FROM public.payment_proofs pp
      WHERE pp.transport_request_id = (
        SELECT id FROM public.transport_requests WHERE foster_assignment_id = assignment_id
      )
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Redefine submit_foster_pickup_choice to support status IN ('ASSIGNED', 'TRANSPORT_NEEDED', 'SELF_PICKUP')
CREATE OR REPLACE FUNCTION public.submit_foster_pickup_choice(assignment_id uuid)
RETURNS boolean AS $$
DECLARE
  pet_id_val uuid;
  tr_id_val uuid;
  sd_id_val uuid;
  deposit_amount_val numeric;
BEGIN
  SELECT fa.pet_id INTO pet_id_val
  FROM public.foster_assignments fa
  WHERE fa.id = assignment_id AND fa.status IN ('ASSIGNED', 'TRANSPORT_NEEDED', 'SELF_PICKUP');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assignment not found or not in active setup phase.';
  END IF;

  -- Update foster assignment
  UPDATE public.foster_assignments
  SET status = 'SELF_PICKUP', deposit_required = true
  WHERE id = assignment_id;

  -- Upsert transport request with status DEPOSIT_PENDING and pickup_method self_pickup
  INSERT INTO public.transport_requests (foster_assignment_id, pet_id, status, pickup_method)
  VALUES (assignment_id, pet_id_val, 'DEPOSIT_PENDING', 'self_pickup')
  ON CONFLICT (foster_assignment_id) DO UPDATE
  SET pickup_method = 'self_pickup', status = 'DEPOSIT_PENDING'
  RETURNING id INTO tr_id_val;

  -- Create security deposit record if it doesn't exist
  SELECT id INTO sd_id_val
  FROM public.security_deposits
  WHERE transport_request_id = tr_id_val;

  IF NOT FOUND THEN
    -- Fetch deposit setting from app_settings
    SELECT COALESCE(NULLIF(value, '')::numeric, 100.00) INTO deposit_amount_val
    FROM public.app_settings
    WHERE key = 'security_deposit_amount';
    
    IF deposit_amount_val IS NULL THEN
      deposit_amount_val := 100.00;
    END IF;

    INSERT INTO public.security_deposits (
      transport_request_id, amount, currency, status
    )
    VALUES (
      tr_id_val, deposit_amount_val, 'USD', 'PENDING'
    )
    RETURNING id INTO sd_id_val;

    -- Update transport request to link deposit
    UPDATE public.transport_requests
    SET security_deposit_id = sd_id_val
    WHERE id = tr_id_val;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Redefine submit_foster_coordination to support status IN ('ASSIGNED', 'TRANSPORT_NEEDED', 'SELF_PICKUP')
CREATE OR REPLACE FUNCTION public.submit_foster_coordination(
  assignment_id uuid,
  foster_address text,
  foster_state text,
  lat numeric,
  lng numeric,
  distance numeric,
  fee_amount numeric,
  fee_tier_id uuid,
  deposit_required boolean
)
RETURNS boolean AS $$
DECLARE
  pet_id_val uuid;
  app_id_val uuid;
  tr_id_val uuid;
BEGIN
  -- Verify setup phase
  SELECT fa.pet_id, fa.application_id INTO pet_id_val, app_id_val
  FROM public.foster_assignments fa
  WHERE fa.id = assignment_id AND fa.status IN ('ASSIGNED', 'TRANSPORT_NEEDED', 'SELF_PICKUP');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assignment not found or not in active setup phase.';
  END IF;

  -- Update foster assignment
  UPDATE public.foster_assignments
  SET 
    foster_address = submit_foster_coordination.foster_address,
    foster_state = submit_foster_coordination.foster_state,
    deposit_required = submit_foster_coordination.deposit_required,
    status = 'TRANSPORT_NEEDED'
  WHERE id = assignment_id;

  -- Upsert transport request starting at QUOTE_GENERATED status
  INSERT INTO public.transport_requests (
    foster_assignment_id, pet_id, status, 
    destination_address, destination_latitude, destination_longitude, 
    distance_miles, fee_tier_id, transport_fee_amount, transport_fee_currency, pickup_method
  )
  VALUES (
    assignment_id, pet_id_val, 'QUOTE_GENERATED'::public.transport_request_status,
    foster_address, lat, lng, 
    distance, fee_tier_id, fee_amount, 'USD', 'transport'
  )
  ON CONFLICT (foster_assignment_id) DO UPDATE
  SET 
    destination_address = EXCLUDED.destination_address,
    destination_latitude = EXCLUDED.destination_latitude,
    destination_longitude = EXCLUDED.destination_longitude,
    distance_miles = EXCLUDED.distance_miles,
    fee_tier_id = EXCLUDED.fee_tier_id,
    transport_fee_amount = EXCLUDED.transport_fee_amount,
    status = 'QUOTE_GENERATED',
    pickup_method = 'transport';

  -- Clean up any existing security deposit for this transport request if it was previously created
  DELETE FROM public.security_deposits
  WHERE transport_request_id = (SELECT id FROM public.transport_requests WHERE foster_assignment_id = assignment_id);

  UPDATE public.transport_requests
  SET security_deposit_id = NULL
  WHERE foster_assignment_id = assignment_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Redefine submit_foster_terms_agreement to support status IN ('ASSIGNED', 'TRANSPORT_NEEDED', 'SELF_PICKUP')
CREATE OR REPLACE FUNCTION public.submit_foster_terms_agreement(assignment_id uuid)
RETURNS boolean AS $$
BEGIN
  UPDATE public.foster_assignments
  SET deposit_terms_agreed = true, deposit_terms_agreed_at = now()
  WHERE id = assignment_id AND status IN ('ASSIGNED', 'TRANSPORT_NEEDED', 'SELF_PICKUP');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assignment not found or not in active setup phase.';
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Redefine submit_foster_payment_proof to support status IN ('ASSIGNED', 'TRANSPORT_NEEDED', 'SELF_PICKUP')
CREATE OR REPLACE FUNCTION public.submit_foster_payment_proof(
  assignment_id uuid,
  bank_account_id uuid,
  proof_image_url text,
  amount_claimed numeric,
  reference_note text,
  purpose text
)
RETURNS boolean AS $$
DECLARE
  tr_id uuid;
  pet_id_val uuid;
  proof_id_val uuid;
  sd_id_val uuid;
BEGIN
  -- Verify assignment is in active setup phase (including self-pickup)
  SELECT tr.id, fa.pet_id, tr.security_deposit_id INTO tr_id, pet_id_val, sd_id_val
  FROM public.foster_assignments fa
  JOIN public.transport_requests tr ON tr.foster_assignment_id = fa.id
  WHERE fa.id = assignment_id AND fa.status IN ('ASSIGNED', 'TRANSPORT_NEEDED', 'SELF_PICKUP');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Active transport request not found for foster assignment.';
  END IF;

  -- 1. Insert payment proof with security_deposit_id associated
  INSERT INTO public.payment_proofs (
    pet_id,
    bank_account_id,
    proof_image_url,
    amount_claimed,
    reference_note,
    status,
    purpose,
    transport_request_id,
    security_deposit_id
  )
  VALUES (
    pet_id_val,
    bank_account_id,
    proof_image_url,
    amount_claimed,
    reference_note,
    'PENDING_REVIEW',
    purpose::public.payment_purpose,
    tr_id,
    sd_id_val
  )
  RETURNING id INTO proof_id_val;

  -- 2. Update transport request status / links
  IF purpose = 'TRANSPORT_FEE' THEN
    UPDATE public.transport_requests
    SET status = 'TRANSPORT_FEE_PENDING', transport_fee_proof_id = proof_id_val
    WHERE id = tr_id;
  ELSIF purpose = 'SECURITY_DEPOSIT' THEN
    UPDATE public.transport_requests
    SET status = 'DEPOSIT_PROOF_SUBMITTED'
    WHERE id = tr_id;

    IF sd_id_val IS NOT NULL THEN
      UPDATE public.security_deposits
      SET proof_id = proof_id_val
      WHERE id = sd_id_val;
    END IF;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

grant execute on function public.get_foster_coordination_details(uuid) to anon, authenticated;
grant execute on function public.submit_foster_coordination(uuid, text, text, numeric, numeric, numeric, numeric, uuid, boolean) to anon, authenticated;
grant execute on function public.submit_foster_pickup_choice(uuid) to anon, authenticated;
grant execute on function public.submit_foster_terms_agreement(uuid) to anon, authenticated;
grant execute on function public.submit_foster_payment_proof(uuid, uuid, text, numeric, text, text) to anon, authenticated;
