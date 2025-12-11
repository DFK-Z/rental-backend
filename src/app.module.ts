import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { CategoriesModule } from './categories/categories.module';
import { EquipmentsModule } from './equipments/equipments.module';
import { RentalsModule } from './rentals/rentals.module';
import { PaymentsModule } from './payments/payments.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [PrismaModule, AuthModule, TasksModule, CategoriesModule, EquipmentsModule, RentalsModule, PaymentsModule, UsersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
