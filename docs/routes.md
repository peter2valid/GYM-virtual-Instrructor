# Routes

## Route Groups Overview

### Public Routes (No Auth Required)

| Route | Purpose |
|---|---|
| `/` | Marketing landing page |
| `/pricing` | Subscription plan details |
| `/contact` | Contact form |
| `/g/[gymSlug]` | Gym member landing (QR code destination) |
| `/g/[gymSlug]/workouts` | Gym workout catalog (Starter plan) |
| `/g/[gymSlug]/workouts/[workoutId]` | Workout detail + steps |
| `/g/[gymSlug]/session/[sessionId]` | Live workout session |

### Auth Routes

| Route | Purpose |
|---|---|
| `/login` | Sign in (gym admins + members) |
| `/signup` | Create account |

### Protected Routes (Require Auth — Phase 1)

| Route | Role Required | Purpose |
|---|---|---|
| `/g/[gymSlug]/progress` | member | Personal progress dashboard |
| `/g/[gymSlug]/history` | member | Past session history |
| `/gym-admin` | gym_admin | Gym dashboard overview |
| `/gym-admin/members` | gym_admin | Member management |
| `/gym-admin/workouts` | gym_admin | Workout catalog management |
| `/gym-admin/analytics` | gym_admin | Attendance + workout analytics |
| `/gym-admin/settings` | gym_admin | Gym profile + preferences |
| `/super-admin` | super_admin | Platform overview |
| `/super-admin/gyms` | super_admin | All tenants list |
| `/super-admin/subscriptions` | super_admin | Subscription + billing view |
| `/super-admin/support` | super_admin | Support requests |

---

## Gym Slug Tenant Context

The `[gymSlug]` URL parameter is the primary way the member app identifies which tenant is being accessed.

In Phase 1, middleware will:
1. Extract `gymSlug` from the URL path
2. Look up the corresponding tenant record in Supabase
3. Attach tenant context to the request
4. Verify the tenant is active and the requested feature is available under their plan

This approach ensures clean, shareable gym-specific URLs (e.g. `platform.com/g/iron-forge-gym`) and provides a natural multi-tenant boundary.

---

## Route Group Notes

- `(marketing)` and `(auth)` are Next.js route groups — they do not appear in the URL
- All `/g/[gymSlug]` routes share a layout with a minimal gym-branded header
- `/gym-admin` and `/super-admin` share dashboard-style layouts with sidebar navigation
- The home page `/` lives outside all route groups and renders the marketing landing
