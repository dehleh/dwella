// POST /api/payments/webhook/paystack - Handle Paystack webhook events
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { notifyPaymentReceived } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) {
      return NextResponse.json({ error: 'Not configured' }, { status: 503 })
    }

    // Verify Paystack signature
    const body = await request.text()
    const hash = crypto.createHmac('sha512', secret).update(body).digest('hex')
    const signature = request.headers.get('x-paystack-signature')

    if (hash !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(body)

    if (event.event === 'charge.success') {
      const { reference, amount, currency, status } = event.data

      // Idempotent: find the payment transaction
      const payment = await prisma.paymentTransaction.findFirst({
        where: { providerTxRef: reference },
      })

      if (!payment) {
        console.warn('Webhook for unknown reference:', reference)
        return NextResponse.json({ received: true })
      }

      // Already processed
      if (payment.status === 'SUCCESS') {
        return NextResponse.json({ received: true })
      }

      // Verify amount matches
      const expectedAmountKobo = payment.amount * 100
      if (amount !== expectedAmountKobo) {
        console.error('Amount mismatch:', { expected: expectedAmountKobo, received: amount })
        await prisma.paymentTransaction.update({
          where: { id: payment.id },
          data: { status: 'FAILED', rawWebhook: event.data },
        })
        return NextResponse.json({ received: true })
      }

      // Process successful payment in a transaction
      await prisma.$transaction(async (tx: any) => {
        // Update payment status
        await tx.paymentTransaction.update({
          where: { id: payment.id },
          data: { status: 'SUCCESS', rawWebhook: event.data },
        })

        if (payment.unlockRequestId) {
          // Update unlock request status
          await tx.unlockRequest.update({
            where: { id: payment.unlockRequestId },
            data: { status: 'PAID' },
          })

          // Get the unlock request details
          const unlockRequest = await tx.unlockRequest.findUnique({
            where: { id: payment.unlockRequestId },
            include: {
              host: { select: { email: true, phone: true, profile: { select: { displayName: true } } } },
            },
          })

          if (unlockRequest) {
            // Create contact reveal record
            await tx.contactReveal.create({
              data: {
                unlockRequestId: payment.unlockRequestId,
                revealedToUserId: payment.userId,
                revealedFields: {
                  email: unlockRequest.host.email,
                  phone: unlockRequest.host.phone,
                  displayName: unlockRequest.host.profile?.displayName,
                },
              },
            })

            // Update unlock request to CONTACT_REVEALED
            await tx.unlockRequest.update({
              where: { id: payment.unlockRequestId },
              data: { status: 'CONTACT_REVEALED' },
            })
          }
        }
      })

      // Notify host of payment (outside transaction, fire-and-forget)
      if (payment.unlockRequestId) {
        const ur = await prisma.unlockRequest.findUnique({
          where: { id: payment.unlockRequestId },
          include: { seeker: { include: { profile: true } } },
        })
        if (ur) {
          notifyPaymentReceived(
            ur.hostUserId,
            ur.seeker.profile?.displayName || 'A seeker',
            payment.amount
          ).catch(() => {})
        }
      }

      return NextResponse.json({ received: true })
    }

    if (event.event === 'charge.failed') {
      const { reference } = event.data
      const payment = await prisma.paymentTransaction.findFirst({
        where: { providerTxRef: reference },
      })
      if (payment && payment.status !== 'SUCCESS') {
        await prisma.paymentTransaction.update({
          where: { id: payment.id },
          data: { status: 'FAILED', rawWebhook: event.data },
        })
        if (payment.unlockRequestId) {
          await prisma.unlockRequest.update({
            where: { id: payment.unlockRequestId },
            data: { status: 'APPROVED' }, // Revert to approved so they can retry
          })
        }
      }
      return NextResponse.json({ received: true })
    }

    // Other events - acknowledge but don't process
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ received: true }) // Always return 200 to Paystack
  }
}
