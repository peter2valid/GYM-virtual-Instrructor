# Product Scope

## Subscription Plans

### Starter Plan

Designed for gyms that want to provide guided workouts without requiring member accounts.

**Included:**
- QR code → gym-specific workout catalog
- Guided workout viewer with step-by-step instructions
- No member login required
- Basic gym admin access to manage workouts

**Not included:**
- Member profiles or accounts
- Workout tracking or history
- Attendance logging
- Analytics

---

### Track Plan

For gyms that want to track member activity and provide a personalized experience.

**Included:**
- Everything in Starter
- Member login and profiles
- Workout session tracking
- Personal workout history
- Attendance logging (QR scan)
- Gym admin dashboard with member list
- Basic attendance and workout completion analytics

---

### Premium Plan

For established gyms that want full platform power and custom branding.

**Included:**
- Everything in Track
- Custom gym branding (logo, primary color)
- Advanced analytics and reporting
- Priority support
- Feature unlocks as the platform grows

---

## What Is NOT Part of V1

The following features are intentionally excluded from V1 and planned for future phases:

- **PWA / installable app** — web app only in V1; offline support and install prompts come later
- **Video workout content** — no video delivery in V1; images and text instructions only
- **Paystack billing** — billing integration is Phase 2; gyms manually provisioned in Phase 0/1
- **Cloudflare R2 media** — no custom media uploads in V1; cover images via URL reference only
- **Push notifications** — no notification system in V1
- **Real-time features** — no WebSocket or Supabase Realtime in V1
- **Social/community features** — no member-to-member interaction in V1
- **Mobile native apps** — web only; no React Native or Expo
- **Third-party fitness integrations** — no Apple Health, Fitbit, etc. in V1
- **AI workout generation** — no AI-assisted features in V1
