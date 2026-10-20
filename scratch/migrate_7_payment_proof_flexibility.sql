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
