export const controllerTemplate = ({ pascal, camel, kebab }) => `import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ${pascal}Service } from './${kebab}.service';
import { Create${pascal}Dto } from './dto/create-${kebab}.dto';
import { Update${pascal}Dto } from './dto/update-${kebab}.dto';
import { Roles } from '../roles/roles.decorator';
import { Role } from '@prisma/client';
import { ResponseService } from '@/utils/response';
import { Request } from 'express';

@Controller('${kebab}s')
export class ${pascal}Controller {
  constructor(
    private readonly ${camel}Service: ${pascal}Service,
  ) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async create(
    @Body() paylaod: Create${pascal}Dto,
  ) {
    const result = await this.${camel}Service.create(paylaod);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.CREATED,
      message: \`${pascal} created successfully\`,
      data: result,
    });
  }

  @Get()
  async findAll(@Req() req: Request) {
    const result = await this.${camel}Service.findAll(req);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: \`${pascal}s retrieved successfully\`,
      meta:result.meta,
      data: result.data,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.${camel}Service.findOne(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: \`${pascal} retrieved successfully\`,
      data: result,
    });
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async update(
    @Param('id') id: string,
    @Body() paylaod: Update${pascal}Dto,
  ) {
    const result = await this.${camel}Service.update(id, paylaod);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: \`${pascal} updated successfully\`,
      data: result,
    });
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async remove(@Param('id') id: string) {
    const result = await this.${camel}Service.remove(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: \`${pascal} deleted successfully\`,
      data: result,
    });
  }
}
`;
