-- Core tables
create table if not exists clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists staffs (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id),
  role text not null check (role in ('admin','staff','reception')),
  full_name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists patients (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id),
  full_name text not null,
  line_user_id text,
  phone text,
  birthday date,
  rank text not null default 'Bronze',
  points int not null default 0,
  memo text,
  created_at timestamptz not null default now()
);

create table if not exists menus (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id),
  name text not null,
  duration_min int not null check (duration_min % 5 = 0),
  price int not null,
  members_only boolean not null default false
);

create table if not exists schedules (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id),
  staff_id uuid not null references staffs(id),
  work_date date not null,
  start_at time not null,
  end_at time not null,
  is_holiday boolean not null default false
);

create table if not exists block_times (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id),
  staff_id uuid not null references staffs(id),
  start_at timestamptz not null,
  end_at timestamptz not null,
  reason text not null
);

create table if not exists reservations (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id),
  patient_id uuid not null references patients(id),
  staff_id uuid references staffs(id),
  menu_id uuid not null references menus(id),
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null check (status in ('booked','visited','cancelled','noshow')),
  referred_by_patient_id uuid references patients(id),
  created_at timestamptz not null default now()
);

create table if not exists coupons (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id),
  name text not null,
  discount_type text not null check (discount_type in ('percent','fixed')),
  discount_value int not null,
  valid_from date not null,
  valid_to date not null,
  usage_limit int
);

create table if not exists coupon_histories (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id),
  coupon_id uuid not null references coupons(id),
  patient_id uuid not null references patients(id),
  reservation_id uuid references reservations(id),
  used_at timestamptz
);

create table if not exists referral_histories (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id),
  referrer_patient_id uuid not null references patients(id),
  referred_patient_id uuid not null references patients(id),
  reservation_id uuid references reservations(id),
  amount int default 0,
  created_at timestamptz not null default now()
);

create table if not exists rank_histories (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id),
  patient_id uuid not null references patients(id),
  old_rank text not null,
  new_rank text not null,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists line_logs (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id),
  patient_id uuid references patients(id),
  message_type text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

alter table clinics enable row level security;
alter table staffs enable row level security;
alter table patients enable row level security;
alter table menus enable row level security;
alter table schedules enable row level security;
alter table block_times enable row level security;
alter table reservations enable row level security;
alter table coupons enable row level security;
alter table coupon_histories enable row level security;
alter table referral_histories enable row level security;
alter table rank_histories enable row level security;
alter table line_logs enable row level security;

create policy "clinic scoped read" on patients for select using (clinic_id in (select clinic_id from staffs where id = auth.uid()));
