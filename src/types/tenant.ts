import { SUBSCRIPTION_PLANS } from "@/lib/constants";

export type SubscriptionPlan =
  (typeof SUBSCRIPTION_PLANS)[keyof typeof SUBSCRIPTION_PLANS];

export type FeatureFlagKey =
  | "member_login"
  | "attendance_tracking"
  | "workout_history"
  | "member_dashboard"
  | "gym_admin_dashboard"
  | "premium_branding"
  | "advanced_analytics"
  | "custom_recommendations";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  welcomeMessage: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TenantSettings {
  id: string;
  tenantId: string;
  showLoginRequired: boolean;
  showQuickStart: boolean;
  defaultRecommendationMode: "manual" | "equipment_match" | "level_match";
  createdAt: string;
  updatedAt: string;
}

export interface FeatureFlag {
  id: string;
  tenantId: string;
  featureKey: FeatureFlagKey;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentType {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface TenantEquipmentProfile {
  id: string;
  tenantId: string;
  equipmentTypeId: string;
  quantity: number | null;
  isAvailable: boolean;
  createdAt: string;
  equipmentType?: EquipmentType;
}
