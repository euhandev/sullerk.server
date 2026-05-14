import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '@/helper/prisma.service';
import { StripeService } from '@/helper/stripe.service';
import { ConfigService } from '@/config/config.service';
import { ApiError } from '@/utils/api_error';
import { Role, WithdrawalStatus, TransactionType, TransactionStatus } from '@prisma/client';
import QueryBuilder from '@/utils/query_builder';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';

@Injectable()
export class WithdrawalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Create a withdrawal request
   */
  async createRequest(userId: string, dto: CreateWithdrawalDto) {
    const minAmount = Number(this.config.get('MIN_WITHDRAWAL_AMOUNT') || 50);
    const autoApprove = this.config.get('WITHDRAWAL_AUTO_APPROVE') === 'true';

    if (dto.amount < minAmount) {
      throw new ApiError(HttpStatus.BAD_REQUEST, `Minimum withdrawal amount is £${minAmount}`);
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Check Customer Balance
      const customer = await tx.customer.findUnique({
        where: { userId },
      });

      if (!customer) throw new ApiError(HttpStatus.NOT_FOUND, 'Customer profile not found');
      if (customer.balance < dto.amount) {
        throw new ApiError(HttpStatus.BAD_REQUEST, 'Insufficient balance');
      }

      // 2. Check if user has a Stripe Connect account
      if (!customer.stripeConnectId) {
        throw new ApiError(
          HttpStatus.BAD_REQUEST,
          'Please connect your Stripe account first to receive payouts',
        );
      }

      // 3. Create Withdrawal Record
      const withdrawal = await tx.withdrawal.create({
        data: {
          customerId: customer.id,
          amount: dto.amount,
          status: autoApprove ? WithdrawalStatus.COMPLETED : WithdrawalStatus.PENDING,
        },
      });

      // 4. Deduct Balance (Assured Deduction)
      await tx.customer.update({
        where: { id: customer.id },
        data: { balance: { decrement: dto.amount } },
      });

      // 5. Create Transaction Log
      const transaction = await tx.transaction.create({
        data: {
          customerId: customer.id,
          amount: -dto.amount,
          type: TransactionType.WITHDRAWAL,
          status: autoApprove ? TransactionStatus.COMPLETED : TransactionStatus.PENDING,
          withdrawalId: withdrawal.id,
          description: `Withdrawal request for £${dto.amount}`,
        },
      });

      // 6. If Auto-Approve, trigger Stripe Transfer immediately
      if (autoApprove) {
        try {
          const transfer = await this.stripeService.createTransfer(
            dto.amount,
            customer.stripeConnectId,
            `Withdrawal #${withdrawal.id}`,
          );

          await tx.withdrawal.update({
            where: { id: withdrawal.id },
            data: { stripeTransferId: transfer.id },
          });
        } catch (error) {
          // If Stripe fails, we keep the status as PENDING and log the error for Admin to review
          await tx.withdrawal.update({
            where: { id: withdrawal.id },
            data: {
              status: WithdrawalStatus.PENDING,
              adminNote: `Auto-approve failed: ${error.message}`,
            },
          });

          await tx.transaction.update({
            where: { id: transaction.id },
            data: { status: TransactionStatus.PENDING },
          });
        }
      }

      return withdrawal;
    });
  }

  /**
   * Admin: Approve a withdrawal
   */
  async approveRequest(id: string, adminNote?: string) {
    const withdrawal = await this.prisma.withdrawal.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!withdrawal) throw new ApiError(HttpStatus.NOT_FOUND, 'Withdrawal request not found');
    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      throw new ApiError(HttpStatus.BAD_REQUEST, `Cannot approve a ${withdrawal.status} request`);
    }

    if (!withdrawal.customer.stripeConnectId) {
      throw new ApiError(HttpStatus.BAD_REQUEST, 'Customer has no Stripe account linked');
    }

    // Trigger Stripe Transfer
    const transfer = await this.stripeService.createTransfer(
      withdrawal.amount,
      withdrawal.customer.stripeConnectId,
      `Withdrawal #${withdrawal.id}`,
    );

    return await this.prisma.$transaction(async (tx) => {
      await tx.withdrawal.update({
        where: { id },
        data: {
          status: WithdrawalStatus.COMPLETED,
          stripeTransferId: transfer.id,
          adminNote: adminNote || 'Approved by Admin',
        },
      });

      // Update Transaction status if found
      await tx.transaction.updateMany({
        where: {
          customerId: withdrawal.customerId,
          type: TransactionType.WITHDRAWAL,
          amount: -withdrawal.amount,
          status: TransactionStatus.PENDING,
        },
        data: { status: TransactionStatus.COMPLETED },
      });

      return { success: true, transferId: transfer.id };
    });
  }

  /**
   * Admin: Reject a withdrawal
   */
  async rejectRequest(id: string, reason: string) {
    const withdrawal = await this.prisma.withdrawal.findUnique({
      where: { id },
    });

    if (!withdrawal) throw new ApiError(HttpStatus.NOT_FOUND, 'Withdrawal request not found');
    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      throw new ApiError(HttpStatus.BAD_REQUEST, `Cannot reject a ${withdrawal.status} request`);
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Update status
      await tx.withdrawal.update({
        where: { id },
        data: {
          status: WithdrawalStatus.REJECTED,
          adminNote: reason,
        },
      });

      // 2. REFUND Balance (Assured Reversion)
      await tx.customer.update({
        where: { id: withdrawal.customerId },
        data: { balance: { increment: withdrawal.amount } },
      });

      // 3. Update Transaction log
      await tx.transaction.updateMany({
        where: {
          customerId: withdrawal.customerId,
          type: TransactionType.WITHDRAWAL,
          amount: -withdrawal.amount,
          status: TransactionStatus.PENDING,
        },
        data: {
          status: TransactionStatus.CANCELLED,
          description: `Withdrawal rejected: ${reason}`,
        },
      });

      return { success: true };
    });
  }

  /**
   * User: Start Stripe Onboarding
   */
  async startOnboarding(userId: string, returnUrl: string, refreshUrl: string) {
    const customer = await this.prisma.customer.findUnique({ where: { userId } });
    if (!customer) throw new ApiError(HttpStatus.NOT_FOUND, 'Customer profile not found');

    let accountId = customer.stripeConnectId;

    if (!accountId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      const account = await this.stripeService.createConnectAccount(user.email, userId);
      accountId = account.id;

      await this.prisma.customer.update({
        where: { id: customer.id },
        data: { stripeConnectId: accountId },
      });
    }

    const link = await this.stripeService.createAccountLink(accountId, returnUrl, refreshUrl);
    return { url: link.url };
  }

  /**
   * Get all withdrawals (Admin) or user history
   */
  async findAll(query: any, userId?: string, role?: Role) {
    const where: any = {};
    if (role === Role.CUSTOMER && userId) {
      const customer = await this.prisma.customer.findUnique({ where: { userId } });
      where.customerId = customer?.id;
    }

    if (query.status) where.status = query.status;

    const queryBuilder = new QueryBuilder(query, this.prisma.withdrawal);
    const [data, meta] = await Promise.all([
      queryBuilder.rawFilter(where).sort().paginate().include({ customer: true }).execute(),
      queryBuilder.countTotal(),
    ]);

    return { data, meta };
  }
}
