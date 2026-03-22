/**
 * Thin Resend email helper — uses the REST API so no SDK is needed.
 * Set RESEND_API_KEY in your env to enable. Emails are silently skipped
 * in development unless the key is present.
 */

const RESEND_API = "https://api.resend.com/emails";
const FROM = process.env.RESEND_FROM_EMAIL ?? "VirtualGYM <noreply@virtualgym.app>";

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

export async function sendEmail(opts: SendEmailOptions): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return; // silently skip if not configured

  await fetch(RESEND_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: Array.isArray(opts.to) ? opts.to : [opts.to],
      subject: opts.subject,
      html: opts.html,
    }),
  }).catch(() => {
    // Best-effort — never let email failure break the main flow
  });
}

// ─── Email templates ──────────────────────────────────────────────────────────

export function buildWelcomeEmail(opts: {
  gymName: string;
  adminName: string;
  gymUrl: string;
  dashboardUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e4e4e7;">
        <!-- Header -->
        <tr>
          <td style="background:#6366f1;padding:32px;text-align:center;">
            <p style="margin:0;font-size:24px;font-weight:700;color:#fff;">VirtualGYM</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#09090b;">
              Welcome, ${opts.adminName}! 🎉
            </h1>
            <p style="margin:0 0 24px;color:#71717a;font-size:15px;line-height:1.6;">
              Your gym <strong style="color:#09090b;">${opts.gymName}</strong> is live on VirtualGYM.
              Members can now scan your QR code and start training.
            </p>

            <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;">
              <tr>
                <td style="background:#f4f4f5;border-radius:12px;padding:16px;">
                  <p style="margin:0 0 4px;font-size:12px;color:#71717a;text-transform:uppercase;letter-spacing:.05em;">Your gym URL</p>
                  <a href="${opts.gymUrl}" style="color:#6366f1;font-size:14px;font-weight:600;text-decoration:none;">${opts.gymUrl}</a>
                </td>
              </tr>
            </table>

            <a href="${opts.dashboardUrl}"
               style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-size:15px;font-weight:600;">
              Go to Dashboard →
            </a>

            <p style="margin:24px 0 0;font-size:13px;color:#a1a1aa;">
              Next steps: upload workouts, print your QR code, and share your gym URL with members.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #e4e4e7;text-align:center;">
            <p style="margin:0;font-size:12px;color:#a1a1aa;">
              © ${new Date().getFullYear()} VirtualGYM · You're receiving this because you signed up for VirtualGYM.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function buildPaymentReceiptEmail(opts: {
  gymName: string;
  adminEmail: string;
  plan: string;
  amount: string;
  reference: string;
  dashboardUrl: string;
}): string {
  const planLabel =
    opts.plan === "premium" ? "Premium" : opts.plan === "track" ? "Track" : "Starter";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e4e4e7;">
        <tr>
          <td style="background:#6366f1;padding:32px;text-align:center;">
            <p style="margin:0;font-size:24px;font-weight:700;color:#fff;">VirtualGYM</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#09090b;">Payment Received ✓</h1>
            <p style="margin:0 0 24px;color:#71717a;font-size:15px;line-height:1.6;">
              Thank you! Your <strong style="color:#09090b;">${planLabel} plan</strong> is now active for
              <strong style="color:#09090b;">${opts.gymName}</strong>.
            </p>

            <table cellpadding="0" cellspacing="0" width="100%"
                   style="background:#f4f4f5;border-radius:12px;padding:16px;margin-bottom:24px;border-spacing:0;">
              <tr>
                <td style="padding:6px 0;font-size:14px;color:#71717a;">Plan</td>
                <td style="padding:6px 0;font-size:14px;font-weight:600;color:#09090b;text-align:right;">${planLabel}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-size:14px;color:#71717a;">Amount</td>
                <td style="padding:6px 0;font-size:14px;font-weight:600;color:#09090b;text-align:right;">${opts.amount}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-size:14px;color:#71717a;">Reference</td>
                <td style="padding:6px 0;font-size:13px;font-family:monospace;color:#71717a;text-align:right;">${opts.reference}</td>
              </tr>
            </table>

            <a href="${opts.dashboardUrl}"
               style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-size:15px;font-weight:600;">
              View Dashboard →
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #e4e4e7;text-align:center;">
            <p style="margin:0;font-size:12px;color:#a1a1aa;">
              © ${new Date().getFullYear()} VirtualGYM · Keep this email as your payment record.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
