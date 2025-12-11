import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { UpdatePromoCodeDto } from './dto/update-promo-code.dto';

@Injectable()
export class PromoCodesService {
  constructor(private prisma: PrismaService) {}

  async create(createPromoCodeDto: CreatePromoCodeDto) {
    // Проверяем, не существует ли уже промо-код с таким кодом
    const existing = await this.prisma.promoCode.findUnique({
      where: { code: createPromoCodeDto.code },
    });

    if (existing) {
      throw new ConflictException('Promo code with this code already exists');
    }

    return this.prisma.promoCode.create({
      data: createPromoCodeDto,
    });
  }

  async findAll() {
    return this.prisma.promoCode.findMany();
  }

  async findOne(id: number) {
    const promoCode = await this.prisma.promoCode.findUnique({
      where: { id },
    });

    if (!promoCode) {
      throw new NotFoundException(`Promo code with ID ${id} not found`);
    }

    return promoCode;
  }

  async findByCode(code: string) {
    const promoCode = await this.prisma.promoCode.findUnique({
      where: { code },
    });

    if (!promoCode) {
      throw new NotFoundException(`Promo code "${code}" not found`);
    }

    return promoCode;
  }

  async update(id: number, updatePromoCodeDto: UpdatePromoCodeDto) {
    await this.findOne(id); // Проверяем существование

    return this.prisma.promoCode.update({
      where: { id },
      data: updatePromoCodeDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Проверяем существование

    return this.prisma.promoCode.delete({
      where: { id },
    });
  }

  async validatePromoCode(code: string) {
    const promoCode = await this.prisma.promoCode.findUnique({
      where: { code },
    });

    if (!promoCode) {
      return { isValid: false, message: 'Promo code not found' };
    }

    if (!promoCode.isActive) {
      return { isValid: false, message: 'Promo code is inactive' };
    }

    const now = new Date();
    if (now < promoCode.validFrom) {
      return { isValid: false, message: 'Promo code not yet valid' };
    }

    if (now > promoCode.validUntil) {
      return { isValid: false, message: 'Promo code expired' };
    }

    if (promoCode.maxUses && promoCode.usedCount >= promoCode.maxUses) {
      return { isValid: false, message: 'Promo code usage limit reached' };
    }

    return {
      isValid: true,
      promoCode,
      message: 'Promo code is valid'
    };
  }

  async incrementUsage(id: number) {
    return this.prisma.promoCode.update({
      where: { id },
      data: {
        usedCount: {
          increment: 1,
        },
      },
    });
  }
}