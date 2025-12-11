import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ==================== ОТЧЁТЫ ====================

  // Загрузка инвентаря (какое оборудование чаще арендуют)
  async getInventoryLoadReport(startDate: Date, endDate: Date) {
    const rentals = await this.prisma.rental.findMany({
      where: {
        startDate: { gte: startDate },
        endDate: { lte: endDate },
        status: { in: ['completed', 'active'] },
      },
      include: {
        equipment: {
          include: {
            category: true,
          },
        },
      },
    });

    // Группировка по оборудованию
    const equipmentStats = rentals.reduce((acc, rental) => {
      const eqId = rental.equipmentId;
      const eqTitle = rental.equipment.title;

      if (!acc[eqId]) {
        acc[eqId] = {
          id: eqId,
          title: eqTitle,
          category: rental.equipment.category.name,
          rentalCount: 0,
          totalRevenue: 0,
          totalDays: 0,
        };
      }

      const days = Math.ceil(
        (rental.endDate.getTime() - rental.startDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      acc[eqId].rentalCount += 1;
      acc[eqId].totalRevenue += rental.totalCents;
      acc[eqId].totalDays += days;

      return acc;
    }, {});

    // Рассчёт загрузки в процентах (предполагаем, что максимум 30 дней в месяце)
    const totalDaysInPeriod = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const maxPossibleDays = totalDaysInPeriod * Object.keys(equipmentStats).length;

    const equipmentStatsArray = Object.values(equipmentStats) as Array<{
      id: number;
      title: string;
      category: string;
      rentalCount: number;
      totalRevenue: number;
      totalDays: number;
    }>;

    const totalRentedDays: number = equipmentStatsArray.reduce(
      (sum: number, stat) => sum + stat.totalDays, 0
    );

    const overallLoadPercentage = maxPossibleDays > 0
      ? (totalRentedDays as number / maxPossibleDays) * 100
      : 0;

    return {
      period: { startDate, endDate },
      overallLoadPercentage: Math.round(overallLoadPercentage * 100) / 100,
      equipmentStats: Object.values(equipmentStats)
        .sort((a: any, b: any) => b.rentalCount - a.rentalCount),
      summary: {
        totalRentals: rentals.length,
        totalRentedDays,
        uniqueEquipmentCount: Object.keys(equipmentStats).length,
      },
    };
  }

  // Финансовые показатели
  async getFinancialReport(startDate: Date, endDate: Date) {
    const payments = await this.prisma.payment.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: 'completed',
      },
      include: {
        rental: {
          include: {
            equipment: true,
            user: true,
          },
        },
      },
    });

    const revenueByType = payments.reduce((acc, payment) => {
      acc[payment.type] = (acc[payment.type] || 0) + payment.amountCents;
      return acc;
    }, {});

    const revenueByEquipment = payments.reduce((acc, payment) => {
      if (payment.rental?.equipment) {
        const eqId = payment.rental.equipment.id;
        const eqTitle = payment.rental.equipment.title;

        acc[eqId] = acc[eqId] || { id: eqId, title: eqTitle, revenue: 0 };
        acc[eqId].revenue += payment.amountCents;
      }
      return acc;
    }, {});

    const revenueByMonth = payments.reduce((acc, payment) => {
      const month = payment.createdAt.toISOString().slice(0, 7); // ГГГГ-ММ
      acc[month] = (acc[month] || 0) + payment.amountCents;
      return acc;
    }, {});

    const totalRevenue = payments.reduce((sum, payment) => {
      if (payment.type !== 'refund') {
        return sum + payment.amountCents;
      }
      return sum - payment.amountCents; // Возвраты вычитаем
    }, 0);

    return {
      period: { startDate, endDate },
      totalRevenue,
      totalPayments: payments.length,
      revenueByType,
      revenueByEquipment: Object.values(revenueByEquipment)
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 10),
      revenueByMonth,
      summary: {
        totalDeposits: revenueByType['deposit'] || 0,
        totalPayments: revenueByType['payment'] || 0,
        totalRefunds: revenueByType['refund'] || 0,
        totalPenalties: revenueByType['penalty'] || 0,
      },
    };
  }

  // Популярное оборудование
  async getPopularEquipment(limit: number = 10) {
    const rentals = await this.prisma.rental.groupBy({
      by: ['equipmentId'],
      _count: { id: true },
      _sum: { totalCents: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });

    const equipmentIds = rentals.map(r => r.equipmentId);
    const equipment = await this.prisma.equipment.findMany({
      where: { id: { in: equipmentIds } },
      include: { category: true },
    });

    return rentals.map(rental => {
      const eq = equipment.find(e => e.id === rental.equipmentId);
      return {
        equipmentId: rental.equipmentId,
        title: eq?.title || 'Неизвестно',
        category: eq?.category?.name || 'Без категории',
        rentalCount: rental._count.id,
        totalRevenue: rental._sum.totalCents || 0,
      };
    });
  }

  // Статистика пользователей
  async getUserStats() {
    const users = await this.prisma.user.findMany({
      include: {
        rentals: {
          include: {
            payments: true,
          },
        },
      },
    });

    return users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      rentalCount: user.rentals.length,
      totalSpent: user.rentals.reduce((sum, rental) => {
        return sum + rental.payments
          .filter(p => p.type === 'payment' && p.status === 'completed')
          .reduce((paymentSum, payment) => paymentSum + payment.amountCents, 0);
      }, 0),
      lastActivity: user.rentals.length > 0
        ? user.rentals.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].createdAt
        : user.createdAt,
    }));
  }

  // ==================== УПРАВЛЕНИЕ ====================

  // Создать промокод
  async createPromoCode(data: { code: string; discountPercent: number; validUntil: Date }) {
    // Здесь можно добавить логику промокодов
    return { message: 'Промокод создан', data };
  }

  // Экспорт в PDF (заглушка)
  async exportToPDF(data: any) {
    // В реальном приложении здесь был бы PDF генератор
    return {
      message: 'Данные готовы для экспорта в PDF',
      data,
      pdfUrl: `/exports/report-${Date.now()}.pdf`, // Заглушка
    };
  }
  // ==================== СИСТЕМНАЯ ИНФОРМАЦИЯ ====================

  async getSystemStats() {
    const [
      userCount,
      equipmentCount,
      rentalCount,
      paymentCount,
      totalRevenue,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.equipment.count(),
      this.prisma.rental.count(),
      this.prisma.payment.count({
        where: { status: 'completed', type: { not: 'refund' } },
      }),
      this.prisma.payment.aggregate({
        where: { status: 'completed', type: { not: 'refund' } },
        _sum: { amountCents: true },
      }),
    ]);

    const recentRentals = await this.prisma.rental.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        equipment: { select: { title: true } },
      },
    });

    return {
      counts: {
        users: userCount,
        equipment: equipmentCount,
        rentals: rentalCount,
        payments: paymentCount,
      },
      revenue: {
        total: totalRevenue._sum.amountCents || 0,
      },
      recentRentals,
      serverTime: new Date(),
    };
  }

  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            rentals: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

