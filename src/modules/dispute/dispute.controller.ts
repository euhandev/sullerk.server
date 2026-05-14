import { Controller, Get, Post, Body, Req, HttpStatus } from '@nestjs/common';
import { DisputeService } from './dispute.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../roles/roles.decorator';
import { Role } from '@prisma/client';
import { ResponseService } from '@/utils/response';
import { Request } from 'express';

@ApiTags('Disputes')
@ApiBearerAuth('JWT-auth')
@Controller('disputes')
export class DisputeController {
  constructor(private readonly disputeService: DisputeService) {}

  @Post()
  @Roles(Role.CUSTOMER)
  @ApiOperation({
    summary: 'Raise a new dispute (User)',
    description: 'Raised by a customer for a listing or an order.',
  })
  async create(@Body() dto: CreateDisputeDto, @Req() req: any) {
    const userId = req.user.id;
    const result = await this.disputeService.create(dto, userId);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.CREATED,
      message: 'Dispute raised successfully',
      data: result,
    });
  }

  // ─────────────────────────────────────────
  // 👥 User Route
  // ─────────────────────────────────────────

  @Get('users')
  @Roles(Role.CUSTOMER)
  @ApiOperation({
    summary: 'View my disputes (User)',
    description: 'Retrieves disputes where you are the raiser, listing owner, or order party.',
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    enum: ['all', 'dispute', 'refund', 'open', 'pending', 'under review', 'resolved'],
    default: 'all',
  })
  @ApiQuery({ name: 'searchTerm', required: false, description: 'Search in reason or details' })
  @ApiQuery({ name: 'page', required: false, default: 1 })
  @ApiQuery({ name: 'limit', required: false, default: 10 })
  async findMyDisputes(@Req() req: Request) {
    const result = await this.disputeService.findAll(req.query, (req as any).user);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Your disputes retrieved successfully',
      data: result.data,
      meta: result.meta,
    });
  }
}
