import { Module } from '@nestjs/common';
import { RentalsService } from './rentals.service';
import { RentalsController } from './rentals.controller';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    JwtModule,
    PrismaModule,
    PassportModule,
  ],
  controllers: [RentalsController],
  providers: [RentalsService],
})
export class RentalsModule {}
