# Architecture

## Product Overview

The Gym Instructor Platform is a multi-tenant SaaS application that allows gym owners to provide a branded, mobile-first workout experience to their members. Gym members scan a QR code unique to their gym, which opens a gym-specific web experience where they can access guided workouts and — depending on subscription tier — track their progress.

---

## Why Single Repo

A single Next.js application was chosen over a monorepo or separate backend because:

- The product is in early stage — simplicity reduces operational overhead
- Next.js App Router supports server-side data access natively, removing the need for a separate API server in V1
- Deployment is simpler (single Vercel project)
- All three surfaces (member app, gym admin, super admin) share types, utilities, and UI components
- Splitting into multiple repos at this stage would introduce unnecessary complexity

This decision can be revisited post-V1 if the codebase grows significantly.

---

## Why Next.js App Router

- Server Components by default — better performance, smaller client bundles
- Nested layouts — clean separation between member, admin, and super admin surfaces
- Route Groups — logical grouping without affecting URL structure
- Built-in support for streaming and caching
- First-class TypeScript support
- Excellent Vercel deployment integration

---

## Why Multi-Tenant Architecture from Day One

Every gym is a tenant. Even in Phase 0 scaffolding:

- All data types include `tenantId`
- Route structure uses `gymSlug` to identify the tenant in the member experience
- Permissions module is structured around roles scoped to tenants
- Supabase RLS will enforce tenant isolation at the database level in Phase 1

Building multi-tenancy in later is significantly harder than designing for it from the start.

---

## Why Server Components Are Default

- Reduces JavaScript sent to the client
- Data fetching happens on the server — no loading spinners for initial page loads
- Better for SEO
- Critical for gym Wi-Fi performance — member devices often on slow networks

Client components (`"use client"`) are only used when browser APIs, hooks, or interactivity require them.

---

## Why Feature-Based Folders

The `src/features/` directory groups code by business domain rather than by technical layer:

```
src/features/
  auth/
  tenants/
  workouts/
  sessions/
  attendance/
  analytics/
  billing/
  branding/
```

This prevents the common problem of scattered, hard-to-navigate codebases as the project grows. Each feature owns its components, hooks, actions, and queries.

---

## How Member App, Gym Admin, and Super Admin Coexist

Three distinct surfaces live in the same app:

| Surface | Route | Audience |
|---|---|---|
| Member App | `/g/[gymSlug]/*` | Gym members (mobile-first) |
| Gym Admin | `/gym-admin/*` | Gym owners/managers |
| Super Admin | `/super-admin/*` | Platform operators |
| Marketing | `/`, `/pricing`, `/contact` | Prospective gym clients |

Each surface has its own layout, navigation, and access control. Route protection will be added via middleware in Phase 1.

---

## Future Integration Notes

### Supabase
- Auth via Supabase Auth (email/password, magic link)
- PostgreSQL database with RLS for tenant isolation
- Storage via Supabase Storage or Cloudflare R2

### Cloudflare R2
- Media storage for workout videos and images
- Better performance/cost at scale vs Supabase Storage
- Integration in Phase 2

### Paystack
- Subscription billing for gyms
- Webhook handling for plan changes and payment events
- Integration in Phase 2
