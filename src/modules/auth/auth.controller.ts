import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './auth.decorator';
import { Request, Response } from 'express';
import { ResponseService } from '@/utils/response';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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
    let cookieDomain = this.configService.get('COOKIE_DOMAIN') || 'localhost';

    // 🛡️ Sanitize domain: remove protocol (http://) and port (:3000)
    cookieDomain = cookieDomain.replace(/^https?:\/\//, '').split(':')[0];

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
  @ApiOperation({
    summary: 'User Login',
    description: `Authenticates a user and returns access and refresh tokens.
    
**cURL Sample:**
\`\`\`bash
curl -X POST http://localhost:5001/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
\`\`\``,
  })
  @ApiBody({
    type: LoginDto,
    examples: {
      standard: {
        value: {
          email: 'user@example.com',
          password: 'password123',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful, returns tokens and user info.',
    schema: {
      example: {
        message: 'User Login successfully',
        success: true,
        data: {
          access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI...',
          refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI...',
          user: { id: '...', email: 'user@example.com' },
        },
      },
    },
  })
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
  @ApiBearerAuth('JWT-auth')
  @Roles(Role.ADMIN, Role.CUSTOMER)
  @ApiOperation({
    summary: 'Set FCM Device Token',
    description: `Updates the current user's Firebase Cloud Messaging token for push notifications.
    
**cURL Sample:**
\`\`\`bash
curl -X POST http://localhost:5001/auth/fcm-token \\
  -H "Authorization: Bearer <access_token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "deviceToken": "fcm_token_here"
  }'
\`\`\``,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        deviceToken: { type: 'string', example: 'fcm_token_abc123' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'FCM token updated successfully.',
    schema: {
      example: {
        message: 'FCM token set successfully',
        success: true,
        data: { id: '...', fcmToken: 'fcm_token_abc123' },
      },
    },
  })
  async setFCMToken(@Req() req: Request, @Body() tokenDto: { deviceToken: string }) {
    const result = await this.authService.setFCMToken(req, tokenDto);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'FCM token set successfully',
      data: result,
    });
  }

  @Get('get-me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get Current User Profile',
    description: `Retrieves the profile information of the currently authenticated user.
    
**cURL Sample:**
\`\`\`bash
curl -X GET http://localhost:5001/auth/get-me \\
  -H "Authorization: Bearer <access_token>"
\`\`\``,
  })
  @ApiResponse({
    status: 200,
    description: 'Profile found successfully.',
    schema: {
      example: {
        message: 'Getme Found successfully',
        success: true,
        data: {
          id: '...',
          username: 'johndoe',
          email: 'john@example.com',
          role: 'CUSTOMER',
        },
      },
    },
  })
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Change Password',
    description: `Updates the password for the currently logged-in user.
    
**cURL Sample:**
\`\`\`bash
curl -X POST http://localhost:5001/auth/change-password \\
  -H "Authorization: Bearer <access_token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prevPass": "old_password_123",
    "newPass": "new_password_456"
  }'
\`\`\``,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        prevPass: { type: 'string', example: 'old_password_123' },
        newPass: { type: 'string', example: 'new_password_456' },
      },
      required: ['prevPass', 'newPass'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully.',
    schema: {
      example: {
        message: 'Password Changed successfully',
        success: true,
        data: { id: '...', email: 'user@example.com' },
      },
    },
  })
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
  @ApiOperation({
    summary: 'Forgot Password Request',
    description: `Sends a password reset OTP to the user's registered email address.
    
**cURL Sample:**
\`\`\`bash
curl -X POST http://localhost:5001/auth/forgot-password \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@example.com"
  }'
\`\`\``,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
      },
      required: ['email'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Forget password mail sent successfully.',
    schema: {
      example: {
        message: 'Forget Password Mail Sent successfully',
        success: true,
        data: true,
      },
    },
  })
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
  @ApiOperation({
    summary: 'Reset Password with OTP',
    description: `Resets the user's password using the OTP received via email.
    
**cURL Sample:**
\`\`\`bash
curl -X POST http://localhost:5001/auth/reset-password \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@example.com",
    "otp": "123456",
    "newPass": "new_secure_password"
  }'
\`\`\``,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
        otp: { type: 'string', example: '123456' },
        newPass: { type: 'string', example: 'new_secure_password' },
      },
      required: ['email', 'otp', 'newPass'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset successful.',
    schema: {
      example: {
        message: 'Password Resetted successfully',
        success: true,
        data: true,
      },
    },
  })
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'User Logout',
    description: `Clears the authentication cookies and logs the user out.
    
**cURL Sample:**
\`\`\`bash
curl -X POST http://localhost:5001/auth/logout \\
  -H "Authorization: Bearer <access_token>"
\`\`\``,
  })
  @ApiResponse({
    status: 200,
    description: 'Logout successful.',
    schema: {
      example: {
        message: 'User Logout successfully',
        success: true,
        data: true,
      },
    },
  })
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

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: 'Initiate Google Login',
    description: `Redirects the user to Google's OAuth 2.0 server to initiate the login flow.
    
**Note:** This route should be visited in a browser, not via cURL.`,
  })
  async googleAuth() {
    // This initiates the Google OAuth flow
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: 'Google Login Callback',
    description: `Google redirects back to this endpoint after successful authentication. It sets cookies and redirects to the frontend.`,
  })
  @ApiResponse({
    status: 302,
    description:
      'Redirects to frontend with tokens in URL (for mobile/legacy) and sets HTTP-only cookies.',
  })
  async googleAuthRedirect(@Req() req: any, @Res() res: Response) {
    const result = await this.authService.validateOAuthUser(req.user);

    // 🍪 Set tokens as HTTP-only cookies
    this.setAuthCookies(res, {
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
    });

    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    return res.redirect(
      `${frontendUrl}/auth/success?accessToken=${result.access_token}&refreshToken=${result.refresh_token}`,
    );
  }
}
