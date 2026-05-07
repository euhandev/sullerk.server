import { Controller, Get, Post, Body, Param, Req, Query, HttpStatus, Patch } from '@nestjs/common';
import { ExchangeService } from './exchange.service';
import { CreateExchangeDto } from './dto/create-exchange.dto';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../roles/roles.decorator';
import { Role, ExchangeStatus } from '@prisma/client';
import { ResponseService } from '@/utils/response';

@ApiTags('Exchanges')
@ApiBearerAuth('JWT-auth')
@Controller('exchanges')
export class ExchangeController {
  constructor(private readonly exchangeService: ExchangeService) {}

  @Post()
  @Roles(Role.CUSTOMER)
  @ApiOperation({
    summary: 'Initiate an exchange offer',
    description: `
**CURL Request Sample:**
\`\`\`bash
curl -X POST http://localhost:8989/api/v1/exchanges \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "receiverId": "65fc1234567890abcdef",
    "senderListingIds": ["65fc11111111111111111111"],
    "receiverListingIds": ["65fc22222222222222222222"],
    "note": "Trade offer"
  }'
\`\`\`
`,
  })
  async create(@Body() dto: CreateExchangeDto, @Req() req: any) {
    const userId = req.user.id;
    const result = await this.exchangeService.createOffer(dto, userId);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.CREATED,
      message: 'Exchange offer sent successfully',
      data: result,
    });
  }

  @Post(':id/counter')
  @Roles(Role.CUSTOMER)
  @ApiOperation({
    summary: 'Send a counter-offer for an existing exchange',
    description: `
**CURL Request Sample:**
\`\`\`bash
curl -X POST http://localhost:8989/api/v1/exchanges/65fc_OLD_ID/counter \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "receiverId": "65fc_OTHER_USER_ID",
    "senderListingIds": ["65fc_NEW_ITEM_ID"],
    "receiverListingIds": ["65fc_ITEM_ID"],
    "note": "My counter offer"
  }'
\`\`\`
`,
  })
  async counter(@Param('id') id: string, @Body() dto: CreateExchangeDto, @Req() req: any) {
    const userId = req.user.id;
    dto.parentOfferId = id; // Force the parent relation
    const result = await this.exchangeService.createOffer(dto, userId);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.CREATED,
      message: 'Counter-offer sent successfully',
      data: result,
    });
  }

  @Patch(':id/respond')
  @Roles(Role.CUSTOMER)
  @ApiOperation({
    summary: 'Accept or Reject an exchange offer',
    description: `
**CURL Request Sample:**
\`\`\`bash
curl -X PATCH http://localhost:8989/api/v1/exchanges/65fc1234567890abcdef/respond \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{ "status": "ACCEPTED" }'
\`\`\`
`,
  })
  async respond(
    @Param('id') id: string,
    @Body('status') status: 'ACCEPTED' | 'REJECTED',
    @Req() req: any,
  ) {
    const userId = req.user.id;
    const result = await this.exchangeService.respondToOffer(id, status, userId);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `Offer ${status.toLowerCase()} successfully`,
      data: result,
    });
  }

  @Get('history')
  @Roles(Role.CUSTOMER)
  @ApiOperation({
    summary: 'Get exchange negotiation history',
    description: `
**CURL Request Sample:**
\`\`\`bash
curl -X GET http://localhost:8989/api/v1/exchanges/history \\
  -H "Authorization: Bearer YOUR_TOKEN"
\`\`\`
`,
  })
  @ApiQuery({ name: 'status', enum: ExchangeStatus, required: false })
  async getHistory(@Req() req: any, @Query('status') status?: ExchangeStatus) {
    const userId = req.user.id;
    const result = await this.exchangeService.getHistory(userId, status);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Exchange history retrieved successfully',
      data: result,
    });
  }
}
