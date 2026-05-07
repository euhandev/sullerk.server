import { Controller, Get, Post, Body, Param, Req, Query, HttpStatus } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../roles/roles.decorator';
import { Role } from '@prisma/client';
import { ResponseService } from '@/utils/response';

@ApiTags('Orders')
@ApiBearerAuth('JWT-auth')
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @Roles(Role.CUSTOMER)
  @ApiOperation({
    summary: 'Initiate a purchase for a listing',
    description: `
**CURL Request Sample:**
\`\`\`bash
curl -X POST http://localhost:8989/api/v1/orders \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{ "listingId": "69fae180e0c772d77befd5b8" }'
\`\`\`
`,
  })
  async create(@Body() createOrderDto: CreateOrderDto, @Req() req: any) {
    const userId = req.user.id;
    const result = await this.orderService.create(createOrderDto, userId);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.CREATED,
      message: 'Order initiated successfully',
      data: result,
    });
  }

  @Get('history')
  @Roles(Role.CUSTOMER)
  @ApiOperation({
    summary: 'Get purchase or sales history',
    description: `
**CURL Request Sample:**
\`\`\`bash
curl -X GET "http://localhost:8989/api/v1/orders/history?type=buy" \\
  -H "Authorization: Bearer YOUR_TOKEN"
\`\`\`
`,
  })
  @ApiQuery({ name: 'type', enum: ['buy', 'sell'], required: true })
  async findAll(@Req() req: any, @Query('type') type: 'buy' | 'sell' = 'buy') {
    const userId = req.user.id;
    const role = req.user.role;
    const result = await this.orderService.findAll(userId, role, type);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `${type === 'buy' ? 'Purchases' : 'Sales'} retrieved successfully`,
      data: result,
    });
  }

  @Get(':id')
  @Roles(Role.CUSTOMER)
  @ApiOperation({
    summary: 'Get detailed order information',
    description: `
**CURL Request Sample:**
\`\`\`bash
curl -X GET http://localhost:8989/api/v1/orders/65fc1234567890abcdef \\
  -H "Authorization: Bearer YOUR_TOKEN"
\`\`\`
`,
  })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;
    const result = await this.orderService.findOne(id, userId);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Order details retrieved successfully',
      data: result,
    });
  }
}
