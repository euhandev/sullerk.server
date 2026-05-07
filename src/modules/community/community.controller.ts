import {
  Controller,
<<<<<<< HEAD
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  Req,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { CommunityService } from './community.service';
import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';
import { Roles } from '../roles/roles.decorator';
import { Role } from '@prisma/client';
import { ResponseService } from '@/utils/response';
import { Request } from 'express';
import { FileInterceptorInmemory } from '@/helper/file_interceptor_inmemorty';
import { ParseFormDataInterceptor } from '@/helper/form_data_interceptor';
import { FileService } from '@/helper/file.service';

@Controller('communities')
export class CommunityController {
  constructor(private readonly communityService: CommunityService, private readonly fileService: FileService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER)
  @UseInterceptors(
      FileInterceptorInmemory([{ name: 'file', maxCount: 1 }]),
      ParseFormDataInterceptor,
    )
  async create(
    @Req() req: Request,
    @Body() paylaod: CreateCommunityDto,
    @UploadedFiles() files: Record<string, Express.Multer.File[]>,
  ) {

    let hero: string | undefined;

    const uploadableFiles = files?.file;

    if (Array.isArray(uploadableFiles) && uploadableFiles?.length > 0) {
      const uploaded = await this.fileService.uploadMultipleToCloudinary(uploadableFiles);
      hero = uploaded[0].url;
    }

    const result = await this.communityService.create(req, {...paylaod}, hero);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.CREATED,
      message: `Community created successfully`,
=======
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  Req,
  HttpStatus,
  Delete,
  Param,
} from '@nestjs/common';
import { CommunityService } from './community.service';
import { CreateCommunityDto } from './dto/create-community.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from '../roles/roles.decorator';
import { Role, FileContext } from '@prisma/client';
import {
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ResponseService } from '@/utils/response';
import { CommunityFileUploadResponse, CreateCommunityResponse } from './dto/community-response.dto';

@ApiTags('Communities')
@ApiBearerAuth('JWT-auth')
@Controller('communities')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Post('upload')
  @Roles(Role.CUSTOMER)
  @ApiOperation({
    summary: 'Upload community hero image (Step 1)',
    description: `
      Uploads a single hero image for a community.
      Returns a detailed file object including its unique database ID and URL.
      
      **CURL EXAMPLE:**
      \`\`\`bash
      curl -X POST "http://localhost:8989/api/v1/communities/upload" \\
        -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
        -H "Content-Type: multipart/form-data" \\
        -F "file=@/path/to/hero.jpg" \\
        -F "context=CREATE"
      \`\`\`
    `,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        context: { type: 'string', enum: ['CREATE', 'EDIT'], default: 'CREATE' },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 200,
    type: CommunityFileUploadResponse,
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadMedia(
    @UploadedFile() file: any,
    @Body('context') context: FileContext,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    const result = await this.communityService.uploadMedia(file, userId, context);

    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Hero image uploaded successfully',
      data: [result],
    });
  }

  @Post()
  @Roles(Role.CUSTOMER)
  @ApiOperation({
    summary: 'Create a new community (Step 2)',
    description: `
      Finalizes community creation and assigns the creator as ADMIN.
      You can provide the heroImg object (containing fileId and url) returned from the upload step.
      
      **CURL EXAMPLE:**
      \`\`\`bash
      curl -X POST "http://localhost:8989/api/v1/communities" \\
        -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
        -H "Content-Type: application/json" \\
        -d '{
          "name": "Vintage Jersey Collectors",
          "description": "A place for collectors of rare football kits.",
          "tags": ["football", "vintage", "kits"],
          "type": "PUBLIC",
          "heroImg": {
            "fileId": "69fae180e0c772d77befd5b8",
            "url": "http://localhost:8989/api/v1/files/hero.jpg"
          }
        }'
      \`\`\`
    `,
  })
  @ApiResponse({
    status: 201,
    type: CreateCommunityResponse,
  })
  async create(@Body() createCommunityDto: CreateCommunityDto, @Req() req: any) {
    const userId = req.user.id;
    const result = await this.communityService.create(createCommunityDto, userId);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.CREATED,
      message: 'Community created successfully',
>>>>>>> 4c011a9 (add post community creation module)
      data: result,
    });
  }

<<<<<<< HEAD
  @Get()
  async findAll(@Req() req: Request) {
    const result = await this.communityService.findAll(req);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `Communitys retrieved successfully`,
      meta: result.meta,
      data: result.data,
    });
  }

  @Get(':id')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const result = await this.communityService.findOne(req, id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `Community retrieved successfully`,
      data: result,
    });
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER)
  @UseInterceptors(
    FileInterceptorInmemory([{ name: 'file', maxCount: 1 }]),
    ParseFormDataInterceptor,
  )
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() paylaod: UpdateCommunityDto,
    @UploadedFiles() files: Record<string, Express.Multer.File[]>,
  ) {
    let hero: string | undefined;

    const uploadableFiles = files?.file;

    if (Array.isArray(uploadableFiles) && uploadableFiles?.length > 0) {
      const uploaded = await this.fileService.uploadMultipleToCloudinary(uploadableFiles);
      hero = uploaded[0].url;
    }

    const result = await this.communityService.update(req, id, paylaod, hero);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `Community updated successfully`,
      data: result,
    });
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER)
  async remove(@Req() req: Request, @Param('id') id: string) {
    const result = await this.communityService.remove(req, id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `Community deleted successfully`,
=======
  @Delete('upload/:id')
  @Roles(Role.CUSTOMER)
  @ApiOperation({
    summary: 'Delete a pending community file',
    description: `
      Removes an uploaded community file from storage and database.
      Only pending files tagged with module:COMMUNITY can be deleted.

      **CURL EXAMPLE:**
      \`\`\`bash
      curl -X DELETE "http://localhost:8989/api/v1/communities/upload/69fae180e0c772d77befd5b8" \\
        -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
      \`\`\`
    `,
  })
  @ApiResponse({
    status: 200,
    schema: { example: { success: true } },
  })
  async deletePendingFile(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;
    const result = await this.communityService.deletePendingFile(id, userId);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'File deleted successfully',
>>>>>>> 4c011a9 (add post community creation module)
      data: result,
    });
  }
}
