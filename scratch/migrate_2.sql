ALTER TABLE public.transport_requests
  ADD CONSTRAINT transport_requests_foster_assignment_id_key UNIQUE (foster_assignment_id);

ALTER TABLE public.payment_proofs
  ALTER COLUMN application_id DROP NOT NULL;

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
      WHERE fa.id = assignment_id AND fa.status IN ('ASSIGNED', 'TRANSPORT_NEEDED')
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
BEGIN
  -- Verify setup phase
  SELECT fa.pet_id, fa.application_id INTO pet_id_val, app_id_val
  FROM public.foster_assignments fa
  WHERE fa.id = assignment_id AND fa.status IN ('ASSIGNED', 'TRANSPORT_NEEDED');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assignment not found or not in active setup phase.';
  END IF;

  -- 1. Update foster assignment
  UPDATE public.foster_assignments
  SET 
    foster_address = submit_foster_coordination.foster_address,
    foster_state = submit_foster_coordination.foster_state,
    deposit_required = submit_foster_coordination.deposit_required,
    status = 'TRANSPORT_NEEDED'
  WHERE id = assignment_id;

  -- 2. Upsert transport request
  INSERT INTO public.transport_requests (
    foster_assignment_id, pet_id, status, 
    destination_address, destination_latitude, destination_longitude, 
    distance_miles, fee_tier_id, transport_fee_amount, transport_fee_currency, pickup_method
  )
  VALUES (
    assignment_id, pet_id_val, 'QUOTE_GENERATED',
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

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.submit_foster_pickup_choice(assignment_id uuid)
RETURNS boolean AS $$
DECLARE
  pet_id_val uuid;
BEGIN
  SELECT fa.pet_id INTO pet_id_val
  FROM public.foster_assignments fa
  WHERE fa.id = assignment_id AND fa.status IN ('ASSIGNED', 'TRANSPORT_NEEDED');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assignment not found or not in active setup phase.';
  END IF;

  UPDATE public.foster_assignments
  SET status = 'SELF_PICKUP', deposit_required = false
  WHERE id = assignment_id;

  INSERT INTO public.transport_requests (foster_assignment_id, pet_id, status, pickup_method)
  VALUES (assignment_id, pet_id_val, 'SELF_PICKUP_CONFIRMED', 'self_pickup')
  ON CONFLICT (foster_assignment_id) DO UPDATE
  SET pickup_method = 'self_pickup', status = 'SELF_PICKUP_CONFIRMED';

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.submit_foster_terms_agreement(assignment_id uuid)
RETURNS boolean AS $$
BEGIN
  UPDATE public.foster_assignments
  SET deposit_terms_agreed = true, deposit_terms_agreed_at = now()
  WHERE id = assignment_id AND status IN ('ASSIGNED', 'TRANSPORT_NEEDED');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assignment not found or not in active setup phase.';
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
