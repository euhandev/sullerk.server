import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '@/helper/prisma.service';
import { CreateExchangeDto } from './dto/create-exchange.dto';
import { ApiError } from '@/utils/api_error';
import { ExchangeStatus, ListingStatus, TransactionType } from '@prisma/client';
import { StripeService } from '@/helper/stripe.service';
import { ConfigService } from '@/config/config.service';

@Injectable()
export class ExchangeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
    private readonly configService: ConfigService,
  ) {}

  async createOffer(dto: CreateExchangeDto, senderUserId: string) {
    const sender = await this.prisma.customer.findUnique({ where: { userId: senderUserId } });
    if (!sender) throw new ApiError(HttpStatus.NOT_FOUND, 'Sender profile not found');

    // 1. Validate Listings
    const senderListings = await this.prisma.listing.findMany({
      where: { id: { in: dto.senderListingIds }, ownerId: sender.id },
    });
    if (senderListings.length !== dto.senderListingIds.length) {
      throw new ApiError(
        HttpStatus.BAD_REQUEST,
        'Some sender listings are invalid or not owned by you',
      );
    }

    const receiverListings = await this.prisma.listing.findMany({
      where: { id: { in: dto.receiverListingIds }, ownerId: dto.receiverId },
    });
    if (receiverListings.length !== dto.receiverListingIds.length) {
      throw new ApiError(
        HttpStatus.BAD_REQUEST,
        'Some receiver listings are invalid or not owned by the receiver',
      );
    }

    // Check availability
    const allListings = [...senderListings, ...receiverListings];
    if (allListings.some((l) => l.status !== ListingStatus.ACTIVE || !l.isTradingEnable)) {
      throw new ApiError(HttpStatus.BAD_REQUEST, 'Some items are not available for trade');
    }

    // 2. Calculate Values
    const senderValue = senderListings.reduce((sum, l) => sum + l.estimatedBaseValue, 0);
    const receiverValue = receiverListings.reduce((sum, l) => sum + l.estimatedBaseValue, 0);
    const cashGap = Math.max(0, receiverValue - senderValue);

    // 3. Handle Counter-Offer
    if (dto.parentOfferId) {
      await this.prisma.exchangeOffer.update({
        where: { id: dto.parentOfferId },
        data: { status: ExchangeStatus.COUNTERED },
      });
    }

    // 4. Create Offer
    return await this.prisma.exchangeOffer.create({
      data: {
        senderId: sender.id,
        receiverId: dto.receiverId,
        senderListingIds: dto.senderListingIds,
        receiverListingIds: dto.receiverListingIds,
        senderTotalValue: senderValue,
        receiverTotalValue: receiverValue,
        balanceToPay: cashGap,
        note: dto.note,
        parentOfferId: dto.parentOfferId,
        status: ExchangeStatus.PENDING,
      },
    });
  }

  async respondToOffer(offerId: string, status: 'ACCEPTED' | 'REJECTED', userId: string) {
    const customer = await this.prisma.customer.findUnique({ where: { userId } });
    const offer = await this.prisma.exchangeOffer.findUnique({
      where: { id: offerId },
      include: { sender: { include: { user: true } } },
    });

    if (!offer || offer.receiverId !== customer?.id) {
      throw new ApiError(HttpStatus.FORBIDDEN, 'Unauthorized or offer not found');
    }

    if (offer.status !== ExchangeStatus.PENDING) {
      throw new ApiError(HttpStatus.BAD_REQUEST, 'Offer is no longer pending');
    }

    if (status === 'REJECTED') {
      return await this.prisma.exchangeOffer.update({
        where: { id: offerId },
        data: { status: ExchangeStatus.REJECTED },
      });
    }

    // ACCEPT Logic
    if (offer.balanceToPay > 0) {
      // Need Payment from Sender
      const appUrl = this.configService.get('APP_URL') || 'http://localhost:3000';
      const session = await this.stripeService.createCheckoutSession({
        amount: offer.balanceToPay,
        currency: 'usd',
        orderId: offer.id,
        listingTitle: `Exchange Balance Payment`,
        successUrl: `${appUrl}/exchange-success?offerId=${offer.id}`,
        cancelUrl: `${appUrl}/exchange-failed?offerId=${offer.id}`,
        customerEmail: offer.sender.user.email,
        metadata: { offerId },
      });

      await this.prisma.exchangeOffer.update({
        where: { id: offerId },
        data: { stripeSessionId: session.id, paymentStatus: 'PENDING' },
      });

      return { checkoutUrl: session.url };
    } else {
      // Free Trade - Finalize Immediately
      await this.finalizeExchange(offerId);
      return { success: true };
    }
  }

  async finalizeExchange(offerId: string) {
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

      // 3. Log Transactions if cash was involved
      if (offer.balanceToPay > 0) {
        // Simple log for history
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

  async getHistory(userId: string, status?: ExchangeStatus) {
    const customer = await this.prisma.customer.findUnique({ where: { userId } });
    return await this.prisma.exchangeOffer.findMany({
      where: {
        OR: [{ senderId: customer?.id }, { receiverId: customer?.id }],
        status: status || undefined,
      },
      include: {
        sender: { select: { fullName: true } },
        receiver: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
