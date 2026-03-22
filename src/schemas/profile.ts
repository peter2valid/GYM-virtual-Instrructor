import { z } from "zod";

export const userRoleSchema = z.enum(["member", "gym_admin", "super_admin"]);

export const profileSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  userId: z.string().uuid(),
  role: userRoleSchema,
  displayName: z.string().min(1).max(100),
  avatarUrl: z.string().url().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ProfileSchema = z.infer<typeof profileSchema>;
