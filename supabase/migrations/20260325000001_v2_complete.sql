-- ============================================================================
-- V2 COMPLETE MIGRATION
-- Applies all V2 tables, RLS policies, indexes, helper functions,
-- and exercise media seeding in one idempotent migration.
-- ============================================================================

-- ─── HELPER: updated_at trigger function (idempotent) ──────────────────────
create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

-- ============================================================================
-- DOMAIN 1: PLATFORM
-- ============================================================================

create table if not exists plans (
  id                  uuid        primary key default gen_random_uuid(),
  name                text        not null,
  slug                text        unique not null,
  price_monthly_kes   integer     not null default 0,
  price_yearly_kes    integer     not null default 0,
  member_limit        integer     not null default 100,
  branch_limit        integer     not null default 1,
  staff_limit         integer     not null default 5,
  attendance_enabled  boolean     not null default true,
  workouts_enabled    boolean     not null default true,
  analytics_enabled   boolean     not null default false,
  branding_enabled    boolean     not null default false,
  campaigns_enabled   boolean     not null default false,
  is_public           boolean     not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table if not exists platform_admins (
  id          uuid  primary key default gen_random_uuid(),
  profile_id  uuid  not null references profiles(id) on delete cascade,
  role        text  not null default 'platform_support',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (profile_id),
  check (role in ('super_admin','platform_support','platform_ops'))
);

-- ============================================================================
-- DOMAIN 2: TENANT (GYM)
-- ============================================================================

create table if not exists branches (
  id          uuid  primary key default gen_random_uuid(),
  gym_id      uuid  not null references tenants(id) on delete cascade,
  name        text  not null,
  slug        text  not null,
  address     text,
  phone       text,
  is_main     boolean not null default false,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (gym_id, slug)
);

create table if not exists gym_subscriptions (
  id                        uuid  primary key default gen_random_uuid(),
  gym_id                    uuid  not null references tenants(id) on delete cascade,
  plan_id                   uuid  not null references plans(id) on delete restrict,
  billing_cycle             text  not null default 'monthly',
  status                    text  not null default 'trialing',
  starts_at                 timestamptz not null default now(),
  ends_at                   timestamptz,
  next_billing_at           timestamptz,
  provider_name             text  not null default 'paystack',
  provider_customer_id      text,
  provider_subscription_id  text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  check (billing_cycle in ('monthly','yearly')),
  check (status in ('trialing','active','past_due','cancelled','expired'))
);

create table if not exists gym_feature_overrides (
  id          uuid  primary key default gen_random_uuid(),
  gym_id      uuid  not null references tenants(id) on delete cascade,
  feature_key text  not null,
  enabled     boolean not null default true,
  expires_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (gym_id, feature_key)
);

-- ============================================================================
-- DOMAIN 3: IDENTITY AND ACCESS
-- ============================================================================

create table if not exists gym_user_roles (
  id          uuid  primary key default gen_random_uuid(),
  gym_id      uuid  not null references tenants(id) on delete cascade,
  profile_id  uuid  not null references profiles(id) on delete cascade,
  branch_id   uuid  references branches(id) on delete set null,
  role        text  not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (gym_id, profile_id, role),
  check (role in ('gym_owner','gym_admin','front_desk','trainer'))
);

create table if not exists invites (
  id                    uuid  primary key default gen_random_uuid(),
  gym_id                uuid  not null references tenants(id) on delete cascade,
  email                 text  not null,
  role                  text  not null,
  branch_id             uuid  references branches(id) on delete set null,
  token_hash            text  not null unique,
  invited_by_profile_id uuid  references profiles(id) on delete set null,
  accepted_at           timestamptz,
  expires_at            timestamptz not null default (now() + interval '7 days'),
  created_at            timestamptz not null default now(),
  check (role in ('gym_admin','front_desk','trainer'))
);

-- ============================================================================
-- DOMAIN 4: MEMBER OPERATIONS
-- ============================================================================

create table if not exists members (
  id          uuid  primary key default gen_random_uuid(),
  gym_id      uuid  not null references tenants(id) on delete cascade,
  branch_id   uuid  references branches(id) on delete set null,
  profile_id  uuid  references profiles(id) on delete set null,
  member_code text,
  first_name  text  not null,
  last_name   text  not null,
  full_name   text  not null generated always as (first_name || ' ' || last_name) stored,
  phone       text,
  email       text,
  gender      text,
  photo_url   text,
  joined_at   timestamptz not null default now(),
  status      text  not null default 'active',
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (gym_id, email),
  unique (gym_id, member_code),
  check (status in ('lead','trial','active','inactive','expired','blocked')),
  check (gender in ('male','female','other') or gender is null)
);

create table if not exists membership_types (
  id                  uuid  primary key default gen_random_uuid(),
  gym_id              uuid  not null references tenants(id) on delete cascade,
  name                text  not null,
  description         text,
  duration_days       integer not null check (duration_days > 0),
  price_kes           integer not null check (price_kes >= 0),
  attendance_limit    integer,
  includes_workouts   boolean not null default true,
  includes_classes    boolean not null default false,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table if not exists member_memberships (
  id                  uuid  primary key default gen_random_uuid(),
  gym_id              uuid  not null references tenants(id) on delete cascade,
  member_id           uuid  not null references members(id) on delete cascade,
  membership_type_id  uuid  not null references membership_types(id) on delete restrict,
  start_date          date  not null default current_date,
  end_date            date  not null,
  status              text  not null default 'active',
  payment_status      text  not null default 'unpaid',
  amount_paid_kes     integer not null default 0,
  auto_renew          boolean not null default false,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  check (status in ('active','expired','paused','cancelled')),
  check (payment_status in ('paid','partial','unpaid','waived')),
  check (end_date >= start_date)
);

create table if not exists member_qr_codes (
  id              uuid  primary key default gen_random_uuid(),
  gym_id          uuid  not null references tenants(id) on delete cascade,
  member_id       uuid  not null references members(id) on delete cascade,
  qr_token_hash   text  not null unique,
  is_active       boolean not null default true,
  expires_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================================
-- DOMAIN 5: ATTENDANCE
-- ============================================================================

create table if not exists attendance_checkins (
  id                        uuid  primary key default gen_random_uuid(),
  gym_id                    uuid  not null references tenants(id) on delete cascade,
  branch_id                 uuid  references branches(id) on delete set null,
  member_id                 uuid  not null references members(id) on delete cascade,
  member_membership_id      uuid  references member_memberships(id) on delete set null,
  checkin_method            text  not null default 'qr',
  checkin_at                timestamptz not null default now(),
  checkout_at               timestamptz,
  checked_in_by_profile_id  uuid  references profiles(id) on delete set null,
  status                    text  not null default 'entered',
  denial_reason             text,
  created_at                timestamptz not null default now(),
  check (checkin_method in ('qr','manual','staff','kiosk')),
  check (status in ('entered','denied','completed'))
);

create table if not exists attendance_events (
  id          uuid  primary key default gen_random_uuid(),
  gym_id      uuid  not null references tenants(id) on delete cascade,
  member_id   uuid  references members(id) on delete set null,
  event_type  text  not null,
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  check (event_type in ('attempt','success','denied','checkout'))
);

-- ============================================================================
-- DOMAIN 6: WORKOUT
-- ============================================================================

create table if not exists exercise_categories (
  id          uuid  primary key default gen_random_uuid(),
  name        text  not null unique,
  slug        text  not null unique,
  created_at  timestamptz not null default now()
);

-- V2 exercise_media (replaces exercise_media_map)
create table if not exists exercise_media (
  id                uuid  primary key default gen_random_uuid(),
  exercise_id       uuid  not null references exercises(id) on delete cascade,
  media_type        text  not null,
  storage_key       text  not null,
  cdn_url           text  not null,
  quality_score     smallint default 5 check (quality_score between 1 and 10),
  is_preferred      boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (exercise_id, media_type),
  check (media_type in ('loop_gif','demo_gif','anatomy_png','thumbnail'))
);

create table if not exists workout_templates (
  id                        uuid  primary key default gen_random_uuid(),
  gym_id                    uuid  references tenants(id) on delete cascade,
  title                     text  not null,
  slug                      text  not null,
  description               text,
  category                  text,
  difficulty                text  not null default 'beginner',
  estimated_duration_minutes integer,
  is_featured               boolean not null default false,
  is_quick_start            boolean not null default false,
  is_published              boolean not null default true,
  source_type               text  not null default 'gym',
  created_by_profile_id     uuid  references profiles(id) on delete set null,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  unique (gym_id, slug),
  check (difficulty in ('beginner','intermediate','expert')),
  check (source_type in ('global','gym'))
);

create table if not exists workout_template_items (
  id                    uuid  primary key default gen_random_uuid(),
  workout_template_id   uuid  not null references workout_templates(id) on delete cascade,
  exercise_id           uuid  references exercises(id) on delete set null,
  step_order            integer not null default 0,
  title                 text,
  instruction_text      text,
  media_url             text,
  duration_seconds      integer,
  reps                  integer,
  sets                  integer,
  rest_seconds          integer,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create table if not exists member_workout_assignments (
  id                      uuid  primary key default gen_random_uuid(),
  gym_id                  uuid  not null references tenants(id) on delete cascade,
  member_id               uuid  not null references members(id) on delete cascade,
  workout_template_id     uuid  not null references workout_templates(id) on delete cascade,
  assigned_by_profile_id  uuid  references profiles(id) on delete set null,
  assigned_at             timestamptz not null default now(),
  starts_on               date,
  ends_on                 date,
  status                  text  not null default 'active',
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  check (status in ('assigned','active','completed','paused','cancelled'))
);

create table if not exists workout_session_items (
  id                  uuid  primary key default gen_random_uuid(),
  workout_session_id  uuid  not null references workout_sessions(id) on delete cascade,
  exercise_id         uuid  references exercises(id) on delete set null,
  sets_completed      integer,
  reps_completed      integer,
  duration_seconds    integer,
  weight_kg           numeric(6,2),
  completed_at        timestamptz,
  notes               text,
  created_at          timestamptz not null default now()
);

-- ============================================================================
-- DOMAIN 7: AUDIT
-- ============================================================================

create table if not exists audit_logs (
  id                      uuid  primary key default gen_random_uuid(),
  actor_profile_id        uuid  references profiles(id) on delete set null,
  actor_platform_admin_id uuid  references platform_admins(id) on delete set null,
  gym_id                  uuid  references tenants(id) on delete set null,
  action                  text  not null,
  entity_type             text  not null,
  entity_id               text,
  metadata                jsonb not null default '{}',
  created_at              timestamptz not null default now()
);

create table if not exists impersonation_sessions (
  id                  uuid  primary key default gen_random_uuid(),
  platform_admin_id   uuid  not null references platform_admins(id) on delete cascade,
  gym_id              uuid  not null references tenants(id) on delete cascade,
  reason              text,
  started_at          timestamptz not null default now(),
  ended_at            timestamptz,
  created_at          timestamptz not null default now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

create index if not exists idx_branches_gym          on branches(gym_id);
create index if not exists idx_gym_subs_gym          on gym_subscriptions(gym_id);
create index if not exists idx_gym_subs_status       on gym_subscriptions(status);
create index if not exists idx_gym_feat_gym          on gym_feature_overrides(gym_id);
create index if not exists idx_gym_roles_gym_prof    on gym_user_roles(gym_id, profile_id);
create index if not exists idx_gym_roles_profile     on gym_user_roles(profile_id);
create index if not exists idx_invites_gym           on invites(gym_id);
create index if not exists idx_invites_token         on invites(token_hash);
create index if not exists idx_members_gym           on members(gym_id);
create index if not exists idx_members_profile       on members(profile_id);
create index if not exists idx_members_status        on members(gym_id, status);
create index if not exists idx_members_email         on members(gym_id, email);
create index if not exists idx_mtype_gym             on membership_types(gym_id);
create index if not exists idx_mmship_member         on member_memberships(member_id);
create index if not exists idx_mmship_gym_status     on member_memberships(gym_id, status);
create index if not exists idx_mmship_dates          on member_memberships(end_date) where status = 'active';
create index if not exists idx_qr_member             on member_qr_codes(member_id);
create index if not exists idx_qr_token              on member_qr_codes(qr_token_hash) where is_active = true;
create index if not exists idx_checkins_gym_member   on attendance_checkins(gym_id, member_id);
create index if not exists idx_checkins_at           on attendance_checkins(checkin_at desc);
create index if not exists idx_checkins_gym_date     on attendance_checkins(gym_id, checkin_at desc);
create index if not exists idx_att_events_gym        on attendance_events(gym_id, created_at desc);
create index if not exists idx_ex_media_exercise     on exercise_media(exercise_id);
create index if not exists idx_ex_media_preferred    on exercise_media(exercise_id) where is_preferred = true;
create index if not exists idx_wt_gym                on workout_templates(gym_id);
create index if not exists idx_wt_items_template     on workout_template_items(workout_template_id, step_order);
create index if not exists idx_mwa_member            on member_workout_assignments(member_id);
create index if not exists idx_mwa_gym_status        on member_workout_assignments(gym_id, status);
create index if not exists idx_wsi_session           on workout_session_items(workout_session_id);
create index if not exists idx_audit_gym             on audit_logs(gym_id, created_at desc);
create index if not exists idx_audit_actor           on audit_logs(actor_profile_id);

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

do $$ begin
  -- plans
  if not exists (select 1 from pg_trigger where tgname = 'plans_updated_at') then
    create trigger plans_updated_at before update on plans
      for each row execute function update_updated_at_column();
  end if;
  -- branches
  if not exists (select 1 from pg_trigger where tgname = 'branches_updated_at') then
    create trigger branches_updated_at before update on branches
      for each row execute function update_updated_at_column();
  end if;
  -- gym_subscriptions
  if not exists (select 1 from pg_trigger where tgname = 'gym_subscriptions_updated_at') then
    create trigger gym_subscriptions_updated_at before update on gym_subscriptions
      for each row execute function update_updated_at_column();
  end if;
  -- gym_feature_overrides
  if not exists (select 1 from pg_trigger where tgname = 'gym_feature_overrides_updated_at') then
    create trigger gym_feature_overrides_updated_at before update on gym_feature_overrides
      for each row execute function update_updated_at_column();
  end if;
  -- gym_user_roles
  if not exists (select 1 from pg_trigger where tgname = 'gym_user_roles_updated_at') then
    create trigger gym_user_roles_updated_at before update on gym_user_roles
      for each row execute function update_updated_at_column();
  end if;
  -- members
  if not exists (select 1 from pg_trigger where tgname = 'members_updated_at') then
    create trigger members_updated_at before update on members
      for each row execute function update_updated_at_column();
  end if;
  -- membership_types
  if not exists (select 1 from pg_trigger where tgname = 'membership_types_updated_at') then
    create trigger membership_types_updated_at before update on membership_types
      for each row execute function update_updated_at_column();
  end if;
  -- member_memberships
  if not exists (select 1 from pg_trigger where tgname = 'member_memberships_updated_at') then
    create trigger member_memberships_updated_at before update on member_memberships
      for each row execute function update_updated_at_column();
  end if;
  -- member_qr_codes
  if not exists (select 1 from pg_trigger where tgname = 'member_qr_codes_updated_at') then
    create trigger member_qr_codes_updated_at before update on member_qr_codes
      for each row execute function update_updated_at_column();
  end if;
  -- exercise_media
  if not exists (select 1 from pg_trigger where tgname = 'exercise_media_updated_at') then
    create trigger exercise_media_updated_at before update on exercise_media
      for each row execute function update_updated_at_column();
  end if;
  -- workout_templates
  if not exists (select 1 from pg_trigger where tgname = 'workout_templates_updated_at') then
    create trigger workout_templates_updated_at before update on workout_templates
      for each row execute function update_updated_at_column();
  end if;
  -- workout_template_items
  if not exists (select 1 from pg_trigger where tgname = 'workout_template_items_updated_at') then
    create trigger workout_template_items_updated_at before update on workout_template_items
      for each row execute function update_updated_at_column();
  end if;
  -- member_workout_assignments
  if not exists (select 1 from pg_trigger where tgname = 'member_workout_assignments_updated_at') then
    create trigger member_workout_assignments_updated_at before update on member_workout_assignments
      for each row execute function update_updated_at_column();
  end if;
end $$;

-- ============================================================================
-- RLS HELPER FUNCTIONS (SECURITY DEFINER — never re-evaluate RLS inside)
-- ============================================================================

-- Is the current user a platform admin?
create or replace function is_platform_admin()
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from platform_admins
    where profile_id = auth.uid() and is_active = true
  );
$$;

-- Get the current user's role in a specific gym (null if not a member of that gym)
create or replace function get_gym_role(p_gym_id uuid)
returns text language sql stable security definer as $$
  select role from gym_user_roles
  where gym_id = p_gym_id and profile_id = auth.uid() and is_active = true
  limit 1;
$$;

-- Is the current user gym_owner or gym_admin in the given gym?
create or replace function is_gym_admin(p_gym_id uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from gym_user_roles
    where gym_id = p_gym_id
      and profile_id = auth.uid()
      and role in ('gym_owner','gym_admin')
      and is_active = true
  );
$$;

-- Is the current user any staff (owner/admin/front_desk/trainer) in the gym?
create or replace function is_gym_staff(p_gym_id uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from gym_user_roles
    where gym_id = p_gym_id
      and profile_id = auth.uid()
      and is_active = true
  );
$$;

-- Get the member row for the current user in a given gym
create or replace function get_member_id(p_gym_id uuid)
returns uuid language sql stable security definer as $$
  select id from members
  where gym_id = p_gym_id and profile_id = auth.uid()
  limit 1;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- plans — public read, platform admin write
alter table plans enable row level security;
drop policy if exists "plans_public_read"   on plans;
drop policy if exists "plans_platform_write" on plans;
create policy "plans_public_read"    on plans for select using (true);
create policy "plans_platform_write" on plans for all using (is_platform_admin());

-- platform_admins — platform admin only
alter table platform_admins enable row level security;
drop policy if exists "platform_admins_self_read" on platform_admins;
drop policy if exists "platform_admins_admin_all" on platform_admins;
create policy "platform_admins_self_read" on platform_admins
  for select using (profile_id = auth.uid());
create policy "platform_admins_admin_all" on platform_admins
  for all using (is_platform_admin());

-- branches — gym staff read, gym admin write
alter table branches enable row level security;
drop policy if exists "branches_staff_read"  on branches;
drop policy if exists "branches_admin_write" on branches;
create policy "branches_staff_read"  on branches for select using (is_gym_staff(gym_id));
create policy "branches_admin_write" on branches for all    using (is_gym_admin(gym_id));

-- gym_subscriptions — gym admin read, platform write
alter table gym_subscriptions enable row level security;
drop policy if exists "gym_subs_admin_read"     on gym_subscriptions;
drop policy if exists "gym_subs_platform_write" on gym_subscriptions;
create policy "gym_subs_admin_read"     on gym_subscriptions for select using (is_gym_admin(gym_id) or is_platform_admin());
create policy "gym_subs_platform_write" on gym_subscriptions for all    using (is_platform_admin());

-- gym_feature_overrides — gym admin read, platform write
alter table gym_feature_overrides enable row level security;
drop policy if exists "gfo_staff_read"     on gym_feature_overrides;
drop policy if exists "gfo_platform_write" on gym_feature_overrides;
create policy "gfo_staff_read"     on gym_feature_overrides for select using (is_gym_staff(gym_id));
create policy "gfo_platform_write" on gym_feature_overrides for all    using (is_platform_admin());

-- gym_user_roles — staff can read own gym roles; admin can manage
alter table gym_user_roles enable row level security;
drop policy if exists "gur_staff_read"  on gym_user_roles;
drop policy if exists "gur_admin_write" on gym_user_roles;
create policy "gur_staff_read"  on gym_user_roles for select using (is_gym_staff(gym_id) or profile_id = auth.uid());
create policy "gur_admin_write" on gym_user_roles for all    using (is_gym_admin(gym_id));

-- invites — gym admin manage
alter table invites enable row level security;
drop policy if exists "invites_admin_all" on invites;
create policy "invites_admin_all" on invites for all using (is_gym_admin(gym_id));

-- members — staff read/write, members read own record
alter table members enable row level security;
drop policy if exists "members_staff_all"  on members;
drop policy if exists "members_self_read"  on members;
create policy "members_staff_all" on members for all    using (is_gym_staff(gym_id));
create policy "members_self_read" on members for select using (profile_id = auth.uid());

-- membership_types — staff read, admin write
alter table membership_types enable row level security;
drop policy if exists "mtype_staff_read"  on membership_types;
drop policy if exists "mtype_admin_write" on membership_types;
create policy "mtype_staff_read"  on membership_types for select using (is_gym_staff(gym_id));
create policy "mtype_admin_write" on membership_types for all    using (is_gym_admin(gym_id));

-- member_memberships — staff manage; member reads own
alter table member_memberships enable row level security;
drop policy if exists "mmship_staff_all"  on member_memberships;
drop policy if exists "mmship_self_read"  on member_memberships;
create policy "mmship_staff_all" on member_memberships for all
  using (is_gym_staff(gym_id));
create policy "mmship_self_read" on member_memberships for select
  using (member_id = get_member_id(gym_id));

-- member_qr_codes — staff manage; member reads own
alter table member_qr_codes enable row level security;
drop policy if exists "qr_staff_all"  on member_qr_codes;
drop policy if exists "qr_self_read"  on member_qr_codes;
create policy "qr_staff_all" on member_qr_codes for all    using (is_gym_staff(gym_id));
create policy "qr_self_read" on member_qr_codes for select using (member_id = get_member_id(gym_id));

-- attendance_checkins — staff manage; member reads own
alter table attendance_checkins enable row level security;
drop policy if exists "checkins_staff_all"  on attendance_checkins;
drop policy if exists "checkins_self_read"  on attendance_checkins;
create policy "checkins_staff_all" on attendance_checkins for all
  using (is_gym_staff(gym_id));
create policy "checkins_self_read" on attendance_checkins for select
  using (member_id = get_member_id(gym_id));

-- attendance_events — staff read/insert; no member access
alter table attendance_events enable row level security;
drop policy if exists "att_events_staff_all" on attendance_events;
create policy "att_events_staff_all" on attendance_events for all using (is_gym_staff(gym_id));

-- exercise_categories — public read
alter table exercise_categories enable row level security;
drop policy if exists "ex_cat_public_read" on exercise_categories;
create policy "ex_cat_public_read" on exercise_categories for select using (true);

-- exercise_media — public read; platform admin write
alter table exercise_media enable row level security;
drop policy if exists "ex_media_public_read"    on exercise_media;
drop policy if exists "ex_media_platform_write" on exercise_media;
create policy "ex_media_public_read"    on exercise_media for select using (true);
create policy "ex_media_platform_write" on exercise_media for all    using (is_platform_admin());

-- workout_templates — authenticated read; gym admin write
alter table workout_templates enable row level security;
drop policy if exists "wt_auth_read"    on workout_templates;
drop policy if exists "wt_admin_write"  on workout_templates;
create policy "wt_auth_read"   on workout_templates for select using (auth.role() = 'authenticated');
create policy "wt_admin_write" on workout_templates for all    using (is_gym_admin(gym_id) or is_platform_admin());

-- workout_template_items — same as templates
alter table workout_template_items enable row level security;
drop policy if exists "wti_auth_read"    on workout_template_items;
drop policy if exists "wti_admin_write"  on workout_template_items;
create policy "wti_auth_read"   on workout_template_items for select using (auth.role() = 'authenticated');
create policy "wti_admin_write" on workout_template_items for all
  using (exists (
    select 1 from workout_templates wt
    where wt.id = workout_template_id and is_gym_admin(wt.gym_id)
  ));

-- member_workout_assignments — staff manage; member reads own
alter table member_workout_assignments enable row level security;
drop policy if exists "mwa_staff_all"  on member_workout_assignments;
drop policy if exists "mwa_self_read"  on member_workout_assignments;
create policy "mwa_staff_all" on member_workout_assignments for all
  using (is_gym_staff(gym_id));
create policy "mwa_self_read" on member_workout_assignments for select
  using (member_id = get_member_id(gym_id));

-- workout_session_items — via session ownership
alter table workout_session_items enable row level security;
drop policy if exists "wsi_session_owner" on workout_session_items;
create policy "wsi_session_owner" on workout_session_items for all
  using (exists (
    select 1 from workout_sessions ws
    where ws.id = workout_session_id and ws.member_id = auth.uid()
  ));

-- audit_logs — platform and gym admin read; append-only via service role
alter table audit_logs enable row level security;
drop policy if exists "audit_platform_read" on audit_logs;
drop policy if exists "audit_gym_read"      on audit_logs;
create policy "audit_platform_read" on audit_logs for select using (is_platform_admin());
create policy "audit_gym_read"      on audit_logs for select
  using (gym_id is not null and is_gym_admin(gym_id));

-- impersonation_sessions — platform admin only
alter table impersonation_sessions enable row level security;
drop policy if exists "impersonation_platform_all" on impersonation_sessions;
create policy "impersonation_platform_all" on impersonation_sessions
  for all using (is_platform_admin());

-- ============================================================================
-- SEED: exercise_categories (7 from free-exercise-db)
-- ============================================================================

insert into exercise_categories (name, slug) values
  ('Strength',    'strength'),
  ('Cardio',      'cardio'),
  ('Stretching',  'stretching'),
  ('Plyometrics', 'plyometrics'),
  ('Powerlifting','powerlifting'),
  ('Olympic Weightlifting', 'olympic-weightlifting'),
  ('Strongman',   'strongman')
on conflict (slug) do nothing;

-- ============================================================================
-- SEED: exercise_media (loop_gif + demo_gif for all seeded exercises)
-- Inserts media rows for exercises that have gifPath or demoGifPath.
-- CDN base: https://pub-135146decfd44634b9e8e73a717545d1.r2.dev
-- ============================================================================

do $$
declare
  cdn text := 'https://pub-135146decfd44634b9e8e73a717545d1.r2.dev';
  ex  record;
begin
  for ex in select id, source_id from exercises where is_active = true and source_id is not null loop
    -- loop_gif: every exercise has one (R2 key uses source_id, e.g. "Barbell_Curl")
    insert into exercise_media (exercise_id, media_type, storage_key, cdn_url, quality_score, is_preferred)
    values (
      ex.id,
      'loop_gif',
      'exercises/' || ex.source_id || '/loop.gif',
      cdn || '/exercises/' || ex.source_id || '/loop.gif',
      5,
      true   -- default preferred; overridden below if demo exists
    )
    on conflict (exercise_id, media_type) do nothing;
  end loop;
end $$;

-- ============================================================================
-- SEED: platform plans (starter / track / premium)
-- ============================================================================

insert into plans (name, slug, price_monthly_kes, price_yearly_kes, member_limit, branch_limit, staff_limit, attendance_enabled, workouts_enabled, analytics_enabled, branding_enabled, campaigns_enabled) values
  ('Starter',  'starter',  0,      0,       50,   1, 2,  true,  false, false, false, false),
  ('Track',    'track',    2999,   29999,   200,  1, 5,  true,  true,  false, false, false),
  ('Premium',  'premium',  6999,   69999,   1000, 3, 20, true,  true,  true,  true,  true)
on conflict (slug) do nothing;
