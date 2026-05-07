import { Controller, Get, Post, Body, Param, Req, Query, HttpStatus, Patch } from '@nestjs/common';
import { DisputeService } from './dispute.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../roles/roles.decorator';
import { Role, DisputeStatus } from '@prisma/client';
import { ResponseService } from '@/utils/response';

@ApiTags('Disputes')
@ApiBearerAuth('JWT-auth')
@Controller('disputes')
export class DisputeController {
  constructor(private readonly disputeService: DisputeService) {}

  @Post()
  @Roles(Role.CUSTOMER)
  @ApiOperation({
    summary: 'Raise a new dispute (User)',
    description: `
**CURL Request Sample:**
\`\`\`bash
curl -X POST http://localhost:8989/api/v1/disputes \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "listingId": "65fc1234567890abcdef",
    "type": "DISPUTE",
    "reason": "Damaged Item",
    "details": "The box arrived crushed.",
    "evidence": [{ "fileId": "f1", "url": "http://img.com/p1.jpg" }]
  }'
\`\`\`
`,
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

  @Get('my-disputes')
  @Roles(Role.CUSTOMER)
  @ApiOperation({
    summary: 'View my raised disputes (User)',
    description: `
**CURL Request Sample:**
\`\`\`bash
curl -X GET http://localhost:8989/api/v1/disputes/my-disputes \\
  -H "Authorization: Bearer YOUR_TOKEN"
\`\`\`
`,
  })
  async findMyDisputes(@Req() req: any) {
    const userId = req.user.id;
    const result = await this.disputeService.findMyDisputes(userId);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Your disputes retrieved successfully',
      data: result,
    });
  }

  // ─────────────────────────────────────────
  // 🛡️ Admin Routes
  // ─────────────────────────────────────────

  @Get('admin/all')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'View all disputes (Admin)',
    description: `
**CURL Request Sample:**
\`\`\`bash
curl -X GET http://localhost:8989/api/v1/disputes/admin/all?status=OPEN \\
  -H "Authorization: Bearer ADMIN_TOKEN"
\`\`\`
`,
  })
  @ApiQuery({ name: 'status', enum: DisputeStatus, required: false })
  async findAll(@Query('status') status?: DisputeStatus) {
    const result = await this.disputeService.findAll(status);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'All disputes retrieved successfully',
      data: result,
    });
  }

  @Patch('admin/:id/resolve')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Resolve a dispute (Admin)',
    description: `
**CURL Request Sample:**
\`\`\`bash
curl -X PATCH http://localhost:8989/api/v1/disputes/admin/65fc12345/resolve \\
  -H "Authorization: Bearer ADMIN_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "status": "RESOLVED",
    "resolutionNote": "Refund issued."
  }'
\`\`\`
`,
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
