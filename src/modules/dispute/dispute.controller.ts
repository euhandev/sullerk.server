import { Controller, Get, Post, Body, Param, Req, HttpStatus, Patch } from '@nestjs/common';
import { DisputeService } from './dispute.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
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

  // ─────────────────────────────────────────
  // 🛡️ Admin Routes
  // ─────────────────────────────────────────

  @Get('admin')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'View all disputes (Admin)',
    description:
      'Admins can see all disputes. Use self=true to see disputes related to your own activities.',
  })
  @ApiQuery({ name: 'self', required: false, type: Boolean, default: false })
  @ApiQuery({
    name: 'filter',
    required: false,
    enum: ['all', 'dispute', 'refund', 'open', 'pending', 'under review', 'resolved'],
    default: 'all',
  })
  @ApiQuery({ name: 'searchTerm', required: false, description: 'Search in reason or details' })
  @ApiQuery({ name: 'page', required: false, default: 1 })
  @ApiQuery({ name: 'limit', required: false, default: 10 })
  async findAll(@Req() req: Request) {
    const result = await this.disputeService.findAll(req.query, (req as any).user);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'All disputes retrieved successfully',
      data: result.data,
      meta: result.meta,
    });
  }

  @Patch('admin/:id/resolve')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Resolve a dispute (Admin)',
  })
  async resolve(@Param('id') id: string, @Body() dto: ResolveDisputeDto, @Req() req: any) {
    const adminUserId = req.user.id;
    const result = await this.disputeService.resolve(id, dto, adminUserId);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Dispute resolved successfully',
      data: result,
    });
  }
}
