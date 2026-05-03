import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './auth.decorator';
import { Request, Response } from 'express';
import { ResponseService } from '@/utils/response';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../roles/roles.decorator';
import { Role } from '@prisma/client';
import { ConfigService } from '@/config/config.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  // ─────────────────────────────────────────
  // 🍪 Helper: Set Auth Cookies
  // ─────────────────────────────────────────
  private parseMaxAge(maxAge: string): number {
    const unit = maxAge.slice(-1);
    const value = parseInt(maxAge.slice(0, -1));
    if (isNaN(value)) return 0;

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return parseInt(maxAge) || 0;
    }
  }

  private setAuthCookies(res: Response, tokens: { accessToken: string; refreshToken: string }) {
    const isProduction = this.configService.get('NODE_ENV')?.toLowerCase() === 'production';
    const cookieDomain = this.configService.get('COOKIE_DOMAIN') || 'localhost';

    const accessTokenMaxAge = this.parseMaxAge(this.configService.get('JWT_EXPIRES_IN') || '7d');
    const refreshTokenMaxAge = this.parseMaxAge(
      this.configService.get('JWT_REFRESH_EXPIRES_IN') || '365d',
    );

    res.cookie('access_token', tokens.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: accessTokenMaxAge,
      path: '/',
      domain: cookieDomain,
    });

    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: refreshTokenMaxAge,
      path: '/',
      domain: cookieDomain,
    });
  }

  @HttpCode(HttpStatus.OK)
  @Public()
  @Post('login')
  @ApiOperation({ summary: 'User Login' })
  async signIn(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(loginDto);

    // 🍪 Set tokens as HTTP-only cookies
    this.setAuthCookies(res, {
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
    });

    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'User Login successfully',
      data: result,
    });
  }

  @Post('fcm-token')
  @Roles(Role.ADMIN, Role.CUSTOMER)
  async setFCMToken(@Req() req: Request, @Body() tokenDto: { deviceToken: string }) {
    const result = await this.authService.setFCMToken(req, tokenDto);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'FCM token set successfully',
      data: result,
    });
  }

  @Get('get-me')
  async getProfile(@Req() req: Request) {
    const user: any = req?.user;
    const result = await this.authService.getMe(user);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Getme Found successfully',
      data: result,
    });
  }

  @Post('change-password')
  async changePassword(@Body() data: { prevPass: string; newPass: string }, @Req() req: Request) {
    const user: any = req?.user;
    const id: string = user?.id;
    const result = await this.authService.changePassword({ ...data, id });

    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Password Changed successfully',
      data: result,
    });
  }

  @Public()
  @Post('forgot-password')
  async forgotPasswod(@Body() data: { email: string }) {
    const result = await this.authService.forgetPassword({
      email: data?.email,
    });
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Forget Password Mail Sent successfully',
      data: result,
    });
  }

  @Public()
  @Post('reset-password')
  async resetPassword(@Body() payload: { email: string; otp: string; newPass: string }) {
    const result = await this.authService.resetPassword(payload);

    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Password Resetted successfully',
      data: result,
    });
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  @ApiOperation({ summary: 'User Logout' })
  async logout(@Res({ passthrough: true }) res: Response) {
    const cookieDomain = this.configService.get('COOKIE_DOMAIN') || 'localhost';
    // 🧹 Clear auth cookies
    res.clearCookie('access_token', {
      path: '/',
      domain: cookieDomain,
    });
    res.clearCookie('refresh_token', {
      path: '/',
      domain: cookieDomain,
    });

    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'User Logout successfully',
      data: true,
    });
  }
}
