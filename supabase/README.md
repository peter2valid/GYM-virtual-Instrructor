# Supabase

This directory contains database migrations and seed data for the Gym Instructor Platform.

## Structure

- `migrations/` — Supabase migration files (managed via Supabase CLI)
- `seed.sql` — Development seed data

## Phase 0 Status

Database schema has not been created yet. Phase 1 will define:

- `tenants` — gym tenant records
- `profiles` — user profiles linked to Supabase Auth
- `workouts` — gym workout catalog
- `workout_steps` — individual steps within a workout
- `workout_sessions` — member session records
- `attendance_logs` — check-in/out records

## Getting Started (Phase 1)

1. Install Supabase CLI: `npm install -g supabase`
2. Run `supabase init` in the project root
3. Create migration files in `migrations/`
4. Apply with `supabase db push` or `supabase migration up`
