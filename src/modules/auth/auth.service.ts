import { PrismaService } from '@/helper/prisma.service';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiError } from '@/utils/api_error';
import { BcryptService } from '@/utils/bcrypt.service';
import { Request } from 'express';
import { ConfigService } from '@/config/config.service';
import { EmailTemplate } from '@/email-templates/forgot-password';
import { AuthProvider, Role, Status } from '@prisma/client';
import { GMailService } from '@/email/gmail';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly jwtService: JwtService,
    private readonly bcryptService: BcryptService,
    private readonly configService: ConfigService,
    private readonly gmailService: GMailService,
    private readonly prisma: PrismaService,
    private readonly emailTemplate: EmailTemplate,
    private readonly userService: UserService,
  ) {}

  async login(data: {
    email: string;
    password: string;
    deviceToken?: string;
  }): Promise<{ access_token: string; refresh_token: string }> {
    const { email, password, deviceToken } = data;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { admin: true, customer: true },
    });

    if (!user) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'User not found');
    }

    if (user.status === Status.INACTIVE) {
      throw new ApiError(HttpStatus.UNAUTHORIZED, 'User is inactive');
    }

    const isPasswordMatched = await this.bcryptService.compare(password, user.password!);

    if (!isPasswordMatched) {
      throw new ApiError(HttpStatus.UNAUTHORIZED, 'Password is incorrect');
    }

    if (deviceToken) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { fcmToken: deviceToken },
      });
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.username,
      avatar: user.avatar,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: '7d',
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: '30d',
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async setFCMToken(
    req: Request,
    data: {
      deviceToken?: string;
    },
  ): Promise<any> {
    const { deviceToken } = data;

    const user: any = req?.user;
    const isUserExists = await this.prisma.user.findUnique({
      where: { id: user?.id },
    });

    if (!isUserExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, `user not found`);
    }

    if (deviceToken) {
      return await this.prisma.user.update({
        where: { id: user.id },
        data: { fcmToken: deviceToken },
      });
    }

    return isUserExists;
  }

  async getMe(user: any) {
    const baseQuery: any = {
      where: { id: user?.id },
      omit: { password: true },
    };

    // dynamically include only needed relation
    if (user?.role === Role.ADMIN) {
      baseQuery.include = { admin: true }; // fix casing (Advisor → advisor)
    } else {
      baseQuery.include = { customer: true };
    }

    const isUserExists = await this.prisma.user.findUnique(baseQuery);

    console.log(`isUserExists`, isUserExists);
    if (!isUserExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, `user not found`);
    }

    return isUserExists;
  }

  async changePassword({
    id,
    prevPass,
    newPass,
  }: {
    id: string;
    prevPass: string;
    newPass: string;
  }) {
    const isUserExists = await this.prisma.user.findUnique({ where: { id } });

    if (!isUserExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, `user not found`);
    }

    const isPasswordMatched = await this.bcryptService.compare(prevPass, isUserExists.password!);

    if (!isPasswordMatched) {
      throw new ApiError(HttpStatus.UNAUTHORIZED, 'Password is not matched!');
    }

    const hashPassword = await this.bcryptService.hash(newPass);

    const changePassword = await this.prisma.user.update({
      where: { id: isUserExists?.id },
      data: {
        password: hashPassword,
      },
    });

    if (!changePassword) {
      throw new ApiError(HttpStatus.NOT_FOUND, `password not updated`);
    }

    return 'password updated';
  }

  async forgetPassword({ email }: { email: string }) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new ApiError(HttpStatus.NOT_FOUND, `User Not Found`);
    }

    if (user.status === Status.INACTIVE) {
      throw new ApiError(HttpStatus.FORBIDDEN, 'Your account is inactive. Please contact support.');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 15); // 15 mins expiry

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordOtp: otp,
        resetPasswordOtpExpires: expires,
      } as any,
    });

    const params = await this.emailTemplate.resetPasswordEmail(
      user?.email,
      user?.username || `user`,
      otp,
    );

    await this.gmailService.sendEmail({
      to: user.email,
      subject: params.subject,
      html: params.htmlContent,
    });

    return {
      message: 'Password reset OTP sent to your email successfully',
    };
  }

  async resetPassword(payload: { email: string; otp: string; newPass: string }) {
    const { email, otp, newPass } = payload;
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new ApiError(HttpStatus.NOT_FOUND, `User Not Found`);
    }

    const userObj = user as any;
    if (!userObj.resetPasswordOtp || userObj.resetPasswordOtp !== otp) {
      throw new ApiError(HttpStatus.BAD_REQUEST, `Invalid OTP`);
    }

    if (!userObj.resetPasswordOtpExpires || new Date() > userObj.resetPasswordOtpExpires) {
      // Clear expired OTP
      await this.prisma.user.update({
        where: { id: user.id },
        data: { resetPasswordOtp: null, resetPasswordOtpExpires: null } as any,
      });
      throw new ApiError(HttpStatus.BAD_REQUEST, `OTP has expired`);
    }

    const hashPassword = await this.bcryptService.hash(newPass);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashPassword,
        resetPasswordOtp: null,
        resetPasswordOtpExpires: null,
      } as any,
    });

    const successParams = await this.emailTemplate.passwordResetSuccessEmail(
      user.email,
      user.username || 'User',
    );

    await this.gmailService.sendEmail({
      to: user.email,
      subject: successParams.subject,
      html: successParams.htmlContent,
    });

    return { message: 'Password resetted successfully' };
  }

  async validateOAuthUser(profile: {
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
    picture: string;
  }): Promise<{ access_token: string; refresh_token: string }> {
    const { googleId, email, firstName, lastName, picture } = profile;

    let user = await this.prisma.user.findUnique({
      where: { email },
      include: { customer: true, admin: true },
    });

    if (!user) {
      // Register new user
      user = (await this.prisma.$transaction(async (tx) => {
        const username = await this.userService.generateUniqueUsername(email, tx);
        const newUser = await tx.user.create({
          data: {
            email,
            username,
            googleId,
            provider: AuthProvider.GOOGLE,
            avatar: picture,
            role: Role.CUSTOMER,
            status: Status.ACTIVE,
          },
        });

        await tx.customer.create({
          data: {
            userId: newUser.id,
            fullName: `${firstName} ${lastName}`,
          },
        });

        return tx.user.findUnique({
          where: { id: newUser.id },
          include: { customer: true, admin: true },
        });
      })) as any;
    } else if (!user.googleId) {
      // Link existing user to Google
      user = (await this.prisma.user.update({
        where: { id: user.id },
        data: {
          googleId,
          provider: AuthProvider.GOOGLE,
          // Update avatar if not set
          avatar: user.avatar || picture,
        },
        include: { customer: true, admin: true },
      })) as any;
    }

    // Generate tokens
    const payload = {
      id: user!.id,
      email: user!.email,
      role: user!.role,
      name: user!.username,
      avatar: user!.avatar,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: '7d',
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: '30d',
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }
}
