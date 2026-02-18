// SMS service via Termii API
// Docs: https://developer.termii.com/

const TERMII_API_KEY = process.env.TERMII_API_KEY
const TERMII_BASE_URL = 'https://api.ng.termii.com/api'
const SENDER_ID = process.env.SMS_SENDER_ID || 'Dwella'

interface SendSmsOptions {
  to: string // Nigerian phone number in international format (+234...)
  message: string
}

/**
 * Normalise a Nigerian phone number to +234 format
 */
function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-()]/g, '')
  if (cleaned.startsWith('+234')) return cleaned
  if (cleaned.startsWith('234')) return `+${cleaned}`
  if (cleaned.startsWith('0')) return `+234${cleaned.slice(1)}`
  return `+234${cleaned}`
}

/**
 * Send an SMS via Termii
 */
export async function sendSms(opts: SendSmsOptions): Promise<boolean> {
  if (!TERMII_API_KEY) {
    console.warn('[SMS] TERMII_API_KEY not set — skipping SMS to:', opts.to)
    return false
  }

  const to = normalizePhone(opts.to)

  try {
    const res = await fetch(`${TERMII_BASE_URL}/sms/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to,
        from: SENDER_ID,
        sms: opts.message,
        type: 'plain',
        channel: 'generic',
        api_key: TERMII_API_KEY,
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error('[SMS] Termii error:', res.status, errBody)
      return false
    }

    const data = await res.json()
    return data.code === 'ok' || data.message_id != null
  } catch (err) {
    console.error('[SMS] Exception:', err)
    return false
  }
}

/**
 * Send an OTP via Termii's token API
 */
export async function sendOtp(phone: string, otp: string): Promise<boolean> {
  if (!TERMII_API_KEY) {
    console.warn('[SMS] TERMII_API_KEY not set — skipping OTP to:', phone)
    return false
  }

  return sendSms({
    to: phone,
    message: `Your Dwella verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`,
  })
}

// ── SMS templates ──

export async function sendWelcomeSms(phone: string, name: string): Promise<boolean> {
  return sendSms({
    to: phone,
    message: `Welcome to Dwella, ${name}! Complete your profile and verify your identity to find your perfect roommate match.`,
  })
}

export async function sendVerificationStatusSms(
  phone: string,
  status: 'APPROVED' | 'REJECTED'
): Promise<boolean> {
  const msg =
    status === 'APPROVED'
      ? 'Great news! Your Dwella identity has been verified. You now have full access to all features.'
      : 'Your Dwella verification needs attention. Please log in to resubmit your documents.'

  return sendSms({ to: phone, message: msg })
}

export async function sendViewingConfirmedSms(
  phone: string,
  neighborhood: string,
  dateStr: string
): Promise<boolean> {
  return sendSms({
    to: phone,
    message: `Dwella: Your viewing for the room in ${neighborhood} is confirmed for ${dateStr}.`,
  })
}

export async function sendUnlockApprovedSms(
  phone: string,
  neighborhood: string
): Promise<boolean> {
  return sendSms({
    to: phone,
    message: `Dwella: Your unlock request for ${neighborhood} was approved! Log in to proceed with payment.`,
  })
}
