-- Checkout access for visitors who are not logged in. The application id in
-- the emailed link (a random UUID) acts as the capability; the tables stay
-- closed to the anon role.

create or replace function public.get_checkout_data(p_application_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_app adoption_applications%rowtype;
  v_pet pets%rowtype;
  v_adopter adopters%rowtype;
  v_banks jsonb := '[]'::jsonb;
begin
  select * into v_app from adoption_applications where id = p_application_id;
  if not found then return null; end if;

  select * into v_pet from pets where id = v_app.pet_id;
  select * into v_adopter from adopters where id = v_app.adopter_id;

  -- Bank details are only revealed once the application is approved.
  if v_app.status = 'APPROVED' then
    select coalesce(jsonb_agg(to_jsonb(b)), '[]'::jsonb) into v_banks
    from bank_accounts b
    where b.is_active and b.currency = coalesce(v_pet.currency, 'USD');
  end if;

  return jsonb_build_object(
    'application', jsonb_build_object(
      'id', v_app.id,
      'pet_id', v_app.pet_id,
      'adopter_id', v_app.adopter_id,
      'status', v_app.status,
      'pets', to_jsonb(v_pet),
      'adopters', jsonb_build_object(
        'id', v_adopter.id,
        'full_name', v_adopter.full_name,
        'email', v_adopter.email,
        'phone', v_adopter.phone
      )
    ),
    'adoption', (select to_jsonb(a) from adoptions a where a.application_id = p_application_id limit 1),
    'proofs', coalesce((select jsonb_agg(to_jsonb(p)) from payment_proofs p where p.application_id = p_application_id), '[]'::jsonb),
    'bank_accounts', v_banks
  );
end $$;

create or replace function public.submit_payment_proof(
  p_application_id uuid,
  p_bank_account_id uuid,
  p_proof_image_url text,
  p_amount_claimed numeric,
  p_reference_note text
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_app adoption_applications%rowtype;
begin
  select * into v_app from adoption_applications where id = p_application_id;
  if not found or v_app.status <> 'APPROVED' then
    raise exception 'Application is not approved for payment.';
  end if;

  -- pet_id and adopter_id come from the application, never from the client.
  insert into payment_proofs (
    application_id, pet_id, adopter_id, bank_account_id,
    proof_image_url, amount_claimed, reference_note, status
  ) values (
    v_app.id, v_app.pet_id, v_app.adopter_id, p_bank_account_id,
    p_proof_image_url, p_amount_claimed, p_reference_note, 'PENDING_REVIEW'
  );
end $$;

grant execute on function public.get_checkout_data(uuid) to anon, authenticated;
grant execute on function public.submit_payment_proof(uuid, uuid, text, numeric, text) to anon, authenticated;
