import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { ProcessRefundDto } from './dto/process-refund.dto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  // ТЗ 5.4: Создание платежа (имитация платежной системы)
  async create(createPaymentDto: CreatePaymentDto) {
    // 1. Проверяем существование бронирования
    const rental = await this.prisma.rental.findUnique({
      where: { id: createPaymentDto.rentalId },
      include: {
        equipment: true,
        user: true,
      },
    });

    if (!rental) {
      throw new NotFoundException(
        `Бронирование с id ${createPaymentDto.rentalId} не найдено`,
      );
    }

    // 2. Проверяем, не оплачено ли уже
    const existingPayment = await this.prisma.payment.findFirst({
      where: {
        rentalId: createPaymentDto.rentalId,
        type: createPaymentDto.type,
        status: 'completed',
      },
    });

    if (existingPayment && createPaymentDto.type !== 'deposit') {
      throw new BadRequestException(
        `Платеж типа "${createPaymentDto.type}" для этого бронирования уже существует`,
      );
    }

    // 3. Имитация платежного шлюза (ТЗ 5.4)
    const paymentResult = await this.mockPaymentGateway(createPaymentDto.amountCents);

    // 4. Создаем запись о платеже
    const payment = await this.prisma.payment.create({
      data: {
        rentalId: createPaymentDto.rentalId,
        amountCents: createPaymentDto.amountCents,
        type: createPaymentDto.type,
        status: paymentResult.success ? 'completed' : 'failed',
        metadata: {
          ...createPaymentDto.metadata,
          gatewayResponse: paymentResult,
          simulatedAt: new Date().toISOString(),
        },
      },
      include: {
        rental: {
          include: {
            equipment: true,
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // 5. Если это депозит и платеж успешен - обновляем статус бронирования
    if (paymentResult.success && createPaymentDto.type === 'deposit') {
      await this.prisma.rental.update({
        where: { id: createPaymentDto.rentalId },
        data: { status: 'confirmed' },
      });
    }

    return payment;
  }

  // ТЗ 5.4: Имитация платежной системы
  private async mockPaymentGateway(amountCents: number): Promise<{
    success: boolean;
    transactionId: string;
    message: string;
  }> {
    // Симуляция работы платежного шлюза
    await new Promise((resolve) => setTimeout(resolve, 500)); // Задержка 0.5 сек

    const success = amountCents <= 500000; // Макс 5000 руб для теста
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      success,
      transactionId,
      message: success
        ? 'Платеж успешно обработан'
        : 'Превышен лимит суммы для тестового платежа',
    };
  }

  // Получить все платежи
  async findAll(filters?: {
    type?: string;
    status?: string;
    rentalId?: number;
    userId?: number;
  }) {
    const where: any = {};

    if (filters?.type) where.type = filters.type;
    if (filters?.status) where.status = filters.status;
    if (filters?.rentalId) where.rentalId = filters.rentalId;

    // Фильтр по пользователю (через rental)
    if (filters?.userId) {
      where.rental = { userId: filters.userId };
    }

    return this.prisma.payment.findMany({
      where,
      include: {
        rental: {
          include: {
            equipment: {
              select: {
                id: true,
                title: true,
                priceCents: true,
              },
            },
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Получить один платеж
  async findOne(id: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        rental: {
          include: {
            equipment: true,
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Платеж с id ${id} не найден`);
    }

    return payment;
  }

  // Обновить платеж
  async update(id: number, updatePaymentDto: UpdatePaymentDto) {
    // Проверяем существование
    await this.findOne(id);

    // Если меняем статус на completed - можно добавить логику уведомлений
    if (updatePaymentDto.status === 'completed') {
      // Здесь можно добавить отправку уведомления пользователю
      console.log(`Платеж ${id} подтвержден`);
    }

    return this.prisma.payment.update({
      where: { id },
      data: updatePaymentDto,
      include: {
        rental: {
          include: {
            equipment: true,
            user: true,
          },
        },
      },
    });
  }

  // Удалить платеж (только для админов)
  async remove(id: number) {
    // Используем findOne, который уже проверяет существование
    const payment = await this.findOne(id); // ← Это гарантирует, что payment не null

    // Теперь TypeScript уверен, что payment не null
    if (payment.status === 'completed') {
      throw new BadRequestException('Нельзя удалить завершенный платеж');
    }

    return this.prisma.payment.delete({
      where: { id },
    });
  }

  // ТЗ 5.4: Обработка возврата средств
  async processRefund(refundDto: ProcessRefundDto) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: refundDto.paymentId },
      include: {
        rental: true,
      },
    });

    if (!payment) {
      throw new NotFoundException(`Платеж с id ${refundDto.paymentId} не найден`);
    }

    if (payment.status !== 'completed') {
      throw new BadRequestException('Можно вернуть только завершенные платежи');
    }

    if (refundDto.refundAmountCents > payment.amountCents) {
      throw new BadRequestException(
        `Сумма возврата не может превышать исходную сумму (${payment.amountCents} копеек)`,
      );
    }

    // Создаем запись о возврате
    const refundPayment = await this.prisma.payment.create({
      data: {
        rentalId: payment.rentalId,
        amountCents: refundDto.refundAmountCents,
        type: 'refund',
        status: 'completed',
        metadata: {
          originalPaymentId: payment.id,
          reason: refundDto.reason,
          refundedAt: new Date().toISOString(),
        },
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

    // Обновляем оригинальный платеж
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'refunded',
        metadata: {
          ...(payment.metadata as any),
          refundId: refundPayment.id,
          refundAmount: refundDto.refundAmountCents,
        },
      },
    });

    return refundPayment;
  }

  // ТЗ 5.4: Финансовые отчеты
  async getFinancialReport(startDate: Date, endDate: Date) {
    const payments = await this.prisma.payment.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: 'completed',
      },
      include: {
        rental: {
          include: {
            equipment: true,
          },
        },
      },
    });

    // Группировка по типам
    const byType = payments.reduce((acc, payment) => {
      acc[payment.type] = (acc[payment.type] || 0) + payment.amountCents;
      return acc;
    }, {});

    // Общая выручка
    const totalRevenue = payments.reduce((sum, payment) => {
      if (payment.type !== 'refund') {
        return sum + payment.amountCents;
      }
      return sum - payment.amountCents; // Возвраты вычитаем
    }, 0);

    // Популярное оборудование (по сумме платежей)
    const equipmentRevenue = payments.reduce((acc, payment) => {
      if (payment.type !== 'refund' && payment.rental?.equipment) {
        const eqId = payment.rental.equipment.id;
        const eqTitle = payment.rental.equipment.title;
        acc[eqId] = acc[eqId] || { id: eqId, title: eqTitle, revenue: 0 };
        acc[eqId].revenue += payment.amountCents;
      }
      return acc;
    }, {});

    const popularEquipment = Object.values(equipmentRevenue)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 10);

    return {
      period: { startDate, endDate },
      totalPayments: payments.length,
      totalRevenue, // В копейках
      revenueByType: byType,
      popularEquipment,
      summary: {
        totalDeposits: byType['deposit'] || 0,
        totalPayments: byType['payment'] || 0,
        totalRefunds: byType['refund'] || 0,
        totalPenalties: byType['penalty'] || 0,
      },
    };
  }

  // Получить платежи пользователя
  async getUserPayments(userId: number) {
    return this.prisma.payment.findMany({
      where: {
        rental: {
          userId,
        },
      },
      include: {
        rental: {
          include: {
            equipment: {
              select: {
                id: true,
                title: true,
                priceCents: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}