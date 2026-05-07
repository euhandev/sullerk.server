import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, Req } from '@nestjs/common';
import { CommunityMemberService } from './community-member.service';
import { CreateCommunityMemberDto } from './dto/create-community-member.dto';
import { UpdateCommunityMemberDto } from './dto/update-community-member.dto';
import { Roles } from '../roles/roles.decorator';
import { Role } from '@prisma/client';
import { ResponseService } from '@/utils/response';
import { Request } from 'express';

@Controller('community-members')
export class CommunityMemberController {
  constructor(private readonly communityMemberService: CommunityMemberService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER)
  async create(@Req() req: Request, @Body() paylaod: CreateCommunityMemberDto) {
    const result = await this.communityMemberService.create(req, paylaod);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.CREATED,
      message: `CommunityMember created successfully`,
      data: result,
    });
  }

  @Get()
  async findAll(@Req() req: Request) {
    const result = await this.communityMemberService.findAll(req);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `CommunityMembers retrieved successfully`,
      meta: result.meta,
      data: result.data,
    });
  }

  @Get('community/:communityId')
  async findByCommunity(@Req() req: Request, @Param('communityId') communityId: string) {
    const result = await this.communityMemberService.findAll(req, communityId);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `CommunityMembers retrieved successfully for community: ${communityId}`,
      meta: result.meta,
      data: result.data,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.communityMemberService.findOne(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `CommunityMember retrieved successfully`,
      data: result,
    });
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER)
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() paylaod: UpdateCommunityMemberDto,
  ) {
    const result = await this.communityMemberService.update(req, id, paylaod);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `CommunityMember updated successfully`,
      data: result,
    });
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER)
  async remove(@Req() req: Request, @Param('id') id: string) {
    const result = await this.communityMemberService.remove(req, id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `CommunityMember deleted successfully`,
      data: result,
    });
  }
}
