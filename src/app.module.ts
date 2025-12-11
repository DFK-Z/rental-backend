import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { EquipmentsModule } from './equipments/equipments.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { RentalsModule } from './rentals/rentals.module';
import { CategoriesModule } from './categories/categories.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    EquipmentsModule,
    AuthModule,
    RentalsModule,
    CategoriesModule,
    PaymentsModule,
  ],
})
export class AppModule {}