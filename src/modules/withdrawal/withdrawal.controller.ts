import { Controller, Get, Post, Body, Query, Req, HttpStatus } from '@nestjs/common';
import { WithdrawalService } from './withdrawal.service';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../roles/roles.decorator';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { ResponseService } from '@/utils/response';

@ApiTags('Withdrawals')
@ApiBearerAuth('JWT-auth')
@Controller('withdrawals')
export class WithdrawalController {
  constructor(private readonly withdrawalService: WithdrawalService) {}

  @Post()
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Customer: Create a withdrawal request' })
  async create(@Req() req: Request, @Body() dto: CreateWithdrawalDto) {
    const userId = (req as any).user.id;
    const result = await this.withdrawalService.createRequest(userId, dto);

    return ResponseService.formatResponse({
      statusCode: HttpStatus.CREATED,
      message: 'Withdrawal request created successfully',
      data: result,
    });
  }

  @Post('onboard')
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Customer: Get Stripe onboarding link' })
  async onboard(
    @Req() req: Request,
    @Body('returnUrl') returnUrl: string,
    @Body('refreshUrl') refreshUrl: string,
  ) {
    const userId = (req as any).user.id;
    const result = await this.withdrawalService.startOnboarding(userId, returnUrl, refreshUrl);

    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Onboarding link generated',
      data: result,
    });
  }

  @Get('my')
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Customer: Get my withdrawal history' })
  async findMy(@Req() req: Request, @Query() query: any) {
    const userId = (req as any).user.id;
    const result = await this.withdrawalService.findAll(query, userId, Role.CUSTOMER);

    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Withdrawal history retrieved',
      data: result.data,
      meta: result.meta,
    });
  }
}
