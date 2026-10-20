-- 1. Redefine submit_foster_pickup_choice to require security deposit
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
  WHERE fa.id = assignment_id AND fa.status IN ('ASSIGNED', 'TRANSPORT_NEEDED');

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


-- 2. Redefine submit_foster_coordination to start at QUOTE_GENERATED
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
  WHERE fa.id = assignment_id AND fa.status IN ('ASSIGNED', 'TRANSPORT_NEEDED');

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
