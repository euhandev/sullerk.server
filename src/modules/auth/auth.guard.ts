import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './auth.decorator';
import { ConfigService } from '@/config/config.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (isPublic) {
      // For public routes, optionally populate req.user if a valid token is present
      if (token) {
        try {
          const payload = await this.jwtService.verifyAsync(token, {
            secret: this.configService.get('JWT_SECRET'),
          });
          request['user'] = payload;
        } catch {
          // Token is invalid — proceed as anonymous
        }
      }
      return true;
    }

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      request['user'] = payload;
    } catch (error) {
      console.error('Token verification failed', error?.message);
      throw new UnauthorizedException('Invalid token');
    }
    return true;
  }

  private extractToken(request: any): string | undefined {
    const headers = request?.headers || request?.header;

    // 1️⃣ Try Authorization header first (for flexibility)
    const authHeader = headers?.authorization || headers?.['authorization'];
    if (authHeader) {
      // Handle both "Bearer token" and raw token formats
      return authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    }

    // 2️⃣ Fallback: Read from HttpOnly cookie
    // Requires cookie-parser middleware
    return request?.cookies?.access_token || request?.cookies?.['access_token'];
  }
}
