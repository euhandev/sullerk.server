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

  /**
   * Create a Stripe Connect Express account for a user
   */
  async createConnectAccount(email: string, userId: string) {
    const account = await this.stripe.accounts.create({
      type: 'express',
      email: email,
      capabilities: {
        transfers: { requested: true },
      },
      metadata: { userId },
    });

    return account;
  }

  /**
   * Generate an onboarding link for a Connect account
   */
  async createAccountLink(accountId: string, returnUrl: string, refreshUrl: string) {
    return await this.stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });
  }

  /**
   * Transfer funds from Platform to a Connect account
   */
  async createTransfer(amount: number, destinationAccountId: string, description?: string) {
    return await this.stripe.transfers.create({
      amount: Math.round(amount * 100), // convert to cents
      currency: 'gbp', // Default to GBP as per listing logic, should be configurable
      destination: destinationAccountId,
      description: description || 'Withdrawal from platform',
    });
  }

  verifyWebhook(payload: Buffer, signature: string) {
    const secret = this.configService.get('STRIPE_WEBHOOK_SECRET');
    return this.stripe.webhooks.constructEvent(payload, signature, secret);
  }
}
