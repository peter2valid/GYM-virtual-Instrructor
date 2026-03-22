# Phase 2 Architecture

## Overview

Phase 2 replaces the mock data layer with a production-grade Supabase-backed multi-tenant architecture. The member-facing UI from Phase 1 is unchanged. What changed is the data source behind it.

---

## Database Schema

### Why exercises are global and workouts are tenant-specific

**Exercises** are a universal catalog — a barbell squat is the same movement at every gym. Having a single global `exercises` table means:
- One place to update metadata, instructions, and media
- Exercises can be enriched (add GIFs, update instructions) independently of which gyms use them
- Future AI recommendation features can query the full catalog without tenant scoping

**Workouts** are curated programs — they reflect programming decisions, not just exercises. A gym's "Beginner Chest Day" might use 4 exercises with specific rep/set schemes, in a specific order, branded with the gym's style. Workouts are therefore tenant-owned.

**Global workouts** (source_type = 'global', tenant_id = NULL) are a future mechanism for system-provided default programs that any gym can use. Currently all seeded workouts are tenant-specific.

### Tenant isolation

Every query against tenant data passes `tenant_id` explicitly. There is no row-level security configured in Phase 2 (auth is Phase 3), but the schema and query layer are structured so that adding RLS policies requires no schema changes — only SQL policy additions.

The tenant resolution chain in all member-facing routes:
```
URL slug → getTenantBySlug() → tenant.id → all downstream queries
```

No cross-tenant data leakage is possible when this chain is followed because every query is scoped by the resolved `tenant.id`.

### Workout scoping pattern

```
tenant_workout_preferences
  ├── tenant_id       → which gym
  ├── workout_id      → which workout
  ├── is_quick_start  → show in "Start now" section
  ├── is_recommended  → show in "Featured" section
  └── display_order   → sort order within each section
```

This table is the configuration surface for gym content. A super admin sets these rows when onboarding a new gym. No code changes are required to give a new gym a completely different workout catalog and quick-start selection.

---

## Super Admin Onboarding Path

To onboard a new gym without touching code:

1. Insert a row into `tenants` with `slug`, `name`, `subscription_plan`
2. Insert a row into `tenant_settings`
3. Insert rows into `feature_flags` for the gym's package
4. Insert rows into `tenant_equipment_profiles` for available equipment
5. Insert rows into `tenant_workout_preferences` linking the gym to desired workouts, flagging quick starts and featured items

The gym is immediately live at `/g/[slug]` with the configured content.

---

## Feature Flags and Package Logic

Package tiers (Starter / Track / Premium) are not hardcoded conditionals. Each feature is a row in `feature_flags`:

| Key | Starter | Track | Premium |
|-----|---------|-------|---------|
| member_login | off | on | on |
| attendance_tracking | off | on | on |
| workout_history | off | on | on |
| member_dashboard | off | on | on |
| gym_admin_dashboard | off | off | on |
| premium_branding | off | off | on |
| advanced_analytics | off | off | on |
| custom_recommendations | off | off | on |

When upgrading a gym's plan, a super admin flips the relevant flags. UI gates read `getFeatureFlagsForTenant(tenantId)` and render accordingly. No deploy needed.

---

## exercise_media_map and Why It Exists

The global `exercises` table has two static JPGs per exercise (start/end positions). These are useful but not ideal for a workout session — members want to see movement, not a pose.

`exercise_media_map` allows attaching better visual media to any exercise without modifying the source exercise record:

- Multiple media rows per exercise supported (GIF, MP4, WebM, image pair)
- `is_preferred = true` marks the one that's actually displayed
- `anatomy_image_url` can hold a muscle diagram alongside the motion GIF

This separation means:
1. The exercise library stays clean and source-accurate
2. Visual quality can be improved incrementally without database churn
3. Different media formats can coexist as the platform migrates from GIF to MP4/WebM

---

## Media Strategy: GIF is Transitional

The current collected GIF pack is used as a visual layer during Phase 2. The long-term media strategy is:

| Phase | Media format | Storage |
|-------|-------------|---------|
| 2 (now) | GIF (local or hosted) | File system / public URL |
| 3 | MP4/WebM converted from GIF | Cloudflare R2 |
| Future | Original MP4/WebM recordings | Cloudflare R2 |

GIFs are mapped via `exercise_media_map`. When a GIF is converted to MP4/WebM:
1. Upload to R2
2. Update `exercise_media_map.media_url` to R2 URL
3. Update `media_type` to 'mp4' or 'webm'

No UI changes required — the media resolution chain handles the format transparently.

---

## Media Resolution Chain

Implemented in `src/features/exercises/mappers.ts` and `src/features/media/helpers.ts`. Applied in workout step queries.

```
1. workout_steps.media_url         → step-level override (admin-set)
2. exercise_media_map (is_preferred) → curated best media
3. exercises.media_loop_url        → source DB looping visual
4. exercises.image_1_url           → source DB static image
5. null                            → SessionScreen renders placeholder
```

This logic is centralized. UI components receive a resolved `mediaUrl` field on each `WorkoutStep` — they never implement this logic themselves.
