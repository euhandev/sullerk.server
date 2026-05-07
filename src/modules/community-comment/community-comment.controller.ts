import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, Req } from '@nestjs/common';
import { CommunityCommentService } from './community-comment.service';
import { CreateCommunityCommentDto } from './dto/create-community-comment.dto';
import { UpdateCommunityCommentDto } from './dto/update-community-comment.dto';
import { Roles } from '../roles/roles.decorator';
import { Role } from '@prisma/client';
import { ResponseService } from '@/utils/response';
import { Request } from 'express';

import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Community Comments')
@ApiBearerAuth('JWT-auth')
@Controller('community-comments')
export class CommunityCommentController {
  constructor(private readonly communityCommentService: CommunityCommentService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER)
  @ApiOperation({
    summary: 'Create a comment in a community post',
    description: `
**CURL Request Sample:**
\`\`\`bash
curl -X POST http://localhost:8989/api/v1/community-comments \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "postId": "65fc123...",
    "communityId": "65fc456...",
    "body": "Great insights in this community!"
  }'
\`\`\`
`,
  })
  async create(@Req() req: Request, @Body() paylaod: CreateCommunityCommentDto) {
    const result = await this.communityCommentService.create(req, paylaod);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.CREATED,
      message: `CommunityComment created successfully`,
      data: result,
    });
  }

  @Get()
  @ApiOperation({
    summary: 'Find all community comments (with filters)',
    description: `
**CURL Request Sample:**
\`\`\`bash
curl -X GET "http://localhost:8989/api/v1/community-comments?postId=65fc123..."
\`\`\`
`,
  })
  async findAll(@Req() req: Request) {
    const result = await this.communityCommentService.findAll(req);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `CommunityComments retrieved successfully`,
      meta: result.meta,
      data: result.data,
    });
  }

  @Get('post/:postId')
  @ApiOperation({
    summary: 'Find all community comments (with filters)',
    description: `
**CURL Request Sample:**
\`\`\`bash
curl -X GET "http://localhost:8989/api/v1/community-comments/post/:postId"
\`\`\`
`,
  })
  async findAllByPostId(@Req() req: Request, @Param('postId') postId: string) {
    const result = await this.communityCommentService.findAllByPostId(req, postId);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `Community Post Comments retrieved successfully`,
      meta: result.meta,
      data: result.data,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single community comment by ID' })
  async findOne(@Param('id') id: string) {
    const result = await this.communityCommentService.findOne(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `CommunityComment retrieved successfully`,
      data: result,
    });
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER)
  @ApiOperation({ summary: 'Update your community comment' })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() paylaod: UpdateCommunityCommentDto,
  ) {
    const result = await this.communityCommentService.update(req, id, paylaod);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `CommunityComment updated successfully`,
      data: result,
    });
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER)
  @ApiOperation({ summary: 'Delete a community comment' })
  async remove(@Req() req: Request, @Param('id') id: string) {
    const result = await this.communityCommentService.remove(req, id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `CommunityComment deleted successfully`,
      data: result,
    });
  }
}
