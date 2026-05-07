import { Injectable } from '@nestjs/common';
import { ConfigService } from '@/config/config.service';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(private readonly configService: ConfigService) {
    this.stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2025-01-27.acacia' as any,
    });
  }

  async createCheckoutSession(params: {
    amount: number;
    currency: string;
    orderId: string;
    listingTitle: string;
    successUrl: string;
    cancelUrl: string;
    customerEmail?: string;
    metadata?: Record<string, string>;
  }) {
    return await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: params.currency,
            product_data: {
              name: params.listingTitle,
            },
            unit_amount: Math.round(params.amount * 100), // Stripe expects cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      client_reference_id: params.orderId,
      customer_email: params.customerEmail,
      metadata: {
        orderId: params.orderId,
        ...params.metadata,
      },
    });
  }

  verifyWebhook(payload: Buffer, signature: string) {
    const secret = this.configService.get('STRIPE_WEBHOOK_SECRET');
    return this.stripe.webhooks.constructEvent(payload, signature, secret);
  }
}
