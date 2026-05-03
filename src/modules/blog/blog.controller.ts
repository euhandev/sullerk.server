import { FileService } from '@/helper/file.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  // UploadedFile,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { BlogService } from './blog.service';
import { CreateBlogDto } from './dto/create-blog.dto';
// import { CustomFileInterceptor } from '@/helper/file_interceptor_2';
import { FileInterceptorInmemory } from '@/helper/file_interceptor_inmemorty';
import { ParseFormDataInterceptor } from '@/helper/form_data_interceptor';
import { ResponseService } from '@/utils/response';
import { Role } from '@prisma/client';
import { Public } from '../auth/auth.decorator';
import { Roles } from '../roles/roles.decorator';
import { UpdateBlogDto } from './dto/update-blog.dto';

@Controller('blogs')
export class BlogController {
  constructor(
    private readonly blogService: BlogService,
    private readonly fileService: FileService,
  ) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @UseInterceptors(
    FileInterceptorInmemory([
      { name: 'primary', maxCount: 1 },
      { name: 'secondary', maxCount: 1 },
    ]),
    ParseFormDataInterceptor,
  )
  async create(
    @UploadedFiles() files: Record<string, Express.Multer.File[]>,
    @Body() createBlogDto: CreateBlogDto,
  ) {
    let primary: string | null;
    let secondary: string | null;

    const primaryUploadableFiles = files['primary'];
    const secondaryUploadableFiles = files['secondary'];

    if (Array.isArray(primaryUploadableFiles) && primaryUploadableFiles?.length > 0) {
      const images = await this.fileService.uploadMultipleToDigitalOcean(
        primaryUploadableFiles,
        'memory',
      );
      primary = images[0];
    }

    if (Array.isArray(secondaryUploadableFiles) && secondaryUploadableFiles?.length > 0) {
      const images = await this.fileService.uploadMultipleToDigitalOcean(
        secondaryUploadableFiles,
        'memory',
      );
      secondary = images[0];
    }

    const data = JSON.parse(JSON.stringify(createBlogDto));

    const result = await this.blogService.create({
      ...data,
      url: primary,
      secUrl: secondary,
    });

    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `blog created successfully`,
      data: result,
    });
  }

  @Public()
  @Get()
  async findAll(@Query() query: Record<string, any>) {
    const result = await this.blogService.findAll(query);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `all blogs found successfully`,
      meta: result?.meta,
      data: result?.data,
    });
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.blogService.findOne(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `single blog found successfully`,
      data: result,
    });
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @UseInterceptors(
    FileInterceptorInmemory([
      { name: 'primary', maxCount: 1 },
      { name: 'secondary', maxCount: 1 },
    ]),
    ParseFormDataInterceptor,
  )
  async update(
    @Param('id') id: string,
    @UploadedFiles() files: Record<string, Express.Multer.File[]>,
    @Body() updateBlogDto: UpdateBlogDto,
  ) {
    let primary: string | null = null;
    let secondary: string | null = null;

    const primaryUploadableFiles = files?.['primary'];
    const secondaryUploadableFiles = files?.['secondary'];

    if (Array.isArray(primaryUploadableFiles) && primaryUploadableFiles.length > 0) {
      const images = await this.fileService.uploadMultipleToDigitalOcean(
        primaryUploadableFiles,
        'memory',
      );
      primary = images[0];
    }

    if (Array.isArray(secondaryUploadableFiles) && secondaryUploadableFiles.length > 0) {
      const images = await this.fileService.uploadMultipleToDigitalOcean(
        secondaryUploadableFiles,
        'memory',
      );
      secondary = images[0];
    }

    const result = await this.blogService.update(id, {
      ...updateBlogDto,
      url: primary,
      secUrl: secondary,
    });

    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `Blog updated successfully`,
      data: result,
    });
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string) {
    const result = await this.blogService.remove(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `blog deleted successfully`,
      data: result,
    });
  }
}
