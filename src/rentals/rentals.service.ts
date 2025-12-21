import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRentalDto } from './dto/create-rental.dto';
import { UpdateRentalDto } from './dto/update-rental.dto';
import { differenceInDays, isBefore } from 'date-fns';

@Injectable()
export class RentalsService {
  constructor(private prisma: PrismaService) {}

  // ==================== СОЗДАНИЕ БРОНИРОВАНИЯ ====================
  async create(userId: number, createRentalDto: CreateRentalDto) {
    // 1. Проверяем существование оборудования
    const equipment = await this.prisma.equipment.findUnique({
      where: { id: createRentalDto.equipmentId },
    });

    if (!equipment) {
      throw new NotFoundException(
        `Оборудование с id ${createRentalDto.equipmentId} не найдено`,
      );
    }

    // 2. Проверяем доступность на выбранные даты
    const isAvailable = await this.checkAvailability(
      createRentalDto.equipmentId,
      createRentalDto.startDate,
      createRentalDto.endDate,
    );

    if (!isAvailable) {
      throw new BadRequestException(
        'Оборудование недоступно на выбранные даты',
      );
    }

    // 3. Проверяем ограничения по срокам
    this.validateRentalDuration(
      createRentalDto.startDate,
      createRentalDto.endDate,
    );

    // 4. Рассчитываем стоимость
    const totalCents = await this.calculatePrice(
      equipment.priceCents,
      createRentalDto.startDate,
      createRentalDto.endDate,
    );

    // 5. Создаём бронирование
    const rental = await this.prisma.rental.create({
      data: {
        userId,
        equipmentId: createRentalDto.equipmentId,
        startDate: createRentalDto.startDate,
        endDate: createRentalDto.endDate,
        totalCents,
        status: createRentalDto.status || 'pending',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        equipment: {
          select: {
            id: true,
            title: true,
            priceCents: true,
            depositCents: true,
          },
        },
      },
    });

    // 6. Автоматически создаём запись о залоге
    if (equipment.depositCents && equipment.depositCents > 0) {
      await this.prisma.payment.create({
        data: {
          rentalId: rental.id,
          amountCents: equipment.depositCents,
          type: 'deposit',
          status: 'pending',
        },
      });
    }

    return rental;
  }

  // ==================== ПРОВЕРКА ДОСТУПНОСТИ ====================
  private async checkAvailability(
    equipmentId: number,
    startDate: Date,
    endDate: Date,
    excludeRentalId?: number,
  ): Promise<boolean> {
    const whereClause: any = {
      equipmentId,
      OR: [
        // Проверка пересечения дат
        {
          startDate: { lte: endDate },
          endDate: { gte: startDate },
        },
      ],
      status: {
        in: ['pending', 'confirmed', 'active'], // Активные статусы
      },
    };

    if (excludeRentalId) {
      whereClause.NOT = { id: excludeRentalId };
    }

    const conflictingRentals = await this.prisma.rental.findMany({
      where: whereClause,
    });

    return conflictingRentals.length === 0;
  }

  // ==================== ПРОВЕРКА СРОКОВ ====================
  private validateRentalDuration(startDate: Date, endDate: Date): void {
    // Минимум 1 час, максимум 30 дней
    const MIN_RENTAL_HOURS = 1;
    const MAX_RENTAL_DAYS = 30;

    const durationDays = differenceInDays(endDate, startDate);
    const durationHours = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60),
    );

    if (durationHours < MIN_RENTAL_HOURS) {
      throw new BadRequestException(
        `Минимальный срок аренды: ${MIN_RENTAL_HOURS} час`,
      );
    }

    if (durationDays > MAX_RENTAL_DAYS) {
      throw new BadRequestException(
        `Максимальный срок аренды: ${MAX_RENTAL_DAYS} дней`,
      );
    }

    if (isBefore(endDate, startDate)) {
      throw new BadRequestException('Дата окончания должна быть позже даты начала');
    }
  }

  // ==================== РАСЧЁТ СТОИМОСТИ ====================
  private async calculatePrice(
    pricePerDayCents: number,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const days = differenceInDays(endDate, startDate) || 1;

    // Тарифы по ТЗ 5.2
    let totalCents = 0;

    if (days <= 1) {
      // Почасовой (первые 24 часа)
      totalCents = pricePerDayCents;
    } else if (days <= 7) {
      // Посуточный
      totalCents = pricePerDayCents * days;
    } else if (days <= 30) {
      // Недельный (скидка 10%)
      const weeks = Math.ceil(days / 7);
      totalCents = Math.round(pricePerDayCents * 7 * weeks * 0.9);
    } else {
      // Месячный (скидка 20%)
      const months = Math.ceil(days / 30);
      totalCents = Math.round(pricePerDayCents * 30 * months * 0.8);
    }

    return totalCents;
  }

  // ==================== ПОЛУЧИТЬ ВСЕ БРОНИРОВАНИЯ ====================
  async findAll(userId?: number, role?: string) {
    const whereClause: any = {};

    // Если не админ — показываем только свои бронирования
    if (role !== 'admin' && userId) {
      whereClause.userId = userId;
    }

    return this.prisma.rental.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        equipment: {
          select: {
            id: true,
            title: true,
            priceCents: true,
          },
        },
        payments: {
          select: {
            id: true,
            amountCents: true,
            type: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // ==================== ПОЛУЧИТЬ ОДНО БРОНИРОВАНИЕ ====================
  async findOne(id: number, userId?: number, role?: string) {
    const rental = await this.prisma.rental.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        equipment: {
          select: {
            id: true,
            title: true,
            description: true,
            priceCents: true,
            depositCents: true,
            category: true,
          },
        },
        payments: {
          select: {
            id: true,
            amountCents: true,
            type: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!rental) {
      throw new NotFoundException(`Бронирование с id ${id} не найдено`);
    }

    // Проверка прав доступа
    if (role !== 'admin' && rental.userId !== userId) {
      throw new ForbiddenException('Нет доступа к этому бронированию');
    }

    return rental;
  }

  // ==================== ОБНОВИТЬ БРОНИРОВАНИЕ ====================
  async update(
    id: number,
    updateRentalDto: UpdateRentalDto,
    userId?: number,
    role?: string,
  ) {
    // Проверяем существование и права
    const rental = await this.findOne(id, userId, role);

    // Если меняются даты — проверяем доступность
    if (updateRentalDto.startDate || updateRentalDto.endDate) {
      const startDate = updateRentalDto.startDate || rental.startDate;
      const endDate = updateRentalDto.endDate || rental.endDate;

      const isAvailable = await this.checkAvailability(
        rental.equipmentId,
        startDate,
        endDate,
        id, // Исключаем текущее бронирование
      );

      if (!isAvailable) {
        throw new BadRequestException(
          'Оборудование недоступно на новые даты',
        );
      }

      this.validateRentalDuration(startDate, endDate);
    }

    return this.prisma.rental.update({
      where: { id },
      data: updateRentalDto,
      include: {
        user: true,
        equipment: true,
      },
    });
  }

  // ==================== УДАЛИТЬ БРОНИРОВАНИЕ ====================
  async remove(id: number, userId?: number, role?: string) {
    const rental = await this.findOne(id, userId, role);

    // Нельзя удалить активное бронирование
    if (rental.status === 'active') {
      throw new BadRequestException(
        'Нельзя удалить активное бронирование',
      );
    }

    return this.prisma.rental.delete({
      where: { id },
    });
  }

  // ==================== ДОПОЛНИТЕЛЬНЫЕ МЕТОДЫ ====================

  // Получить бронирования пользователя
  async getUserRentals(userId: number) {
    return this.prisma.rental.findMany({
      where: { userId },
      include: {
        equipment: {
          include: {
            category: true,
          },
        },
        payments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Получить бронирования оборудования
  async getEquipmentRentals(equipmentId: number) {
    return this.prisma.rental.findMany({
      where: { equipmentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    });
  }

  // Обновить статус бронирования
  async updateStatus(id: number, status: string) {
    await this.findOne(id); // Проверяем существование

    return this.prisma.rental.update({
      where: { id },
      data: { status },
    });
  }
}