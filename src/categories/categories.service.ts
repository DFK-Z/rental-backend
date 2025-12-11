import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    // Если указан parentId - проверяем существование родительской категории
    if (createCategoryDto.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: createCategoryDto.parentId },
      });

      if (!parent) {
        throw new NotFoundException(
          `Родительская категория с id ${createCategoryDto.parentId} не найдена`,
        );
      }
    }

    return this.prisma.category.create({
      data: {
        name: createCategoryDto.name,
        parentId: createCategoryDto.parentId,
      },
      include: {
        parent: true, // Возвращаем родительскую категорию
        children: true, // И дочерние
      },
    });
  }

  async findAll() {
    return this.prisma.category.findMany({
      include: {
        parent: true,
        children: true,
        _count: {
          select: { equipment: true }, // Количество оборудования в категории
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        equipment: {
          include: {
            category: true,
          },
          take: 10, // Первые 10 единиц оборудования
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Категория с id ${id} не найдена`);
    }

    return category;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    // Проверяем существование категории
    await this.findOne(id);

    // Если меняется parentId - проверяем новую родительскую категорию
    if (updateCategoryDto.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: updateCategoryDto.parentId },
      });

      if (!parent) {
        throw new NotFoundException(
          `Родительская категория с id ${updateCategoryDto.parentId} не найдена`,
        );
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
      include: {
        parent: true,
        children: true,
      },
    });
  }

  async remove(id: number) {
    // Проверяем существование
    await this.findOne(id);

    // Проверяем, нет ли дочерних категорий
    const children = await this.prisma.category.findMany({
      where: { parentId: id },
    });

    if (children.length > 0) {
      throw new NotFoundException(
        'Нельзя удалить категорию с дочерними категориями. Сначала удалите или переместите дочерние категории.',
      );
    }

    // Проверяем, нет ли привязанного оборудования
    const equipment = await this.prisma.equipment.findFirst({
      where: { categoryId: id },
    });

    if (equipment) {
      throw new NotFoundException(
        'Нельзя удалить категорию, к которой привязано оборудование. Сначала измените категорию у оборудования.',
      );
    }

    return this.prisma.category.delete({
      where: { id },
    });
  }

  // Дополнительный метод: получить дерево категорий
  async getTree() {
    const categories = await this.prisma.category.findMany({
      include: {
        children: {
          include: {
            children: true, // Вложенность 2 уровня
          },
        },
      },
      where: {
        parentId: null, // Начинаем с корневых
      },
      orderBy: {
        name: 'asc',
      },
    });

    return categories;
  }
}
