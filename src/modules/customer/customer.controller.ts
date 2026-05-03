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
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import { Roles } from '../roles/roles.decorator';
import { ResponseService } from '@/utils/response';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { ParseFormDataInterceptor } from '@/helper/form_data_interceptor';
import { FileService } from '@/helper/file.service';
import { Role } from '@prisma/client';
import { FileInterceptorInmemory } from '@/helper/file_interceptor_inmemorty';

@Controller('customers')
export class CustomerController {
  constructor(
    private readonly CustomerService: CustomerService,
    private readonly fileService: FileService,
  ) {}

  @Get()
  @Roles(Role.ADMIN, Role.CUSTOMER, Role.SUPER_ADMIN)
  async findAll(@Query() query: Record<string, any>) {
    const result = await this.CustomerService.findAll(query);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Customers Found successfully',
      meta: result?.meta,
      data: result?.data,
    });
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER)
  async findOne(@Param('id') id: string) {
    const result = await this.CustomerService.findOne(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Customer Found successfully',
      data: result,
    });
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER)
  @UseInterceptors(
    FileInterceptorInmemory([{ name: 'avatar', maxCount: 1 }]),
    ParseFormDataInterceptor,
  )
  async update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
    @UploadedFiles() files: Record<string, Express.Multer.File[]>,
  ) {
    let avatar: string | undefined;

    const uploadableFile = files?.avatar;

    if (Array.isArray(uploadableFile) && uploadableFile.length > 0) {
      const uploaded = await this.fileService.uploadMultipleToCloudinary(uploadableFile, 'avatars');
      avatar = uploaded[0];
    }

    const result = await this.CustomerService.update(id, updateCustomerDto, avatar);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Customer Updated successfully',
      data: result,
    });
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER)
  async remove(@Param('id') id: string) {
    const result = await this.CustomerService.remove(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Customer Deleted successfully',
      data: result,
    });
  }
}
