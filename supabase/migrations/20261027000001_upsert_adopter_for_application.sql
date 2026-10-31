-- Lets anonymous visitors submit an adoption application without needing
-- RLS access to public.adopters. Returns only the adopter id.
create or replace function public.upsert_adopter_for_application(
  p_full_name text, p_email text, p_phone text, p_address text, p_id_document_url text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  insert into adopters (full_name, email, phone, address, id_document_url)
  values (p_full_name, p_email, p_phone, p_address, p_id_document_url)
  on conflict (email) do update
    set full_name = excluded.full_name, phone = excluded.phone,
        address = excluded.address, id_document_url = excluded.id_document_url
  returning id into v_id;
  return v_id;
end $$;

grant execute on function public.upsert_adopter_for_application to anon, authenticated;
