import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { EquipmentsModule } from './equipments/equipments.module';
import { CategoriesModule } from './categories/categories.module';
import { RentalsModule } from './rentals/rentals.module';
import { PaymentsModule } from './payments/payments.module';
import { AdminModule } from './admin/admin.module';
import { PromoCodesModule } from './promo-codes/promo-codes.module'; // ← ОДИН РАЗ!
import { EquipmentAvailabilityModule } from './equipment-availability/equipment-availability.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    AuthModule,
    EquipmentsModule,
    CategoriesModule,
    RentalsModule,
    PaymentsModule,
    PromoCodesModule,
    EquipmentAvailabilityModule,
    AdminModule,
    EquipmentAvailabilityModule,
  ],
})
export class AppModule {}