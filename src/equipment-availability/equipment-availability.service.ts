import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEquipmentAvailabilityDto } from './dto/create-equipment-availability.dto';
import { UpdateEquipmentAvailabilityDto } from './dto/update-equipment-availability.dto';

@Injectable()
export class EquipmentAvailabilityService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateEquipmentAvailabilityDto) {
    // Проверяем, существует ли оборудование
    const equipment = await this.prisma.equipment.findUnique({
      where: { id: createDto.equipmentId },
    });

    if (!equipment) {
      throw new NotFoundException(`Equipment with ID ${createDto.equipmentId} not found`);
    }

    // Проверяем, не существует ли уже записи на эту дату
    const existing = await this.prisma.equipmentAvailability.findUnique({
      where: {
        equipmentId_date: {
          equipmentId: createDto.equipmentId,
          date: createDto.date,
        },
      },
    });

    if (existing) {
      throw new ConflictException(`Availability for equipment ${createDto.equipmentId} on date ${createDto.date} already exists`);
    }

    // Если указан rentalId, проверяем его существование
    if (createDto.rentalId) {
      const rental = await this.prisma.rental.findUnique({
        where: { id: createDto.rentalId },
      });

      if (!rental) {
        throw new NotFoundException(`Rental with ID ${createDto.rentalId} not found`);
      }
    }

    return this.prisma.equipmentAvailability.create({
      data: createDto,
      include: {
        equipment: true,
        rental: true,
      },
    });
  }

  async findAll() {
    return this.prisma.equipmentAvailability.findMany({
      include: {
        equipment: true,
        rental: true,
      },
      orderBy: {
        date: 'asc',
      },
    });
  }

  async findOne(id: number) {
    const availability = await this.prisma.equipmentAvailability.findUnique({
      where: { id },
      include: {
        equipment: true,
        rental: true,
      },
    });

    if (!availability) {
      throw new NotFoundException(`Availability with ID ${id} not found`);
    }

    return availability;
  }

  async findByEquipmentId(equipmentId: number) {
    // Проверяем существование оборудования
    const equipment = await this.prisma.equipment.findUnique({
      where: { id: equipmentId },
    });

    if (!equipment) {
      throw new NotFoundException(`Equipment with ID ${equipmentId} not found`);
    }

    return this.prisma.equipmentAvailability.findMany({
      where: { equipmentId },
      include: {
        equipment: true,
        rental: true,
      },
      orderBy: {
        date: 'asc',
      },
    });
  }

  async findByDateRange(equipmentId: number, startDate: Date, endDate: Date) {
    return this.prisma.equipmentAvailability.findMany({
      where: {
        equipmentId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });
  }

  async update(id: number, updateDto: UpdateEquipmentAvailabilityDto) {
    const current = await this.findOne(id); // Получаем текущую запись

    // Если меняем equipmentId или date, проверяем уникальность
    if (updateDto.equipmentId || updateDto.date) {
      const equipmentId = updateDto.equipmentId || current.equipmentId;
      const date = updateDto.date || current.date;

      const existing = await this.prisma.equipmentAvailability.findUnique({
        where: {
          equipmentId_date: {
            equipmentId,
            date,
          },
        },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException(`Availability for equipment ${equipmentId} on date ${date} already exists`);
      }
    }

    return this.prisma.equipmentAvailability.update({
      where: { id },
      data: updateDto,
      include: {
        equipment: true,
        rental: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Проверяем существование

    return this.prisma.equipmentAvailability.delete({
      where: { id },
    });
  }

  async checkAvailability(equipmentId: number, startDate: Date, endDate: Date) {
    const conflicts = await this.prisma.equipmentAvailability.findMany({
      where: {
        equipmentId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        status: 'booked',
      },
    });

    return {
      isAvailable: conflicts.length === 0,
      conflicts,
      message: conflicts.length > 0
        ? `Equipment is booked on ${conflicts.length} day(s)`
        : 'Equipment is available for the selected dates',
    };
  }

  async bulkUpdateForRental(equipmentId: number, rentalId: number, startDate: Date, endDate: Date, status: string) {
    // Проверяем оборудование и бронирование
    const [equipment, rental] = await Promise.all([
      this.prisma.equipment.findUnique({ where: { id: equipmentId } }),
      this.prisma.rental.findUnique({ where: { id: rentalId } }),
    ]);

    if (!equipment) {
      throw new NotFoundException(`Equipment with ID ${equipmentId} not found`);
    }

    if (!rental) {
      throw new NotFoundException(`Rental with ID ${rentalId} not found`);
    }

    const results: any[] = []; // Исправляем тип для массива
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const date = new Date(currentDate);

      const availability = await this.prisma.equipmentAvailability.upsert({
        where: {
          equipmentId_date: {
            equipmentId,
            date,
          },
        },
        update: {
          status,
          rentalId,
        },
        create: {
          equipmentId,
          date,
          status,
          rentalId,
        },
      });

      results.push(availability);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return results;
  }
}