import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = 'Vuxi <noreply@vuxi.ai>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vuxi.ai';

export async function sendReportReadyEmail({
  to,
  reportId,
  websiteUrl,
  score,
}: {
  to: string;
  reportId: number;
  websiteUrl: string;
  score?: number | null;
}) {
  if (!resend) {
    console.warn('RESEND_API_KEY not set — skipping report-ready email');
    return;
  }

  const reportUrl = `${APP_URL}/report/${reportId}`;
  const scoreText = score != null ? `Overall score: <strong>${score}/10</strong><br>` : '';

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your Vuxi report for ${websiteUrl} is ready`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1e293b">
        <h2 style="margin-bottom:8px">Your UX report is ready</h2>
        <p style="color:#475569;margin-top:0">
          The analysis for <strong>${websiteUrl}</strong> has completed.
        </p>
        <p style="color:#475569">
          ${scoreText}
        </p>
        <a href="${reportUrl}"
           style="display:inline-block;margin-top:8px;padding:12px 24px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">
          View Report
        </a>
        <p style="margin-top:32px;font-size:12px;color:#94a3b8">
          You're receiving this because you ran an analysis on Vuxi.
        </p>
      </div>
    `,
  });
}
