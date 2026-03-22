# GEMINI.md — Gym Instructor Platform

This file defines the project rules, conventions, and architectural decisions.
All AI assistants and developers working on this codebase must follow these rules.

---

## Project Overview

A B2B SaaS gym management platform that allows gym owners to provide a mobile-first workout experience to their members via QR-code access. The platform supports multiple gyms (tenants) with tiered subscription plans (Starter, Track, Premium).

---

## Locked Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui + Radix UI |
| Icons | Lucide React |
| Client State | Zustand |
| Server State | TanStack Query |
| Forms | React Hook Form + Zod |
| Animation | Framer Motion |
| Charts | Recharts |
| Auth + DB | Supabase |
| Monitoring | Sentry |
| Theme | next-themes |

Do not add new major libraries without team agreement. Keep dependencies lean.

---

## Architecture Rules

### Single Repo, Single App
- This is NOT a monorepo
- One Next.js app serves all: member experience, gym admin, super admin
- Do not create separate backend services in V1

### Multi-Tenant Architecture
- Every database entity that belongs to a gym MUST have a `tenant_id`
- Members must NEVER see data from another tenant
- Gym admins must NEVER see data from another tenant
- Super admin is the only role that can query across tenants
- Multi-tenant isolation will be enforced via Supabase RLS in Phase 1

### Route Structure
- `/` — marketing site
- `/g/[gymSlug]` — member experience (mobile-first, per-gym)
- `/gym-admin` — gym admin dashboard (protected)
- `/super-admin` — platform super admin (protected)
- `/(auth)` — login, signup

### Server Components Default
- Use React Server Components by default
- Only add `"use client"` when required:
  - useState, useEffect, or other React hooks
  - Browser-only APIs
  - Event handlers on interactive elements
  - TanStack Query hooks
  - Zustand store subscriptions
- Never make a component client-side just for convenience

---

## Coding Conventions

### TypeScript
- Strict mode is always on — never disable it
- No `any` types — use `unknown` with type guards if needed
- All props must be typed
- Use `interface` for object shapes, `type` for unions/intersections
- No `@ts-ignore` or `as any` escape hatches

### File Naming
- Components: `PascalCase.tsx`
- Utilities, hooks, stores: `kebab-case.ts`
- Route files: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`

### Imports
- Always use `@/*` path alias — never `../../` relative imports
- Group imports: React → Next.js → third-party → internal
- No unused imports

### Components
- Keep components small and focused
- Split when a component file approaches ~150 lines
- No dead code or commented-out blocks
- No fake data that pretends to be real API responses

### Styling
- Tailwind utility classes only — no inline styles
- Mobile-first breakpoints: `sm:`, `md:`, `lg:`
- Use `cn()` from `@/lib/utils` for conditional class merging
- No hardcoded colors outside the CSS variable token system

---

## UI Rules

### Mobile-First (Member App)
- The `/g/[gymSlug]` experience is mobile-first, always
- Design for 375px screen width as baseline
- Touch targets minimum 44px height
- Test layouts at 375px, 390px, 430px viewport widths

### Performance on Slow Networks
- Gyms often have poor Wi-Fi — optimize for slow connections
- Avoid large initial JavaScript bundles
- Do NOT use GIFs for any content — use MP4/WebM video (Phase 2+)
- Prefer static images and text over heavy animated components in the member flow
- Lazy load charts, analytics, and non-critical content

### Theme
- Dark mode is the default
- Use CSS variables via the shadcn/ui token system
- No hardcoded color values outside CSS variable definitions

### Animation
- Use Framer Motion sparingly — only where it adds clear UX value
- Never animate to cover loading states or hide missing features

---

## Data Rules

### No Cross-Tenant Data
- Every Supabase query in Phase 1+ must filter by `tenant_id`
- Server Actions and API routes must validate tenant context server-side
- Never trust client-supplied `tenant_id` — always derive it from session/auth context

### No Premature Data Modeling
- Do not create database tables until the feature is ready to implement
- Schema changes must be migration-driven via Supabase CLI

---

## What NOT To Do

- Do not build features before they are planned and scoped
- Do not mock complex business logic with fake return values
- Do not add Redux or any additional global state solutions
- Do not create a separate Express or Node backend in V1
- Do not implement billing before Paystack integration is planned
- Do not add feature flag infrastructure before there is a real need
- Do not overbuild before the data model is ready
- Do not add unnecessary abstractions — three similar lines is better than a premature helper
- Do not skip TypeScript errors with `@ts-ignore` or `as any`
- Do not use GIFs — use MP4/WebM for video content

---

## Phase Status

| Phase | Status |
|---|---|
| Phase 0 — Setup & Architecture | Complete |
| Phase 1 — Auth, Tenant, Workouts, Session Engine | Pending |
| Phase 2 — Tracking, Analytics, Billing | Pending |
| Phase 3 — Premium, Branding, PWA | Pending |
