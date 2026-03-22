import { USER_ROLES } from "@/lib/constants";

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export interface Profile {
  id: string;
  tenantId: string;
  userId: string;
  role: UserRole;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}
