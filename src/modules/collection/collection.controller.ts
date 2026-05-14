import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { ResponseService } from '@/utils/response';
import { Roles } from '../roles/roles.decorator';
import { CollectionService } from './collection.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { Public } from '../auth/auth.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Collections')
@Controller('collections')
export class CollectionController {
  constructor(private readonly collectionService: CollectionService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async create(@Body() createCollectionDto: CreateCollectionDto) {
    const result = await this.collectionService.create(createCollectionDto);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.CREATED,
      message: 'Collection created successfully',
      data: result,
    });
  }

  @Public()
  @Get()
  async findAll(@Query() query: Record<string, any>) {
    const result = await this.collectionService.findAll(query);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Collections retrieved successfully',
      meta: result.meta,
      data: result.data,
    });
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.collectionService.findOne(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Collection retrieved successfully',
      data: result,
    });
  }

  @Public()
  @Get(':id/listings')
  async findAllListings(@Param('id') id: string, @Query() query: Record<string, any>) {
    const result = await this.collectionService.findAllListings(id, query);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Collection listings retrieved successfully',
      meta: result.meta,
      data: result.data,
    });
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async update(@Param('id') id: string, @Body() updateCollectionDto: UpdateCollectionDto) {
    const result = await this.collectionService.update(id, updateCollectionDto);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Collection updated successfully',
      data: result,
    });
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async remove(@Param('id') id: string) {
    const result = await this.collectionService.remove(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Collection deleted successfully',
      data: result,
    });
  }

  @Post(':id/listings/:listingId')
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async addListing(@Param('id') id: string, @Param('listingId') listingId: string) {
    const result = await this.collectionService.addListing(id, listingId);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Listing added to collection successfully',
      data: result,
    });
  }

  @Delete(':id/listings/:listingId')
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async removeListing(@Param('id') id: string, @Param('listingId') listingId: string) {
    const result = await this.collectionService.removeListing(id, listingId);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Listing removed from collection successfully',
      data: result,
    });
  }
}
