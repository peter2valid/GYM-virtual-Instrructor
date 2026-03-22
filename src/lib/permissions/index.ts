import { USER_ROLES } from "@/lib/constants";

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

/**
 * Placeholder permission helpers.
 * Phase 1 will expand this with server-side role checks
 * derived from Supabase session + profile.role.
 */

export function isSuperAdmin(role: UserRole): boolean {
  return role === USER_ROLES.SUPER_ADMIN;
}

export function isGymAdmin(role: UserRole): boolean {
  return role === USER_ROLES.GYM_ADMIN || isSuperAdmin(role);
}

export function isMember(role: UserRole): boolean {
  return role === USER_ROLES.MEMBER;
}
