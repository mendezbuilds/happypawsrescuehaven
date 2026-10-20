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
BEGIN
  -- Verify assignment is in active setup phase
  SELECT tr.id, fa.pet_id INTO tr_id, pet_id_val
  FROM public.foster_assignments fa
  JOIN public.transport_requests tr ON tr.foster_assignment_id = fa.id
  WHERE fa.id = assignment_id AND fa.status IN ('ASSIGNED', 'TRANSPORT_NEEDED');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Active transport request not found for foster assignment.';
  END IF;

  -- 1. Insert payment proof
  INSERT INTO public.payment_proofs (
    pet_id,
    bank_account_id,
    proof_image_url,
    amount_claimed,
    reference_note,
    status,
    purpose,
    transport_request_id
  )
  VALUES (
    pet_id_val,
    bank_account_id,
    proof_image_url,
    amount_claimed,
    reference_note,
    'PENDING_REVIEW',
    purpose::public.payment_purpose,
    tr_id
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
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
