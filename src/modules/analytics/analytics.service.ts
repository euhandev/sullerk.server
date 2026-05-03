import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '@/helper/prisma.service';
import { ApiError } from '@/utils/api_error';
import { Status } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async adminAnalytics(user: any) {
    const admin = await this.prisma.admin.findUnique({
      where: { userId: user?.id },
    });

    if (!admin) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Admin not found');
    }

    const totalCustomer = await this.prisma.customer.count();
    const totalAdmin = await this.prisma.admin.count();
    const totalUser = await this.prisma.user.count();
    const totalActiveUser = await this.prisma.user.count({ where: { status: Status.ACTIVE } });
    const totalInactiveUser = await this.prisma.user.count({ where: { status: Status.INACTIVE } })

    return {
      users: {
        totalCustomers: totalCustomer,
        totalAdmins: totalAdmin,
        totalUsers: totalUser,
        totalActiveUsers: (totalActiveUser / totalUser) * 100,
        totalInactiveUsers: (totalInactiveUser / totalUser) * 100,
      }
    };
  }

}
