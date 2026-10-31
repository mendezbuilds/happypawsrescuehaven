-- Pin search_path on functions flagged by the security advisor.
alter function public.touch_updated_at() set search_path = public;
alter function public.get_foster_coordination_details(uuid) set search_path = public;
alter function public.submit_foster_coordination(uuid, text, text, numeric, numeric, numeric, numeric, uuid, boolean) set search_path = public;
alter function public.submit_foster_pickup_choice(uuid) set search_path = public;
alter function public.submit_foster_terms_agreement(uuid) set search_path = public;
alter function public.submit_foster_payment_proof(uuid, uuid, text, numeric, text, text) set search_path = public;
