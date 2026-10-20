-- Redefine submit_foster_coordination
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
  tr_status text;
  sd_id_val uuid;
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

  -- Determine initial transport request status: DEPOSIT_PENDING or DEPOSIT_PAID (waived MI)
  IF submit_foster_coordination.deposit_required THEN
    tr_status := 'DEPOSIT_PENDING';
  ELSE
    tr_status := 'DEPOSIT_PAID';
  END IF;

  -- 2. Upsert transport request
  INSERT INTO public.transport_requests (
    foster_assignment_id, pet_id, status, 
    destination_address, destination_latitude, destination_longitude, 
    distance_miles, fee_tier_id, transport_fee_amount, transport_fee_currency, pickup_method
  )
  VALUES (
    assignment_id, pet_id_val, tr_status::public.transport_status,
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
    status = EXCLUDED.status,
    pickup_method = 'transport'
  RETURNING id INTO tr_id_val;

  -- 3. If deposit is required, automatically create a pending security deposit record
  IF submit_foster_coordination.deposit_required THEN
    -- Check if a security deposit already exists for this transport request
    SELECT id INTO sd_id_val
    FROM public.security_deposits
    WHERE transport_request_id = tr_id_val;

    IF NOT FOUND THEN
      INSERT INTO public.security_deposits (
        transport_request_id, amount, currency, status
      )
      VALUES (
        tr_id_val, 100.00, 'USD', 'PENDING'
      )
      RETURNING id INTO sd_id_val;

      -- Update the transport request to link the security deposit
      UPDATE public.transport_requests
      SET security_deposit_id = sd_id_val
      WHERE id = tr_id_val;
    END IF;
  ELSE
    -- If deposit was previously required but now waived, clean up by marking paid
    UPDATE public.security_deposits
    SET status = 'PAID'
    WHERE transport_request_id = tr_id_val AND status = 'PENDING';
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Redefine submit_foster_payment_proof
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
  -- Verify assignment is in active setup phase
  SELECT tr.id, fa.pet_id, tr.security_deposit_id INTO tr_id, pet_id_val, sd_id_val
  FROM public.foster_assignments fa
  JOIN public.transport_requests tr ON tr.foster_assignment_id = fa.id
  WHERE fa.id = assignment_id AND fa.status IN ('ASSIGNED', 'TRANSPORT_NEEDED');

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
