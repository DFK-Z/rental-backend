import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRentalDto } from './dto/create-rental.dto';
import { UpdateRentalDto } from './dto/update-rental.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RentalsService {
  constructor(private readonly prismaService: PrismaService ) {}

  async findAll(userId: number, role: string) {
    if (role === 'ADMIN') return this.prismaService.rental.findMany();

    return this.prismaService.rental.findMany({
      where: { userId },
      include: { user: true },
    });
  }

  async findOne(id: number) {
    const task = await this.prismaService.rental.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
    if (!task) throw new NotFoundException(`Запись с id ${id} не найдена`);
    return task;
  }

  async create(userId: number, dto: CreateRentalDto) {
    return this.prismaService.rental.create({
      data: { ...dto, userId },
    });
  }

  async update(id: number, dto: UpdateRentalDto) {
    const task = await this.prismaService.rental.findUnique({ where: { id } });
    if (!task) throw new NotFoundException(`Запись с id ${id} не найдена`);
    return this.prismaService.rental.update({ where: { id }, data: { ...dto } });
  }

  async delete(id: number) {
    const task = await this.prismaService.rental.findUnique({ where: { id } });
    if (!task) throw new NotFoundException(`Запись с id ${id} не найдена`);
    return this.prismaService.rental.delete({ where: { id } });
  }
}
