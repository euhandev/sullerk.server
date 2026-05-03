import { Public } from '@/modules/auth/auth.decorator';
import { ResponseService } from '@/utils/response';
import { Body, Controller, Get, HttpStatus, Param, Patch, Post, Req } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UserService } from './user.service';
import { Request } from 'express';
import { CreateUserAdminDto } from './dto/create-admin.dto';
import { Roles } from '../roles/roles.decorator';
import { Role } from '@prisma/client';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UserService) {}

  @Public()
  @Post('create-admin')
  async createAdmin(@Body() createAdminDto: CreateUserAdminDto) {
    const result = await this.usersService.createAdmin(createAdminDto);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.CREATED,
      message: `Admin created successfully`,
      data: result,
    });
  }

  @Public()
  @Post('create-customer')
  async createCustomer(@Body() createCustomerDto: CreateCustomerDto) {
    const result = await this.usersService.createCustomer(createCustomerDto);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.CREATED,
      message: `Customer created successfully`,
      data: result,
    });
  }

  @Public()
  @Get('/')
  async getUsers(@Req() req: Request) {
    const result = await this.usersService.getMany(req?.query as Record<string, string>);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'user retrieved successfully',
      data: result.data,
      meta: result.meta,
    });
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  async findOne(@Param('id') id: string) {
    const result = await this.usersService.getOne({ email: id });
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'user retrieved successfully',
      data: result,
    });
  }

  @Patch('status/:id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async changeStatus(@Param('id') id: string) {
    const result = await this.usersService.changeStatus(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'user status updated successfully',
      data: result,
    });
  }

  // @Public()
  // @Get('/')
  // async userNameExists(@Req() req: Request) {
  //   console.log(req.query);

  //   const result = await this.usersService.userNameExists(
  //     req?.query?.username as string,
  //   );

  //   return ResponseService.formatResponse({
  //     statusCode: HttpStatus.OK,
  //     message: 'username checked successfully',
  //     data: result,
  //   });
  // }
}
