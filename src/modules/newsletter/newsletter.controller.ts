import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, Req } from '@nestjs/common';
import { NewsletterService } from './newsletter.service';
import { CreateNewsletterDto } from './dto/create-newsletter.dto';
import { UpdateNewsletterDto } from './dto/update-newsletter.dto';
import { Roles } from '../roles/roles.decorator';
import { Role } from '@prisma/client';
import { ResponseService } from '@/utils/response';
import { Request } from 'express';
import { Public } from '../auth/auth.decorator';

@Controller('newsletters')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Public()
  @Post()
  // @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async create(@Body() paylaod: CreateNewsletterDto) {
    const result = await this.newsletterService.create(paylaod);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.CREATED,
      message: `Newsletter created successfully`,
      data: result,
    });
  }

  @Get()
  @Roles(Role.ADVISOR)
  async findAll(@Req() req: Request) {
    const result = await this.newsletterService.findAll(req);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `Newsletters retrieved successfully`,
      meta: result.meta,
      data: result.data,
    });
  }

  @Get(':id')
  @Roles(Role.ADVISOR)
  async findOne(@Param('id') id: string) {
    const result = await this.newsletterService.findOne(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `Newsletter retrieved successfully`,
      data: result,
    });
  }

  @Patch(':id')
  @Roles(Role.ADVISOR)
  async update(@Param('id') id: string, @Body() paylaod: UpdateNewsletterDto) {
    const result = await this.newsletterService.update(id, paylaod);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `Newsletter updated successfully`,
      data: result,
    });
  }

  @Delete(':id')
  @Roles(Role.ADVISOR)
  async remove(@Param('id') id: string) {
    const result = await this.newsletterService.remove(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `Newsletter deleted successfully`,
      data: result,
    });
  }
}
