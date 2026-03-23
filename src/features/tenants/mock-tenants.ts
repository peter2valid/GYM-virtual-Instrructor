import type { Tenant } from "@/types";

export const mockTenants: Tenant[] = [
  {
    id: "tenant-iron-house",
    name: "Iron House Gym",
    slug: "iron-house",
    subscriptionPlan: "starter",
    subscriptionStatus: "active",
    logoUrl: null,
    primaryColor: "#8B1A1A",   // Iron House maroon/red
    secondaryColor: "#1A1A1A",
    welcomeMessage: null,
    isActive: true,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  },
];
