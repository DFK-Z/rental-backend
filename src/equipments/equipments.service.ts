import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';

@Injectable()
export class EquipmentsService {
  constructor(private prisma: PrismaService) {}

  async create(createEquipmentDto: CreateEquipmentDto) {
    // Проверяем существование категории
    const category = await this.prisma.category.findUnique({
      where: { id: createEquipmentDto.categoryId },
    });

    if (!category) {
      throw new NotFoundException(
        `Категория с id ${createEquipmentDto.categoryId} не найдена`,
      );
    }

    return this.prisma.equipment.create({
      data: {
        title: createEquipmentDto.title,
        description: createEquipmentDto.description,
        priceCents: createEquipmentDto.priceCents,
        depositCents: createEquipmentDto.depositCents,
        categoryId: createEquipmentDto.categoryId,
        status: createEquipmentDto.status || 'available',
      },
      include: {
        category: true, // Возвращаем категорию в ответе
      },
    });
  }

  async findAll() {
    return this.prisma.equipment.findMany({
      include: {
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const equipment = await this.prisma.equipment.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!equipment) {
      throw new NotFoundException(`Оборудование с id ${id} не найдено`);
    }

    return equipment;
  }

  async update(id: number, updateEquipmentDto: UpdateEquipmentDto) {
    // Проверяем существование
    await this.findOne(id);

    // Если меняется categoryId - проверяем новую категорию
    if (updateEquipmentDto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateEquipmentDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException(
          `Категория с id ${updateEquipmentDto.categoryId} не найдена`,
        );
      }
    }

    return this.prisma.equipment.update({
      where: { id },
      data: updateEquipmentDto,
      include: {
        category: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Проверяем существование

    return this.prisma.equipment.delete({
      where: { id },
    });
  }

  // Дополнительный метод: поиск по категории (ТЗ: фильтрация)
  async findByCategory(categoryId: number) {
    return this.prisma.equipment.findMany({
      where: { categoryId },
      include: {
        category: true,
      },
    });
  }

  // Дополнительный метод: обновление статуса
  async updateStatus(id: number, status: string) {
    await this.findOne(id);

    return this.prisma.equipment.update({
      where: { id },
      data: { status },
    });
  }
}