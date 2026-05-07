import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '@/helper/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ApiError } from '@/utils/api_error';
import { ListingStatus, OrderStatus, OrderType } from '@prisma/client';
import { StripeService } from '@/helper/stripe.service';
import { ConfigService } from '@/config/config.service';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
    private readonly configService: ConfigService,
  ) {}

  async create(createOrderDto: CreateOrderDto, buyerUserId: string) {
    const { listingId } = createOrderDto;

    // 1. Fetch listing and buyer/seller details
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: { owner: { include: { user: true } } },
    });

    if (!listing) throw new ApiError(HttpStatus.NOT_FOUND, 'Listing not found');
    if (listing.status !== ListingStatus.ACTIVE) {
      throw new ApiError(HttpStatus.BAD_REQUEST, 'Listing is not available for purchase');
    }

    const buyer = await this.prisma.customer.findUnique({
      where: { userId: buyerUserId },
      include: { user: true },
    });
    if (!buyer) throw new ApiError(HttpStatus.NOT_FOUND, 'Buyer profile not found');
    if (buyer.id === listing.ownerId) {
      throw new ApiError(HttpStatus.BAD_REQUEST, 'You cannot buy your own listing');
    }

    // 2. Calculate values
    const totalAmount = listing.initialPrice;
    const platformFeePercent = parseFloat(this.configService.get('PLATFORM_FEE_PERCENT') || '5');
    const platformFee = (totalAmount * platformFeePercent) / 100;
    const sellerEarnings = totalAmount - platformFee;

    // 3. Create Order and Lock Listing in a transaction
    const order = await this.prisma.$transaction(async (tx) => {
      // Lock listing
      await tx.listing.update({
        where: { id: listingId },
        data: { status: ListingStatus.LOCKED },
      });

      // Create Order
      return await tx.order.create({
        data: {
          orderNumber: `ORD-${Date.now()}`,
          listingId,
          buyerId: buyer.id,
          sellerId: listing.ownerId,
          totalAmount,
          platformFee,
          sellerEarnings,
          status: OrderStatus.PENDING_PAYMENT,
          type: OrderType.PURCHASE,
        },
      });
    });

    // 4. Generate Stripe Session
    const appUrl = this.configService.get('APP_URL') || 'http://localhost:3000';
    const session = await this.stripeService.createCheckoutSession({
      amount: totalAmount,
      currency: 'usd',
      orderId: order.id,
      listingTitle: listing.title || 'Product Purchase',
      successUrl: `${appUrl}/payment-success?orderId=${order.id}`,
      cancelUrl: `${appUrl}/payment-failed?orderId=${order.id}`,
      customerEmail: buyer.user.email,
    });

    // 5. Save Session ID to Order
    await this.prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });

    return {
      orderId: order.id,
      checkoutUrl: session.url,
    };
  }

  async findAll(userId: string, role: string, type: 'buy' | 'sell') {
    const customer = await this.prisma.customer.findUnique({ where: { userId } });
    if (!customer) throw new ApiError(HttpStatus.NOT_FOUND, 'Customer profile not found');

    const where: any = {};
    if (type === 'buy') {
      where.buyerId = customer.id;
    } else {
      where.sellerId = customer.id;
    }

    return await this.prisma.order.findMany({
      where,
      include: {
        listing: true,
        buyer: { select: { fullName: true, id: true } },
        seller: { select: { fullName: true, id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { listing: true, buyer: true, seller: true },
    });

    if (!order) throw new ApiError(HttpStatus.NOT_FOUND, 'Order not found');

    const customer = await this.prisma.customer.findUnique({ where: { userId } });
    if (order.buyerId !== customer?.id && order.sellerId !== customer?.id) {
      throw new ApiError(HttpStatus.FORBIDDEN, 'Unauthorized access to this order');
    }

    return order;
  }
}
