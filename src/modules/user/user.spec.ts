import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@/app/app.module';
import { UserService } from '@/modules/user/user.service';
import { JwtService } from '@nestjs/jwt';

describe('UsersController (e2e)', () => {
  let app: INestApplication;

  const mockUserService = {
    createAdmin: jest.fn(),
    createCustomer: jest.fn(),
    getMany: jest.fn(),
    getOne: jest.fn(),
    changeStatus: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(UserService)
      .useValue(mockUserService)
      .overrideProvider(JwtService)
      .useValue({
        verifyAsync: jest
          .fn()
          .mockResolvedValue({ id: '1', role: 'ADMIN', email: 'admin@test.com' }),
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

  describe('/users/create-admin (POST)', () => {
    it('should create an admin', async () => {
      mockUserService.createAdmin.mockResolvedValue({
        id: 'admin_1',
        email: 'admin@test.com',
      });

      const response = await request(app.getHttpServer())
        .post('/users/create-admin')
        .send({ email: 'admin@test.com', password: 'password123', fullName: 'Admin User' })
        .expect(201);

      expect(response.body.message).toEqual('Admin created successfully');
      expect(response.body.data.id).toEqual('admin_1');
      expect(mockUserService.createAdmin).toHaveBeenCalled();
    });
  });

  describe('/users/create-customer (POST)', () => {
    it('should create a customer', async () => {
      mockUserService.createCustomer.mockResolvedValue({
        id: 'customer_1',
        email: 'customer@test.com',
      });

      const response = await request(app.getHttpServer())
        .post('/users/create-customer')
        .send({
          email: 'customer@test.com',
          password: 'password123',
          contactNo: '1234567890',
          fullName: 'Customer User',
          postcode: '1234',
        })
        .expect(201);

      expect(response.body.message).toEqual('Customer created successfully');
      expect(response.body.data.id).toEqual('customer_1');
      expect(mockUserService.createCustomer).toHaveBeenCalled();
    });
  });

  describe('/users/ (GET)', () => {
    it('should retrieve a list of users', async () => {
      mockUserService.getMany.mockResolvedValue({
        data: [{ id: 'user_1', email: 'user@test.com' }],
        meta: { total: 1, page: 1, lastPage: 1 },
      });

      const response = await request(app.getHttpServer()).get('/users').expect(200);

      expect(response.body.message).toEqual('user retrieved successfully');
      expect(response.body.data[0].id).toEqual('user_1');
      expect(response.body.meta.total).toEqual(1);
      expect(mockUserService.getMany).toHaveBeenCalled();
    });
  });

  describe('/users/:id (GET)', () => {
    it('should retrieve one user by ID/email', async () => {
      mockUserService.getOne.mockResolvedValue({
        id: 'user_1',
        email: 'user@test.com',
      });

      const response = await request(app.getHttpServer())
        .get('/users/user@test.com')
        .set('Authorization', 'Bearer fake_token')
        .expect(200);

      expect(response.body.message).toEqual('user retrieved successfully');
      expect(response.body.data.email).toEqual('user@test.com');
      expect(mockUserService.getOne).toHaveBeenCalledWith({ email: 'user@test.com' });
    });
  });

  describe('/users/status/:id (PATCH)', () => {
    it('should update user status', async () => {
      mockUserService.changeStatus.mockResolvedValue({
        id: 'user_1',
        status: 'INACTIVE',
      });

      const response = await request(app.getHttpServer())
        .patch('/users/status/user_1')
        .set('Authorization', 'Bearer fake_token')
        .expect(200);

      expect(response.body.message).toEqual('user status updated successfully');
      expect(response.body.data.status).toEqual('INACTIVE');
      expect(mockUserService.changeStatus).toHaveBeenCalledWith('user_1');
    });
  });
});
