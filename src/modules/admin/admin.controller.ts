import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  UseInterceptors,
  UploadedFiles,
  Req,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { ListingService } from '../listing/listing.service';
import { Roles } from '../roles/roles.decorator';
import { ResponseService } from '@/utils/response';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { UpdateAdminProfileDto } from './dto/update-profile.dto';
import { ParseFormDataInterceptor } from '@/helper/form_data_interceptor';
import { FileService } from '../../helper/file.service';
import { Role } from '@prisma/client';
import { FileInterceptorInmemory } from '@/helper/file_interceptor_inmemorty';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { WithdrawalService } from '../withdrawal/withdrawal.service';
import { DisputeService } from '../dispute/dispute.service';
import { TransactionService } from '../transaction/transaction.service';
import { ResolveDisputeDto } from '../dispute/dto/resolve-dispute.dto';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly listingService: ListingService,
    private readonly fileService: FileService,
    private readonly withdrawalService: WithdrawalService,
    private readonly disputeService: DisputeService,
    private readonly transactionService: TransactionService,
  ) {}

  // ─────────────────────────────────────────
  // 📦 Listings
  // ─────────────────────────────────────────

  @Get('listings')
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async findAllListings(@Query() query: Record<string, any>) {
    const result = await this.listingService.findAllAdmin(query);

    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'All listings retrieved successfully for admin',
      meta: result.meta,
      data: result.data,
    });
  }

  // ─────────────────────────────────────────
  // 🛡️ Admin User Management
  // ─────────────────────────────────────────

  @Get()
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async findAll(@Query() query: Record<string, any>) {
    const result = await this.adminService.findAll(query);

    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Admins Found successfully',
      meta: result?.meta,
      data: result?.data,
    });
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async findOne(@Param('id') id: string) {
    const result = await this.adminService.findOne(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Admin Found successfully',
      data: result,
    });
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Update Admin profile',
    description: `
      Updates admin user account (email, username) and profile details (fullName, address, intro).
      Supports avatar upload via **multipart/form-data**.
      
      **Note:** For nested admin fields in form-data, use keys like:
      - \`admin[fullName]\`
      - \`admin[address]\`
      - \`admin[intro]\`
      
      **Curl Sample:**
      \`\`\`bash
      curl -X PATCH "http://localhost:8989/api/v1/admin/{id}" \\
           -H "Authorization: Bearer {TOKEN}" \\
           -F "email=new_email@test.com" \\
           -F "admin[fullName]=New Name" \\
           -F "avatar=@/path/to/img.png"
      \`\`\`
    `,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'admin@test.com' },
        username: { type: 'string', example: 'admin_user' },
        avatar: { type: 'string', format: 'binary' },
        'admin[fullName]': { type: 'string', example: 'John Doe' },
        'admin[address]': { type: 'string', example: '123 Admin St' },
        'admin[intro]': { type: 'string', example: 'Experienced admin' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Admin updated successfully',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Admin Updated successfully' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '65f...' },
            email: { type: 'string', example: 'new_email@test.com' },
            username: { type: 'string', example: 'admin_user' },
            role: { type: 'string', example: 'ADMIN' },
            avatar: { type: 'string', example: 'https://cloudinary.com/avatar.png' },
            admin: {
              type: 'object',
              properties: {
                id: { type: 'string', example: '65g...' },
                fullName: { type: 'string', example: 'New Name' },
                address: { type: 'string', example: '123 Admin St' },
                intro: { type: 'string', example: 'Experienced admin' },
              },
            },
          },
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptorInmemory([{ name: 'avatar', maxCount: 1 }]),
    ParseFormDataInterceptor,
  )
  async update(
    @Param('id') id: string,
    @Body() updateAdminDto: UpdateAdminDto,
    @UploadedFiles() files: Record<string, Express.Multer.File[]>,
  ) {
    let avatar: string | undefined;

    const uploadableFiles = files?.avatar;

    if (Array.isArray(uploadableFiles) && uploadableFiles?.length > 0) {
      const uploaded = await this.fileService.uploadMultipleToCloudinary(
        uploadableFiles,
        'avatars',
      );
      avatar = uploaded[0].url;
    }

    const result = await this.adminService.update(id, updateAdminDto, avatar);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Admin Updated successfully',
      data: result,
    });
  }

  @Patch('profile/update')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update own email and name (Password Required)',
    description: `
      Allows a logged-in admin to update their own email and full name.
      **Requires current password** for security verification.
      
      **Curl Sample:**
      \`\`\`bash
      curl -X PATCH "http://localhost:8989/api/v1/admin/profile/update" \\
           -H "Authorization: Bearer {TOKEN}" \\
           -H "Content-Type: application/json" \\
           -d '{
             "email": "new_email@test.com",
             "fullName": "Updated Admin Name",
             "currentPassword": "password123"
           }'
      \`\`\`
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
  })
  async updateProfile(@Req() req: any, @Body() dto: UpdateAdminProfileDto) {
    const userId = req.user.id;
    const result = await this.adminService.updateProfile(userId, dto);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Profile updated successfully',
      data: result,
    });
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async remove(@Param('id') id: string) {
    const result = await this.adminService.remove(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Admin Deleted successfully',
      data: result,
    });
  }

  // ─────────────────────────────────────────
  // 🏦 Withdrawals
  // ─────────────────────────────────────────

  @Get('withdrawals')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Admin: List all withdrawal requests' })
  async findAllWithdrawals(@Query() query: any) {
    const result = await this.withdrawalService.findAll(query);

    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'All withdrawals retrieved',
      data: result.data,
      meta: result.meta,
    });
  }

  @Patch('withdrawals/:id/approve')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Admin: Approve withdrawal and trigger Stripe' })
  async approveWithdrawal(@Param('id') id: string, @Body('adminNote') adminNote: string) {
    const result = await this.withdrawalService.approveRequest(id, adminNote);

    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Withdrawal approved and funds transferred',
      data: result,
    });
  }

  @Patch('withdrawals/:id/reject')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Admin: Reject withdrawal and refund balance' })
  async rejectWithdrawal(@Param('id') id: string, @Body('reason') reason: string) {
    const result = await this.withdrawalService.rejectRequest(id, reason);

    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Withdrawal rejected and balance refunded',
      data: result,
    });
  }

  // ─────────────────────────────────────────
  // ⚖️ Disputes
  // ─────────────────────────────────────────

  @Get('disputes')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'View all disputes (Admin)',
    description: 'Admins can see all disputes.',
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    enum: ['all', 'dispute', 'refund', 'open', 'pending', 'under review', 'resolved'],
    default: 'all',
  })
  @ApiQuery({ name: 'searchTerm', required: false })
  @ApiQuery({ name: 'page', required: false, default: 1 })
  @ApiQuery({ name: 'limit', required: false, default: 10 })
  async findAllDisputes(@Query() query: any, @Req() req: any) {
    const result = await this.disputeService.findAll(query, req.user);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'All disputes retrieved successfully',
      data: result.data,
      meta: result.meta,
    });
  }

  @Patch('disputes/:id/resolve')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Resolve a dispute (Admin)',
  })
  async resolveDispute(@Param('id') id: string, @Body() dto: ResolveDisputeDto, @Req() req: any) {
    const adminUserId = req.user.id;
    const result = await this.disputeService.resolve(id, dto, adminUserId);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Dispute resolved successfully',
      data: result,
    });
  }

  // ─────────────────────────────────────────
  // 💸 Transactions
  // ─────────────────────────────────────────

  @Get('transactions')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Admin: Get transaction history (Transformed)',
    description: `
      Retrieves detailed transaction history for Admin dashboard.
    `,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['all', 'PENDING', 'COMPLETED', 'CANCELLED'],
    default: 'all',
  })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, default: 1 })
  @ApiQuery({ name: 'limit', required: false, default: 10 })
  async findAllTransactions(@Query() query: any) {
    const result = await this.transactionService.findAllAdmin(query);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Admin transactions retrieved successfully',
      data: result.data,
      meta: result.meta,
    });
  }
}
