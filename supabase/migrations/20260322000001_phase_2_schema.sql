-- ============================================================
-- Phase 2 Schema Migration
-- Gym Instructor Platform — Multi-tenant production schema
-- ============================================================

-- ─── Utilities ───────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── 1. TENANTS ──────────────────────────────────────────────────────────────
-- One row per gym. The anchor for all tenant-scoped data.

create table tenants (
  id                   uuid        primary key default gen_random_uuid(),
  name                 text        not null,
  slug                 text        unique not null,
  logo_url             text,
  primary_color        text,
  secondary_color      text,
  welcome_message      text,
  subscription_plan    text        not null default 'starter',
  subscription_status  text        not null default 'active',
  is_active            boolean     not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint tenants_subscription_plan_check
    check (subscription_plan in ('starter', 'track', 'premium')),
  constraint tenants_subscription_status_check
    check (subscription_status in ('active', 'past_due', 'cancelled', 'trialing'))
);

create trigger tenants_updated_at
  before update on tenants
  for each row execute function update_updated_at_column();

-- ─── 2. TENANT_SETTINGS ──────────────────────────────────────────────────────
-- Behavior/config flags per tenant. One row per tenant.

create table tenant_settings (
  id                          uuid        primary key default gen_random_uuid(),
  tenant_id                   uuid        not null references tenants(id) on delete cascade,
  show_login_required         boolean     not null default false,
  show_quick_start            boolean     not null default true,
  default_recommendation_mode text        not null default 'manual',
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  constraint tenant_settings_tenant_id_unique unique (tenant_id),
  constraint tenant_settings_recommendation_mode_check
    check (default_recommendation_mode in ('manual', 'equipment_match', 'level_match'))
);

create trigger tenant_settings_updated_at
  before update on tenant_settings
  for each row execute function update_updated_at_column();

-- ─── 3. EXERCISES ────────────────────────────────────────────────────────────
-- Global exercise library. NOT tenant-specific.
-- Populated from external datasets (free-exercise-db, curated sources).
-- image_1_url / image_2_url = static fallback photos (source DB).
-- media_loop_url = preferred looping visual (GIF or MP4/WebM URL).

create table exercises (
  id                uuid        primary key default gen_random_uuid(),
  source_id         text,
  source_name       text,
  slug              text        unique not null,
  name              text        not null,
  description       text,
  category          text,
  level             text,
  force             text,
  mechanic          text,
  equipment         text,
  primary_muscles   jsonb       not null default '[]'::jsonb,
  secondary_muscles jsonb       not null default '[]'::jsonb,
  instructions      jsonb       not null default '[]'::jsonb,
  image_1_url       text,
  image_2_url       text,
  media_loop_url    text,
  is_active         boolean     not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger exercises_updated_at
  before update on exercises
  for each row execute function update_updated_at_column();

-- ─── 4. EXERCISE_MEDIA_MAP ───────────────────────────────────────────────────
-- Maps exercises to better-quality visual media.
-- Supports multiple media rows per exercise (GIF, MP4, WebM, image pairs).
-- is_preferred = true marks the single best media for display.
-- Convention: only one is_preferred = true per exercise_id.
-- This is enforced in query logic (LIMIT 1 on is_preferred), not by a DB constraint,
-- because we may need to stage a replacement preferred row before unsetting the old one.

create table exercise_media_map (
  id               uuid        primary key default gen_random_uuid(),
  exercise_id      uuid        not null references exercises(id) on delete cascade,
  media_type       text        not null,
  media_url        text        not null,
  thumbnail_url    text,
  anatomy_image_url text,
  source_name      text,
  quality_score    integer,
  is_preferred     boolean     not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint exercise_media_map_type_check
    check (media_type in ('gif', 'mp4', 'webm', 'image_pair'))
);

create trigger exercise_media_map_updated_at
  before update on exercise_media_map
  for each row execute function update_updated_at_column();

-- ─── 5. EQUIPMENT_TYPES ──────────────────────────────────────────────────────
-- Global catalog of equipment types.

create table equipment_types (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,
  slug       text        unique not null,
  created_at timestamptz not null default now()
);

-- ─── 6. TENANT_EQUIPMENT_PROFILES ────────────────────────────────────────────
-- What equipment each gym has available.
-- Drives future equipment-based workout recommendations.

create table tenant_equipment_profiles (
  id                uuid        primary key default gen_random_uuid(),
  tenant_id         uuid        not null references tenants(id) on delete cascade,
  equipment_type_id uuid        not null references equipment_types(id) on delete cascade,
  quantity          integer,
  is_available      boolean     not null default true,
  created_at        timestamptz not null default now(),
  constraint tenant_equipment_profiles_unique unique (tenant_id, equipment_type_id)
);

-- ─── 7. WORKOUTS ─────────────────────────────────────────────────────────────
-- Curated workout programs. Can be tenant-specific or global.
--
-- Tenant isolation strategy: nullable tenant_id + source_type
--   tenant_id = NULL, source_type = 'global'  → available to all tenants
--   tenant_id = uuid, source_type = 'tenant'  → belongs to one gym
--
-- This is cleaner than a separate global_workouts table because:
--   - Single query surface for both types
--   - Easy to promote a tenant workout to global
--   - tenant_workout_preferences controls what each gym actually shows
--
-- Slug uniqueness is enforced per scope via partial indexes below.

create table workouts (
  id                         uuid        primary key default gen_random_uuid(),
  tenant_id                  uuid        references tenants(id) on delete cascade,
  title                      text        not null,
  slug                       text        not null,
  description                text,
  category                   text,
  difficulty                 text,
  estimated_duration_minutes integer,
  is_featured                boolean     not null default false,
  is_quick_start             boolean     not null default false,
  is_published               boolean     not null default true,
  recommendation_priority    integer     not null default 0,
  source_type                text        not null default 'tenant',
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now(),
  constraint workouts_source_type_check
    check (source_type in ('tenant', 'global')),
  constraint workouts_difficulty_check
    check (difficulty in ('beginner', 'intermediate', 'advanced') or difficulty is null)
);

-- Slug unique per tenant
create unique index workouts_slug_tenant_unique
  on workouts(tenant_id, slug)
  where tenant_id is not null;

-- Slug unique among global workouts
create unique index workouts_slug_global_unique
  on workouts(slug)
  where tenant_id is null;

create trigger workouts_updated_at
  before update on workouts
  for each row execute function update_updated_at_column();

-- ─── 8. WORKOUT_STEPS ────────────────────────────────────────────────────────
-- Individual steps that power the session engine.
-- exercise_id links to the global exercise library (optional — custom steps allowed).
-- media_url on the step is an override; media resolution logic prefers this
-- over exercise-level media when set.

create table workout_steps (
  id               uuid        primary key default gen_random_uuid(),
  workout_id       uuid        not null references workouts(id) on delete cascade,
  exercise_id      uuid        references exercises(id) on delete set null,
  step_order       integer     not null,
  title            text        not null,
  instruction_text text,
  media_url        text,
  duration_seconds integer,
  reps             integer,
  sets             integer,
  rest_seconds     integer,
  custom_metadata  jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint workout_steps_order_unique unique (workout_id, step_order)
);

create trigger workout_steps_updated_at
  before update on workout_steps
  for each row execute function update_updated_at_column();

-- ─── 9. TENANT_WORKOUT_PREFERENCES ───────────────────────────────────────────
-- Controls which workouts each gym shows, and how they're positioned.
-- This is the mechanism for super admin (or future gym admin) to configure
-- a gym's workout catalog without touching code.
-- is_quick_start here overrides the workout-level is_quick_start for this tenant.

create table tenant_workout_preferences (
  id             uuid        primary key default gen_random_uuid(),
  tenant_id      uuid        not null references tenants(id) on delete cascade,
  workout_id     uuid        not null references workouts(id) on delete cascade,
  is_recommended boolean     not null default false,
  is_quick_start boolean     not null default false,
  display_order  integer     not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint tenant_workout_prefs_unique unique (tenant_id, workout_id)
);

create trigger tenant_workout_preferences_updated_at
  before update on tenant_workout_preferences
  for each row execute function update_updated_at_column();

-- ─── 10. FEATURE_FLAGS ───────────────────────────────────────────────────────
-- Tenant-level package feature gates.
-- Starter: all false by default.
-- Track/Premium: enabled by super admin during onboarding.

create table feature_flags (
  id          uuid        primary key default gen_random_uuid(),
  tenant_id   uuid        not null references tenants(id) on delete cascade,
  feature_key text        not null,
  enabled     boolean     not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint feature_flags_unique unique (tenant_id, feature_key)
);

create trigger feature_flags_updated_at
  before update on feature_flags
  for each row execute function update_updated_at_column();

-- ─── 11. PROFILES ────────────────────────────────────────────────────────────
-- App-level user profiles. id matches Supabase Auth user id (uuid).
-- role drives access control: member | gym_admin | super_admin.
-- super_admin is not scoped to a tenant (tenant_id still required for non-super roles).

create table profiles (
  id         uuid        primary key,
  tenant_id  uuid        not null references tenants(id) on delete cascade,
  full_name  text,
  age        integer,
  role       text        not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_check
    check (role in ('member', 'gym_admin', 'super_admin'))
);

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at_column();

-- ─── 12. WORKOUT_SESSIONS ────────────────────────────────────────────────────
-- Track package foundation. Records each time a member starts a workout.
-- member_id is nullable to support anonymous sessions (Starter plan).

create table workout_sessions (
  id                     uuid        primary key default gen_random_uuid(),
  tenant_id              uuid        not null references tenants(id) on delete cascade,
  member_id              uuid        references profiles(id) on delete set null,
  workout_id             uuid        not null references workouts(id) on delete cascade,
  started_at             timestamptz not null default now(),
  completed_at           timestamptz,
  status                 text        not null default 'started',
  completion_percent     integer,
  total_duration_seconds integer,
  created_at             timestamptz not null default now(),
  constraint workout_sessions_status_check
    check (status in ('started', 'completed', 'abandoned'))
);

-- ─── 13. ATTENDANCE_LOGS ─────────────────────────────────────────────────────
-- Track package foundation. Records gym visits.
-- member_id nullable for future anonymous check-in flows.

create table attendance_logs (
  id              uuid        primary key default gen_random_uuid(),
  tenant_id       uuid        not null references tenants(id) on delete cascade,
  member_id       uuid        references profiles(id) on delete set null,
  attendance_date date        not null,
  source          text        not null default 'qr_scan',
  created_at      timestamptz not null default now(),
  constraint attendance_logs_source_check
    check (source in ('qr_scan', 'manual', 'app'))
);

-- ─── INDEXES ─────────────────────────────────────────────────────────────────

-- tenants
create index idx_tenants_slug              on tenants(slug);
create index idx_tenants_is_active         on tenants(is_active) where is_active = true;

-- exercises
create index idx_exercises_slug            on exercises(slug);
create index idx_exercises_category        on exercises(category);
create index idx_exercises_level           on exercises(level);
create index idx_exercises_equipment       on exercises(equipment);

-- exercise_media_map
create index idx_emm_exercise_id           on exercise_media_map(exercise_id);
create index idx_emm_preferred             on exercise_media_map(exercise_id) where is_preferred = true;

-- workouts
create index idx_workouts_tenant_id        on workouts(tenant_id);
create index idx_workouts_featured         on workouts(tenant_id, is_featured)    where is_featured = true;
create index idx_workouts_quick_start      on workouts(tenant_id, is_quick_start) where is_quick_start = true;
create index idx_workouts_published        on workouts(tenant_id, is_published)   where is_published = true;
create index idx_workouts_category         on workouts(tenant_id, category);
create index idx_workouts_priority         on workouts(tenant_id, recommendation_priority desc);

-- workout_steps
create index idx_workout_steps_workout_id  on workout_steps(workout_id);
create index idx_workout_steps_order       on workout_steps(workout_id, step_order);
create index idx_workout_steps_exercise_id on workout_steps(exercise_id) where exercise_id is not null;

-- tenant_workout_preferences
create index idx_twp_tenant_id             on tenant_workout_preferences(tenant_id);
create index idx_twp_display_order         on tenant_workout_preferences(tenant_id, display_order);
create index idx_twp_quick_start           on tenant_workout_preferences(tenant_id, is_quick_start)  where is_quick_start = true;
create index idx_twp_recommended           on tenant_workout_preferences(tenant_id, is_recommended)  where is_recommended = true;

-- feature_flags
create index idx_feature_flags_tenant_id   on feature_flags(tenant_id);

-- profiles
create index idx_profiles_tenant_id        on profiles(tenant_id);
create index idx_profiles_role             on profiles(tenant_id, role);

-- workout_sessions
create index idx_ws_tenant_member          on workout_sessions(tenant_id, member_id);
create index idx_ws_workout_id             on workout_sessions(workout_id);
create index idx_ws_status                 on workout_sessions(tenant_id, status);
create index idx_ws_started_at             on workout_sessions(tenant_id, started_at desc);

-- attendance_logs
create index idx_al_tenant_date            on attendance_logs(tenant_id, attendance_date);
create index idx_al_tenant_member          on attendance_logs(tenant_id, member_id);

-- tenant_equipment_profiles
create index idx_tep_tenant_id             on tenant_equipment_profiles(tenant_id);
