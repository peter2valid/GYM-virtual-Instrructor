-- ============================================================
-- V2 Foundation Schema Migration
-- Phase 1: Parallel Evolution (Safe Additions)
-- ============================================================

-- ─── 1. PLATFORM LAYER ──────────────────────────────────────────────────────

-- Platform pricing catalog
create table if not exists plans (
  id                         uuid        primary key default gen_random_uuid(),
  name                       text        not null,
  price_monthly_kes          integer     not null default 0,
  price_yearly_kes           integer     not null default 0,
  member_limit               integer     not null default 0,
  branch_limit               integer     not null default 1,
  staff_limit                integer     not null default 0,
  attendance_enabled         boolean     not null default false,
  workouts_enabled           boolean     not null default false,
  analytics_enabled          boolean     not null default false,
  branding_enabled           boolean     not null default false,
  campaign_enabled          boolean     not null default false,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);

-- Separate platform authority from gym users
create table if not exists platform_admins (
  id                uuid        primary key default gen_random_uuid(),
  profile_id        uuid        not null references public.profiles(id) on delete cascade,
  role              text        not null default 'platform_support',
  is_active         boolean     not null default true,
  created_at        timestamptz not null default now(),
  constraint platform_admins_role_check
    check (role in ('super_admin', 'platform_support', 'platform_ops'))
);

-- ─── 2. GYM / TENANT LAYER ──────────────────────────────────────────────────

-- Support multi-branch gyms
create table if not exists branches (
  id                uuid        primary key default gen_random_uuid(),
  gym_id            uuid        not null references public.tenants(id) on delete cascade,
  name              text        not null,
  slug              text        not null,
  address           text,
  phone             text,
  is_main           boolean     not null default false,
  is_active         boolean     not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint branches_slug_gym_unique unique (gym_id, slug)
);

-- Actual platform subscription per gym
create table if not exists gym_subscriptions (
  id                        uuid        primary key default gen_random_uuid(),
  gym_id                    uuid        not null references public.tenants(id) on delete cascade,
  plan_id                   uuid        not null references plans(id) on delete restrict,
  billing_cycle             text        not null default 'monthly',
  status                    text        not null default 'trialing',
  starts_at                 timestamptz not null default now(),
  ends_at                   timestamptz,
  next_billing_at           timestamptz,
  provider_name             text        default 'paystack',
  provider_customer_id      text,
  provider_subscription_id  text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  constraint gym_subscriptions_billing_cycle_check
    check (billing_cycle in ('monthly', 'yearly')),
  constraint gym_subscriptions_status_check
    check (status in ('trialing', 'active', 'past_due', 'cancelled', 'expired'))
);

-- ─── 3. IDENTITY AND ACCESS ─────────────────────────────────────────────────

-- Map a profile into a role inside a specific gym
create table if not exists gym_user_roles (
  id                uuid        primary key default gen_random_uuid(),
  gym_id            uuid        not null references public.tenants(id) on delete cascade,
  profile_id        uuid        not null references public.profiles(id) on delete cascade,
  branch_id         uuid        references branches(id) on delete set null,
  role              text        not null default 'member',
  is_active         boolean     not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint gym_user_roles_role_check
    check (role in ('gym_owner', 'gym_admin', 'front_desk', 'trainer', 'member')),
  constraint gym_user_roles_unique unique (gym_id, profile_id, role)
);

-- ─── 4. MEMBER OPERATIONS ───────────────────────────────────────────────────

-- Represents the customer/member as a business entity
create table if not exists members (
  id                uuid        primary key default gen_random_uuid(),
  gym_id            uuid        not null references public.tenants(id) on delete cascade,
  branch_id         uuid        references branches(id) on delete set null,
  profile_id        uuid        references public.profiles(id) on delete set null,
  member_code       text,
  first_name        text        not null,
  last_name         text        not null,
  full_name         text        not null,
  phone             text,
  email             text,
  gender            text,
  photo_url         text,
  joined_at         timestamptz not null default now(),
  status            text        not null default 'active',
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint members_status_check
    check (status in ('lead', 'trial', 'active', 'inactive', 'expired', 'blocked')),
  constraint members_gym_email_unique unique (gym_id, email),
  constraint members_gym_code_unique unique (gym_id, member_code)
);

-- Define commercial packages sold by the gym
create table if not exists membership_types (
  id                uuid        primary key default gen_random_uuid(),
  gym_id            uuid        not null references public.tenants(id) on delete cascade,
  name              text        not null,
  description       text,
  duration_days     integer     not null,
  price_kes         integer     not null,
  attendance_limit  integer,
  includes_workouts boolean     not null default true,
  includes_classes  boolean     not null default false,
  is_active         boolean     not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Track the actual active membership for a member
create table if not exists member_memberships (
  id                  uuid        primary key default gen_random_uuid(),
  gym_id              uuid        not null references public.tenants(id) on delete cascade,
  member_id           uuid        not null references members(id) on delete cascade,
  membership_type_id  uuid        not null references membership_types(id) on delete restrict,
  start_date          date        not null default current_date,
  end_date            date        not null,
  status              text        not null default 'active',
  payment_status      text        not null default 'unpaid',
  auto_renew          boolean     not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint member_memberships_status_check
    check (status in ('active', 'expired', 'paused', 'cancelled')),
  constraint member_memberships_payment_status_check
    check (payment_status in ('paid', 'partial', 'unpaid', 'waived'))
);

-- ─── 5. ATTENDANCE ENGINE ───────────────────────────────────────────────────

-- Stores validated check-ins/checkouts
create table if not exists attendance_checkins (
  id                        uuid        primary key default gen_random_uuid(),
  gym_id                    uuid        not null references public.tenants(id) on delete cascade,
  branch_id                 uuid        references branches(id) on delete set null,
  member_id                 uuid        not null references members(id) on delete cascade,
  member_membership_id      uuid        references member_memberships(id) on delete set null,
  checkin_method            text        not null default 'qr',
  checkin_at                timestamptz not null default now(),
  checkout_at               timestamptz,
  checked_in_by_profile_id  uuid        references public.profiles(id) on delete set null,
  status                    text        not null default 'entered',
  denial_reason             text,
  created_at                timestamptz not null default now(),
  constraint attendance_checkins_method_check
    check (checkin_method in ('qr', 'manual', 'staff', 'kiosk')),
  constraint attendance_checkins_status_check
    check (status in ('entered', 'denied', 'completed'))
);

-- ─── 6. WORKOUT ENGINE ──────────────────────────────────────────────────────

-- Assign a workout template to a specific member
create table if not exists member_workout_assignments (
  id                    uuid        primary key default gen_random_uuid(),
  gym_id                uuid        not null references public.tenants(id) on delete cascade,
  member_id             uuid        not null references members(id) on delete cascade,
  workout_template_id   uuid        not null references public.workouts(id) on delete cascade,
  assigned_by_profile_id uuid        references public.profiles(id) on delete set null,
  assigned_at           timestamptz not null default now(),
  starts_on             date,
  ends_on               date,
  status                text        not null default 'active',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint member_workout_assignments_status_check
    check (status in ('assigned', 'active', 'completed', 'paused', 'cancelled'))
);

-- Track exercise-by-exercise execution inside a session
create table if not exists workout_session_items (
  id                  uuid        primary key default gen_random_uuid(),
  workout_session_id  uuid        not null references public.workout_sessions(id) on delete cascade,
  exercise_id         uuid        references public.exercises(id) on delete set null,
  sets_completed      integer,
  reps_completed      integer,
  duration_seconds    integer,
  completed_at        timestamptz default now(),
  notes               text,
  created_at          timestamptz not null default now()
);

-- ─── 7. AUDIT AND LOGS ──────────────────────────────────────────────────────

create table if not exists audit_logs (
  id                        uuid        primary key default gen_random_uuid(),
  actor_profile_id          uuid        references public.profiles(id) on delete set null,
  actor_platform_admin_id   uuid        references platform_admins(id) on delete set null,
  gym_id                    uuid        references public.tenants(id) on delete set null,
  action                    text        not null,
  entity_type               text        not null,
  entity_id                 uuid,
  metadata                  jsonb       not null default '{}'::jsonb,
  created_at                timestamptz not null default now()
);

create table if not exists impersonation_sessions (
  id                  uuid        primary key default gen_random_uuid(),
  platform_admin_id   uuid        not null references platform_admins(id) on delete cascade,
  gym_id              uuid        not null references public.tenants(id) on delete cascade,
  reason              text,
  started_at          timestamptz not null default now(),
  ended_at            timestamptz,
  created_at          timestamptz not null default now()
);

-- ─── INDEXES ─────────────────────────────────────────────────────────────────

create index if not exists idx_plans_name on plans(name);
create index if not exists idx_platform_admins_profile_id on platform_admins(profile_id);
create index if not exists idx_branches_gym_id on branches(gym_id);
create index if not exists idx_gym_subscriptions_gym_id on gym_subscriptions(gym_id);
create index if not exists idx_gym_user_roles_gym_profile on gym_user_roles(gym_id, profile_id);
create index if not exists idx_members_gym_id on members(gym_id);
create index if not exists idx_members_profile_id on members(profile_id);
create index if not exists idx_members_status on members(gym_id, status);
create index if not exists idx_membership_types_gym_id on membership_types(gym_id);
create index if not exists idx_member_memberships_member_id on member_memberships(member_id);
create index if not exists idx_member_memberships_status on member_memberships(gym_id, status);
create index if not exists idx_ac_gym_member on attendance_checkins(gym_id, member_id);
create index if not exists idx_ac_checkin_at on attendance_checkins(checkin_at desc);
create index if not exists idx_mwa_member_id on member_workout_assignments(member_id);
create index if not exists idx_wsi_session_id on workout_session_items(workout_session_id);
create index if not exists idx_audit_logs_gym_id on audit_logs(gym_id);
create index if not exists idx_audit_logs_created_at on audit_logs(created_at desc);

-- ─── TRIGGERS FOR UPDATED_AT ─────────────────────────────────────────────────

create trigger plans_updated_at before update on plans for each row execute function update_updated_at_column();
create trigger branches_updated_at before update on branches for each row execute function update_updated_at_column();
create trigger gym_subscriptions_updated_at before update on gym_subscriptions for each row execute function update_updated_at_column();
create trigger gym_user_roles_updated_at before update on gym_user_roles for each row execute function update_updated_at_column();
create trigger members_updated_at before update on members for each row execute function update_updated_at_column();
create trigger membership_types_updated_at before update on membership_types for each row execute function update_updated_at_column();
create trigger member_memberships_updated_at before update on member_memberships for each row execute function update_updated_at_column();
create trigger member_workout_assignments_updated_at before update on member_workout_assignments for each row execute function update_updated_at_column();
