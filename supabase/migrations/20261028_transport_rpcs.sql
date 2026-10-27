-- Transport flow access for visitors who are not logged in. The adoption id
-- (or transport request id) in the emailed link is the capability; the tables
-- stay closed to the anon role. Statuses are set here, never by the client.

-- Read everything the transport page needs. p_id may be an adoption id or a
-- transport request id (the emails use both).
create or replace function public.get_transport_request_data(p_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_adoption_id uuid;
  v_adopt adoptions%rowtype;
  v_pet pets%rowtype;
  v_adopter adopters%rowtype;
  v_tr transport_requests%rowtype;
  v_dep security_deposits%rowtype;
  v_methods jsonb := '[]'::jsonb;
begin
  select adoption_id into v_adoption_id from transport_requests where id = p_id;
  v_adoption_id := coalesce(v_adoption_id, p_id);

  select * into v_adopt from adoptions where id = v_adoption_id;
  if not found then return null; end if;

  select * into v_pet from pets where id = v_adopt.pet_id;
  select * into v_adopter from adopters where id = v_adopt.adopter_id;
  select * into v_tr from transport_requests where adoption_id = v_adoption_id;
  if v_tr.id is not null then
    select * into v_dep from security_deposits where transport_request_id = v_tr.id;
  end if;

  -- Payment details are only revealed once the adoption fee is paid.
  if v_adopt.payment_status::text = 'PAID' then
    select coalesce(jsonb_agg(to_jsonb(b)), '[]'::jsonb) into v_methods
    from bank_accounts b where b.is_active;
  end if;

  return jsonb_build_object(
    'adoption', to_jsonb(v_adopt) || jsonb_build_object(
      'pets', to_jsonb(v_pet),
      'adopters', jsonb_build_object(
        'id', v_adopter.id,
        'full_name', v_adopter.full_name,
        'email', v_adopter.email,
        'phone', v_adopter.phone
      )
    ),
    'transport_request', case when v_tr.id is null then null else to_jsonb(v_tr) end,
    'security_deposit', case when v_dep.id is null then null else to_jsonb(v_dep) end,
    'payment_methods', v_methods
  );
end $$;

create or replace function public.get_active_transport_fee_tiers()
returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
  from transport_fee_tiers t where t.is_active;
$$;

-- Step 0: self pickup vs. arranged transport.
create or replace function public.select_transport_pickup_method(
  p_adoption_id uuid,
  p_method text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_adopt adoptions%rowtype;
  v_tr transport_requests%rowtype;
begin
  select * into v_adopt from adoptions where id = p_adoption_id;
  if not found or v_adopt.payment_status::text <> 'PAID' then
    raise exception 'Adoption fee must be confirmed before requesting transport.';
  end if;

  select * into v_tr from transport_requests where adoption_id = p_adoption_id;
  if found and v_tr.status::text not in ('AWAITING_LOCATION', 'SELF_PICKUP_CONFIRMED', 'QUOTE_GENERATED') then
    raise exception 'This transport request is already in progress.';
  end if;

  if p_method = 'self_pickup' then
    insert into transport_requests (adoption_id, pet_id, adopter_id, pickup_method, status)
    values (p_adoption_id, v_adopt.pet_id, v_adopt.adopter_id, 'self_pickup', 'SELF_PICKUP_CONFIRMED')
    on conflict (adoption_id) do update
      set pickup_method = 'self_pickup', status = 'SELF_PICKUP_CONFIRMED'
    returning * into v_tr;
  elsif p_method = 'transport' then
    insert into transport_requests (adoption_id, pet_id, adopter_id, pickup_method, status)
    values (p_adoption_id, v_adopt.pet_id, v_adopt.adopter_id, 'transport', 'AWAITING_LOCATION')
    on conflict (adoption_id) do update
      set pickup_method = 'transport', status = 'AWAITING_LOCATION'
    returning * into v_tr;
  else
    raise exception 'Invalid pickup method.';
  end if;

  return to_jsonb(v_tr);
end $$;

-- Step 1: store the quote. The fee comes from the tier, not from the client.
create or replace function public.confirm_transport_quote(
  p_adoption_id uuid,
  p_destination_address text,
  p_latitude numeric,
  p_longitude numeric,
  p_distance_miles numeric,
  p_fee_tier_id uuid
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_adopt adoptions%rowtype;
  v_tr transport_requests%rowtype;
  v_tier transport_fee_tiers%rowtype;
begin
  select * into v_adopt from adoptions where id = p_adoption_id;
  if not found or v_adopt.payment_status::text <> 'PAID' then
    raise exception 'Adoption fee must be confirmed before requesting transport.';
  end if;

  select * into v_tier from transport_fee_tiers where id = p_fee_tier_id and is_active;
  if not found
     or p_distance_miles < v_tier.min_distance_miles
     or (v_tier.max_distance_miles is not null and p_distance_miles > v_tier.max_distance_miles) then
    raise exception 'No matching transportation rate tier exists for this distance.';
  end if;

  select * into v_tr from transport_requests where adoption_id = p_adoption_id;
  if found and v_tr.status::text not in ('AWAITING_LOCATION', 'QUOTE_GENERATED') then
    raise exception 'This transport request is already in progress.';
  end if;

  insert into transport_requests (
    adoption_id, pet_id, adopter_id, status, destination_address,
    destination_latitude, destination_longitude, distance_miles,
    fee_tier_id, transport_fee_amount, transport_fee_currency, pickup_method
  ) values (
    p_adoption_id, v_adopt.pet_id, v_adopt.adopter_id, 'QUOTE_GENERATED', p_destination_address,
    p_latitude, p_longitude, p_distance_miles,
    v_tier.id, v_tier.fee_amount, coalesce(v_tier.currency, 'USD'), 'transport'
  )
  on conflict (adoption_id) do update set
    status = 'QUOTE_GENERATED',
    destination_address = excluded.destination_address,
    destination_latitude = excluded.destination_latitude,
    destination_longitude = excluded.destination_longitude,
    distance_miles = excluded.distance_miles,
    fee_tier_id = excluded.fee_tier_id,
    transport_fee_amount = excluded.transport_fee_amount,
    transport_fee_currency = excluded.transport_fee_currency,
    pickup_method = 'transport'
  returning * into v_tr;

  return to_jsonb(v_tr);
end $$;

-- Steps 2 & 3: transport fee proof and security deposit proof.
create or replace function public.submit_transport_payment_proof(
  p_transport_request_id uuid,
  p_purpose text,
  p_bank_account_id uuid,
  p_proof_image_url text,
  p_amount_claimed numeric,
  p_reference_note text
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_tr transport_requests%rowtype;
  v_adopt adoptions%rowtype;
  v_dep security_deposits%rowtype;
  v_proof_id uuid;
begin
  select * into v_tr from transport_requests where id = p_transport_request_id;
  if not found then
    raise exception 'Transport request not found.';
  end if;

  select * into v_adopt from adoptions where id = v_tr.adoption_id;
  if not found or v_adopt.payment_status::text <> 'PAID' then
    raise exception 'Adoption fee must be confirmed before submitting transport payments.';
  end if;

  if p_purpose = 'TRANSPORT_FEE' then
    insert into payment_proofs (
      application_id, pet_id, adopter_id, bank_account_id, proof_image_url,
      amount_claimed, reference_note, status, purpose, transport_request_id
    ) values (
      v_adopt.application_id, v_adopt.pet_id, v_adopt.adopter_id, p_bank_account_id, p_proof_image_url,
      coalesce(p_amount_claimed, 0), p_reference_note, 'PENDING_REVIEW', 'TRANSPORT_FEE', v_tr.id
    ) returning id into v_proof_id;

    update transport_requests
      set status = 'TRANSPORT_FEE_PENDING', transport_fee_proof_id = v_proof_id
      where id = v_tr.id;

  elsif p_purpose = 'SECURITY_DEPOSIT' then
    select * into v_dep from security_deposits where transport_request_id = v_tr.id;
    if not found then
      raise exception 'A security deposit has not been requested yet.';
    end if;

    insert into payment_proofs (
      application_id, pet_id, adopter_id, bank_account_id, proof_image_url,
      amount_claimed, reference_note, status, purpose, transport_request_id, security_deposit_id
    ) values (
      v_adopt.application_id, v_adopt.pet_id, v_adopt.adopter_id, p_bank_account_id, p_proof_image_url,
      coalesce(p_amount_claimed, 0), p_reference_note, 'PENDING_REVIEW', 'SECURITY_DEPOSIT', v_tr.id, v_dep.id
    ) returning id into v_proof_id;

    update transport_requests set status = 'DEPOSIT_PROOF_SUBMITTED' where id = v_tr.id;
    update security_deposits set proof_id = v_proof_id where id = v_dep.id;

  else
    raise exception 'Invalid payment purpose.';
  end if;
end $$;

-- Public shipment tracking by tracking id.
create or replace function public.get_shipment_tracking(p_tracking_id text)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_tr transport_requests%rowtype;
  v_pet pets%rowtype;
begin
  select * into v_tr from transport_requests where tracking_id = p_tracking_id;
  if not found or v_tr.status::text not in ('TRACKING_ACTIVE', 'DELIVERED') then
    return null;
  end if;

  select * into v_pet from pets where id = v_tr.pet_id;

  return jsonb_build_object(
    'shipment', to_jsonb(v_tr) || jsonb_build_object('pets', to_jsonb(v_pet)),
    'updates', coalesce((
      select jsonb_agg(to_jsonb(u) order by u.created_at desc)
      from shipment_status_updates u where u.transport_request_id = v_tr.id
    ), '[]'::jsonb)
  );
end $$;

grant execute on function public.get_transport_request_data(uuid) to anon, authenticated;
grant execute on function public.get_active_transport_fee_tiers() to anon, authenticated;
grant execute on function public.select_transport_pickup_method(uuid, text) to anon, authenticated;
grant execute on function public.confirm_transport_quote(uuid, text, numeric, numeric, numeric, uuid) to anon, authenticated;
grant execute on function public.submit_transport_payment_proof(uuid, text, uuid, text, numeric, text) to anon, authenticated;
grant execute on function public.get_shipment_tracking(text) to anon, authenticated;
