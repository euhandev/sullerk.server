import { BrevoService } from '@/email/brevo';
import { UserModule } from '@/modules/user/user.module';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { BcryptService } from '@/utils/bcrypt.service';
import { UserService } from '@/modules/user/user.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigService } from '@/config/config.service';
import { EmailTemplate } from '@/email-templates/forgot-password';
import { GMailService } from '@/email/gmail';
export const OIDC_CONFIG = 'OIDC_CONFIG';
@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    UserModule,
    JwtModule.register({
      global: true,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [
    AuthService,
    BcryptService,
    UserService,
    ConfigService,
    BrevoService,
    GMailService,
    EmailTemplate,
    // by  using this nest js automatically bind every endpoint with AuthGuard
    // { provide: APP_GUARD, useClass: RolesGuard },
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
