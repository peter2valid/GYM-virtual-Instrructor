export interface AttendanceLog {
  id: string;
  tenantId: string;
  profileId: string;
  checkedInAt: string;
  checkedOutAt: string | null;
  source: "qr_scan" | "manual";
}
