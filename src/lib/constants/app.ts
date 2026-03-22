export const APP_NAME = "Gym Instructor Platform";
export const APP_DESCRIPTION =
  "The modern gym management platform for trainers and members.";
export const APP_VERSION = "0.1.0";

export const SUBSCRIPTION_PLANS = {
  STARTER: "starter",
  TRACK: "track",
  PREMIUM: "premium",
} as const;

export const USER_ROLES = {
  MEMBER: "member",
  GYM_ADMIN: "gym_admin",
  SUPER_ADMIN: "super_admin",
} as const;
