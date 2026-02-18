// POST /api/unlock-requests/[id]/pay - Initiate Paystack payment for approved unlock
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const unlockRequest = await prisma.unlockRequest.findUnique({
      where: { id: params.id },
      include: { seeker: { include: { profile: true } } },
    })
    if (!unlockRequest) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (unlockRequest.seekerUserId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    if (unlockRequest.status !== 'APPROVED' && unlockRequest.status !== 'PAYMENT_PENDING') {
      return NextResponse.json({ error: `Cannot pay from status ${unlockRequest.status}` }, { status: 400 })
    }

    // Check for existing pending payment
    const existingPayment = await prisma.paymentTransaction.findFirst({
      where: { unlockRequestId: params.id, status: 'INITIATED' },
    })
    if (existingPayment) {
      return NextResponse.json({
        message: 'Payment already initiated',
        paymentReference: existingPayment.providerTxRef,
        amount: existingPayment.amount,
        currency: existingPayment.currency,
      })
    }

    const reference = `dwl_${params.id}_${Date.now()}`
    const amount = unlockRequest.unlockFee * 100 // Paystack uses kobo

    // Initialize Paystack transaction
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
    if (!paystackSecretKey) {
      return NextResponse.json({ error: 'Payment not configured' }, { status: 503 })
    }

    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        amount,
        reference,
        currency: 'NGN',
        callback_url: `${process.env.NEXTAUTH_URL || ''}/listings/${unlockRequest.listingId}/unlock?request=${params.id}`,
        metadata: {
          unlock_request_id: params.id,
          listing_id: unlockRequest.listingId,
          seeker_id: user.id,
          host_id: unlockRequest.hostUserId,
        },
      }),
    })

    const paystackData = await paystackRes.json()

    if (!paystackData.status) {
      console.error('Paystack init failed:', paystackData)
      return NextResponse.json({ error: 'Payment initialization failed' }, { status: 502 })
    }

    // Create payment transaction record
    await prisma.$transaction([
      prisma.paymentTransaction.create({
        data: {
          userId: user.id,
          unlockRequestId: params.id,
          type: 'UNLOCK_FEE',
          provider: 'paystack',
          providerTxRef: reference,
          amount: unlockRequest.unlockFee,
          currency: 'NGN',
          status: 'INITIATED',
        },
      }),
      prisma.unlockRequest.update({
        where: { id: params.id },
        data: { status: 'PAYMENT_PENDING' },
      }),
    ])

    return NextResponse.json({
      message: 'Payment initialized',
      paymentUrl: paystackData.data.authorization_url,
      paymentReference: reference,
      accessCode: paystackData.data.access_code,
      amount: unlockRequest.unlockFee,
      currency: 'NGN',
    })
  } catch (error) {
    console.error('Pay unlock error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
