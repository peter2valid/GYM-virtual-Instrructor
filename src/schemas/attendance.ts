import { z } from "zod";

export const attendanceLogSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  profileId: z.string().uuid(),
  checkedInAt: z.string().datetime(),
  checkedOutAt: z.string().datetime().nullable(),
  source: z.enum(["qr_scan", "manual"]),
});

export type AttendanceLogSchema = z.infer<typeof attendanceLogSchema>;
