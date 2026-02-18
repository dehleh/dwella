// Transactional email service via Resend
import { Resend } from 'resend'

// Lazy-init to avoid build-time errors when API key is not set
let _resend: Resend | null = null
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

const FROM_EMAIL = process.env.FROM_EMAIL || 'Dwella <noreply@dwella.ng>'

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

async function sendEmail(opts: SendEmailOptions): Promise<boolean> {
  const resend = getResend()
  if (!resend) {
    console.warn('[Email] RESEND_API_KEY not set — skipping email send:', opts.subject)
    return false
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    })

    if (error) {
      console.error('[Email] Send failed:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('[Email] Exception:', err)
    return false
  }
}

// ── Styled email wrapper ──
function wrap(body: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,sans-serif;background:#f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
    <tr><td style="background:#0088E6;padding:24px 32px;">
      <h1 style="margin:0;color:#fff;font-size:24px;">Dwella</h1>
    </td></tr>
    <tr><td style="padding:32px;">
      ${body}
    </td></tr>
    <tr><td style="padding:20px 32px;background:#f9fafb;color:#6b7280;font-size:13px;text-align:center;">
      &copy; ${new Date().getFullYear()} Dwella &middot; Verified roommate matching for Nigeria
    </td></tr>
  </table>
</body>
</html>`
}

// ── Email templates ──

export async function sendWelcomeEmail(to: string, name: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: 'Welcome to Dwella!',
    html: wrap(`
      <h2 style="color:#111;margin:0 0 16px;">Welcome, ${name}!</h2>
      <p style="color:#374151;line-height:1.6;">
        Thanks for joining Dwella — the verified roommate-matching platform for Nigeria.
      </p>
      <p style="color:#374151;line-height:1.6;">
        To get the most out of Dwella, we recommend:
      </p>
      <ol style="color:#374151;line-height:1.8;">
        <li><strong>Complete your profile</strong> — add a photo and bio</li>
        <li><strong>Verify your identity</strong> — unlock messaging and contact features</li>
        <li><strong>Set your preferences</strong> — help us find your ideal match</li>
      </ol>
      <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard"
         style="display:inline-block;padding:12px 28px;background:#0088E6;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;margin-top:16px;">
        Go to Dashboard
      </a>
    `),
    text: `Welcome to Dwella, ${name}! Complete your profile and verify your identity to get started.`,
  })
}

export async function sendVerificationStatusEmail(
  to: string,
  name: string,
  status: 'APPROVED' | 'REJECTED',
  reason?: string
): Promise<boolean> {
  const isApproved = status === 'APPROVED'

  return sendEmail({
    to,
    subject: isApproved ? 'Identity Verified — Welcome!' : 'Verification Update',
    html: wrap(`
      <h2 style="color:#111;margin:0 0 16px;">
        ${isApproved ? '✅ Identity Verified!' : '⚠️ Verification Update'}
      </h2>
      <p style="color:#374151;line-height:1.6;">
        Hi ${name},
      </p>
      ${isApproved ? `
        <p style="color:#374151;line-height:1.6;">
          Great news — your identity has been verified! You now have full access to all Dwella features including messaging, contact unlock, and viewing scheduling.
        </p>
      ` : `
        <p style="color:#374151;line-height:1.6;">
          Unfortunately, we were unable to verify your identity at this time.
        </p>
        ${reason ? `<p style="color:#6b7280;line-height:1.6;background:#fef2f2;padding:12px 16px;border-radius:8px;"><strong>Reason:</strong> ${reason}</p>` : ''}
        <p style="color:#374151;line-height:1.6;">
          You can resubmit with clearer documents from your profile.
        </p>
      `}
      <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/${isApproved ? 'dashboard' : 'verification'}"
         style="display:inline-block;padding:12px 28px;background:#0088E6;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;margin-top:16px;">
        ${isApproved ? 'Continue to Dashboard' : 'Resubmit Verification'}
      </a>
    `),
  })
}

export async function sendUnlockApprovedEmail(
  to: string,
  seekerName: string,
  listingNeighborhood: string,
  listingCity: string
): Promise<boolean> {
  return sendEmail({
    to,
    subject: 'Unlock Request Approved — Proceed to Payment',
    html: wrap(`
      <h2 style="color:#111;margin:0 0 16px;">Unlock Request Approved</h2>
      <p style="color:#374151;line-height:1.6;">
        Hi ${seekerName}, your request to unlock contact details for the room in
        <strong>${listingNeighborhood}, ${listingCity}</strong> has been approved by the host!
      </p>
      <p style="color:#374151;line-height:1.6;">
        You can now proceed to payment to reveal the host's contact information.
      </p>
      <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard"
         style="display:inline-block;padding:12px 28px;background:#0088E6;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;margin-top:16px;">
        Go to Dashboard
      </a>
    `),
  })
}

export async function sendViewingConfirmedEmail(
  to: string,
  name: string,
  listingNeighborhood: string,
  confirmedSlot: string,
  role: 'host' | 'seeker'
): Promise<boolean> {
  const dateStr = new Date(confirmedSlot).toLocaleString('en-NG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return sendEmail({
    to,
    subject: `Viewing Confirmed — ${dateStr}`,
    html: wrap(`
      <h2 style="color:#111;margin:0 0 16px;">Viewing Confirmed!</h2>
      <p style="color:#374151;line-height:1.6;">Hi ${name},</p>
      <p style="color:#374151;line-height:1.6;">
        A viewing for the room in <strong>${listingNeighborhood}</strong> has been confirmed.
      </p>
      <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:0;color:#0369a1;font-weight:600;">📅 ${dateStr}</p>
      </div>
      <p style="color:#374151;line-height:1.6;">
        ${role === 'seeker'
          ? 'Please arrive on time. The host will be expecting you.'
          : 'The seeker has been notified and will arrive at the scheduled time.'}
      </p>
      <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/viewings"
         style="display:inline-block;padding:12px 28px;background:#0088E6;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;margin-top:16px;">
        View Details
      </a>
    `),
  })
}

export async function sendNewMessageEmail(
  to: string,
  recipientName: string,
  senderName: string,
  listingNeighborhood: string,
  conversationId: string
): Promise<boolean> {
  return sendEmail({
    to,
    subject: `New message from ${senderName}`,
    html: wrap(`
      <h2 style="color:#111;margin:0 0 16px;">New Message</h2>
      <p style="color:#374151;line-height:1.6;">
        Hi ${recipientName}, <strong>${senderName}</strong> sent you a message about
        the room in <strong>${listingNeighborhood}</strong>.
      </p>
      <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/messages/${conversationId}"
         style="display:inline-block;padding:12px 28px;background:#0088E6;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;margin-top:16px;">
        Read Message
      </a>
    `),
  })
}

export async function sendUnlockRequestEmail(
  to: string,
  hostName: string,
  seekerName: string,
  listingNeighborhood: string
): Promise<boolean> {
  return sendEmail({
    to,
    subject: `${seekerName} wants to unlock your listing`,
    html: wrap(`
      <h2 style="color:#111;margin:0 0 16px;">New Unlock Request</h2>
      <p style="color:#374151;line-height:1.6;">
        Hi ${hostName}, <strong>${seekerName}</strong> has requested to unlock contact details
        for your room in <strong>${listingNeighborhood}</strong>.
      </p>
      <p style="color:#374151;line-height:1.6;">
        Review and approve or decline the request from your dashboard.
      </p>
      <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard"
         style="display:inline-block;padding:12px 28px;background:#0088E6;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;margin-top:16px;">
        Review Request
      </a>
    `),
  })
}
