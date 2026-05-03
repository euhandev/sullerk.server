import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '@/helper/prisma.service';
import { ApiError } from '@/utils/api_error';
import { ConsultationStatus, Status } from '@prisma/client';

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
    const totalAdvisor = await this.prisma.advisor.count();
    const totalUser = await this.prisma.user.count();
    const totalActiveUser = await this.prisma.user.count({ where: { status: Status.ACTIVE } });
    const totalInactiveUser = await this.prisma.user.count({ where: { status: Status.INACTIVE } });
    const totalCourses = await this.prisma.course.count();
    const totalLiveCourses = await this.prisma.course.count({ where: { isLive: true } });
    const totalActiveAdvisor = await this.prisma.advisor.count({
      where: { user: { status: Status.ACTIVE } },
    });
    const totalPostCodeRanges = await this.prisma.postCodeRange.count();

    const referralStats = await this.prisma.referral.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const totalReferrals = referralStats.reduce((acc, curr) => acc + curr._count.status, 0);
    const pendingReferrals = referralStats.find((r) => r.status === 'PENDING')?._count.status || 0;
    const convertedReferrals =
      referralStats.find((r) => r.status === 'CONVERTED')?._count.status || 0;

    const totalConsultations = await this.prisma.consultationRequest.count();
    const totalCompletedConsultations = await this.prisma.consultationRequest.count({
      where: { status: ConsultationStatus.COMPLETED },
    });
    const totalPendingConsultations = await this.prisma.consultationRequest.count({
      where: { status: ConsultationStatus.PENDING },
    });

    const allCategories = await this.prisma.category.findMany({
      select: { id: true, name: true, slug: true },
    });
    const progressCounts = await this.prisma.courseProgress.groupBy({
      by: ['categoryId'],
      _count: {
        id: true,
      },
    });

    // 3. Convert counts to map
    const progressMap = new Map(progressCounts.map((p) => [p.categoryId, p._count.id]));

    // 4. Merge → ensure all categories exist
    const eachCourseEnrollmentCount = allCategories.map((cat) => ({
      categoryId: cat.id,
      categoryName: cat.name,
      categorySlug: cat.slug,
      enrollmentCount: progressMap.get(cat.id) || 0, // 🔥 default 0
    }));

    return {
      users: {
        totalCustomers: totalCustomer,
        totalAdmins: totalAdmin,
        totalAdvisors: totalAdvisor,
        totalActiveAdvisors: totalActiveAdvisor,
        totalPostCodeRanges: totalPostCodeRanges,
        totalUsers: totalUser,
        totalActiveUsers: (totalActiveUser / totalUser) * 100,
        totalInactiveUsers: (totalInactiveUser / totalUser) * 100,
      },
      courses: {
        totalCourses: totalCourses,
        totalLive: totalLiveCourses,
        eachCourseEnrollmentCount: eachCourseEnrollmentCount,
      },
      referrals: {
        total: totalReferrals,
        pending: pendingReferrals,
        converted: convertedReferrals,
      },
      consultations: {
        total: totalConsultations,
        totalCompleted: totalCompletedConsultations,
        totalPending: totalPendingConsultations,
      },
    };
  }

  async AdvisorAnalytics(user: any) {
    const advisor = await this.prisma.advisor.findUnique({
      where: { userId: user?.id },
      select: { id: true },
    });

    if (!advisor) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Advisor not found');
    }

    const referralStats = await this.prisma.referral.groupBy({
      by: ['status'],
      where: { advisorId: advisor.id },
      _count: { status: true },
    });

    const totalReferrals = referralStats.reduce((acc, curr) => acc + curr._count.status, 0);
    const pendingReferrals = referralStats.find((r) => r.status === 'PENDING')?._count.status || 0;
    const convertedReferrals =
      referralStats.find((r) => r.status === 'CONVERTED')?._count.status || 0;

    const totalConsultations = await this.prisma.consultationRequest.count({
      where: { advisorId: advisor.id },
    });

    const totalFiles = await this.prisma.file.count({
      where: { advisorId: advisor.id },
    });

    const recentConsultations = await this.prisma.consultationRequest.findMany({
      where: { advisorId: advisor.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { customer: true },
    });

    return {
      referrals: {
        total: totalReferrals,
        pending: pendingReferrals,
        converted: convertedReferrals,
      },
      consultations: {
        total: totalConsultations,
        recent: recentConsultations,
      },
      totalFiles,
    };
  }

  async CustomerAnalytics(user: any) {
    const customer = await this.prisma.customer.findUnique({
      where: { userId: user?.id },
      select: { id: true },
    });

    if (!customer) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Customer not found');
    }

    // course progress completed
    const courseProgressCompleted = await this.prisma.courseProgress.count({
      where: { customerId: customer.id, isCompleted: true },
    });

    // course progress modules count by last position
    const courseProgressInProgress = await this.prisma.courseProgress.aggregate({
      _sum: { lastPosition: true },
      where: { customerId: customer.id },
    });

    // is qualified for consultation
    const isQualifiedForConsultation = await this.prisma.userLearningPath.findUnique({
      where: { customerId: customer.id },
      select: { canApplyForConsultation: true },
    });

    return {
      courseProgress: {
        categoriesCompleted: courseProgressCompleted,
        modulesCompleted: courseProgressInProgress?._sum?.lastPosition,
      },
      isQualifiedForConsultation: isQualifiedForConsultation?.canApplyForConsultation || false,
    };
  }
}
