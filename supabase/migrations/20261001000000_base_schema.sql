-- ========================================================
-- RESCUE4PAWS BASE SCHEMA
-- Rebuilt from schema.sql, scratch/migrate_*.sql and the columns the app
-- reads/writes (src/lib/types.ts + admin/public pages). The original
-- Supabase project was deleted, so this is the source of truth going forward.
-- ========================================================

-- ---------- Enums ----------
create type public.pet_status as enum
  ('AVAILABLE', 'PENDING', 'ADOPTED', 'MEDICAL_HOLD', 'NOT_LISTED', 'IN_FOSTER');
create type public.application_status as enum ('PENDING', 'APPROVED', 'REJECTED');
create type public.adoption_payment_status as enum ('PENDING', 'PAID', 'FAILED', 'REFUNDED');
create type public.payment_purpose as enum ('ADOPTION_FEE', 'TRANSPORT_FEE', 'SECURITY_DEPOSIT');
create type public.transport_request_status as enum (
  'AWAITING_CHOICE', 'SELF_PICKUP_CONFIRMED', 'AWAITING_LOCATION', 'QUOTE_GENERATED',
  'TRANSPORT_FEE_PENDING', 'TRANSPORT_FEE_PAID', 'DEPOSIT_PENDING', 'DEPOSIT_PROOF_SUBMITTED',
  'DEPOSIT_PAID', 'TRACKING_ACTIVE', 'DELIVERED', 'CANCELLED', 'PENDING', 'EN_ROUTE'
);

-- ---------- Tables ----------
create table public.staff (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role text not null default 'staff',
  created_at timestamptz not null default now()
);

-- SECURITY DEFINER so policies on public.staff itself do not recurse.
create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff s where s.user_id = auth.uid());
$$;
grant execute on function public.is_staff() to anon, authenticated;

create table public.pets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  species text not null,
  breed text,
  age text,
  gender text,
  description text,
  status public.pet_status not null default 'AVAILABLE',
  case_number text not null unique,
  intake_date date not null default current_date,
  photo_url text,
  created_at timestamptz not null default now(),
  adoption_fee numeric(10,2) not null default 0,
  currency text not null default 'USD',
  good_with_kids boolean,
  good_with_dogs boolean,
  good_with_cats boolean,
  vaccinated boolean not null default false,
  spayed_neutered boolean not null default false,
  microchipped boolean not null default false,
  foster_notes text,
  current_location text,
  age_years numeric,
  sex text check (sex in ('male', 'female', 'unknown')),
  size text check (size in ('small', 'medium', 'large', 'extra_large')),
  photos text[] not null default '{}',
  origin_latitude double precision,
  origin_longitude double precision
);

create table public.adopters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  email text not null unique,
  phone text,
  address text,
  id_document_url text,
  id_verified boolean not null default false,
  id_verified_by uuid,
  id_verified_at timestamptz,
  age_confirmed boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.volunteers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  email text not null unique,
  phone text,
  interests text[] default '{}',
  created_at timestamptz not null default now()
);

create table public.adoption_applications (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  adopter_id uuid not null references public.adopters(id) on delete cascade,
  status public.application_status not null default 'PENDING',
  housing_type text not null,
  has_other_pets boolean not null default false,
  experience_details text,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.adoptions (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.adoption_applications(id) on delete cascade,
  pet_id uuid not null references public.pets(id) on delete cascade,
  adopter_id uuid not null references public.adopters(id) on delete cascade,
  adoption_date timestamptz not null default now(),
  fee_paid numeric(10,2) not null default 0,
  contract_signed boolean not null default false,
  amount numeric(10,2),
  currency text not null default 'USD',
  payment_status public.adoption_payment_status not null default 'PENDING',
  flutterwave_tx_ref text,
  flutterwave_tx_id text,
  flutterwave_raw_response jsonb,
  paid_at timestamptz,
  tracking_id text,
  created_at timestamptz not null default now()
);

create table public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  bank_name text not null,
  account_name text not null default '',
  account_number text,
  routing_number text,
  account_type text check (account_type in ('checking', 'savings')),
  swift_code text,
  currency text not null default 'USD',
  is_active boolean not null default true,
  notes text,
  logo_url text,
  method_type text not null default 'bank_transfer'
    check (method_type in ('bank_transfer', 'zelle', 'cashapp', 'chime', 'venmo', 'paypal', 'other')),
  handle text,
  display_label text,
  created_at timestamptz not null default now()
);

create table public.transport_fee_tiers (
  id uuid primary key default gen_random_uuid(),
  min_distance_miles integer not null default 0,
  max_distance_miles integer,
  fee_amount numeric(10,2) not null,
  currency text not null default 'USD',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.foster_volunteer_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  email text not null,
  phone text,
  address text,
  role_interest text not null check (role_interest in ('FOSTER', 'VOLUNTEER', 'BOTH')),
  experience_details text,
  availability text,
  has_other_pets boolean,
  housing_type text,
  id_document_url text,
  age_confirmed boolean not null default false,
  status text not null default 'SUBMITTED' check (status in ('SUBMITTED', 'APPROVED', 'REJECTED')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now()
);

create table public.foster_assignments (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.foster_volunteer_applications(id) on delete cascade,
  pet_id uuid not null references public.pets(id) on delete cascade,
  status text not null default 'ASSIGNED'
    check (status in ('ASSIGNED', 'TRANSPORT_NEEDED', 'SELF_PICKUP', 'ACTIVE', 'RETURNED')),
  assigned_by uuid,
  assigned_at timestamptz default now(),
  returned_at timestamptz,
  notes text,
  foster_address text,
  foster_state text,
  deposit_required boolean,
  deposit_terms_agreed boolean not null default false,
  deposit_terms_agreed_at timestamptz
);

create table public.transport_requests (
  id uuid primary key default gen_random_uuid(),
  adoption_id uuid unique references public.adoptions(id) on delete cascade,
  foster_assignment_id uuid unique references public.foster_assignments(id) on delete cascade,
  pet_id uuid references public.pets(id) on delete cascade,
  adopter_id uuid references public.adopters(id) on delete cascade,
  status public.transport_request_status not null default 'AWAITING_CHOICE',
  destination_address text,
  destination_latitude double precision,
  destination_longitude double precision,
  distance_miles numeric,
  fee_tier_id uuid references public.transport_fee_tiers(id) on delete set null,
  transport_fee_amount numeric(10,2),
  transport_fee_currency text,
  -- Back-pointers to payment_proofs / security_deposits are plain uuids (no FK)
  -- so PostgREST embeds between these tables stay unambiguous.
  transport_fee_proof_id uuid,
  transport_fee_paid_at timestamptz,
  security_deposit_id uuid,
  tracking_id text unique,
  tracking_activated_at timestamptz,
  pickup_method text check (pickup_method in ('self_pickup', 'transport')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payment_proofs (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.adoption_applications(id) on delete cascade,
  pet_id uuid references public.pets(id) on delete cascade,
  adopter_id uuid references public.adopters(id) on delete cascade,
  bank_account_id uuid references public.bank_accounts(id) on delete set null,
  proof_image_url text not null,
  amount_claimed numeric(10,2) not null default 0,
  reference_note text,
  status text not null default 'PENDING_REVIEW' check (status in ('PENDING_REVIEW', 'APPROVED', 'REJECTED')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  rejection_reason text,
  submitted_at timestamptz not null default now(),
  purpose public.payment_purpose not null default 'ADOPTION_FEE',
  transport_request_id uuid references public.transport_requests(id) on delete cascade,
  security_deposit_id uuid
);

create table public.security_deposits (
  id uuid primary key default gen_random_uuid(),
  transport_request_id uuid not null unique references public.transport_requests(id) on delete cascade,
  amount numeric(10,2) not null,
  currency text not null default 'USD',
  status text not null default 'PENDING' check (status in ('PENDING', 'PAID', 'REFUNDED', 'FORFEITED')),
  proof_id uuid,
  paid_at timestamptz,
  refunded_at timestamptz,
  refund_notes text,
  created_at timestamptz not null default now()
);

create table public.shipment_status_updates (
  id uuid primary key default gen_random_uuid(),
  transport_request_id uuid not null references public.transport_requests(id) on delete cascade,
  status text not null check (status in
    ('PENDING', 'SHIPPED', 'EN_ROUTE', 'ARRIVED_AT_HUB', 'ON_HOLD', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED')),
  location_description text,
  note text,
  posted_by uuid not null,
  created_at timestamptz not null default now()
);

create table public.donations (
  id uuid primary key default gen_random_uuid(),
  donor_name text not null,
  donor_email text not null,
  amount numeric(10,2) not null,
  currency text not null default 'USD',
  message text,
  bank_account_id uuid references public.bank_accounts(id) on delete set null,
  proof_image_url text,
  status text not null default 'PENDING_REVIEW' check (status in ('PENDING_REVIEW', 'CONFIRMED', 'REJECTED')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  subject text,
  message text not null,
  created_at timestamptz not null default now()
);

create table public.app_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

create index on public.adoption_applications (pet_id);
create index on public.adoption_applications (adopter_id);
create index on public.adoptions (application_id);
create index on public.payment_proofs (application_id);
create index on public.payment_proofs (transport_request_id);
create index on public.shipment_status_updates (transport_request_id, created_at desc);
create index on public.foster_assignments (pet_id);

-- updated_at maintenance
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger trg_touch_adoption_applications before update on public.adoption_applications
  for each row execute function public.touch_updated_at();
create trigger trg_touch_transport_requests before update on public.transport_requests
  for each row execute function public.touch_updated_at();
create trigger trg_touch_app_settings before update on public.app_settings
  for each row execute function public.touch_updated_at();

-- ---------- Row Level Security ----------
alter table public.staff enable row level security;
alter table public.pets enable row level security;
alter table public.adopters enable row level security;
alter table public.volunteers enable row level security;
alter table public.adoption_applications enable row level security;
alter table public.adoptions enable row level security;
alter table public.bank_accounts enable row level security;
alter table public.transport_fee_tiers enable row level security;
alter table public.foster_volunteer_applications enable row level security;
alter table public.foster_assignments enable row level security;
alter table public.transport_requests enable row level security;
alter table public.payment_proofs enable row level security;
alter table public.security_deposits enable row level security;
alter table public.shipment_status_updates enable row level security;
alter table public.donations enable row level security;
alter table public.contact_submissions enable row level security;
alter table public.app_settings enable row level security;

-- Staff: full access everywhere.
do $$
declare t text;
begin
  foreach t in array array[
    'staff', 'pets', 'adopters', 'volunteers', 'adoption_applications', 'adoptions',
    'bank_accounts', 'transport_fee_tiers', 'foster_volunteer_applications',
    'foster_assignments', 'transport_requests', 'payment_proofs', 'security_deposits',
    'shipment_status_updates', 'donations', 'contact_submissions', 'app_settings'
  ] loop
    execute format(
      'create policy "Staff full access to %1$s" on public.%1$I for all to authenticated using (public.is_staff()) with check (public.is_staff())',
      t
    );
  end loop;
end $$;

-- Public reads.
create policy "Allow public read access to pets" on public.pets
  for select using (true);
create policy "Allow public read access to app_settings" on public.app_settings
  for select using (true);
create policy "Allow public read access to active bank_accounts" on public.bank_accounts
  for select using (is_active);
create policy "Allow public read access to active transport_fee_tiers" on public.transport_fee_tiers
  for select using (is_active);

-- Shipment updates are visible only once tracking is live for that request.
create or replace function public.is_tracking_visible(p_transport_request_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.transport_requests t
    where t.id = p_transport_request_id and t.status::text in ('TRACKING_ACTIVE', 'DELIVERED')
  );
$$;
grant execute on function public.is_tracking_visible(uuid) to anon, authenticated;

create policy "Allow public read of live shipment updates" on public.shipment_status_updates
  for select using (public.is_tracking_visible(transport_request_id));

-- Public inserts (forms). Everything else for visitors goes through the RPCs.
create policy "Allow public insert to adopters" on public.adopters
  for insert with check (true);
create policy "Allow public insert of pending adoption applications" on public.adoption_applications
  for insert with check (status = 'PENDING');
create policy "Allow public insert of foster/volunteer applications" on public.foster_volunteer_applications
  for insert with check (status = 'SUBMITTED');
create policy "Allow public insert of pending donations" on public.donations
  for insert with check (status = 'PENDING_REVIEW');
create policy "Allow public insert to contact_submissions" on public.contact_submissions
  for insert with check (true);

-- ---------- Storage ----------
insert into storage.buckets (id, name, public) values
  ('pet-photos', 'pet-photos', true),
  ('adopter-ids', 'adopter-ids', false),
  ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

create policy "Public read pet photos" on storage.objects
  for select using (bucket_id = 'pet-photos');
create policy "Staff manage pet photos" on storage.objects
  for all to authenticated
  using (bucket_id = 'pet-photos' and public.is_staff())
  with check (bucket_id = 'pet-photos' and public.is_staff());

-- Visitors can upload (not read/list) ID documents and payment proofs.
create policy "Public upload adopter ids" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'adopter-ids');
create policy "Public upload payment proofs" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'payment-proofs');
create policy "Staff read adopter ids" on storage.objects
  for select to authenticated using (bucket_id = 'adopter-ids' and public.is_staff());
create policy "Staff read payment proofs" on storage.objects
  for select to authenticated using (bucket_id = 'payment-proofs' and public.is_staff());
create policy "Staff delete adopter ids" on storage.objects
  for delete to authenticated using (bucket_id = 'adopter-ids' and public.is_staff());
create policy "Staff delete payment proofs" on storage.objects
  for delete to authenticated using (bucket_id = 'payment-proofs' and public.is_staff());

-- ---------- Seed settings ----------
insert into public.app_settings (key, value) values
  ('security_deposit_amount', '100.00'),
  ('total_animals_adopted', '0'),
  ('contact_email', 'admin@rescue4pawz.site')
on conflict (key) do nothing;
