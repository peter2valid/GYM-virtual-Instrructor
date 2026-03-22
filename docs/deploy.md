# VirtualGYM — Deployment Checklist

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project (free tier works)
- A [Vercel](https://vercel.com) account
- A [Paystack](https://paystack.com) account (for billing)
- *(Optional)* A [Sentry](https://sentry.io) project (for error tracking)

---

## 1. Supabase Setup

### 1a. Run migrations

Apply every file in `supabase/migrations/` in order via the Supabase SQL editor or the CLI:

```bash
supabase db push
```

Confirm the following tables exist after migration:
`tenants`, `profiles`, `workouts`, `workout_steps`, `exercises`,
`exercise_media_map`, `tenant_workout_preferences`, `attendance_logs`,
`feature_flags`, `tenant_settings`

### 1b. Enable Email Auth

Dashboard → Authentication → Providers → Email → **Enable**

Disable "Confirm email" only if you want instant login during development.
For production, keep email confirmation **on**.

### 1c. Note your API keys

From **Project Settings → API**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` ⚠️ Keep secret — never expose client-side

---

## 2. Paystack Setup

1. Create a Paystack account at [paystack.com](https://paystack.com)
2. From **Settings → API Keys & Webhooks**:
   - Copy your **Secret Key** → `PAYSTACK_SECRET_KEY`
3. Add your webhook URL:
   - URL: `https://your-domain.vercel.app/api/paystack/webhook`
   - Events to enable: `charge.success`, `subscription.disable`, `invoice.payment_failed`
4. Set your callback URL in Paystack to:
   `https://your-domain.vercel.app/api/paystack/verify`

---

## 3. Sentry Setup (optional)

1. Create a new project at [sentry.io](https://sentry.io) (platform: Next.js)
2. Copy the **DSN** → `NEXT_PUBLIC_SENTRY_DSN`
3. Create an **Auth Token** with `project:write` scope → `SENTRY_AUTH_TOKEN`
4. Note your **org slug** → `SENTRY_ORG`
5. Note your **project slug** → `SENTRY_PROJECT`

---

## 4. PWA Icons

The PWA manifest references two icon files that must exist before deployment:

| File | Size |
|------|------|
| `public/icons/icon-192.png` | 192×192 px |
| `public/icons/icon-512.png` | 512×512 px |

Generate square PNG icons (the VirtualGYM logo or a "G" on a branded background)
and place them at the paths above. Tools: [Figma](https://figma.com),
[RealFaviconGenerator](https://realfavicongenerator.net), or any image editor.

---

## 5. Vercel Deployment

### 5a. Import the project

1. Push the repo to GitHub/GitLab
2. Go to [vercel.com/new](https://vercel.com/new) → Import repository
3. Framework preset will be detected as **Next.js** (also set in `vercel.json`)

### 5b. Set environment variables

In **Vercel → Project → Settings → Environment Variables**, add:

| Variable | Environment |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview, Development |
| `NEXT_PUBLIC_APP_URL` | Production (`https://your-domain.vercel.app`) |
| `PAYSTACK_SECRET_KEY` | Production (`sk_live_...`), Preview (`sk_test_...`) |
| `NEXT_PUBLIC_SENTRY_DSN` | Production, Preview |
| `SENTRY_AUTH_TOKEN` | Production, Preview |
| `SENTRY_ORG` | Production, Preview |
| `SENTRY_PROJECT` | Production, Preview |

### 5c. Deploy

Click **Deploy**. The build command (`npm run build`) and install command
(`npm install`) are already set in `vercel.json`.

---

## 6. Post-Deployment Verification

### Smoke tests

- [ ] `/` — marketing landing page loads
- [ ] `/(auth)/signup` — gym onboarding signup works
- [ ] `/(marketing)/onboard` — gym self-onboarding wizard completes
- [ ] `/gym-admin` — dashboard loads after login
- [ ] `/gym-admin/workouts/new` — create a workout and publish it
- [ ] `/g/<slug>` — member landing page loads with correct branding
- [ ] `/g/<slug>/attend` — check-in logs an attendance row
- [ ] `/g/<slug>/me` — member profile page renders

### PWA checks

- [ ] Chrome DevTools → Application → Manifest — no errors
- [ ] Service worker registered and active
- [ ] Install banner appears on Android Chrome after second visit
- [ ] Lighthouse PWA score ≥ 90

### Billing checks (Paystack test mode)

- [ ] Selecting a paid plan during onboarding redirects to Paystack checkout
- [ ] After test payment, webhook fires → tenant `subscription_status` = `active`
- [ ] `/api/paystack/verify?reference=...` redirects to `/gym-admin?payment=success`

---

## 7. Import Exercise Media (one-time)

If you have GIF files for exercises, run the import script after deployment:

```bash
# Requires SUPABASE_SERVICE_ROLE_KEY in your local .env.local
npx tsx scripts/import-exercise-media.ts
```

This walks `gif and images/` recursively and upserts matches into `exercise_media_map`.

---

## 8. Custom Domain (optional)

1. Vercel → Project → Settings → Domains → Add domain
2. Add the DNS records shown (CNAME or A record) at your registrar
3. Update `NEXT_PUBLIC_APP_URL` to the new domain
4. Redeploy (or trigger a new deployment) for the change to take effect
