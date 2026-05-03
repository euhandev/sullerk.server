import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@/app/app.module';
import { AuthService } from '@/modules/auth/auth.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  const mockAuthService = {
    login: jest.fn(),
    setFCMToken: jest.fn(),
    getMe: jest.fn(),
    changePassword: jest.fn(),
    forgetPassword: jest.fn(),
    resetPassword: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AuthService)
      .useValue(mockAuthService)
      .overrideProvider(JwtService)
      .useValue({
        verifyAsync: jest.fn().mockResolvedValue({ id: '1', role: 'ADMIN', email: 'test@test.com' }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('/auth/login (POST)', () => {
    it('should login and set cookies', async () => {
      mockAuthService.login.mockResolvedValue({
        access_token: 'access_token_123',
        refresh_token: 'refresh_token_123',
        user: { id: '1', email: 'test@test.com' },
      });

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@test.com', password: 'password123' })
        .expect(200);

      expect(response.body.data.access_token).toEqual('access_token_123');
      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      expect(cookies.some((cookie: string) => cookie.includes('access_token'))).toBeTruthy();
    });
  });

  describe('/auth/fcm-token (POST)', () => {
    it('should set FCM token', async () => {
      mockAuthService.setFCMToken.mockResolvedValue(true);

      const response = await request(app.getHttpServer())
        .post('/auth/fcm-token')
        .set('Authorization', 'Bearer fake_token')
        .send({ deviceToken: 'token123' })
        .expect(201);

      expect(response.body.message).toEqual('FCM token set successfully');
      expect(mockAuthService.setFCMToken).toHaveBeenCalled();
    });
  });

  describe('/auth/get-me (GET)', () => {
    it('should return user profile', async () => {
      mockAuthService.getMe.mockResolvedValue({ id: '1', email: 'test@test.com' });

      const response = await request(app.getHttpServer())
        .get('/auth/get-me')
        .set('Authorization', 'Bearer fake_token')
        .expect(200);

      expect(response.body.data.email).toEqual('test@test.com');
      expect(mockAuthService.getMe).toHaveBeenCalled();
    });
  });

  describe('/auth/change-password (POST)', () => {
    it('should change password', async () => {
      mockAuthService.changePassword.mockResolvedValue(true);

      const response = await request(app.getHttpServer())
        .post('/auth/change-password')
        .set('Authorization', 'Bearer fake_token')
        .send({ prevPass: 'old123', newPass: 'new123' })
        .expect(201); // Controller has @Post but no HttpCode(200), so Nest defaults to 201

      expect(response.body.message).toEqual('Password Changed successfully');
      expect(mockAuthService.changePassword).toHaveBeenCalled();
    });
  });

  describe('/auth/forgot-password (POST)', () => {
    it('should process forgot password request', async () => {
      mockAuthService.forgetPassword.mockResolvedValue(true);

      const response = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'test@test.com' })
        .expect(201);

      expect(response.body.message).toEqual('Forget Password Mail Sent successfully');
      expect(mockAuthService.forgetPassword).toHaveBeenCalledWith({ email: 'test@test.com' });
    });
  });

  describe('/auth/reset-password (POST)', () => {
    it('should reset password', async () => {
      mockAuthService.resetPassword.mockResolvedValue(true);

      const response = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ email: 'test@test.com', otp: '123456', newPass: 'new123' })
        .expect(201);

      expect(response.body.message).toEqual('Password Resetted successfully');
      expect(mockAuthService.resetPassword).toHaveBeenCalled();
    });
  });

  describe('/auth/logout (POST)', () => {
    it('should clear cookies on logout', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', 'Bearer fake_token')
        .expect(200);

      expect(response.body.message).toEqual('User Logout successfully');
      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      expect(cookies.some((cookie: string) => cookie.includes('access_token=;'))).toBeTruthy();
    });
  });
});
