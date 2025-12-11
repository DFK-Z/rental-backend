import { Module } from '@nestjs/common';
import { RentalsService } from './rentals.service';
import { RentalsController } from './rentals.controller';
import { PrismaModule } from '../prisma/prisma.module'; // ДОЛЖНО БЫТЬ!

@Module({
  imports: [PrismaModule], // ВАЖНО: импортируем PrismaModule
  controllers: [RentalsController],
  providers: [RentalsService],
})
export class RentalsModule {}