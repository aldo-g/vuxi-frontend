import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function POST(req: NextRequest) {
  const { message, context, userName, userEmail } = await req.json();

  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  if (!resend) {
    console.warn('RESEND_API_KEY not set — skipping issue report email');
    return NextResponse.json({ ok: true });
  }

  const userInfo = (userName || userEmail)
    ? `<p style="color:#64748b;font-size:13px;margin-top:4px">From: ${[userName, userEmail].filter(Boolean).join(' – ')}</p>`
    : '';

  await resend.emails.send({
    from: 'Vuxi <noreply@vuxi.ai>',
    to: 'alastairegrant@pm.me',
    subject: `Vuxi Issue Report${context ? ` – ${context}` : ''}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
        <h2 style="margin-bottom:8px">New Issue Report</h2>
        ${context ? `<p style="color:#64748b;font-size:13px;margin-top:0">Context: ${context}</p>` : ''}
        ${userInfo}
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;white-space:pre-wrap;font-size:14px;color:#334155;margin-top:12px">
${message}
        </div>
      </div>
    `,
  });

  return NextResponse.json({ ok: true });
}
