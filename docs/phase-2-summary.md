# Phase 2 Summary

## What Was Built

Phase 2 replaces the Phase 1 mock data system with a production-grade Supabase-backed multi-tenant data architecture. The member UI is fully preserved.

---

## Files Created

| File | Purpose |
|------|---------|
| `supabase/migrations/20260322000001_phase_2_schema.sql` | Full schema migration |
| `supabase/seed.sql` | Iron House Gym seed data (full dataset) |
| `src/types/exercise.ts` | Exercise, ExerciseMedia, ResolvedExerciseMedia types |
| `src/features/exercises/queries.ts` | Exercise DB queries |
| `src/features/exercises/mappers.ts` | DB row → TypeScript type mappers |
| `src/features/media/helpers.ts` | Media resolution utilities |
| `docs/phase-2-architecture.md` | Architecture decisions + schema rationale |
| `docs/exercise-import-plan.md` | How external datasets map into DB |
| `docs/phase-2-summary.md` | This file |

---

## Files Changed

| File | What Changed |
|------|-------------|
| `supabase/seed.sql` | Full rewrite — from placeholder to complete seed |
| `src/types/workout.ts` | Updated Workout + WorkoutStep to match DB schema |
| `src/types/tenant.ts` | Updated Tenant, added TenantSettings, FeatureFlag, EquipmentType |
| `src/types/index.ts` | Added exercise type exports |
| `src/lib/supabase/index.ts` | Added `isSupabaseConfigured` export |
| `src/features/tenants/queries.ts` | Full rewrite — Supabase + mock fallback |
| `src/features/workouts/queries.ts` | Full rewrite — Supabase + mock fallback |
| `src/features/workouts/mock-workouts.ts` | Updated to match new Workout type |
| `src/features/tenants/mock-tenants.ts` | Updated to match new Tenant type |
| `src/app/g/[gymSlug]/page.tsx` | Uses new async query functions |
| `src/app/g/[gymSlug]/workouts/page.tsx` | Uses new async query functions |
| `src/app/g/[gymSlug]/workouts/[workoutId]/page.tsx` | Uses new async query functions |
| `src/app/g/[gymSlug]/workouts/[workoutId]/session/page.tsx` | Uses new async query functions |

---

## Migration

1 migration file: `20260322000001_phase_2_schema.sql`

Apply with:
```bash
supabase db push
# or
supabase migration up
```

---

## Tables Created (13)

| Table | Description |
|-------|-------------|
| `tenants` | One row per gym |
| `tenant_settings` | Behavior flags per tenant |
| `exercises` | Global exercise library |
| `exercise_media_map` | Better visual media per exercise |
| `equipment_types` | Global equipment catalog |
| `tenant_equipment_profiles` | What equipment each gym has |
| `workouts` | Curated workout programs (tenant or global) |
| `workout_steps` | Steps within a workout |
| `tenant_workout_preferences` | Per-gym content catalog + ordering |
| `feature_flags` | Package feature gates per tenant |
| `profiles` | App users (future auth) |
| `workout_sessions` | Session tracking (Track package) |
| `attendance_logs` | Attendance tracking (Track package) |

---

## Indexes Created

37 indexes across all tables. Key ones:

- `idx_tenants_slug` — tenant resolution by URL slug (every page load)
- `idx_workouts_tenant_id` — all workout queries
- `idx_twp_quick_start` — quick start section
- `idx_twp_recommended` — featured section
- `idx_workout_steps_order` — step ordering in session
- `idx_emm_preferred` — preferred media lookup per exercise

---

## Query Functions Added

### `src/features/tenants/queries.ts`
- `getTenantBySlug(slug)` — async, Supabase + mock fallback
- `getTenantById(id)` — async, Supabase + mock fallback
- `getTenantSettings(tenantId)` — async
- `getFeatureFlagsForTenant(tenantId)` — async, returns typed key map
- `getTenantEquipmentProfile(tenantId)` — async

### `src/features/workouts/queries.ts`
- `getWorkoutsByTenant(tenantId, filters?)` — async, Supabase + mock fallback
- `getWorkoutBySlugOrId(tenantId, identifier)` — async, UUID or slug lookup
- `getCategoriesForTenant(tenantId)` — async
- `getQuickStartWorkoutsForTenant(tenantId)` — async, DB-driven
- `getFeaturedWorkoutsForTenant(tenantId, count?)` — async, DB-driven
- `getRecommendedWorkoutsForTenant(tenantId)` — async

### `src/features/exercises/queries.ts`
- `getExerciseById(id)` — async
- `getExercises(filters?)` — async
- `getPreferredMediaForExercise(exerciseId)` — async, single exercise
- `getPreferredMediaForExercises(exerciseIds[])` — async, batch (N exercises in 1 query)

---

## Routes Now Using Real Supabase Data

All 4 member-facing routes now call async query functions:

| Route | Before | After |
|-------|--------|-------|
| `/g/[gymSlug]` | Sync mock calls | `await Promise.all([quickStarts, featured, categories])` |
| `/g/[gymSlug]/workouts` | Sync mock calls | `await Promise.all([workouts, categories])` |
| `/g/[gymSlug]/workouts/[workoutId]` | Sync mock call | `await getWorkoutBySlugOrId()` — includes steps |
| `/g/[gymSlug]/workouts/[workoutId]/session` | Sync mock call | `await getWorkoutBySlugOrId()` — includes steps + media |

---

## How Exercises and Visuals Are Separated

```
exercises           — metadata, instructions, source images
exercise_media_map  — curated visual media (GIFs, future MP4/WebM)
workout_steps       — links a workout step to an exercise (optional)
```

A `WorkoutStep` has an `exerciseId`. The query layer resolves the best available media for that exercise and puts the URL into `step.mediaUrl`. UI components receive a ready-to-render URL — they never implement media resolution logic.

---

## How Media Fallback Works

```
1. workout_steps.media_url     (admin override on the step)
2. exercise_media_map preferred (curated GIF/video)
3. exercises.media_loop_url    (source DB looping image)
4. exercises.image_1_url       (source DB static photo)
5. null                        (SessionScreen shows category icon)
```

---

## How Gym Recommendations Work

Quick starts and featured workouts come from `tenant_workout_preferences` rows in the database — not from hardcoded arrays or application logic.

```sql
-- Quick start workouts for a gym
SELECT w.* FROM workouts w
JOIN tenant_workout_preferences twp ON twp.workout_id = w.id
WHERE twp.tenant_id = $1 AND twp.is_quick_start = true
ORDER BY twp.display_order;

-- Featured workouts for a gym
SELECT w.* FROM workouts w
JOIN tenant_workout_preferences twp ON twp.workout_id = w.id
WHERE twp.tenant_id = $1 AND twp.is_recommended = true
ORDER BY twp.display_order;
```

A super admin adds/removes rows in this table to control what each gym sees. No code changes required.

---

## Mock Fallback

All query functions check `isSupabaseConfigured` before hitting Supabase. If env vars are not set (local dev without a DB), they return mock data. This means the app continues to run in development with `npm run dev` before Supabase is connected.

---

## What Is Ready Now

- Production schema for all 13 tables
- Full seed for Iron House Gym (10 workouts, 49 steps, equipment, flags)
- Supabase-backed query layer with mock fallback
- All member-facing routes wired to real DB
- Exercise library foundation ready for bulk import
- `exercise_media_map` schema ready for GIF/MP4/WebM mapping
- Feature flag system wired and typed
- TypeScript clean (zero errors)

---

## Intentionally Left for Phase 3

- **Auth flows**: Supabase Auth integration, login/signup pages, session cookies
- **RLS policies**: Row-level security on all tables
- **Route protection middleware**: Redirect unauthenticated users
- **Super admin UI**: Dashboard to onboard gyms, manage flags, assign content
- **Gym admin UI**: Dashboard for gym operators
- **Member dashboard**: Workout history, progress, attendance
- **Full exercise import**: Run `scripts/import-exercises.ts` against full 873-exercise dataset
- **GIF/media import**: Run `scripts/import-exercise-media.ts` to map visual assets
- **Cloudflare R2 setup**: Object storage for media files
- **GIF → MP4/WebM conversion**: Production media quality upgrade
- **Sentry integration**: Error tracking
- **Analytics dashboards**: Session stats, attendance reports
