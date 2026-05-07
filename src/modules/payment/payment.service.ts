import { HttpStatus, Injectable, RawBodyRequest } from '@nestjs/common';
import { PrismaService } from '@/helper/prisma.service';
import { StripeService } from '@/helper/stripe.service';
import { Request } from 'express';
import { ApiError } from '@/utils/api_error';
import { ListingStatus, OrderStatus, TransactionType, ExchangeStatus } from '@prisma/client';

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
  ) {}

  async handleWebhook(req: RawBodyRequest<Request>) {
    const sig = req.headers['stripe-signature'] as string;
    let event;

    try {
      event = this.stripeService.verifyWebhook(req.rawBody, sig);
    } catch (err) {
      throw new ApiError(HttpStatus.BAD_REQUEST, `Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const orderId = session.client_reference_id || session.metadata.orderId;
      const offerId = session.metadata.offerId;

      if (offerId) {
        await this.finalizeExchange(offerId);
      } else if (orderId) {
        await this.finalizeOrder(orderId);
      }
    }

    return { received: true };
  }

  private async finalizeOrder(orderId: string) {
    if (!orderId) return;

    await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
      });

      if (!order || order.status !== OrderStatus.PENDING_PAYMENT) return;

      // 1. Update Order Status
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PAID },
      });

      // 2. Update Listing Status
      await tx.listing.update({
        where: { id: order.listingId },
        data: { status: ListingStatus.SOLD },
      });

      // 3. Update Seller Balance
      await tx.customer.update({
        where: { id: order.sellerId },
        data: { balance: { increment: order.sellerEarnings } },
      });

      // 4. Create Transaction Log for Seller (Revenue)
      await tx.transaction.create({
        data: {
          customerId: order.sellerId,
          amount: order.sellerEarnings,
          type: TransactionType.SALE_REVENUE,
          orderId: order.id,
          description: `Sale revenue for order ${order.orderNumber}`,
        },
      });

      // 5. Create Transaction Log for Buyer (Debit)
      await tx.transaction.create({
        data: {
          customerId: order.buyerId,
          amount: -order.totalAmount,
          type: TransactionType.PURCHASE_DEBIT,
          orderId: order.id,
          description: `Purchase debit for order ${order.orderNumber}`,
        },
      });

      // 6. Create Transaction Log for Platform (Fee)
      await tx.transaction.create({
        data: {
          customerId: order.sellerId,
          amount: -order.platformFee,
          type: TransactionType.PLATFORM_FEE,
          orderId: order.id,
          description: `Platform fee for order ${order.orderNumber}`,
        },
      });
    });
  }

  private async finalizeExchange(offerId: string) {
    if (!offerId) return;

    await this.prisma.$transaction(async (tx) => {
      const offer = await tx.exchangeOffer.findUnique({ where: { id: offerId } });
      if (!offer || offer.status === ExchangeStatus.ACCEPTED) return;

      // 1. Update Offer Status
      await tx.exchangeOffer.update({
        where: { id: offerId },
        data: { status: ExchangeStatus.ACCEPTED, paymentStatus: 'PAID' },
      });

      // 2. Update Listings Status
      const allListingIds = [...offer.senderListingIds, ...offer.receiverListingIds];
      await tx.listing.updateMany({
        where: { id: { in: allListingIds } },
        data: { status: ListingStatus.EXCHANGED },
      });

      // 3. Log Transactions for the balance payment
      if (offer.balanceToPay > 0) {
        await tx.transaction.create({
          data: {
            customerId: offer.senderId,
            amount: -offer.balanceToPay,
            type: TransactionType.TRADE_BALANCE,
            exchangeOfferId: offer.id,
            description: `Paid balance for exchange offer`,
          },
        });
        await tx.transaction.create({
          data: {
            customerId: offer.receiverId,
            amount: offer.balanceToPay,
            type: TransactionType.TRADE_BALANCE,
            exchangeOfferId: offer.id,
            description: `Received balance for exchange offer`,
          },
        });
      }
    });
  }
}
