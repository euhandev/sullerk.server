import { Controller, Post, Req, RawBodyRequest } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { Request } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('webhook')
  @ApiOperation({ summary: 'Stripe Webhook endpoint' })
  async handleWebhook(@Req() req: RawBodyRequest<Request>) {
    return await this.paymentService.handleWebhook(req);
  }
}
